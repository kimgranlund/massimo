// The Theme select: one prebuilt stylesheet per reference brand (scripts/brands.ts), loaded when
// chosen and placed after the kit's CSS. The choice is a per-browser convenience.
import { useEffect, useState } from 'react';

export interface BrandEntry { id: string; label: string; fonts: string[] }
export type Scheme = 'auto' | 'light' | 'dark';
const KEY = 'massimo-docs-brand';
const read = () => { try { return localStorage.getItem(KEY) ?? 'default'; } catch { return 'default'; } };
const write = (id: string) => { try { localStorage.setItem(KEY, id); } catch { /* the choice lasts this visit */ } };
const url = (path: string) => `${import.meta.env.BASE_URL}${path}`;

function link(id: string, href: string) {
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (!el) { el = document.createElement('link'); el.id = id; el.rel = 'stylesheet'; document.head.append(el); }
  el.href = href;
}
function apply(brand: BrandEntry | undefined) {
  document.querySelectorAll('link[data-docs-theme]').forEach((l) => l.remove());
  if (!brand) return;
  link('docs-brand', url(`brands/${brand.id}.css`));
  document.getElementById('docs-brand')!.setAttribute('data-docs-theme', '');
  brand.fonts.forEach((href, i) => { link(`docs-font-${i}`, href); document.getElementById(`docs-font-${i}`)!.setAttribute('data-docs-theme', ''); });
}

export function useTheme() {
  const [brands, setBrands] = useState<BrandEntry[]>([]);
  const [brand, setBrand] = useState(read);
  const [scheme, setScheme] = useState<Scheme>('auto');
  useEffect(() => { void fetch(url('brands/index.json')).then((r) => r.json()).then(setBrands); }, []);
  useEffect(() => { apply(brands.find((b) => b.id === brand)); write(brand); }, [brand, brands]);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', scheme === 'light');
    root.classList.toggle('dark', scheme === 'dark');
  }, [scheme]);
  return { brands, brand, setBrand, scheme, setScheme };
}
