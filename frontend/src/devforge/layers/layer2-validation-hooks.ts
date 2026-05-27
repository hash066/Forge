/**
 * Layer 2: Validation Hooks
 * Passive monitoring of code changes with drift detection, constraint validation, and risk scoring
 */

import { ArchitectureStore } from '../store/architecture-store';
import { ApiClient } from '../services/api-client';
import { DriftDetector } from './validators/drift-detector';
import { ConstraintValidator } from './validators/constraint-validator';
import { RiskScorer } from './validators/risk-scorer';

export class ValidationHooks {
  private driftDetector: DriftDetector;
  private constraintValidator: ConstraintValidator;
  private riskScorer: RiskScorer;
  private lastValidationTime: number = 0;
  private validationDebounceMs: number = 500;
  private simulationInterval: NodeJS.Timeout | null = null;

  constructor(
    private store: ArchitectureStore,
    private apiClient: ApiClient
  ) {
    this.driftDetector = new DriftDetector();
    this.constraintValidator = new ConstraintValidator();
    this.riskScorer = new RiskScorer();
  }

  /**
   * Register Kiro hooks for code monitoring
   */
  registerHooks(): void {
    console.log('🔗 Registering Layer 2 validation hooks');

    // In real implementation, this would register with Kiro's hook system
    // For MVP, we'll simulate hook triggers
    this.simulateHookTriggers();
  }

  /**
   * Unregister hooks
   */
  unregisterHooks(): void {
    console.log('🔗 Unregistering Layer 2 validation hooks');
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  /**
   * Simulate hook triggers for MVP
   */
  private simulateHookTriggers(): void {
    // Simulate code changes every 3 seconds
    this.simulationInterval = setInterval(() => {
      this.onCodeChange(this.generateMockCode());
    }, 3000);
  }

  /**
   * Handle code change event (triggered by Kiro postToolUse hook)
   */
  private onCodeChange(code: string): void {
    const now = Date.now();
    if (now - this.lastValidationTime < this.validationDebounceMs) {
      return;
    }
    this.lastValidationTime = now;

    const architecture = this.store.getArchitectureDefinition();
    const blueprint = this.store.getBlueprint();

    if (!architecture || !blueprint) {
      return;
    }

    // Run all validators
    this.runValidation(code, architecture, blueprint);
  }

  /**
   * Run complete validation pipeline
   */
  private runValidation(code: string, architecture: any, blueprint: any): void {
    // 1. Drift Detection
    const driftResult = this.driftDetector.detect(code, blueprint);
    this.store.setDriftResult(driftResult);

    // 2. Constraint Validation
    const validationResult = this.constraintValidator.validate(code, architecture);
    this.store.setValidationResult(validationResult);

    // 3. Risk Scoring
    const scores = this.riskScorer.calculateScores(code, blueprint, validationResult, driftResult);
    this.store.updateScores(scores);

    // 4. Generate feedback
    this.generateFeedback(driftResult, validationResult, scores);

    console.log('✅ Validation complete', { driftResult, validationResult, scores });
  }

  /**
   * Generate feedback items from validation results
   */
  private generateFeedback(driftResult: any, validationResult: any, scores: any): void {
    // Clear old feedback
    this.store.getFeedback().forEach(f => this.store.removeFeedback(f.id));

    // Add drift feedback
    if (driftResult.hasDrift) {
      driftResult.drifts.forEach((drift: any) => {
        this.store.addFeedback({
          id: 'drift-' + Date.now(),
          severity: drift.severity,
          title: 'Architectural Drift Detected',
          description: drift.description,
          recommendation: 'Review and align code with approved blueprint',
          timestamp: new Date()
        });
      });
    }

    // Add constraint violation feedback
    validationResult.violations.forEach((violation: any) => {
      this.store.addFeedback({
        id: 'violation-' + Date.now(),
        severity: violation.severity,
        title: 'Constraint Violation',
        description: violation.description,
        recommendation: 'Update code to satisfy constraint',
        timestamp: new Date()
      });
    });

    // Add risk score feedback
    if (scores.security > 70) {
      this.store.addFeedback({
        id: 'risk-security-' + Date.now(),
        severity: 'critical',
        title: 'High Security Risk',
        description: `Security risk score: ${scores.security}`,
        recommendation: 'Review security implementation',
        timestamp: new Date()
      });
    }

    if (scores.scalability > 70) {
      this.store.addFeedback({
        id: 'risk-scalability-' + Date.now(),
        severity: 'warning',
        title: 'Scalability Concerns',
        description: `Scalability risk score: ${scores.scalability}`,
        recommendation: 'Add load balancing and caching',
        timestamp: new Date()
      });
    }
  }

  /**
   * Generate mock code for testing
   */
  private generateMockCode(): string {
    const samples = [
      `
        // API Gateway
        app.get('/api/users', (req, res) => {
          // Missing authentication
          const users = db.query('SELECT * FROM users');
          res.json(users);
        });
      `,
      `
        // User Service with gRPC
        const grpc = require('@grpc/grpc-js');
        const service = new UserService();
        const server = new grpc.Server();
        server.addService(UserService, service);
      `,
      `
        // Cache implementation
        const cache = require('redis');
        const client = cache.createClient();
        app.get('/api/products', async (req, res) => {
          const cached = await client.get('products');
          if (cached) return res.json(JSON.parse(cached));
          const products = await db.query('SELECT * FROM products');
          await client.set('products', JSON.stringify(products));
          res.json(products);
        });
      `
    ];

    return samples[Math.floor(Math.random() * samples.length)];
  }
}
