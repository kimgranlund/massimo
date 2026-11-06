import { defineConfig } from '@pandacss/dev';
import { uiKitPreset } from '../../packages/ui-kit/preset.ts';

// The studio's Panda setup: unhashed names so the kit's recipe classes resolve, and every recipe
// variant, since web components pick theirs at runtime.
export default defineConfig({
  presets: ['@pandacss/preset-base', uiKitPreset],
  preflight: false,
  hash: false,
  staticCss: { recipes: '*' },
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  jsxFramework: 'react',
  outdir: 'styled-system',
  strictTokens: true,
  strictPropertyValues: true,
  forceImportExtension: true,
});
