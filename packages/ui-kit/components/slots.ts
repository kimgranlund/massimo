// Slot anatomy for labelled controls (ui-button, ui-option, ui-tag, ui-chip, choices; the input
// control and select trigger use the same parts). Authored children are sorted into
//   [data-part=leading] [data-part=prefix] [data-part=contents] [data-part=suffix] [data-part=trailing]
// leading / trailing: 6u icon slots (slot="leading" | "trailing", usually one <i name>).
// prefix / suffix: short text adornments beside the label (slot="prefix" | "suffix": "$", "USD", "⌘K").
// Everything else is contents (the label). Empty containers are hidden, so an icon-only button
// is a square. Re-sorts when children or slot attributes change.

export const SLOT_PARTS = ['leading', 'prefix', 'contents', 'suffix', 'trailing'] as const;
const NAMED = new Set<string>(['leading', 'prefix', 'suffix', 'trailing']);
export type SlotPart = (typeof SLOT_PARTS)[number];

const partOf = (node: Node): SlotPart => {
  const slot = node.nodeType === 1 ? (node as Element).getAttribute('slot') : null;
  return slot && NAMED.has(slot) ? (slot as SlotPart) : 'contents';
};
const isPart = (node: Node): node is HTMLElement =>
  node.nodeType === 1 && SLOT_PARTS.includes((node as Element).getAttribute('data-part') as SlotPart) && (node as Element).localName === 'span';
const hasContent = (el: Element) => [...el.childNodes].some((n) => n.nodeType === 1 || (n.textContent ?? '').trim() !== '');

/** Get or create the three containers, sort every authored node into them, hide empty ones. */
export function arrangeSlots(host: HTMLElement): Record<SlotPart, HTMLElement> {
  const parts = {} as Record<SlotPart, HTMLElement>;
  for (const name of SLOT_PARTS) {
    let el = [...host.children].find((c) => isPart(c) && c.getAttribute('data-part') === name) as HTMLElement | undefined;
    if (!el) { el = document.createElement('span'); el.setAttribute('data-part', name); }
    parts[name] = el;
  }
  // Loose nodes on the host, plus nodes whose slot attribute no longer matches their container.
  const loose = [...host.childNodes].filter((n) => !isPart(n));
  const misplaced = SLOT_PARTS.flatMap((name) => [...parts[name].childNodes].filter((n) => partOf(n) !== name));
  for (const n of [...loose, ...misplaced]) parts[partOf(n)].append(n);
  for (const name of SLOT_PARTS) {
    if (parts[name].parentNode !== host || host.children[SLOT_PARTS.indexOf(name)] !== parts[name]) host.append(parts[name]);
    parts[name].hidden = !hasContent(parts[name]);
  }
  return parts;
}

/** Keep a host arranged as its children change. Returns a disconnect function. */
export function observeSlots(host: HTMLElement, onChange?: () => void) {
  arrangeSlots(host);
  const mo = new MutationObserver(() => {
    mo.disconnect();
    arrangeSlots(host);
    onChange?.();
    observe();
  });
  const observe = () => mo.observe(host, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['slot'] });
  observe();
  return () => mo.disconnect();
}

/** The parts an author may fill around a field's own contents (input control, select trigger). */
export const ADORNMENT_PARTS = ['leading', 'prefix', 'suffix', 'trailing'] as const;

/**
 * Move authored adornments (elements with slot="leading" | "prefix" | "suffix" | "trailing") into
 * the matching [data-part] containers of `control`, then hide the empty containers.
 */
export function adoptAdornments(control: Element, nodes: Element[], parts: readonly string[] = ADORNMENT_PARTS) {
  for (const n of nodes) {
    const slot = n.getAttribute('slot') ?? '';
    if (parts.includes(slot)) control.querySelector(`:scope > [data-part=${slot}]`)?.append(n);
  }
  for (const p of parts) {
    const el = control.querySelector<HTMLElement>(`:scope > [data-part=${p}]`);
    if (el) el.hidden = !hasContent(el);
  }
}
