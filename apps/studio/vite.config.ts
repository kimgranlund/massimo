import { defineConfig, type Plugin } from 'vite';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateTheme } from '../../packages/ui-kit/tokens/themes/validate.ts';

const THEMES_FILE = fileURLToPath(new URL('../../packages/ui-kit/tokens/themes/themes.json', import.meta.url));

// Dev-only endpoint: POST /__studio/themes { name, params } writes ui-kit's themes.json.
// Input is validated against the parameter schema; nothing else reaches the file.
function saveThemes(): Plugin {
  return {
    name: 'studio-save-themes',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__studio/themes', async (req, res) => {
        const send = (status: number, body: unknown) => {
          res.statusCode = status;
          res.setHeader('content-type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return send(405, { error: 'POST only' });
        let raw = '';
        for await (const chunk of req) {
          raw += chunk;
          if (raw.length > 10_000) return send(413, { error: 'too large' });
        }
        let body: any;
        try { body = JSON.parse(raw); } catch { return send(400, { error: 'invalid JSON' }); }
        const v = validateTheme(body?.name, body?.params);
        if (!v.ok) return send(400, { error: v.error });
        const themes = JSON.parse(await readFile(THEMES_FILE, 'utf8'));
        themes[v.name] = v.params;
        await writeFile(THEMES_FILE, JSON.stringify(themes, null, 2) + '\n');
        send(200, { saved: v.name, params: v.params });
      });
    },
  };
}

export default defineConfig({
  plugins: [saveThemes()],
  // Saving a theme must not reload the studio mid-edit; restart dev to regenerate theme CSS.
  server: { watch: { ignored: ['**/tokens/themes/themes.json'] } },
  build: { rollupOptions: { input: { studio: 'index.html', canvas: 'canvas.html', 'geometry-check': 'geometry-check.html' } } },
});
