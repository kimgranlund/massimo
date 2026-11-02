import { defineConfig } from '@pandacss/dev';
import { uiKitPreset } from '../../packages/ui-kit/preset.ts';

export default defineConfig({
  presets: ['@pandacss/preset-base', uiKitPreset],
  preflight: false, // ui-kit's reset ships in the preset
  hash: false,      // web components look up recipe class names at runtime
  include: ['./src/**/*.{ts,tsx}', '../../packages/ui-kit/components/**/*.{ts,tsx}'],
  exclude: [],
  staticCss: { recipes: '*' },
  jsxFramework: 'react',
  outdir: 'styled-system',
  forceImportExtension: true,
});
