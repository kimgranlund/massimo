// Generates docs/geometry.csv: every geometry formula with its value at each size.
// Implemented rows are computed by the resolver itself, so the CSV cannot drift from the
// code (test/geometry-csv.test.ts fails when the file is stale). Run: npm run geometry:csv
import { writeFileSync } from 'node:fs';
import { TYPE_ROLES, resolveType, type TypeRoleName } from '../tokens/typography/resolve.ts';
import { fileURLToPath } from 'node:url';
import { SIZES, GEOMETRY_DEFAULTS, resolveControl, resolveComposite, resolveField, resolveSelectTrigger, resolveButtonContents, resolveTextRun, popupOffset, resolveBtg, resolveChoice, resolveTrack, trackFill, resolveSwatch, resolveSwiper, resolveFieldRow, resolveFieldGrid, resolveImage, IMAGE_RATIOS, resolveContainer, CONTAINERS, PAGE_MAX_WIDTH_REM, resolveSeparator, resolveAvatar, resolveMeter, AVATAR_SIZES, resolveChoiceGroup, resolveFieldset, resolveDisclosure, resolveTabs, resolvePopup, type AvatarSize, type ContainerLevel } from '../tokens/geometry/resolve.ts';

export type Row = { id: string; family: string; element: string; quantity: string; formula: string; value: (u: number) => number; status: 'implemented' | 'proposed' | 'input'; notes: string };

const ctl = (u: number) => resolveControl({ unit: u });
const icon = (u: number, iconSize: 'sm' | 'md' | 'lg' | 'fill') => resolveControl({ unit: u, iconSize }).iconSize;
const cmp = (u: number) => resolveComposite({ unit: u });

