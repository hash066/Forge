import { performanceMonitor, PerformanceReport } from './performanceMonitor';

export interface BenchmarkSuite {
  name: string;
  tests: BenchmarkTest[];
}

export interface BenchmarkTest {
  name: string;
  fn: () => Promise<void> | void;
  iterations?: number;
  timeout?: number;
}

export interface BenchmarkResult {
  testName: string;
  iterations: number;
  totalDuration: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  stdDeviation: number;
  throughput: number; // operations per second
}

export interface BenchmarkSuiteResult {
  suiteName: string;
  startTime: number;
  endTime: number;
  totalDuration: number;
  results: BenchmarkResult[];
  passed: number;
  failed: number;
}

export class BenchmarkRunner {
  /**
   * Run a single benchmark test
   */
  async runTest(test: BenchmarkTest): Promise<BenchmarkResult> {
    const iterations = test.iterations || 10;
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();

      try {
        const result = test.fn();
        if (result instanceof Promise) {
          await result;
        }
      } catch (error) {
        console.error(`Benchmark test "${test.name}" failed:`, error);
      }

      const duration = performance.now() - startTime;
      durations.push(duration);
    }

    const totalDuration = durations.reduce((a, b) => a + b, 0);
    const averageDuration = totalDuration / iterations;
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);

    // Calculate standard deviation
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - averageDuration, 2), 0) / iterations;
    const stdDeviation = Math.sqrt(variance);

    // Throughput: operations per second
    const throughput = (1000 / averageDuration) * 1000;

    return {
      testName: test.name,
      iterations,
      totalDuration,
      averageDuration,
      minDuration,
      maxDuration,
      stdDeviation,
      throughput,
    };
  }

  /**
   * Run a suite of benchmarks
   */
  async runSuite(suite: BenchmarkSuite): Promise<BenchmarkSuiteResult> {
    const startTime = Date.now();
    const results: BenchmarkResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const test of suite.tests) {
      try {
        const result = await this.runTest(test);
        results.push(result);
        passed++;
      } catch (error) {
        console.error(`Benchmark suite "${suite.name}" test "${test.name}" failed:`, error);
        failed++;
      }
    }

    const endTime = Date.now();

    return {
      suiteName: suite.name,
      startTime,
      endTime,
      totalDuration: endTime - startTime,
      results,
      passed,
      failed,
    };
  }

  /**
   * Format benchmark result as a readable string
   */
  formatResult(result: BenchmarkResult): string {
    return `
${result.testName}
  Iterations: ${result.iterations}
  Total: ${result.totalDuration.toFixed(2)}ms
  Average: ${result.averageDuration.toFixed(2)}ms
  Min: ${result.minDuration.toFixed(2)}ms
  Max: ${result.maxDuration.toFixed(2)}ms
  Std Dev: ${result.stdDeviation.toFixed(2)}ms
  Throughput: ${result.throughput.toFixed(2)} ops/sec
    `.trim();
  }

  /**
   * Format suite results as a readable string
   */
  formatSuiteResults(suiteResult: BenchmarkSuiteResult): string {
    const lines = [
      `Benchmark Suite: ${suiteResult.suiteName}`,
      `Duration: ${suiteResult.totalDuration}ms`,
      `Passed: ${suiteResult.passed} | Failed: ${suiteResult.failed}`,
      '',
      ...suiteResult.results.map(r => this.formatResult(r)),
    ];

    return lines.join('\n');
  }

  /**
   * Compare two benchmark results
   */
  compareResults(baseline: BenchmarkResult, current: BenchmarkResult): {
    improvement: number; // percentage
    faster: boolean;
    message: string;
  } {
    const improvement = ((baseline.averageDuration - current.averageDuration) / baseline.averageDuration) * 100;
    const faster = improvement > 0;

    const message = faster
      ? `${improvement.toFixed(2)}% faster`
      : `${Math.abs(improvement).toFixed(2)}% slower`;

    return { improvement, faster, message };
  }
}

export const benchmarkRunner = new BenchmarkRunner();
