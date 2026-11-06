// Headless breadcrumb truncation, shared by both renderers: which crumbs show, and whether the middle
// ones are folded behind an ellipsis. The first and the last stay, so a trail keeps its root and the
// current page.
export interface CrumbView { shown: number[]; folded: boolean }

export function visibleCrumbs(total: number, max: number, expanded: boolean): CrumbView {
  const all = Array.from({ length: total }, (_, i) => i);
  if (expanded || max < 2 || total <= max) return { shown: all, folded: false };
  return { shown: [0, ...all.slice(total - (max - 1))], folded: true };
}

/** Enter and Space press a non-native button. */
export const pressKey = (key: string) => key === 'Enter' || key === ' ';
