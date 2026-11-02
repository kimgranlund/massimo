import { defineConfig } from '@pandacss/dev';
import { uiKitPreset } from './preset.ts';

export default defineConfig({
  preflight: false, // styles/reset.ts replaces it
  presets: ['@pandacss/preset-base', uiKitPreset], // Panda 2 ships no utilities without preset-base
  include: ['./styles/**/*.ts'],
  exclude: [],
  outdir: 'styled-system',
  // Web components pick recipe variants at runtime, so extraction cannot see them: emit them all.
  staticCss: { recipes: '*' },
  strictTokens: true, // a length or color that is not a token is a type error; exceptions use [..]
  strictPropertyValues: true,
  forceImportExtension: true, // explicit .js specifiers so Node and browsers resolve without a bundler
});
