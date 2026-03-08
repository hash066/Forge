import { RiskScores, Violation, Blueprint } from '../shared/types';
import { QuizQuestion } from './comprehensionValidator';

/**
 * Returns a varied set of risk scores for demo purposes.
 */
export const getMockRiskScores = (): RiskScores => ({
    security: 7.5,
    scalability: 4.2,
    cost: 8.9,
    overengineering: 6.0
});

/**
 * Returns a set of realistic violations including drift, security, and vulnerabilities.
 */
export const getMockViolations = (): Violation[] => [
    {
        type: 'architecture',
        severity: 'high',
        line: 15,
        description: 'Unauthorized database technology: Found MongoDB usage but blueprint requires PostgreSQL.',
        fix: 'Migration to PostgreSQL or update blueprint constraints if MongoDB is justified.'
    },
    {
        type: 'security',
        severity: 'critical',
        line: 42,
        description: 'Hardcoded AWS Secret Access Key detected.',
        fix: 'Remove secret and use AWS Secrets Manager or environment variables.'
    },
    {
        type: 'vulnerability',
        severity: 'high',
        line: 110,
        description: 'Potential SQL Injection: String concatenation in raw query.',
        fix: 'Use parameterized queries or an ORM like Prisma/TypeORM.'
    }
];

/**
 * Returns a comprehensive mock analysis result.
 */
export const getMockAnalysis = () => ({
    violations: getMockViolations(),
    riskScores: getMockRiskScores(),
    costEstimate: getMockCostEstimate()
});

/**
 * Returns a static mock monthly cost estimate.
 */
export const getMockCostEstimate = (): number => 112.50;

/**
 * Returns a sample blueprint for the demo project.
 */
export const getMockBlueprint = (): Blueprint => ({
    constraints: {
        scale: 'enterprise',
        currentUsers: 1000,
        projectedUsers: 50000,
        peakLoad: 500,
        budget: 200,
        teamSize: 5,
        deploymentFrequency: 'daily',
        architectureType: 'microservices',
        domain: 'web'
    },
    components: [
        { id: 'auth-service', type: 'service', name: 'Auth Service', technology: 'Node.js' },
        { id: 'main-db', type: 'database', name: 'Primary DB', technology: 'PostgreSQL' }
    ],
    connections: [],
    version: '1.0.0'
});

/**
 * Returns a mock quiz question.
 */
export const getMockQuiz = (): QuizQuestion => ({
    id: 'mock-quiz-1',
    question: "Why is manual SQL concatenation considered a critical vulnerability in this module?",
    options: [
        "It increases memory usage on the server.",
        "It allows an attacker to manipulate the query structure via input.",
        "It makes the code harder to read for team members.",
        "It prevents the database from caching the execution plan."
    ],
    correctIndex: 1,
    explanation: "SQL Injection allows attackers to bypass application logic and execute arbitrary commands on your database, potentially leading to total data loss or unauthorized access.",
    codeSnippet: "const query = 'SELECT * FROM users WHERE id = ' + userId;"
});

/**
 * Returns a mock scale timeline.
 */
export const getMockScaleTimeline = (currentUsers: number) => {
    const dbCapacity = 1000;
    return {
        current_users: currentUsers,
        timeline: [
            { user_count: currentUsers, status: 'healthy', health_score: 100, issues: [] },
            { user_count: dbCapacity * 0.8, status: 'degraded', health_score: 60, issues: [{ component: 'database', severity: 'warning', description: 'Database connection pool at 80% capacity', recommendation: 'Consider adding read replicas' }] },
            { user_count: dbCapacity, status: 'critical', health_score: 20, issues: [{ component: 'database', severity: 'critical', description: 'Database connection pool exhausted', recommendation: 'Immediate action: Add read replicas or increase connection limit', estimated_cost: '+$50/month for read replica' }] },
            { user_count: 5000, status: 'failure', health_score: 0, issues: [{ component: 'compute', severity: 'critical', description: 'CPU saturation at 100%, system unresponsive', recommendation: 'Scale to larger instance or enable auto-scaling', estimated_cost: '+$30/month for t3.medium' }] }
        ],
        summary: {
            first_failure_at: dbCapacity,
            failure_component: 'database',
            action_required: true,
            recommendation: 'Immediate action: Add read replicas or increase connection limit'
        }
    };
};

/**
 * Returns mock detected patterns with LeetCode links.
 */
export const getMockPatterns = () => ({
    patterns: [
        {
            pattern: 'nested_loops',
            complexity: 'O(n²)',
            severity: 'warning',
            description: 'Detected 2 nested loops',
            leetcode_problems: [
                { title: 'Two Sum', difficulty: 'Easy', url: 'https://leetcode.com/problems/two-sum/' },
                { title: '3Sum', difficulty: 'Medium', url: 'https://leetcode.com/problems/3sum/' }
            ],
            suggestion: 'Consider using HashMap/Set for O(n) or O(n log n) solution'
        },
        {
            pattern: 'recursion',
            complexity: 'Varies',
            severity: 'info',
            description: 'Recursive function detected',
            leetcode_problems: [
                { title: 'Fibonacci Number', difficulty: 'Easy', url: 'https://leetcode.com/problems/fibonacci-number/' },
                { title: 'Climbing Stairs', difficulty: 'Easy', url: 'https://leetcode.com/problems/climbing-stairs/' }
            ],
            suggestion: 'Consider memoization/DP for optimization'
        }
    ],
    total_patterns: 2
});

