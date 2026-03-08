interface DetectedService {
    type: string;
    name: string;
    details: string;
    instances?: number;
}

export class ServiceDetector {
    /**
     * Scans code for common AWS/Cloud service usage patterns.
     */
    public detectServices(code: string): DetectedService[] {
        const services: DetectedService[] = [];

        // S3 Detection
        if (code.includes('S3Client') || code.includes('s3.putObject')) {
            services.push({
                type: 'aws:s3',
                name: 'Amazon S3',
                details: 'Object Storage',
            });
        }

        // DynamoDB Detection
        if (code.includes('DynamoDBClient') || code.includes('DynamoDB.DocumentClient')) {
            services.push({
                type: 'aws:dynamodb',
                name: 'Amazon DynamoDB',
                details: 'NoSQL Database',
            });
        }

        // Lambda Detection
        if (code.includes('LambdaClient') || code.includes('exports.handler = async')) {
            services.push({
                type: 'aws:lambda',
                name: 'AWS Lambda',
                details: 'Serverless Functions',
            });
        }

        // RDS/SQL Detection (Look for connection strings or clients)
        if (code.includes('createConnection') || code.includes('new Pool(') || code.includes('postgres://') || code.includes('mysql://')) {
            services.push({
                type: 'aws:rds',
                name: 'Amazon RDS',
                details: 'Relational Database (PostgreSQL/MySQL)',
                instances: 1
            });
        }

        // ElastiCache/Redis Detection
        if (code.includes('createClient') && (code.includes('redis') || code.includes('6379'))) {
            services.push({
                type: 'aws:elasticache',
                name: 'Amazon ElastiCache',
                details: 'Redis Caching',
                instances: 1
            });
        }

        return services;
    }
}
