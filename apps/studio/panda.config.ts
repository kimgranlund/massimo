import { defineConfig } from '@pandacss/dev';
import { uiKitPreset } from '../../packages/ui-kit/preset.ts';

export default defineConfig({
  presets: ['@pandacss/preset-base', uiKitPreset],
  preflight: false, // ui-kit's reset ships in the preset
  // Readable class names in dev, short hashed ones in production builds. Token variables stay
  // readable: the kit and the jig set --colors-*, --spacing-* and --ui-* by name.
  hash: { className: process.env.NODE_ENV === 'production', cssVar: false },
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  jsxFramework: 'react',
  outdir: 'styled-system',
  strictTokens: true, // a length or color that is not a token is a type error; exceptions use [..]
  strictPropertyValues: true,
  forceImportExtension: true,
});
