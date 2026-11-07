// Headless wall-clock times for the time picker: a typed time in, HH:MM out. No date, no zone.
export function parseTime(text: string): string | null {
  const m = /^\s*(\d{1,2})(?::?(\d{2}))?\s*(am|pm|a|p)?\s*$/i.exec(text);
  if (!m) return null;
  let h = +m[1];
  const min = m[2] ? +m[2] : 0, mer = m[3]?.toLowerCase()[0];
  if (min > 59) return null;
  if (mer) { if (h < 1 || h > 12) return null; h = (h % 12) + (mer === 'p' ? 12 : 0); }
  if (h > 23) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}
/** Times through the day, every `step` minutes. */
export function timeSlots(step = 30) {
  const every = Math.max(1, Math.floor(step));
  return Array.from({ length: Math.ceil(1440 / every) }, (_, i) => { const t = i * every; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`; });
}
export const timeLabel = (hhmm: string, locale?: string) => { const [h, m] = hhmm.split(':').map(Number); return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(2023, 0, 1, h, m))); };
