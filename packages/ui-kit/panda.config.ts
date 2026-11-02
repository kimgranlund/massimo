import { defineConfig } from '@pandacss/dev';
import { uiKitPreset } from './preset.ts';

export default defineConfig({
  preflight: false, // styles/reset.ts replaces it
  presets: ['@pandacss/preset-base', uiKitPreset], // Panda 2 ships no utilities without preset-base
  include: ['./components/**/*.{ts,tsx}', './styles/**/*.ts'],
  exclude: [],
  // Web components build class names at runtime, so emit every recipe variant.
  staticCss: { recipes: '*' },
  outdir: 'styled-system',
  forceImportExtension: true, // explicit .js specifiers so Node and browsers resolve without a bundler
});
