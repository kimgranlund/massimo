// Clipboard writes for the copy field. A browser can refuse, so the caller shows what happened.
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}
/** How long the field says Copied. */
export const COPIED_MS = 1800;
