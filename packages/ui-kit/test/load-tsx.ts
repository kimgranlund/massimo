// Load .tsx modules in node:test: Node strips types but does not compile JSX, so a load hook
// (test/tsx-loader.mjs) compiles .tsx with Vite's Oxc transform, transitive imports included.
import { register } from 'node:module';

register(new URL('./tsx-loader.mjs', import.meta.url));

export const loadTsx = (url: URL) => import(url.href);
