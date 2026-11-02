// Base UI's Tabs.Indicator variables, shared by both renderers: the active tab's box inside its list
// (from the list's padding edge, as positioned children see it), in fractional px from the layout
// boxes (offsetLeft / offsetWidth round to whole pixels), snapped to the 1/64 px layout unit so the
// indicator lays out at exactly the tab's size.

export const INDICATOR_VARS = ['left', 'top', 'right', 'bottom', 'width', 'height'] as const;

/** `--active-tab-*` for `tab` in `list`, or null when there is no active tab. */
export function activeTabVars(list: Element, tab: Element | null | undefined): Record<string, string> | null {
  if (!tab) return null;
  const l = list.getBoundingClientRect(), t = tab.getBoundingClientRect();
  const left = t.left - l.left - list.clientLeft, top = t.top - l.top - list.clientTop;
  const box = { left, top, width: t.width, height: t.height, right: list.clientWidth - left - t.width, bottom: list.clientHeight - top - t.height };
  return Object.fromEntries(INDICATOR_VARS.map((k) => [`--active-tab-${k}`, `${Math.round(box[k] * 64) / 64}px`]));
}
