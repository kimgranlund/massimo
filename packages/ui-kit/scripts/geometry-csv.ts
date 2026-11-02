// Generates docs/geometry.csv: every geometry formula with its value at each size.
// Implemented rows are computed by the resolver itself, so the CSV cannot drift from the
// code (test/geometry-csv.test.ts fails when the file is stale). Run: npm run geometry:csv
import { writeFileSync } from 'node:fs';
import { TYPE_ROLES, resolveType, type TypeRoleName } from '../tokens/typography/resolve.ts';
import { fileURLToPath } from 'node:url';
import { SIZES, GEOMETRY_DEFAULTS, resolveControl, resolveComposite, resolveField, resolveSelectTrigger, resolveButtonContents, resolveTextRun, popupOffset, resolveBtg, resolveChoice, resolveTrack, resolveSwatch, resolveSwiper, resolveContainer, CONTAINERS, PAGE_MAX_WIDTH_REM, type ContainerLevel } from '../tokens/geometry/resolve.ts';

export type Row = { id: string; family: string; element: string; quantity: string; formula: string; value: (u: number) => number; status: 'implemented' | 'proposed' | 'input'; notes: string };

const ctl = (u: number) => resolveControl({ unit: u });
const icon = (u: number, iconSize: 'sm' | 'md' | 'lg' | 'fill') => resolveControl({ unit: u, iconSize }).iconSize;
const cmp = (u: number) => resolveComposite({ unit: u });

