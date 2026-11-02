import { defineConfig } from 'vite';

export default defineConfig({
  build: { rollupOptions: { input: { studio: 'index.html', 'geometry-check': 'geometry-check.html', 'react-check': 'react-check.html' } } },
});
