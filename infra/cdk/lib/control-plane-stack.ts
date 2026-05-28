/**
 * DevForge Control Plane Stack.
 *
 * What it provisions:
 *   1. ECR repository — holds the FastAPI Docker image (devforge-control-plane)
 *   2. IAM role for App Runner — Bedrock invoke + CloudWatch logs
 *   3. App Runner service — pulls the image, auto-scales, exposes HTTPS endpoint
 *   4. CloudFormation outputs — service URL, ECR URI, deploy commands
 *
 * Why App Runner instead of Fargate?
 *   - Single managed service vs ALB + Fargate + target group + listener
 *   - Built-in HTTPS endpoint, no Route53 prerequisite
 *   - Auto-scaling without spinning up an ASG separately
 *   - 5x faster to `cdk deploy` (~3 min vs ~12 min for Fargate)
 *
 * Cost: ~$26/mo idle (0.25 vCPU, 0.5 GB) + $0.007/min when handling requests.
 * Tear down with `pnpm destroy` after demo.
 */
import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class ControlPlaneStack extends cdk.Stack {
  public readonly serviceUrl: string;
  public readonly ecrRepoUri: string;

  constructor(scope: Construct, id: string, props: cdk.StackProps = {}) {
    super(scope, id, props);

    const region = this.region;
    const account = this.account;

    // OpenAI key (primary AI provider). Provide at deploy time via:
    //   OPENAI_API_KEY=sk-... pnpm deploy
    //   or: cdk deploy -c openaiApiKey=sk-...
    // If omitted, the control plane runs the deterministic SRE engine (and can
    // still use Bedrock as a fallback via the instance role below).
    const openaiApiKey =
      process.env.OPENAI_API_KEY ?? (this.node.tryGetContext('openaiApiKey') as string | undefined);

    // ── 1. ECR repository ─────────────────────────────────────────────────
    const repo = new ecr.Repository(this, 'ControlPlaneRepo', {
      repositoryName: 'devforge-control-plane',
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      lifecycleRules: [
        { description: 'Keep last 10 images', maxImageCount: 10 },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // ── 2. App Runner needs two roles ─────────────────────────────────────

    // Access role: lets App Runner pull from ECR
    const accessRole = new iam.Role(this, 'AppRunnerEcrAccessRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSAppRunnerServicePolicyForECRAccess'),
      ],
    });

    // Instance role: identity of the running container — Bedrock + Logs
    const instanceRole = new iam.Role(this, 'AppRunnerInstanceRole', {
      assumedBy: new iam.ServicePrincipal('tasks.apprunner.amazonaws.com'),
      description: 'Identity assumed by the DevForge control plane container at runtime',
    });

    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'BedrockInvoke',
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        // Limit to Claude Sonnet family. Wildcard handles regional model
        // identifier suffixes that Bedrock occasionally rolls.
        resources: [
          `arn:aws:bedrock:${region}::foundation-model/anthropic.claude-sonnet-*`,
          `arn:aws:bedrock:${region}::foundation-model/anthropic.claude-3-5-sonnet-*`,
          `arn:aws:bedrock:${region}::foundation-model/anthropic.claude-3-haiku-*`,
        ],
      }),
    );

    instanceRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'PricingApi',
        effect: iam.Effect.ALLOW,
        actions: ['pricing:GetProducts', 'pricing:GetAttributeValues'],
        resources: ['*'], // Pricing API has no resource-level perms
      }),
    );

    // CloudWatch log group with retention
    new logs.LogGroup(this, 'ControlPlaneLogs', {
      logGroupName: '/aws/apprunner/devforge-control-plane',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ── 3. App Runner service ─────────────────────────────────────────────
    // Note: image must already exist in ECR for `cdk deploy` to succeed.
    // The README documents the `docker build && docker push` step that
    // precedes `cdk deploy`.
    const service = new apprunner.CfnService(this, 'ControlPlaneService', {
      serviceName: 'devforge-control-plane',
      sourceConfiguration: {
        autoDeploymentsEnabled: true,
        authenticationConfiguration: {
          accessRoleArn: accessRole.roleArn,
        },
        imageRepository: {
          imageRepositoryType: 'ECR',
          imageIdentifier: `${repo.repositoryUri}:latest`,
          imageConfiguration: {
            port: '8000',
            runtimeEnvironmentVariables: [
              { name: 'APP_ENV', value: 'production' },
              // OpenAI is the primary brain; Bedrock stays available as fallback.
              { name: 'AI_PROVIDER', value: openaiApiKey ? 'openai' : 'bedrock' },
              { name: 'OPENAI_MODEL', value: 'gpt-5.5' },
              ...(openaiApiKey ? [{ name: 'OPENAI_API_KEY', value: openaiApiKey }] : []),
              { name: 'AWS_REGION', value: region },
              {
                name: 'AWS_BEDROCK_MODEL_ID',
                value: 'anthropic.claude-sonnet-4-20250514-v1:0',
              },
              {
                name: 'ALLOWED_ORIGINS',
                value: 'https://devforge.io,https://*.vercel.app,http://localhost:3001',
              },
              { name: 'LOG_LEVEL', value: 'INFO' },
            ],
          },
        },
      },
      instanceConfiguration: {
        cpu: '0.25 vCPU',
        memory: '0.5 GB',
        instanceRoleArn: instanceRole.roleArn,
      },
      healthCheckConfiguration: {
        protocol: 'HTTP',
        path: '/health',
        interval: 10,
        timeout: 5,
        healthyThreshold: 1,
        unhealthyThreshold: 3,
      },
      autoScalingConfigurationArn: undefined, // use default — 1-25 instances
      networkConfiguration: {
        egressConfiguration: { egressType: 'DEFAULT' },
        ingressConfiguration: { isPubliclyAccessible: true },
      },
    });

    this.serviceUrl = `https://${service.attrServiceUrl}`;
    this.ecrRepoUri = repo.repositoryUri;

    // ── 4. Outputs — values needed for `docker push` and extension config ─
    new cdk.CfnOutput(this, 'ServiceUrl', {
      value: this.serviceUrl,
      description: 'Public HTTPS URL of the DevForge control plane',
      exportName: 'DevForgeServiceUrl',
    });
    new cdk.CfnOutput(this, 'EcrRepositoryUri', {
      value: repo.repositoryUri,
      description: 'ECR repository — push images here',
      exportName: 'DevForgeEcrRepo',
    });
    new cdk.CfnOutput(this, 'DockerPushCommands', {
      value: [
        `aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${account}.dkr.ecr.${region}.amazonaws.com`,
        `docker build -t devforge-control-plane:latest services/control-plane`,
        `docker tag devforge-control-plane:latest ${repo.repositoryUri}:latest`,
        `docker push ${repo.repositoryUri}:latest`,
      ].join('  ;;  '),
      description: 'Run these commands to push the Docker image (semicolons separate steps)',
    });
  }
}
