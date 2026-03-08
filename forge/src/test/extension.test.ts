import * as assert from 'assert';
import * as vscode from 'vscode';
import { SecurityScanner } from '../extension/securityScanner';
import { DriftDetector } from '../extension/driftDetector';
import { CostCalculator } from '../extension/costCalculator';

suite('DevForge Extension Analyzers Test Suite', () => {
    vscode.window.showInformationMessage('Start DevForge tests.');

    test('SecurityScanner: detect SQL injection and secrets', () => {
        const scanner = new SecurityScanner();
        const code = `
            const token="api_key=XYZ1234567890ABCDEFGH"
            const query = "SELECT * FROM users WHERE id=" + req.body.id;
        `;
        const violations = scanner.runSecurityScan(code, 'test.ts');
        assert.strictEqual(violations.length, 2);
        assert.strictEqual(violations.some(v => v.type === 'vulnerability'), true);
        assert.strictEqual(violations.some(v => v.type === 'security'), true);
    });

    test('DriftDetector: detect unauthorized dependency', () => {
        const detector = new DriftDetector();
        const blueprint: any = { components: [] };
        const code = `import AWS from 'aws-sdk';`;
        const violations = detector.detectDrift(blueprint, code, 'test.ts');
        assert.strictEqual(violations.length, 1);
        assert.strictEqual(violations[0].type, 'security');
    });

    test('CostCalculator: calculates correct cost bounds', () => {
        const calc = new CostCalculator();
        const cost = calc.calculateMonthlyCost(['rds', 'ec2']);
        assert.ok(cost > 0 && cost < 200);
    });
});
