// Headless Gregorian dates for the calendar and pickers. Dates are ISO strings (YYYY-MM-DD), computed
// in UTC so a time zone can never shift a day. Names come from Intl: there's no date library.
export type IsoDate = string;
const DAY = 86_400_000;

export function parseIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 ? d : null;
}
export const toIso = (d: Date): IsoDate => d.toISOString().slice(0, 10);
export const todayIso = (now = new Date()): IsoDate => toIso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
export const addDays = (iso: IsoDate, n: number): IsoDate => toIso(new Date(parseIso(iso)!.getTime() + n * DAY));

/** Add months, staying in the target month when the day doesn't exist there (Jan 31 + 1 is Feb 28). */
export function addMonths(iso: IsoDate, n: number): IsoDate {
  const d = parseIso(iso)!, first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  return toIso(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(d.getUTCDate(), last))));
}

/** The first day of the week for a locale: 0 Sunday … 6 Saturday. */
export function weekStart(locale?: string): number {
  try {
    const l = new Intl.Locale(locale ?? new Intl.DateTimeFormat().resolvedOptions().locale) as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
    const info = l.getWeekInfo?.() ?? l.weekInfo;
    return info ? info.firstDay % 7 : 0;
  } catch { return 0; }
}

/** Six weeks of ISO dates covering the month of `iso`, starting on `start`. */
export function monthGrid(iso: IsoDate, start = 0): IsoDate[][] {
  const d = parseIso(iso)!, first = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  const from = addDays(toIso(first), -((first.getUTCDay() - start + 7) % 7));
  return Array.from({ length: 6 }, (_, w) => Array.from({ length: 7 }, (_, i) => addDays(from, w * 7 + i)));
}

const utc = (o: Intl.DateTimeFormatOptions) => ({ ...o, timeZone: 'UTC' });
export const monthLabel = (iso: IsoDate, locale?: string) => new Intl.DateTimeFormat(locale, utc({ month: 'long', year: 'numeric' })).format(parseIso(iso)!);
export const dayLabel = (iso: IsoDate, locale?: string) => new Intl.DateTimeFormat(locale, utc({ dateStyle: 'full' })).format(parseIso(iso)!);
export const shortDate = (iso: IsoDate, locale?: string) => new Intl.DateTimeFormat(locale, utc({ dateStyle: 'medium' })).format(parseIso(iso)!);
export function weekdays(start = 0, locale?: string) {
  const fmt = (style: 'short' | 'long') => new Intl.DateTimeFormat(locale, utc({ weekday: style }));
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(Date.UTC(2023, 0, 1 + ((start + i) % 7))); return { short: fmt('short').format(d), long: fmt('long').format(d) }; });
}
export const inBounds = (iso: IsoDate, min?: string, max?: string) => (!min || iso >= min) && (!max || iso <= max);

/** A keyboard step in days, or a month jump. PageUp and PageDown move a month, with Shift a year. */
export function calendarKey(key: string, iso: IsoDate, start: number, shift = false, rtl = false): IsoDate | null {
  const across = rtl ? -1 : 1, day = (parseIso(iso)!.getUTCDay() - start + 7) % 7;
  switch (key) {
    case 'ArrowRight': return addDays(iso, across);
    case 'ArrowLeft': return addDays(iso, -across);
    case 'ArrowDown': return addDays(iso, 7);
    case 'ArrowUp': return addDays(iso, -7);
    case 'Home': return addDays(iso, -day);
    case 'End': return addDays(iso, 6 - day);
    case 'PageDown': return addMonths(iso, shift ? 12 : 1);
    case 'PageUp': return addMonths(iso, shift ? -12 : -1);
    default: return null;
  }
}

/** Order a picked pair: a range never runs backward. */
export const orderRange = (a: IsoDate, b: IsoDate): [IsoDate, IsoDate] => (a <= b ? [a, b] : [b, a]);
export const inRange = (iso: IsoDate, start?: string, end?: string) => !!start && !!end && iso >= start && iso <= end;

export interface CalendarCell { iso: IsoDate; day: number; outside: boolean; today: boolean; selected: boolean; inRange: boolean; disabled: boolean; focused: boolean; label: string }
export interface CalendarView { focus: IsoDate; start: number; value?: string; rangeStart?: string; rangeEnd?: string; min?: string; max?: string; today: IsoDate; locale?: string }

/** Six weeks of cells for the month holding `focus`, with everything a renderer needs. */
export function calendarCells(v: CalendarView): CalendarCell[][] {
  const month = v.focus.slice(0, 7);
  return monthGrid(v.focus, v.start).map((week) => week.map((iso) => ({
    iso, day: parseIso(iso)!.getUTCDate(), outside: iso.slice(0, 7) !== month, today: iso === v.today,
    selected: iso === v.value || iso === v.rangeStart || iso === v.rangeEnd, inRange: inRange(iso, v.rangeStart, v.rangeEnd),
    disabled: !inBounds(iso, v.min, v.max), focused: iso === v.focus, label: dayLabel(iso, v.locale),
  })));
}

/** A finished range: both ends, in order. */
export const rangeComplete = (value: string) => { const [a, b] = value.split('/'); return !!parseIso(a ?? '') && !!parseIso(b ?? '') && a <= b; };
/** A range as text, or the fallback when it isn't finished. */
export const rangeText = (value: string, fallback: string, locale?: string) => { if (!rangeComplete(value)) return fallback; const [a, b] = value.split('/'); return `${shortDate(a, locale)} – ${shortDate(b, locale)}`; };
