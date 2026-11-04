// The brands authored from docs/references/brand-expressions (<Brand>/brand.json): every folder with
// one joins the Brand tab's Start from list. Each loads when chosen, so the list adds no shell weight.
const MODULES = import.meta.glob('../../../../docs/references/brand-expressions/*/brand.json');

export const REFERENCE_BRANDS = Object.entries(MODULES)
  .map(([path, load]) => {
    const folder = path.split('/').at(-2)!;
    return { id: `reference:${folder}`, label: folder.replaceAll('-', ' '), load: load as () => Promise<{ default: unknown }> };
  })
  .sort((a, b) => a.label.localeCompare(b.label));
