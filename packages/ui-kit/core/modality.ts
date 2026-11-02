// Input modality: <html data-modality="keyboard|pointer">. Focus rings show only after keyboard
// use; a pointer press hides them again. Text fields match :focus-visible even on click, and
// script-moved focus can too, so the browser's heuristic alone is not enough.
export function trackModality(doc: Document = document) {
  const root = doc.documentElement;
  if (root.hasAttribute('data-modality')) return;
  root.setAttribute('data-modality', 'pointer');
  const set = (m: 'keyboard' | 'pointer') => { if (root.getAttribute('data-modality') !== m) root.setAttribute('data-modality', m); };
  doc.addEventListener('keydown', (e) => { if (!e.metaKey && !e.ctrlKey && !e.altKey) set('keyboard'); }, true);
  doc.addEventListener('pointerdown', () => set('pointer'), true);
}

if (typeof document !== 'undefined') trackModality();