export const rows: Row[] = [
  // Inputs
  { id: 'in.u', family: 'input', element: 'all', quantity: 'unit u', formula: 'u = size attribute (px)', value: (u) => u, status: 'input', notes: 'size="2|2.25|2.5|3|3.5|4|4.5"; theme default 4' },
  { id: 'in.B', family: 'input', element: 'all', quantity: 'border B', formula: `B (default ${GEOMETRY_DEFAULTS.border})`, value: () => GEOMETRY_DEFAULTS.border, status: 'input', notes: 'whole px, 0..u/2; lives inside padding, never added to height' },
  { id: 'in.s', family: 'input', element: 'all', quantity: 'curvature scale s', formula: `s (default ${GEOMETRY_DEFAULTS.radiusScale})`, value: () => GEOMETRY_DEFAULTS.radiusScale, status: 'input', notes: 'theme radius-scale, 0..3' },
  { id: 'in.k', family: 'input', element: 'all', quantity: 'corner shape k', formula: 'corner-shape: superellipse(k) (default 1)', value: () => 1, status: 'input', notes: 'theme corner-shape; 1 round, 2 squircle, 0 bevel, -1 scoop' },
  { id: 'in.gap', family: 'input', element: 'containers, composites', quantity: 'gap g', formula: 'gap = g·u (default: the padding level)', value: () => NaN, status: 'input', notes: 'gap attribute 0..8 in 0.5 steps; applies to that element only' },

  // Control
  { id: 'control.height', family: 'control', element: 'button, input, select', quantity: 'height', formula: '8u', value: (u) => ctl(u).height, status: 'implemented', notes: '' },
  { id: 'control.padding', family: 'control', element: 'button, input, select', quantity: 'padding', formula: 'u - B', value: (u) => ctl(u).padding, status: 'implemented', notes: 'border + padding = 1u' },
  { id: 'control.slot', family: 'control', element: 'button, option', quantity: 'slot (leading / contents / trailing) min size', formula: '6u', value: (u) => ctl(u).slot, status: 'implemented', notes: 'empty slots hidden; icon-only button = 8u square' },
  { id: 'control.contents.paddingInline', family: 'control', element: 'button, option', quantity: 'contents inline padding beside a slot', formula: 'u', value: (u) => ctl(u).contents.paddingInline, status: 'implemented', notes: '' },
  { id: 'button.contents.paddingInline.open', family: 'control', element: 'button, option', quantity: 'label padding on a side without leading/trailing', formula: '2u', value: (u) => resolveButtonContents(false, false, { unit: u }).start, status: 'implemented', notes: 'text-only: 2u both sides; leading only: 1u start, 2u end' },
  { id: 'control.textRun.between', family: 'control', element: 'button, option, input control, select trigger, tag, chip, choices', quantity: 'gap between adjacent text parts (prefix | label | suffix)', formula: '0.5u + 0.5u', value: (u) => { const r = resolveTextRun({ prefix: true }, { unit: u }); return r.prefix!.end + r.contents!.start; }, status: 'implemented', notes: 'construction pattern [leading] [prefix] [contents] [suffix] [trailing]; text-run edges: 1u beside a slot, 2u bare (tag/chip 1u, choices 0)' },
  { id: 'control.contents.paddingBlock', family: 'control', element: 'button, option', quantity: 'contents block padding', formula: '(6u - line height) / 2', value: (u) => ctl(u).contents.paddingBlock, status: 'implemented', notes: '' },
  { id: 'control.contents.lineHeight', family: 'control', element: 'button, option', quantity: 'contents line height (single-line controls: button, option, input, select)', formula: 'min(1.2 × font, 6u)', value: (u) => ctl(u).contents.lineHeight, status: 'implemented', notes: '1.2 × (10px + u); the 6u cap applies below u = 2.5' },
  { id: 'control.font', family: 'control', element: 'all controls', quantity: 'font size', formula: '10 + u', value: (u) => ctl(u).fontSize, status: 'implemented', notes: '' },
  { id: 'control.icon.sm', family: 'control', element: 'icons in slots', quantity: 'icon sm', formula: 'min(font - 0.5u, 6u)', value: (u) => icon(u, 'sm'), status: 'implemented', notes: '' },
  { id: 'control.icon.md', family: 'control', element: 'icons in slots', quantity: 'icon md (default)', formula: 'min(font + 0.5u, 6u)', value: (u) => icon(u, 'md'), status: 'implemented', notes: 'capped by slot below u~2.2' },
  { id: 'control.icon.lg', family: 'control', element: 'icons in slots', quantity: 'icon lg', formula: 'min(font + 1.5u, 6u)', value: (u) => icon(u, 'lg'), status: 'implemented', notes: 'capped by slot below u~2.9' },
  { id: 'control.icon.fill', family: 'control', element: 'icons in slots', quantity: 'icon fill', formula: '6u', value: (u) => icon(u, 'fill'), status: 'implemented', notes: 'object-fit cover, centered' },
  { id: 'control.radius', family: 'control', element: 'button, input, select', quantity: 'radius', formula: 'min(3u * s, 4u)', value: (u) => ctl(u).radius, status: 'implemented', notes: 'soft curvature, capped at half height' },
  { id: 'control.fill.radius', family: 'control', element: 'fill slot', quantity: 'fill slot radius', formula: 'max(0, radius - u)', value: (u) => Math.max(0, ctl(u).radius - u), status: 'implemented', notes: 'nested inside the control radius' },

  // Fields
  { id: 'field.paddingInline', family: 'control', element: 'input', quantity: 'text inline padding', formula: '(u - B) + 2u', value: (u) => resolveField({ unit: u }).paddingStart, status: 'implemented', notes: 'host 1u + contents 2u (button label rule); select: contents 2u | 1u, then the 6u trailing chevron slot, then u - B' },
  { id: 'select.paddingStart', family: 'control', element: 'select trigger', quantity: 'start padding', formula: '(u - B) + u', value: (u) => resolveSelectTrigger({ unit: u }).paddingStart, status: 'implemented', notes: '' },
  { id: 'select.paddingEnd', family: 'control', element: 'select trigger', quantity: 'end padding', formula: 'u - B', value: (u) => resolveSelectTrigger({ unit: u }).paddingEnd, status: 'implemented', notes: 'chevron occupies a trailing 6u slot' },
  { id: 'select.chevron.icon', family: 'control', element: 'select trigger', quantity: 'chevron icon', formula: 'icon sm: min(font - 0.5u, 6u)', value: (u) => resolveSelectTrigger({ unit: u }).chevronIcon, status: 'implemented', notes: 'all caret-* icons in slots use sm' },
  { id: 'select.popupOffset', family: 'control', element: 'select popup', quantity: 'offset from trigger', formula: 'u', value: (u) => popupOffset({ unit: u }), status: 'implemented', notes: '' },

  // Composite
  { id: 'composite.edge', family: 'composite', element: 'listbox, segmented, popup', quantity: 'edge distance D', formula: 'max(B, 0.5u)', value: (u) => cmp(u).edge, status: 'implemented', notes: 'the composite padding level' },
  { id: 'composite.padding', family: 'composite', element: 'listbox, segmented, popup', quantity: 'padding', formula: 'D - B', value: (u) => cmp(u).padding, status: 'implemented', notes: '' },
  { id: 'composite.gap', family: 'composite', element: 'listbox, segmented, popup', quantity: 'gap between options', formula: 'g·u (gap attribute), default 0.5u', value: (u) => cmp(u).gap, status: 'implemented', notes: '' },
  { id: 'composite.option.inset', family: 'composite', element: 'option', quantity: 'option inset Ic', formula: 'max(B, u - D)', value: (u) => cmp(u).child.inset, status: 'implemented', notes: '' },
  { id: 'composite.option.height', family: 'composite', element: 'option', quantity: 'option height', formula: '6u + 2Ic', value: (u) => cmp(u).child.height, status: 'implemented', notes: '7u' },
  { id: 'composite.rowHeight', family: 'composite', element: 'segmented', quantity: 'one-row height', formula: 'option height + 2D', value: (u) => cmp(u).rowHeight, status: 'implemented', notes: 'always 8u (B ≤ u/2)' },
  { id: 'composite.radius.segmented', family: 'composite', element: 'segmented', quantity: 'radius', formula: 'min(3.5u * s, row / 2)', value: (u) => cmp(u).radius, status: 'implemented', notes: '' },
  { id: 'composite.radius.container', family: 'composite', element: 'listbox, popup', quantity: 'radius', formula: '3.5u * s', value: (u) => resolveComposite({ unit: u, container: true }).radius, status: 'implemented', notes: '' },
  { id: 'composite.option.radius', family: 'composite', element: 'option', quantity: 'option radius', formula: 'min(option / 2, max(0, parent radius - D))', value: (u) => cmp(u).child.radius, status: 'implemented', notes: '= 3u control radius (concentric)' },

  // Layout containers
  ...(['group', 'collection', 'tile', 'card', 'panel', 'region', 'page'] as ContainerLevel[]).flatMap((level): Row[] => {
    const spec = CONTAINERS[level];
    return [
      { id: `container.${level}.padding`, family: 'container', element: `ui-${level}`, quantity: 'padding', formula: `pad-${level} (default ${spec.padding})u - B`, value: (u) => resolveContainer(level, { unit: u }).padding, status: 'implemented', notes: '' },
      { id: `container.${level}.gap`, family: 'container', element: `ui-${level}`, quantity: 'gap', formula: `gap-${level} (default ${spec.padding})u; the gap attribute wins`, value: (u) => resolveContainer(level, { unit: u }).gap, status: 'implemented', notes: '' },
      { id: `container.${level}.radius`, family: 'container', element: `ui-${level}`, quantity: 'max radius', formula: spec.maxRadius ? `(3 + pad-${level})u * s (default ${spec.maxRadius}u)` : '0', value: (u) => resolveContainer(level, { unit: u }).radius, status: 'implemented', notes: spec.maxRadius ? 'concentric with a 3u control in the corner; capped at half height' : 'square: meets the viewport edge' },
    ];
  }),
  { id: 'container.page.maxWidth', family: 'container', element: 'ui-page', quantity: 'max width', formula: `${PAGE_MAX_WIDTH_REM}rem (fixed)`, value: () => PAGE_MAX_WIDTH_REM * 16, status: 'implemented', notes: 'px at a 16px root; centered; page({ width }) overrides' },

  // Choices, tracks, swatches, swiper
  { id: 'choice.box', family: 'choice', element: 'checkbox, radio, switch', quantity: 'box height', formula: '5u', value: (u) => resolveChoice('checkbox', { unit: u }).box, status: 'implemented', notes: 'in the 6u leading slot' },
  { id: 'choice.switch.width', family: 'choice', element: 'switch', quantity: 'track width', formula: '9u', value: (u) => resolveChoice('switch', { unit: u }).width, status: 'implemented', notes: '' },
  { id: 'choice.switch.thumb', family: 'choice', element: 'switch', quantity: 'thumb', formula: '4u (inset 0.5u)', value: (u) => resolveChoice('switch', { unit: u }).thumb, status: 'implemented', notes: 'travels 4u' },
  { id: 'choice.rowHeight', family: 'choice', element: 'checkbox, radio, switch', quantity: 'row height', formula: '6u', value: (u) => resolveChoice('checkbox', { unit: u }).rowHeight, status: 'implemented', notes: '' },
  { id: 'choice.label.paddingStart', family: 'choice', element: 'checkbox, radio, switch', quantity: 'label start padding', formula: 'u', value: (u) => resolveChoice('checkbox', { unit: u }).labelPaddingStart, status: 'implemented', notes: 'label lands 1.5u from the box' },
  { id: 'choice.checkbox.radius', family: 'choice', element: 'checkbox', quantity: 'radius', formula: 'u * s', value: (u) => resolveChoice('checkbox', { unit: u }).radius, status: 'implemented', notes: 'radio and switch stay round' },
  { id: 'choice.checkbox.mark', family: 'choice', element: 'checkbox', quantity: 'check mark icon', formula: '4u', value: (u) => resolveChoice('checkbox', { unit: u }).mark, status: 'implemented', notes: '' },
  { id: 'choice.radio.dot', family: 'choice', element: 'radio', quantity: 'dot', formula: '2u', value: (u) => resolveChoice('radio', { unit: u }).dot, status: 'implemented', notes: '' },
  { id: 'track.height', family: 'track', element: 'range, progress', quantity: 'box height', formula: '4u', value: (u) => resolveTrack('range', { unit: u }).height, status: 'implemented', notes: '' },
  { id: 'track.track', family: 'track', element: 'range, progress', quantity: 'track thickness', formula: '4u (full height)', value: (u) => resolveTrack('range', { unit: u }).track, status: 'implemented', notes: 'radius min(3u * s, 2u)' },
  { id: 'track.radius', family: 'track', element: 'range, progress', quantity: 'track and thumb radius', formula: 'min(3u * s, 2u)', value: (u) => resolveTrack('range', { unit: u }).trackRadius, status: 'implemented', notes: 'range fill = ratio * (width - 4u) + 4u' },
  { id: 'track.thumb', family: 'track', element: 'range', quantity: 'thumb', formula: '4u', value: (u) => resolveTrack('range', { unit: u }).thumb, status: 'implemented', notes: '' },
  { id: 'track.minWidth', family: 'track', element: 'range, progress', quantity: 'min width', formula: '24u', value: (u) => resolveTrack('range', { unit: u }).minWidth, status: 'implemented', notes: '' },
  { id: 'swatch.size', family: 'swatch', element: 'swatch', quantity: 'size', formula: '6u', value: (u) => resolveSwatch({ unit: u }).size, status: 'implemented', notes: '' },
  { id: 'swatch.radius', family: 'swatch', element: 'swatch', quantity: 'radius', formula: 'u * s', value: (u) => resolveSwatch({ unit: u }).radius, status: 'implemented', notes: 'square inside a palette' },
  { id: 'swatch.palette.radius', family: 'swatch', element: 'palette', quantity: 'radius', formula: '2u * s', value: (u) => resolveSwatch({ unit: u }).paletteRadius, status: 'implemented', notes: 'swatches attached, no gap' },
  { id: 'swiper.paddleInset', family: 'swiper', element: 'swiper', quantity: 'paddle inset', formula: '2u', value: (u) => resolveSwiper({ unit: u }).paddleInset, status: 'implemented', notes: 'paddles are 8u icon buttons' },
  { id: 'swiper.dot', family: 'swiper', element: 'swiper', quantity: 'dot', formula: '2u (active 4u wide)', value: (u) => resolveSwiper({ unit: u }).dot, status: 'implemented', notes: '4u hit area, u gap' },

  // Typography (ratio 1.333, rhythm 1u)
  { id: 'in.typeRatio', family: 'input', element: 'text', quantity: 'type ratio r', formula: 'r (default 1.333)', value: () => 1.333, status: 'input', notes: 'theme type-ratio, 1–1.5' },
  { id: 'in.typeRhythm', family: 'input', element: 'text', quantity: 'type rhythm', formula: 'rhythm × u (default 1)', value: () => 1, status: 'input', notes: 'theme type-rhythm: 0 natural, 0.5, 1' },
  ...(Object.entries(TYPE_ROLES) as [TypeRoleName, (typeof TYPE_ROLES)[TypeRoleName]][]).flatMap(([role, r]): Row[] => [
    { id: `type.${role}.size`, family: 'type', element: role, quantity: 'font size', formula: 'u' in r ? `${r.u}u` : `(10 + u) × r^${r.step}`, value: (u) => resolveType(role, { unit: u }).size, status: 'implemented', notes: '' },
    { id: `type.${role}.lineHeight`, family: 'type', element: role, quantity: 'line height', formula: 'control' in r ? `${r.lh} (unitless)` : `ceil(size × ${r.lh} / u) × u`, value: (u) => resolveType(role, { unit: u }).lineHeight, status: 'implemented', notes: `voice ${r.voice}, weight ${r.weight}, tracking ${r.tracking}em${'upper' in r ? ', uppercase' : ''}` },
  ]),

  // Badge / tag / chip
  { id: 'btg.chip.height', family: 'btg', element: 'chip', quantity: 'height', formula: 'min(12 + 3u, 8u)', value: (u) => resolveBtg('chip', { unit: u }).height, status: 'implemented', notes: 'cap: never taller than a control (bites below u = 2.4)' },
  { id: 'btg.tag.height', family: 'btg', element: 'tag', quantity: 'height', formula: 'min(12 + 2u, chip - u)', value: (u) => resolveBtg('tag', { unit: u }).height, status: 'implemented', notes: 'one u below chip' },
  { id: 'btg.badge.height', family: 'btg', element: 'badge', quantity: 'height', formula: 'min(12 + u, tag - u)', value: (u) => resolveBtg('badge', { unit: u }).height, status: 'implemented', notes: 'one u below tag' },
  { id: 'btg.chip.font', family: 'btg', element: 'chip', quantity: 'font size', formula: '10 + u', value: (u) => resolveBtg('chip', { unit: u }).fontSize, status: 'implemented', notes: 'same as controls' },
  { id: 'btg.tag.font', family: 'btg', element: 'tag', quantity: 'font size', formula: '10 + 0.5u', value: (u) => resolveBtg('tag', { unit: u }).fontSize, status: 'implemented', notes: '' },
  { id: 'btg.badge.font', family: 'btg', element: 'badge', quantity: 'font size', formula: '10', value: (u) => resolveBtg('badge', { unit: u }).fontSize, status: 'implemented', notes: '' },
  { id: 'btg.padding', family: 'btg', element: 'badge, tag, chip', quantity: 'padding', formula: 'max(0, 0.5u - B)', value: (u) => resolveBtg('chip', { unit: u }).padding, status: 'implemented', notes: 'host padding for badge, tag and chip; the label wrapper carries the rest' },
  { id: 'btg.chip.slot', family: 'btg', element: 'chip', quantity: 'slot (leading / contents / trailing) min size', formula: 'chip - u', value: (u) => resolveBtg('chip', { unit: u }).slot, status: 'implemented', notes: 'equals tag height (uncapped range)' },
  { id: 'btg.tag.slot', family: 'btg', element: 'tag', quantity: 'slot min size', formula: 'tag - u', value: (u) => resolveBtg('tag', { unit: u }).slot, status: 'implemented', notes: 'equals badge height (uncapped range)' },
  { id: 'btg.chip.lineHeight', family: 'btg', element: 'chip', quantity: 'line height', formula: 'min(1.2 × font, slot)', value: (u) => resolveBtg('chip', { unit: u }).lineHeight, status: 'implemented', notes: 'tag: same rule with the tag font and slot; badge: min(1.2 × 10px, badge height)' },
  { id: 'btg.label.bareEdge', family: 'btg', element: 'tag, chip', quantity: 'label padding at a bare edge', formula: 'u', value: (u) => resolveBtg('chip', { unit: u }).bareEdge, status: 'implemented', notes: 'half the control (2u); beside a slot 0.5u; text parts 0.5u apart' },
  { id: 'btg.label.slotEdge', family: 'btg', element: 'tag, chip', quantity: 'label padding beside a slot', formula: '0.5u', value: (u) => resolveBtg('chip', { unit: u }).slotEdge, status: 'implemented', notes: '' },
  { id: 'btg.badge.label.bareEdge', family: 'btg', element: 'badge', quantity: 'label padding at a bare edge', formula: 'max(0, min(0.5u, (badge - 2·pad - 2B - 1ch) / 2))', value: (u) => resolveBtg('badge', { unit: u }).bareEdge, status: 'implemented', notes: 'ch = one digit (value shown for ch = 5.5px); keeps a one-character badge round; beside a slot 0.25u' },
  { id: 'btg.chip.icon.md', family: 'btg', element: 'chip', quantity: 'icon md', formula: 'min(chip font + 0.5u, chip slot)', value: (u) => resolveBtg('chip', { unit: u }).iconSize, status: 'implemented', notes: 'sm/lg/fill as for controls, against the chip slot' },
  { id: 'btg.tag.icon.md', family: 'btg', element: 'tag', quantity: 'icon md', formula: 'min(tag font + 0.5u, tag slot)', value: (u) => resolveBtg('tag', { unit: u }).iconSize, status: 'implemented', notes: '' },
  { id: 'btg.minWidth', family: 'btg', element: 'badge, tag, chip', quantity: 'min width', formula: 'height', value: (u) => resolveBtg('badge', { unit: u }).minWidth, status: 'implemented', notes: 'value shown for badge; a single character is a circle' },
  { id: 'btg.chip.radius', family: 'btg', element: 'chip', quantity: 'radius', formula: 'min(3u * s, chip / 2)', value: (u) => resolveBtg('chip', { unit: u }).radius, status: 'implemented', notes: 'tag and badge: same formula with their height' },
];

const fmt = (n: number) => (Number.isNaN(n) ? '' : String(Math.round(n * 1000) / 1000));
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
