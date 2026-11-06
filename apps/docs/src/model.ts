// The site's content model: one page per component node, built only from the manifests and examples
// files. Pure, so the coverage check runs it in Node and the site runs it on Vite's glob.
export interface Example { id: string; label: string; subject: string; markup: string; note?: string }
export interface ExamplesFile { component: string; title: string; summary: string; examples: Example[] }
export interface Row { [key: string]: unknown }
export interface Node {
  id: string; kind: string; status?: string; tag?: string; intent?: string[]; properties?: Row[]; attributes?: Row[]; events?: Row[];
  constraints?: string[]; avoidWhen?: { when: string; reason: string; useInstead?: string }[];
}
export interface Manifest {
  name: string; module: string | null; nodes: Node[];
  renderers?: { react?: { exports?: Record<string, string>; props?: Record<string, { props?: string[] }> } };
}
export interface DocPage {
  slug: string; id: string; folder: string; tag: string; title: string; intent: string[]; status: string; examples: Example[];
  properties: Row[]; attributes: Row[]; events: Row[]; constraints: string[]; avoid: { when: string; reason: string; useInstead?: string }[];
  reactExport?: string; reactProps: string[];
}

const titleOf = (slug: string) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
export const slugOf = (id: string) => id.replace(/^component:/, '');

export function buildPages(manifests: Manifest[], examples: ExamplesFile[]): DocPage[] {
  const byFolder = new Map(examples.map((e) => [e.component, e]));
  const pages: DocPage[] = [];
  for (const m of manifests) {
    const nodes = m.nodes.filter((n) => n.kind === 'component');
    for (const n of nodes) {
      const own = (byFolder.get(m.name)?.examples ?? []).filter((e) => e.subject === n.id);
      if (!own.length) continue; // no example, no page: the coverage check reports it
      const slug = slugOf(n.id), react = m.renderers?.react;
      pages.push({
        slug, id: n.id, folder: m.name, tag: n.tag ?? `ui-${slug}`, title: titleOf(slug), intent: n.intent ?? [], status: n.status ?? 'implemented', examples: own,
        properties: n.properties ?? [], attributes: n.attributes ?? [], events: n.events ?? [], constraints: n.constraints ?? [], avoid: n.avoidWhen ?? [],
        reactExport: react?.exports?.[n.id], reactProps: react?.props?.[n.id]?.props ?? [],
      });
    }
  }
  return pages.sort((a, b) => a.title.localeCompare(b.title));
}

/** The component ids in `ids` with no page. */
export const missingPages = (ids: string[], pages: DocPage[]) => {
  const have = new Set(pages.map((p) => p.id));
  return ids.filter((id) => !have.has(id));
};

/** Every element module an example needs: each ui-* tag in its markup, mapped through the manifests. */
export function modulesFor(markup: string, tagModules: Map<string, string>) {
  return [...new Set([...markup.matchAll(/<(ui-[a-z0-9-]+)/g)].flatMap((m) => tagModules.get(m[1]) ?? []))];
}
export function tagModulesOf(manifests: Manifest[]) {
  return new Map(manifests.flatMap((m) => (m.module ? m.nodes.flatMap((n) => (n.tag ? [[n.tag, `${m.name}/${m.module!.replace('./', '')}`] as [string, string]] : [])) : [])));
}
