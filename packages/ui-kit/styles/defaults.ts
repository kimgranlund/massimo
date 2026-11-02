// Boilerplate component defaults: just enough to make every component usable and its
// state visible. No variants, no design. Every length comes from styles/geometry.ts
// (--h, --pad, --edge, --gap, --b, --radius, …); this file only says where each applies. Keyed on tags, [data-ui]/[data-part] hooks and
// ARIA state, so web components and their React counterparts share one stylesheet and
// tag rules already apply before an element upgrades.
import { defineGlobalStyles } from '@pandacss/dev';

const FIELD = ':is(ui-input, ui-select, [data-ui=input])';
const CONTROL = ':is(ui-input, [data-ui=input]) > [data-part=control], ui-select > [data-part=trigger]';
const BUTTON = ':is(ui-button, [data-ui=button])';

export const defaults = defineGlobalStyles({
  '[hidden]': { display: 'none !important' },

  // Button
  [BUTTON]: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--gap)',
    height: 'var(--h)', paddingInline: 'calc(var(--pad) + var(--edge))', borderWidth: 'var(--b)', borderColor: 'border.strong',
    borderRadius: 'var(--radius)', bg: 'bg', color: 'fg', fontSize: 'var(--font)', lineHeight: 'var(--leading)',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
  },
  [`${BUTTON}:hover`]: { bg: 'bg.muted' },
  [`${BUTTON}:is([aria-disabled=true], [aria-busy=true])`]: { opacity: 0.5, cursor: 'not-allowed' },

  // Field: label, control, description, error
  [FIELD]: { display: 'flex', flexDirection: 'column', gap: '1.5' },
  [`${FIELD} > [data-part=label]`]: { fontSize: 'sm', fontWeight: 'medium', alignSelf: 'start', cursor: 'default' },
  [`${FIELD} > [data-part=description]`]: { fontSize: 'xs', color: 'fg.muted' },
  [`${FIELD} > [data-part=error]`]: { fontSize: 'xs', color: 'danger.fg' },
  [CONTROL]: {
    // Text-field label edge: L on each exposed side, not doubled.
    display: 'flex', alignItems: 'center', gap: 'var(--gap)', width: '100%', height: 'var(--h)',
    paddingInline: 'calc(var(--pad) + var(--edge))', borderWidth: 'var(--b)', borderColor: 'border.strong',
    borderRadius: 'var(--radius)', bg: 'bg', color: 'fg', fontSize: 'var(--font)', lineHeight: 'var(--leading)',
  },
  // aria-invalid only: native :invalid would flag untouched required fields on load.
  [`:is(${CONTROL})[aria-invalid=true]`]: { borderColor: 'danger.solid' },
  [`:is(${CONTROL}):is(:disabled, [aria-disabled=true])`]: { opacity: 0.5, cursor: 'not-allowed' },
  [`:is(${CONTROL})::placeholder`]: { color: 'fg.muted' },

  // Contenteditable text field
  '[data-part=control][contenteditable]': { whiteSpace: 'pre', overflowX: 'auto', scrollbarWidth: 'none', cursor: 'text', minWidth: 0 },
  '[data-part=control][contenteditable]:empty::before': { content: 'attr(data-placeholder)', color: 'fg.muted', pointerEvents: 'none' },
  '[data-part=control][data-secret]': { WebkitTextSecurity: 'disc' },

  // Select trigger and popup
  // Trailing chevron slot: no label edge on that side.
  'ui-select > [data-part=trigger]': { cursor: 'pointer', userSelect: 'none', paddingInlineEnd: 'var(--pad)' },
  'ui-select [data-part=value]': { flex: '1', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  'ui-select [data-part=value][data-placeholder]': { color: 'fg.muted' },
  'ui-select [data-part=chevron]': { display: 'grid', placeItems: 'center', flexShrink: 0, width: 'var(--slot)', height: 'var(--slot)', color: 'fg.muted' },
  'ui-select [data-part=chevron]::before': {
    content: '""', width: 'calc(var(--icon) * 0.35)', height: 'calc(var(--icon) * 0.35)',
    borderRightWidth: '1.5px', borderBottomWidth: '1.5px', borderColor: 'currentColor', transform: 'translateY(-25%) rotate(45deg)',
  },
  // [popover] stays hidden until shown; layout only while open.
  'ui-select > [data-part=popup]': {
    position: 'fixed', inset: 'auto', margin: 0, overflowY: 'auto', overscrollBehavior: 'contain',
    bg: 'bg', color: 'fg', borderColor: 'border', boxShadow: 'md',
  },
  'ui-select > [data-part=popup]:popover-open': { display: 'flex', flexDirection: 'column' },

  // Listbox, segmented control, options
  'ui-listbox': { display: 'flex', flexDirection: 'column', borderColor: 'border' },
  'ui-segmented': { display: 'inline-flex', bg: 'bg.muted', borderColor: 'transparent' },
  'ui-option': { display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' },
  'ui-option[data-active]': { bg: 'bg.muted' },
  'ui-option[aria-selected=true]': { bg: 'accent.subtle', color: 'accent.fg', fontWeight: 'medium' },
  'ui-segmented > ui-option': { flex: '1', justifyContent: 'center', color: 'fg.muted' },
  'ui-segmented > ui-option[data-active]': { bg: 'transparent' },
  'ui-segmented > ui-option[aria-selected=true]': { bg: 'bg', color: 'fg', boxShadow: 'sm' },
  'ui-option[aria-disabled=true]': { opacity: 0.45, cursor: 'not-allowed' },
});
