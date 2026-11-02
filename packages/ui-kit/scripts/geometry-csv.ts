// Generates docs/geometry.csv: every geometry formula with its value at each size.
// Implemented rows are computed by the resolver itself, so the CSV cannot drift from the
// code (test/geometry-csv.test.ts fails when the file is stale). Run: npm run geometry:csv
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SIZES, GEOMETRY_DEFAULTS, resolveControl, resolveComposite, resolveField, resolveSelectTrigger, containerRadius, popupOffset } from '../tokens/geometry/resolve.ts';

type Row = { id: string; family: string; element: string; quantity: string; formula: string; value: (u: number) => number; status: 'implemented' | 'proposed' | 'input'; notes: string };

const ctl = (u: number) => resolveControl({ unit: u });
const icon = (u: number, iconSize: 'sm' | 'md' | 'lg' | 'fill') => resolveControl({ unit: u, iconSize }).iconSize;
const cmp = (u: number) => resolveComposite({ unit: u });

const rows: Row[] = [
  // Inputs
  { id: 'in.u', family: 'input', element: 'all', quantity: 'unit u', formula: 'u = size attribute (px)', value: (u) => u, status: 'input', notes: 'size="2|2.25|2.5|3|3.5|4|4.5"; theme default 4' },
  { id: 'in.B', family: 'input', element: 'all', quantity: 'border B', formula: `B (default ${GEOMETRY_DEFAULTS.border})`, value: () => GEOMETRY_DEFAULTS.border, status: 'input', notes: 'whole px, 0..u/2; lives inside padding, never added to height' },
  { id: 'in.s', family: 'input', element: 'all', quantity: 'curvature scale s', formula: `s (default ${GEOMETRY_DEFAULTS.radiusScale})`, value: () => GEOMETRY_DEFAULTS.radiusScale, status: 'input', notes: 'theme radius-scale, 0..3' },
  { id: 'in.Q', family: 'input', element: 'composite', quantity: 'composite inset Q', formula: `Q = ${GEOMETRY_DEFAULTS.compositeInsetUnits}u`, value: (u) => GEOMETRY_DEFAULTS.compositeInsetUnits * u, status: 'input', notes: 'inset attribute 0|0.5|1|1.5 (x u)' },

  // Control
  { id: 'control.height', family: 'control', element: 'button, input, select', quantity: 'height', formula: '8u', value: (u) => ctl(u).height, status: 'implemented', notes: '' },
  { id: 'control.padding', family: 'control', element: 'button, input, select', quantity: 'padding', formula: 'u - B', value: (u) => ctl(u).padding, status: 'implemented', notes: 'border + padding = 1u' },
  { id: 'control.slot', family: 'control', element: 'button, option', quantity: 'slot (leading / contents / trailing) min size', formula: '6u', value: (u) => ctl(u).slot, status: 'implemented', notes: 'empty slots hidden; icon-only button = 8u square' },
  { id: 'control.contents.paddingInline', family: 'control', element: 'button, option', quantity: 'contents inline padding', formula: 'u', value: (u) => ctl(u).contents.paddingInline, status: 'implemented', notes: '' },
  { id: 'control.contents.paddingBlock', family: 'control', element: 'button, option', quantity: 'contents block padding', formula: '0.75u', value: (u) => ctl(u).contents.paddingBlock, status: 'implemented', notes: '' },
  { id: 'control.contents.lineHeight', family: 'control', element: 'button, option', quantity: 'contents line height', formula: '4.5u', value: (u) => ctl(u).contents.lineHeight, status: 'implemented', notes: 'below font size at u < 2.86 (tight, not clipped)' },
  { id: 'control.font', family: 'control', element: 'all controls', quantity: 'font size', formula: '10 + u', value: (u) => ctl(u).fontSize, status: 'implemented', notes: '' },
  { id: 'control.icon.sm', family: 'control', element: 'icons in slots', quantity: 'icon sm', formula: 'min(font - 0.5u, 6u)', value: (u) => icon(u, 'sm'), status: 'implemented', notes: '' },
  { id: 'control.icon.md', family: 'control', element: 'icons in slots', quantity: 'icon md (default)', formula: 'min(font + 0.5u, 6u)', value: (u) => icon(u, 'md'), status: 'implemented', notes: 'capped by slot below u~2.2' },
  { id: 'control.icon.lg', family: 'control', element: 'icons in slots', quantity: 'icon lg', formula: 'min(font + 1.5u, 6u)', value: (u) => icon(u, 'lg'), status: 'implemented', notes: 'capped by slot below u~2.9' },
  { id: 'control.icon.fill', family: 'control', element: 'icons in slots', quantity: 'icon fill', formula: '6u', value: (u) => icon(u, 'fill'), status: 'implemented', notes: 'object-fit cover, centered' },
  { id: 'control.radius', family: 'control', element: 'button, input, select', quantity: 'radius', formula: 'min(3u * s, 4u)', value: (u) => ctl(u).radius, status: 'implemented', notes: 'soft curvature, capped at half height' },
  { id: 'control.fill.radius', family: 'control', element: 'fill slot', quantity: 'fill slot radius', formula: 'max(0, radius - u)', value: (u) => Math.max(0, ctl(u).radius - u), status: 'implemented', notes: 'nested inside the control radius' },

  // Fields
  { id: 'field.paddingInline', family: 'control', element: 'input', quantity: 'text inline padding', formula: '(u - B) + u', value: (u) => resolveField({ unit: u }).paddingStart, status: 'implemented', notes: 'text sits where button contents sit' },
  { id: 'select.paddingStart', family: 'control', element: 'select trigger', quantity: 'start padding', formula: '(u - B) + u', value: (u) => resolveSelectTrigger({ unit: u }).paddingStart, status: 'implemented', notes: '' },
  { id: 'select.paddingEnd', family: 'control', element: 'select trigger', quantity: 'end padding', formula: 'u - B', value: (u) => resolveSelectTrigger({ unit: u }).paddingEnd, status: 'implemented', notes: 'chevron occupies a trailing 6u slot' },
  { id: 'select.popupOffset', family: 'control', element: 'select popup', quantity: 'offset from trigger', formula: 'u', value: (u) => popupOffset({ unit: u }), status: 'implemented', notes: '' },

  // Composite
  { id: 'composite.edge', family: 'composite', element: 'listbox, segmented, popup', quantity: 'edge distance D', formula: 'max(B, Q)', value: (u) => cmp(u).edge, status: 'implemented', notes: '' },
  { id: 'composite.padding', family: 'composite', element: 'listbox, segmented, popup', quantity: 'padding', formula: 'D - B', value: (u) => cmp(u).padding, status: 'implemented', notes: '' },
  { id: 'composite.gap', family: 'composite', element: 'listbox, segmented, popup', quantity: 'gap between options', formula: 'Q', value: (u) => cmp(u).gap, status: 'implemented', notes: '' },
  { id: 'composite.option.inset', family: 'composite', element: 'option', quantity: 'option inset Ic', formula: 'max(B, u - D)', value: (u) => cmp(u).child.inset, status: 'implemented', notes: '' },
  { id: 'composite.option.height', family: 'composite', element: 'option', quantity: 'option height', formula: '6u + 2Ic', value: (u) => cmp(u).child.height, status: 'implemented', notes: '' },
  { id: 'composite.rowHeight', family: 'composite', element: 'segmented', quantity: 'one-row height', formula: 'option height + 2D', value: (u) => cmp(u).rowHeight, status: 'implemented', notes: 'equals control height unless the border leaves no room (then grows)' },
  { id: 'composite.radius.segmented', family: 'composite', element: 'segmented', quantity: 'radius', formula: 'min(3u * s, row / 2)', value: (u) => cmp(u).radius, status: 'implemented', notes: '' },
  { id: 'composite.radius.container', family: 'composite', element: 'listbox, popup', quantity: 'radius', formula: '3u * s', value: (u) => containerRadius({ unit: u }), status: 'implemented', notes: 'container curvature, not height-capped' },
  { id: 'composite.option.radius', family: 'composite', element: 'option in segmented', quantity: 'option radius', formula: 'min(option / 2, max(0, parent radius - D)); 0 when Q = 0', value: (u) => cmp(u).child.radius, status: 'implemented', notes: 'Q = 0 is an attached group (square options)' },

  // Badge / tag / chip (proposed, not implemented)
  { id: 'btg.badge.height', family: 'btg', element: 'badge', quantity: 'height', formula: '12 + u', value: (u) => 12 + u, status: 'proposed', notes: 'font + 2' },
  { id: 'btg.tag.height', family: 'btg', element: 'tag', quantity: 'height', formula: '12 + 2u', value: (u) => 12 + 2 * u, status: 'proposed', notes: 'taller than control below u = 2' },
  { id: 'btg.chip.height', family: 'btg', element: 'chip', quantity: 'height', formula: '12 + 3u', value: (u) => 12 + 3 * u, status: 'proposed', notes: 'taller than control below u = 2.4; equals 6u only at u = 4; cap decision open' },
  { id: 'btg.chip.innerSlot', family: 'btg', element: 'chip', quantity: 'inner slot (0.5u inset)', formula: '12 + 3u - 2(0.5u) = 12 + 2u', value: (u) => 12 + 2 * u, status: 'proposed', notes: 'equals tag height' },
  { id: 'btg.tag.innerSlot', family: 'btg', element: 'tag', quantity: 'inner slot (0.5u inset)', formula: '12 + 2u - 2(0.5u) = 12 + u', value: (u) => 12 + u, status: 'proposed', notes: 'equals badge height' },
];

const fmt = (n: number) => String(Math.round(n * 1000) / 1000);
const cell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

export function geometryCsv() {
  const header = ['id', 'family', 'element', 'quantity', 'formula', ...SIZES.map((u) => `u=${u}`), 'status', 'notes'];
  const lines = [header.join(',')];
  for (const r of rows) lines.push([r.id, r.family, r.element, r.quantity, r.formula, ...SIZES.map((u) => fmt(r.value(u))), r.status, r.notes].map(cell).join(','));
  return lines.join('\n') + '\n';
}

export const CSV_PATH = fileURLToPath(new URL('../docs/geometry.csv', import.meta.url));

if (import.meta.main) {
  writeFileSync(CSV_PATH, geometryCsv());
  console.log(`wrote ${CSV_PATH}`);
}
