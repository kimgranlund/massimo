import { defineConfig } from 'vite';

// The site is served beside the studio: STUDIO_BASE is /massimo/ on Pages, so this is /massimo/docs/.
// It builds into the studio's dist, so run it after the studio's build, which empties that folder.
export default defineConfig({
  base: `${process.env.STUDIO_BASE ?? '/'}docs/`,
  build: { outDir: '../studio/dist/docs', emptyOutDir: true },
});
