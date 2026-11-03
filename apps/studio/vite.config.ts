
import { defineConfig } from 'vite';

export default defineConfig({
  // GitHub Pages serves the studio under /massimo/; the deploy workflow sets STUDIO_BASE.
  base: process.env.STUDIO_BASE ?? '/',
  build: { rollupOptions: { input: { studio: 'index.html', 'geometry-check': 'geometry-check.html', 'react-check': 'react-check.html' } } },
});
