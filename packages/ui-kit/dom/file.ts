// Headless file picking: accept matching and the text a picker shows. Files are never read here.
export function matchesAccept(file: { name: string; type: string }, accept: string) {
  const rules = accept.split(',').map((r) => r.trim().toLowerCase()).filter(Boolean);
  if (!rules.length) return true;
  const name = file.name.toLowerCase(), type = file.type.toLowerCase();
  return rules.some((r) => (r.startsWith('.') ? name.endsWith(r) : r.endsWith('/*') ? type.startsWith(r.slice(0, -1)) : type === r));
}
export const fileSummary = (names: string[]) => (names.length === 0 ? 'No file chosen' : names.length === 1 ? names[0] : `${names.length} files`);
