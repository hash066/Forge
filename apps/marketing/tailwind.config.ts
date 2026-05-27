import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
import preset from '@devforge/tokens/tailwind-preset';

const config: Config = {
  presets: [preset],
  content: [
    './src/**/*.{ts,tsx,mdx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
  plugins: [animate],
};

export default config;
