#!/usr/bin/env node
/**
 * DevForge AWS infrastructure entry point.
 *
 * One command: `cdk deploy` brings up the control plane on AWS.
 *
 * Stacks:
 *   - ControlPlaneStack: ECR repo + App Runner service + IAM (Bedrock access)
 *
 * Environment is read from CDK context or process env:
 *   - region (default: ap-south-1 — Mumbai, Bedrock Claude Sonnet 4 available)
 *   - account (AWS_ACCOUNT_ID env or `cdk deploy --profile <p>`)
 */
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ControlPlaneStack } from '../lib/control-plane-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION ?? 'ap-south-1',
};

new ControlPlaneStack(app, 'DevForgeControlPlane', {
  env,
  description: 'DevForge control plane — App Runner + ECR + IAM (Bedrock)',
  tags: {
    Project: 'DevForge',
    Component: 'control-plane',
    ManagedBy: 'cdk',
  },
});

app.synth();
