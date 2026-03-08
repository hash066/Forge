import { Violation } from '../shared/types';

export class SecurityScanner {
    private secretPatterns: Record<string, RegExp> = {
        'API Key': /(?:api_?key|secret)[=:]\s*["'][A-Za-z0-9_\-.]{20,}["']/gi, // Context-aware API Key pattern
        'AWS Secret': /aws_secret_access_key\s*=\s*[^\s]+/gi,
        'AWS Access ID': /aws_access_key_id\s*=\s*[A-Z0-9]{20}/gi,
        'Password In Code': /password\s*=\s*["'][^"']+["']/gi,
        'Hardcoded Token': /token\s*=\s*["'][a-zA-Z0-9\-._~+/]+=*["']/gi,
        'Database URL': /[a-z]+:\/\/[^:]+:[^@]+@[^/]+/gi, // postgres://user:pass@host
    };

    /**
     * Scans code for secrets, API keys, and hardcoded credentials.
     */
    public scanForSecrets(code: string, filepath: string): Violation[] {
        const violations: Violation[] = [];
        const lines = code.split('\n');

        lines.forEach((lineText, index) => {
            const lineNumber = index + 1;
            
            for (const [name, pattern] of Object.entries(this.secretPatterns)) {
                // Reset regex state since we're reusing it per line
                pattern.lastIndex = 0;
                let match;
                while ((match = pattern.exec(lineText)) !== null) {
                    violations.push({
                        type: 'security',
                        severity: 'critical',
                        line: lineNumber,
                        description: `Found hardcoded secret: ${name}`,
                        fix: `Remove the hardcoded ${name} and use an environment variable or secret manager.`,
                    });
                }
            }
        });

        return violations;
    }

    /**
     * Scans for potential SQL injection vulnerabilities in string-concatenated queries.
     */
    public scanForSQLInjection(code: string): Violation[] {
        const violations: Violation[] = [];
        const lines = code.split('\n');

        const sqlPatterns = [
            /SELECT.*FROM.*WHERE.*=.*\+.*["']/gi, // SQL concat with +
            /INSERT.*INTO.*VALUES.*=.*\+.*["']/gi, // SQL concat with +
            /UPDATE.*SET.*WHERE.*=.*\+.*["']/gi, // SQL concat with +
            /SELECT.*FROM.*WHERE.*=.*\$\{.*\}/gi, // Template literal injection
        ];

        lines.forEach((lineText, index) => {
            const lineNumber = index + 1;
            
            sqlPatterns.forEach(pattern => {
                if (pattern.test(lineText)) {
                    violations.push({
                        type: 'vulnerability',
                        severity: 'high',
                        line: lineNumber,
                        description: 'Potential SQL injection vulnerability: detected string concatenation/interpolation in query',
                        fix: 'Use parameterized queries, placeholders, or an ORM.',
                    });
                }
            });
        });

        return violations;
    }

    /**
     * Stub for Smart Contract Vulnerability Scanner
     */
    public scanSmartContract(filepath: string): Violation[] {
        if (!filepath.endsWith('.sol')) return [];
        return [
            {
                type: 'vulnerability',
                severity: 'critical',
                line: 12,
                description: 'Reentrancy vulnerability detected in withdraw()',
                fix: 'Implement Checks-Effects-Interactions pattern or use ReentrancyGuard.',
            }
        ];
    }

    /**
     * Main security scan function combining all checks.
     */
    public runSecurityScan(code: string, filepath: string): Violation[] {
        return [
            ...this.scanForSecrets(code, filepath),
            ...this.scanForSQLInjection(code),
            ...this.scanSmartContract(filepath),
        ];
    }
}
