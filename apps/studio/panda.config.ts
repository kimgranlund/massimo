import { defineConfig } from '@pandacss/dev';
import { uiKitPreset } from '../../packages/ui-kit/preset.ts';

export default defineConfig({
  presets: ['@pandacss/preset-base', uiKitPreset],
  preflight: false, // ui-kit's reset ships in the preset
  hash: false,
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  jsxFramework: 'react',
  outdir: 'styled-system',
  forceImportExtension: true,
});