export const rows: Row[] = [
  // Inputs
  { id: 'in.u', family: 'input', element: 'all', quantity: 'unit u', formula: 'u = size attribute (px)', value: (u) => u, status: 'input', notes: 'size="2|2.25|2.5|3|3.5|4|4.5"; theme default 4.5' },
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
  ...((Object.keys(CONTAINERS) as ContainerLevel[]).filter((l) => l !== 'composite')).flatMap((level): Row[] => {
    const spec = CONTAINERS[level];
    const element = level.startsWith('card-') ? `ui-card${level === 'card-md' ? '' : `[padding=${level.slice(5)}]`}` : `ui-${level}`;
    return [
      { id: `container.${level}.padding`, family: 'container', element, quantity: 'padding', formula: `pad-${level} (default ${spec.padding})u - B`, value: (u) => resolveContainer(level, { unit: u }).padding, status: 'implemented', notes: '' },
      { id: `container.${level}.gap`, family: 'container', element, quantity: 'gap', formula: `gap-${level} (default ${spec.padding})u; the gap attribute wins`, value: (u) => resolveContainer(level, { unit: u }).gap, status: 'implemented', notes: '' },
      { id: `container.${level}.radius`, family: 'container', element, quantity: 'max radius', formula: spec.family === 'area' ? '0' : spec.family === 'wrapper' ? `(3 + pad-${level})u * s (default ${spec.maxRadius}u)` : `pad-${level}u * min(1, s) (default ${spec.maxRadius}u)`, value: (u) => resolveContainer(level, { unit: u }).radius, status: 'implemented', notes: spec.family === 'area' ? 'area: square, meets the viewport or other areas' : spec.family === 'wrapper' ? 'wrapper: concentric with 3u children; capped at half height' : 'container: at most the padding; capped at half height' },
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
  { id: 'track.radius', family: 'track', element: 'range, progress', quantity: 'track and fill radius', formula: 'min(3u * s, 2u)', value: (u) => resolveTrack('range', { unit: u }).trackRadius, status: 'implemented', notes: 'range fill = ratio * (width - 4u) + 4u' },
  { id: 'track.thumb', family: 'track', element: 'range', quantity: 'thumb', formula: 'track - u', value: (u) => resolveTrack('range', { unit: u }).thumb, status: 'implemented', notes: 'inset 0.5u like the switch thumb; radius track radius - 0.5u' },
  { id: 'track.fill.range', family: 'track', element: 'range', quantity: 'fill width at ratio p (shown for p = 0)', formula: 'track + p * (width - track)', value: (u) => trackFill('range', 0, 24 * 4 * u, { unit: u }), status: 'implemented', notes: 'ends one track radius past the thumb center: a concentric cap around the thumb' },
  { id: 'track.minWidth', family: 'track', element: 'range, progress', quantity: 'min width', formula: '24u', value: (u) => resolveTrack('range', { unit: u }).minWidth, status: 'implemented', notes: '' },
  { id: 'swatch.size', family: 'swatch', element: 'swatch', quantity: 'size', formula: '6u', value: (u) => resolveSwatch({ unit: u }).size, status: 'implemented', notes: '' },
  { id: 'swatch.radius', family: 'swatch', element: 'swatch', quantity: 'radius', formula: 'u * s', value: (u) => resolveSwatch({ unit: u }).radius, status: 'implemented', notes: 'square inside a palette' },
  { id: 'swatch.palette.radius', family: 'swatch', element: 'palette', quantity: 'radius', formula: '2u * s', value: (u) => resolveSwatch({ unit: u }).paletteRadius, status: 'implemented', notes: 'swatches attached, no gap' },
  { id: 'swiper.paddleInset', family: 'swiper', element: 'swiper', quantity: 'paddle inset', formula: '2u', value: (u) => resolveSwiper({ unit: u }).paddleInset, status: 'implemented', notes: 'paddles are 8u icon buttons' },
  { id: 'swiper.dot', family: 'swiper', element: 'swiper', quantity: 'dot', formula: '2u (active 4u wide)', value: (u) => resolveSwiper({ unit: u }).dot, status: 'implemented', notes: '4u hit area, u gap' },
  { id: 'swiper.paddle', family: 'swiper', element: 'swiper', quantity: 'paddle size', formula: '8u (radius 4u, always round)', value: (u) => resolveSwiper({ unit: u }).paddle, status: 'implemented', notes: 'icon size lg' },
  { id: 'swiper.dotActive', family: 'swiper', element: 'swiper', quantity: 'active dot width', formula: '4u', value: (u) => resolveSwiper({ unit: u }).dotActive, status: 'implemented', notes: 'dot radius u' },
  { id: 'swiper.dotHit', family: 'swiper', element: 'swiper', quantity: 'dot hit area', formula: '4u square', value: (u) => resolveSwiper({ unit: u }).dotHit, status: 'implemented', notes: '' },
  { id: 'swiper.dotsGap', family: 'swiper', element: 'swiper', quantity: 'dots gap', formula: 'u', value: (u) => resolveSwiper({ unit: u }).dotsGap, status: 'implemented', notes: '' },
  { id: 'swiper.dotsInset', family: 'swiper', element: 'swiper', quantity: 'dots inset from the bottom', formula: '2u', value: (u) => resolveSwiper({ unit: u }).dotsInset, status: 'implemented', notes: '' },

  // Image
  { id: 'image.radius', family: 'image', element: 'image', quantity: 'radius', formula: '0', value: (u) => resolveImage({ unit: u }).radius, status: 'implemented', notes: 'square frame; a container clips it' },
  ...Object.entries(IMAGE_RATIOS).map(([name, r]): Row => ({ id: `image.ratio.${name}`, family: 'image', element: `image[ratio=${name}]`, quantity: 'height / width', formula: `1 / (${name} ratio ${Math.round(r * 1000) / 1000})`, value: (u) => resolveImage({ unit: u, ratio: name, width: 1 }).height!, status: 'implemented', notes: 'no ratio or an invalid one: the content sets the height; a custom "w/h" is h / w' })),
  { id: 'image.slideshow.paddle', family: 'image', element: 'image[slideshow]', quantity: 'paddle size', formula: '8u (the swiper paddle)', value: (u) => resolveImage({ unit: u }).slideshow.paddle, status: 'implemented', notes: 'the swiper fills the frame; dots and insets as for the swiper' },

  // Field rows
  { id: 'fieldRow.columnGap', family: 'field-row', element: 'field', quantity: 'column gap', formula: '2u', value: (u) => resolveFieldRow('stacked', { unit: u }).columnGap, status: 'implemented', notes: 'control to readout; inline also label to control' },
  { id: 'fieldRow.stacked.rowGap', family: 'field-row', element: 'field[layout=stacked]', quantity: 'row gap', formula: '1.5u', value: (u) => resolveFieldRow('stacked', { unit: u }).rowGap, status: 'implemented', notes: 'label above the control; control to description' },
  { id: 'fieldRow.inline.rowGap', family: 'field-row', element: 'field[layout=inline]', quantity: 'row gap', formula: 'u', value: (u) => resolveFieldRow('inline', { unit: u }).rowGap, status: 'implemented', notes: 'control row to description' },
  { id: 'fieldRow.stacked.unitGap', family: 'field-row', element: 'field[layout=stacked]', quantity: 'label to unit', formula: 'u', value: (u) => resolveFieldRow('stacked', { unit: u }).unitGap, status: 'implemented', notes: '' },
  { id: 'fieldRow.inline.unitGap', family: 'field-row', element: 'field[layout=inline]', quantity: 'label to unit (min)', formula: '2u', value: (u) => resolveFieldRow('inline', { unit: u }).unitGap, status: 'implemented', notes: 'the unit sits at the label column end' },
  { id: 'fieldRow.readout.minWidth', family: 'field-row', element: 'field, field-grid', quantity: 'readout min width', formula: '10u', value: (u) => resolveFieldRow('stacked', { unit: u }).readoutMinWidth, status: 'implemented', notes: 'end-aligned numeric voice' },
  { id: 'fieldGrid.columnGap', family: 'field-row', element: 'field-grid', quantity: 'column gap', formula: '2u', value: (u) => resolveFieldGrid({ unit: u }).columnGap, status: 'implemented', notes: 'label column fit-content(40%), control 1fr, readout auto' },
  { id: 'fieldGrid.rowGap', family: 'field-row', element: 'field-grid', quantity: 'row gap', formula: '2u', value: (u) => resolveFieldGrid({ unit: u }).rowGap, status: 'implemented', notes: 'each field is a subgrid row' },
  { id: 'fieldGrid.headingSpace', family: 'field-row', element: 'field-grid', quantity: 'space above a heading', formula: '4u', value: (u) => resolveFieldGrid({ unit: u }).headingSpace, status: 'implemented', notes: 'every heading but the first' },
  // Choice groups
  { id: 'choiceGroup.vertical.gap', family: 'choice-group', element: 'radio-group, checkbox-group', quantity: 'gap between choices (vertical)', formula: 'g·u (gap attribute), default u', value: (u) => resolveChoiceGroup('vertical', { unit: u }).gap, status: 'implemented', notes: '6u rows 1u apart: a 7u pitch, like composite items' },
  { id: 'choiceGroup.vertical.pitch', family: 'choice-group', element: 'radio-group, checkbox-group', quantity: 'row pitch (vertical)', formula: '6u + gap', value: (u) => resolveChoiceGroup('vertical', { unit: u }).pitch, status: 'implemented', notes: 'one-line labels; a wrapping label grows its row' },
  { id: 'choiceGroup.horizontal.columnGap', family: 'choice-group', element: 'radio-group[orientation=horizontal], checkbox-group[orientation=horizontal]', quantity: 'gap between choices (horizontal)', formula: 'g·u (gap attribute), default 4u', value: (u) => resolveChoiceGroup('horizontal', { unit: u }).columnGap, status: 'implemented', notes: 'a choice label has no end padding' },
  { id: 'choiceGroup.horizontal.rowGap', family: 'choice-group', element: 'radio-group[orientation=horizontal], checkbox-group[orientation=horizontal]', quantity: 'gap between wrapped lines', formula: 'u', value: (u) => resolveChoiceGroup('horizontal', { unit: u }).rowGap, status: 'implemented', notes: '' },
  // Fieldset
  { id: 'fieldset.gap', family: 'fieldset', element: 'fieldset', quantity: 'gap between the legend and the fields', formula: 'g·u (gap attribute), default the collection gap (2u)', value: (u) => resolveFieldset({ unit: u }).gap, status: 'implemented', notes: 'theme gap-collection' },
  { id: 'fieldset.padding', family: 'fieldset', element: 'fieldset', quantity: 'padding, border, radius', formula: '0', value: (u) => resolveFieldset({ unit: u }).padding, status: 'implemented', notes: 'no box of its own; a card around it supplies the surface' },

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
  { id: 'btg.padding', family: 'btg', element: 'badge, tag, chip', quantity: 'padding', formula: 'max(0, 0.5u′ - B), u′ = height / 8', value: (u) => resolveBtg('chip', { unit: u }).padding, status: 'implemented', notes: 'host padding for badge, tag and chip; the label wrapper carries the rest' },
  { id: 'btg.chip.slot', family: 'btg', element: 'chip', quantity: 'slot (leading / contents / trailing) min size', formula: 'chip - u′ (u′ = chip / 8)', value: (u) => resolveBtg('chip', { unit: u }).slot, status: 'implemented', notes: 'spacing is relative to the element' },
  { id: 'btg.tag.slot', family: 'btg', element: 'tag', quantity: 'slot min size', formula: 'tag - u′ (u′ = tag / 8)', value: (u) => resolveBtg('tag', { unit: u }).slot, status: 'implemented', notes: 'spacing is relative to the element' },
  { id: 'btg.chip.lineHeight', family: 'btg', element: 'chip', quantity: 'line height', formula: 'min(1.2 × font, slot)', value: (u) => resolveBtg('chip', { unit: u }).lineHeight, status: 'implemented', notes: 'tag: same rule with the tag font and slot; badge: min(1.2 × 10px, badge height)' },
  { id: 'btg.label.edge', family: 'btg', element: 'badge, tag', quantity: 'label padding (bare edge and beside a slot)', formula: 'u′ = height / 8', value: (u) => resolveBtg('tag', { unit: u }).bareEdge, status: 'implemented', notes: 'value shown for tag; text parts 0.5u′ apart' },
  { id: 'btg.chip.label.bareEdge', family: 'btg', element: 'chip', quantity: 'label padding at a bare edge', formula: '1.5u′', value: (u) => resolveBtg('chip', { unit: u }).bareEdge, status: 'implemented', notes: '+0.5u′ compensation; beside a slot 1u′' },
  { id: 'btg.localUnit', family: 'btg', element: 'badge, tag, chip', quantity: 'local unit u′ (all spacing)', formula: 'height / 8', value: (u) => resolveBtg('tag', { unit: u }).localUnit, status: 'implemented', notes: 'value shown for tag; chip and badge use their own height' },
  { id: 'btg.chip.icon.md', family: 'btg', element: 'chip', quantity: 'icon md', formula: 'min(chip font + 0.5u, chip slot)', value: (u) => resolveBtg('chip', { unit: u }).iconSize, status: 'implemented', notes: 'sm/lg/fill as for controls, against the chip slot' },
  { id: 'btg.tag.icon.md', family: 'btg', element: 'tag', quantity: 'icon md', formula: 'min(tag font + 0.5u, tag slot)', value: (u) => resolveBtg('tag', { unit: u }).iconSize, status: 'implemented', notes: '' },
  { id: 'btg.minWidth', family: 'btg', element: 'badge, tag, chip', quantity: 'min width', formula: 'height', value: (u) => resolveBtg('badge', { unit: u }).minWidth, status: 'implemented', notes: 'value shown for badge; never narrower than tall' },
  { id: 'btg.chip.radius', family: 'btg', element: 'chip', quantity: 'radius', formula: 'min((0.5u′ + slot / 3) * s, chip / 2)', value: (u) => resolveBtg('chip', { unit: u }).radius, status: 'implemented', notes: 'concentric with the slot (the button: 1u + 6u / 3 = 3u); tag and badge use their own u′ and slot' },

  // Separator
  { id: 'separator.thickness', family: 'separator', element: 'separator', quantity: 'thickness (height, or width when vertical)', formula: 'max(1px, B)', value: (u) => resolveSeparator({ unit: u }).thickness, status: 'implemented', notes: 'B = min(border, u/2): a hairline at B = 0 and 1; the theme border above' },
  { id: 'separator.thicknessAtB2', family: 'separator', element: 'separator', quantity: 'thickness at B = 2', formula: 'max(1px, min(2, u/2))', value: (u) => resolveSeparator({ unit: u, border: Math.min(2, u / 2) }).thickness, status: 'implemented', notes: 'spans the other axis; no padding or margin (the container gap spaces it)' },

  // Meter
  { id: 'meter.track', family: 'track', element: 'meter', quantity: 'track thickness', formula: '4u (the progress track)', value: (u) => resolveMeter({ unit: u }).track, status: 'implemented', notes: 'fill = ratio × width, radius min(3u * s, 2u)' },
  { id: 'meter.rowGap', family: 'track', element: 'meter', quantity: 'text row to track', formula: '1.5u', value: (u) => resolveMeter({ unit: u }).rowGap, status: 'implemented', notes: 'the stacked field gap' },
  { id: 'meter.columnGap', family: 'track', element: 'meter', quantity: 'label to value (min)', formula: '2u', value: (u) => resolveMeter({ unit: u }).columnGap, status: 'implemented', notes: 'the value sits at the end, tabular figures' },
  { id: 'meter.lineHeight', family: 'track', element: 'meter', quantity: 'label and value line height', formula: 'min(1.2 × (10 + u), 6u)', value: (u) => resolveMeter({ unit: u }).lineHeight, status: 'implemented', notes: 'control voice, font 10 + u' },

  // Avatar
  ...(Object.keys(AVATAR_SIZES) as AvatarSize[]).flatMap((k): Row[] => [
    { id: `avatar.${k}.size`, family: 'avatar', element: `avatar[avatar-size=${k}]`, quantity: 'size (square)', formula: `${AVATAR_SIZES[k]}u`, value: (u) => resolveAvatar(k, { unit: u }).size, status: 'implemented', notes: k === 'sm' ? 'the 6u slot: fits a leading slot' : k === 'md' ? 'the 8u control height (default)' : '' },
    { id: `avatar.${k}.font`, family: 'avatar', element: `avatar[avatar-size=${k}]`, quantity: 'initials font size', formula: `(10 + u) × ${AVATAR_SIZES[k] / 8}`, value: (u) => resolveAvatar(k, { unit: u }).fontSize, status: 'implemented', notes: 'the control font × k, k = size / 8u; line height 1.2' },
    { id: `avatar.${k}.icon`, family: 'avatar', element: `avatar[avatar-size=${k}]`, quantity: 'fallback icon', formula: `(10 + 1.5u) × ${AVATAR_SIZES[k] / 8}`, value: (u) => resolveAvatar(k, { unit: u }).iconSize, status: 'implemented', notes: 'the md control icon × k' },
  ]),
  { id: 'avatar.radius', family: 'avatar', element: 'avatar', quantity: 'radius', formula: 'size / 2 × min(1, s)', value: (u) => resolveAvatar('md', { unit: u }).radius, status: 'implemented', notes: 'value shown for md: a circle at s ≥ 1, square at s = 0' },
  // Disclosure (collapsible, accordion)
  { id: 'disclosure.trigger.height', family: 'disclosure', element: 'collapsible trigger', quantity: 'trigger height', formula: '8u', value: (u) => resolveDisclosure({ unit: u }).height, status: 'implemented', notes: 'a control row, full width; grows with a wrapping label' },
  { id: 'disclosure.trigger.padding', family: 'disclosure', element: 'collapsible trigger', quantity: 'padding', formula: 'u - B', value: (u) => resolveDisclosure({ unit: u }).padding, status: 'implemented', notes: 'transparent border inside the 1u' },
  { id: 'disclosure.trigger.labelStart', family: 'disclosure', element: 'collapsible trigger', quantity: 'label start padding (bare edge)', formula: '2u', value: (u) => resolveDisclosure({ unit: u }).labelStart, status: 'implemented', notes: '1u beside a leading slot' },
  { id: 'disclosure.trigger.labelEnd', family: 'disclosure', element: 'collapsible trigger', quantity: 'label end padding (beside the caret slot)', formula: 'u', value: (u) => resolveDisclosure({ unit: u }).labelEnd, status: 'implemented', notes: 'the caret sits in the 6u trailing slot' },
  { id: 'disclosure.caret', family: 'disclosure', element: 'collapsible trigger', quantity: 'caret icon', formula: 'icon sm: min(font - 0.5u, 6u)', value: (u) => resolveDisclosure({ unit: u }).caret, status: 'implemented', notes: 'turns 180° while open (toggle intent)' },
  { id: 'disclosure.trigger.radius', family: 'disclosure', element: 'collapsible trigger', quantity: 'radius', formula: 'min(3u * s, 4u)', value: (u) => resolveDisclosure({ unit: u }).radius, status: 'implemented', notes: 'the control radius' },
  { id: 'disclosure.panel.paddingInline', family: 'disclosure', element: 'collapsible panel', quantity: 'panel inline padding', formula: 'u + 2u', value: (u) => resolveDisclosure({ unit: u }).panelInline, status: 'implemented', notes: 'text starts at the trigger label edge' },
  { id: 'disclosure.panel.paddingBlockEnd', family: 'disclosure', element: 'collapsible panel', quantity: 'panel end padding', formula: '2u', value: (u) => resolveDisclosure({ unit: u }).panelBlockEnd, status: 'implemented', notes: '0 while closed; height and padding animate on the reveal intent' },
  { id: 'disclosure.accordion.divider', family: 'disclosure', element: 'accordion item', quantity: 'divider between items', formula: 'thin border width (1px token)', value: (u) => resolveDisclosure({ unit: u }).divider, status: 'implemented', notes: 'border role; outside the trigger padding, so it is the same at B = 0 and B > 0' },
  { id: 'disclosure.tabs.gap', family: 'disclosure', element: 'tabs', quantity: 'list to panel', formula: '2u', value: (u) => resolveTabs('segmented', { unit: u }).gap, status: 'implemented', notes: 'beside the panel when vertical' },
  { id: 'disclosure.tabs.segmented.listHeight', family: 'disclosure', element: 'tabs[variant=segmented] list', quantity: 'list height (one row)', formula: '7u + 2D = 8u', value: (u) => resolveTabs('segmented', { unit: u }).listHeight, status: 'implemented', notes: 'a composite: edge D = max(B, 0.5u), padding D - B, gap 0.5u' },
  { id: 'disclosure.tabs.segmented.tabHeight', family: 'disclosure', element: 'tabs[variant=segmented] tab', quantity: 'tab height', formula: '6u + 2Ic = 7u', value: (u) => resolveTabs('segmented', { unit: u }).tabHeight, status: 'implemented', notes: 'a composite option; the indicator is its box' },
  { id: 'disclosure.tabs.segmented.tabRadius', family: 'disclosure', element: 'tabs[variant=segmented] tab, indicator', quantity: 'tab and indicator radius', formula: 'min(tab / 2, max(0, list radius - D))', value: (u) => resolveTabs('segmented', { unit: u }).tabRadius, status: 'implemented', notes: 'concentric with the list' },
  { id: 'disclosure.tabs.underline.tabHeight', family: 'disclosure', element: 'tabs[variant=underline] tab', quantity: 'tab height', formula: '8u', value: (u) => resolveTabs('underline', { unit: u }).tabHeight, status: 'implemented', notes: 'a control row, padding u - B; tabs touch (gap 0)' },
  { id: 'disclosure.tabs.underline.indicator', family: 'disclosure', element: 'tabs[variant=underline] indicator', quantity: 'indicator thickness', formula: '0.5u', value: (u) => resolveTabs('underline', { unit: u }).indicatorThickness!, status: 'implemented', notes: 'radius 0.25u; as wide as the active tab, on the track' },
  { id: 'disclosure.tabs.underline.track', family: 'disclosure', element: 'tabs[variant=underline] list', quantity: 'track', formula: 'thin border width (1px token)', value: (u) => resolveTabs('underline', { unit: u }).track, status: 'implemented', notes: 'border role, on the list end edge (inline end when vertical)' },
  { id: 'disclosure.accordion.itemHeight', family: 'disclosure', element: 'accordion item', quantity: 'closed item height', formula: '8u + 1px', value: (u) => resolveDisclosure({ unit: u }).itemHeight, status: 'implemented', notes: 'trigger row plus the divider' },
  // Popups (popover, tooltip, preview card)
  { id: 'popup.offset', family: 'popup', element: 'popover, tooltip, preview card positioner', quantity: 'offset from the trigger', formula: 'u', value: (u) => resolvePopup('popover', { unit: u }).offset, status: 'implemented', notes: 'flips to the opposite side when the preferred one has no room' },
  { id: 'popup.arrow.width', family: 'popup', element: 'popup arrow', quantity: 'arrow width', formula: '2u', value: (u) => resolvePopup('popover', { unit: u }).arrowWidth, status: 'implemented', notes: 'centered on the trigger, kept radius + u inside the popup ends' },
  { id: 'popup.arrow.height', family: 'popup', element: 'popup arrow', quantity: 'arrow height (tip to popup edge)', formula: 'u', value: (u) => resolvePopup('popover', { unit: u }).arrowHeight, status: 'implemented', notes: 'spans the 1u gap; its base covers the popup edge (B)' },
  { id: 'popup.popover.padding', family: 'popup', element: 'popover popup', quantity: 'padding', formula: '3u - B', value: (u) => resolvePopup('popover', { unit: u }).paddingBlock, status: 'implemented', notes: 'the card-sm level (theme pad-card-sm)' },
  { id: 'popup.popover.radius', family: 'popup', element: 'popover popup', quantity: 'radius', formula: '3u * min(1, s)', value: (u) => resolvePopup('popover', { unit: u }).radius, status: 'implemented', notes: 'container family: at most the padding' },
  { id: 'popup.popover.gap', family: 'popup', element: 'popover popup', quantity: 'gap', formula: 'u', value: (u) => resolvePopup('popover', { unit: u }).gap, status: 'implemented', notes: 'the group gap; the gap attribute wins' },
  { id: 'popup.popover.maxWidth', family: 'popup', element: 'popover positioner', quantity: 'max width', formula: 'min(available width, 80u)', value: (u) => resolvePopup('popover', { unit: u }).maxWidth, status: 'implemented', notes: 'value shown is the 80u cap; min width = the trigger width' },
  { id: 'popup.tooltip.height', family: 'popup', element: 'tooltip popup', quantity: 'single-line height', formula: '6u + 2 * 0.5u = 7u', value: (u) => resolvePopup('tooltip', { unit: u }).height ?? NaN, status: 'implemented', notes: 'a 6u text slot inside a 0.5u edge, like a composite item; grows when it wraps' },
  { id: 'popup.tooltip.paddingBlock', family: 'popup', element: 'tooltip popup', quantity: 'block padding', formula: '0.5u - B + (6u - line) / 2', value: (u) => resolvePopup('tooltip', { unit: u }).paddingBlock, status: 'implemented', notes: 'line = min(1.2 * font, 6u)' },
  { id: 'popup.tooltip.paddingInline', family: 'popup', element: 'tooltip popup', quantity: 'inline padding', formula: '2u - B', value: (u) => resolvePopup('tooltip', { unit: u }).paddingInline, status: 'implemented', notes: 'text 2u from a bare edge' },
  { id: 'popup.tooltip.radius', family: 'popup', element: 'tooltip popup', quantity: 'radius', formula: 'min(3u * s, 3.5u)', value: (u) => resolvePopup('tooltip', { unit: u }).radius, status: 'implemented', notes: 'the control radius, capped at half the 7u row' },
  { id: 'popup.tooltip.maxWidth', family: 'popup', element: 'tooltip positioner', quantity: 'max width', formula: 'min(available width, 60u)', value: (u) => resolvePopup('tooltip', { unit: u }).maxWidth, status: 'implemented', notes: 'no minimum of the trigger width' },
  { id: 'popup.previewCard.padding', family: 'popup', element: 'preview card popup', quantity: 'padding', formula: '4u - B', value: (u) => resolvePopup('preview-card', { unit: u }).paddingBlock, status: 'implemented', notes: 'the card-md level (theme pad-card-md)' },
  { id: 'popup.previewCard.radius', family: 'popup', element: 'preview card popup', quantity: 'radius', formula: '4u * min(1, s)', value: (u) => resolvePopup('preview-card', { unit: u }).radius, status: 'implemented', notes: 'container family: at most the padding' },
  { id: 'popup.previewCard.gap', family: 'popup', element: 'preview card popup', quantity: 'gap', formula: '2u', value: (u) => resolvePopup('preview-card', { unit: u }).gap, status: 'implemented', notes: 'the collection gap; the gap attribute wins' },
  { id: 'popup.previewCard.maxWidth', family: 'popup', element: 'preview card positioner', quantity: 'max width', formula: 'min(available width, 80u)', value: (u) => resolvePopup('preview-card', { unit: u }).maxWidth, status: 'implemented', notes: 'min width = the link width' },
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
