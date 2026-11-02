import { defineConfig } from '@pandacss/dev';
import { uiKitPreset } from '../../packages/ui-kit/preset.ts';

export default defineConfig({
  presets: ['@pandacss/preset-base', uiKitPreset],
  preflight: false, // ui-kit's reset ships in the preset
  // Readable class names: the kit's web components put recipe class names from the kit's own
  // codegen (unhashed) on their parts, so this build must not hash them either. Token variables
  // stay readable too: the kit and the jig set --colors-*, --spacing-* and --ui-* by name.
  hash: false,
  // Web components pick recipe variants at runtime, so extraction cannot see them: emit them all.
  staticCss: { recipes: '*' },
  include: ['./src/**/*.{ts,tsx}'],
  exclude: [],
  jsxFramework: 'react',
  outdir: 'styled-system',
  strictTokens: true, // a length or color that is not a token is a type error; exceptions use [..]
  strictPropertyValues: true,
  forceImportExtension: true,
});
