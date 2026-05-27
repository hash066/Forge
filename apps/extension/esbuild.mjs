/**
 * esbuild bundler for the DevForge VS Code extension.
 *
 * Why esbuild and not webpack/tsc? Two reasons:
 *   1. VS Code requires a single CommonJS bundle at dist/extension.js — esbuild
 *      does this in ~50ms vs tsc + bundler chain in seconds.
 *   2. The vscode module must stay external (provided by the host). esbuild's
 *      `external` config handles this in one line.
 */
import { build, context } from 'esbuild';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: 'dist/extension.js',
  external: ['vscode'],
  sourcemap: !production,
  minify: production,
  treeShaking: true,
  logLevel: 'info',
};

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  // eslint-disable-next-line no-console
  console.log('devforge-vscode: watching for changes…');
} else {
  await build(options);
}
