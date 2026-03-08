import * as vscode from 'vscode';

export interface PerformanceMetric {
  name: string;
  duration: number; // milliseconds
  timestamp: number;
  category: 'api' | 'analysis' | 'ui' | 'fs' | 'other';
  status: 'success' | 'error' | 'timeout';
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: PerformanceMetric[];
  summary: {
    totalDuration: number;
    averageDuration: number;
    slowestOperation: PerformanceMetric | null;
    fastestOperation: PerformanceMetric | null;
    errorCount: number;
    successCount: number;
    timeoutCount: number;
    categoryBreakdown: Record<string, { count: number; totalDuration: number; avgDuration: number }>;
  };
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000;
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('DevForge Performance');
  }

  /**
   * Measure execution time of an async function
   */
  async measure<T>(
    name: string,
    category: PerformanceMetric['category'],
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const startTime = performance.now();
    const timestamp = Date.now();

    try {
      const result = await fn();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp,
        category,
        status: 'success',
        metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp,
        category,
        status: 'error',
        metadata: { ...metadata, error: String(error) },
      });

      throw error;
    }
  }

  /**
   * Measure execution time of a sync function
   */
  measureSync<T>(
    name: string,
    category: PerformanceMetric['category'],
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const startTime = performance.now();
    const timestamp = Date.now();

    try {
      const result = fn();
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp,
        category,
        status: 'success',
        metadata,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      this.recordMetric({
        name,
        duration,
        timestamp,
        category,
        status: 'error',
        metadata: { ...metadata, error: String(error) },
      });

      throw error;
    }
  }

  /**
   * Record a metric manually
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Generate a performance report
   */
  generateReport(): PerformanceReport {
    const categoryBreakdown: Record<string, { count: number; totalDuration: number; avgDuration: number }> = {};

    for (const metric of this.metrics) {
      if (!categoryBreakdown[metric.category]) {
        categoryBreakdown[metric.category] = { count: 0, totalDuration: 0, avgDuration: 0 };
      }
      categoryBreakdown[metric.category].count++;
      categoryBreakdown[metric.category].totalDuration += metric.duration;
    }

    // Calculate averages
    for (const category in categoryBreakdown) {
      const data = categoryBreakdown[category];
      data.avgDuration = data.totalDuration / data.count;
    }

    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const successCount = this.metrics.filter(m => m.status === 'success').length;
    const errorCount = this.metrics.filter(m => m.status === 'error').length;
    const timeoutCount = this.metrics.filter(m => m.status === 'timeout').length;

    const sortedByDuration = [...this.metrics].sort((a, b) => b.duration - a.duration);

    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      summary: {
        totalDuration,
        averageDuration: this.metrics.length > 0 ? totalDuration / this.metrics.length : 0,
        slowestOperation: sortedByDuration[0] || null,
        fastestOperation: sortedByDuration[sortedByDuration.length - 1] || null,
        errorCount,
        successCount,
        timeoutCount,
        categoryBreakdown,
      },
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get metrics for a specific category
   */
  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(m => m.category === category);
  }

  /**
   * Get metrics for a specific operation name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Log report to output channel
   */
  logReport(report: PerformanceReport): void {
    this.outputChannel.clear();
    this.outputChannel.appendLine('='.repeat(80));
    this.outputChannel.appendLine('DevForge Performance Report');
    this.outputChannel.appendLine('='.repeat(80));
    this.outputChannel.appendLine(`Generated: ${new Date(report.timestamp).toISOString()}`);
    this.outputChannel.appendLine('');

    // Summary
    this.outputChannel.appendLine('SUMMARY');
    this.outputChannel.appendLine('-'.repeat(80));
    this.outputChannel.appendLine(`Total Operations: ${report.metrics.length}`);
    this.outputChannel.appendLine(`Successful: ${report.summary.successCount}`);
    this.outputChannel.appendLine(`Errors: ${report.summary.errorCount}`);
    this.outputChannel.appendLine(`Timeouts: ${report.summary.timeoutCount}`);
    this.outputChannel.appendLine(`Total Duration: ${report.summary.totalDuration.toFixed(2)}ms`);
    this.outputChannel.appendLine(`Average Duration: ${report.summary.averageDuration.toFixed(2)}ms`);
    this.outputChannel.appendLine('');

    // Slowest/Fastest
    if (report.summary.slowestOperation) {
      this.outputChannel.appendLine('SLOWEST OPERATION');
      this.outputChannel.appendLine('-'.repeat(80));
      this.outputChannel.appendLine(`Name: ${report.summary.slowestOperation.name}`);
      this.outputChannel.appendLine(`Duration: ${report.summary.slowestOperation.duration.toFixed(2)}ms`);
      this.outputChannel.appendLine(`Category: ${report.summary.slowestOperation.category}`);
      this.outputChannel.appendLine(`Status: ${report.summary.slowestOperation.status}`);
      this.outputChannel.appendLine('');
    }

    if (report.summary.fastestOperation) {
      this.outputChannel.appendLine('FASTEST OPERATION');
      this.outputChannel.appendLine('-'.repeat(80));
      this.outputChannel.appendLine(`Name: ${report.summary.fastestOperation.name}`);
      this.outputChannel.appendLine(`Duration: ${report.summary.fastestOperation.duration.toFixed(2)}ms`);
      this.outputChannel.appendLine(`Category: ${report.summary.fastestOperation.category}`);
      this.outputChannel.appendLine('');
    }

    // Category breakdown
    this.outputChannel.appendLine('CATEGORY BREAKDOWN');
    this.outputChannel.appendLine('-'.repeat(80));
    for (const [category, data] of Object.entries(report.summary.categoryBreakdown)) {
      this.outputChannel.appendLine(`${category.toUpperCase()}`);
      this.outputChannel.appendLine(`  Count: ${data.count}`);
      this.outputChannel.appendLine(`  Total: ${data.totalDuration.toFixed(2)}ms`);
      this.outputChannel.appendLine(`  Average: ${data.avgDuration.toFixed(2)}ms`);
    }
    this.outputChannel.appendLine('');

    // Top 10 slowest
    this.outputChannel.appendLine('TOP 10 SLOWEST OPERATIONS');
    this.outputChannel.appendLine('-'.repeat(80));
    const sorted = [...report.metrics].sort((a, b) => b.duration - a.duration).slice(0, 10);
    sorted.forEach((metric, index) => {
      this.outputChannel.appendLine(
        `${index + 1}. ${metric.name} (${metric.category}) - ${metric.duration.toFixed(2)}ms [${metric.status}]`
      );
    });

    this.outputChannel.show();
  }

  /**
   * Export report as JSON
   */
  exportAsJson(report: PerformanceReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Export report as CSV
   */
  exportAsCsv(report: PerformanceReport): string {
    const headers = ['Name', 'Duration (ms)', 'Category', 'Status', 'Timestamp'];
    const rows = report.metrics.map(m => [
      m.name,
      m.duration.toFixed(2),
      m.category,
      m.status,
      new Date(m.timestamp).toISOString(),
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    return csv;
  }
}

export const performanceMonitor = new PerformanceMonitor();
