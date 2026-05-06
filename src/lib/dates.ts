/**
 * Date helpers for WHG Team Portal.
 *
 * The portal serves a Louisiana hospitality group, so all "today" / "now"
 * date calculations operate in America/Chicago (Central Time). UTC defaults
 * (e.g. `new Date().toISOString().split('T')[0]`) caused multiple bugs where
 * evening posts and active events disappeared once UTC rolled past midnight
 * — even though it was still the same operating day in Baton Rouge.
 *
 * Use these helpers anywhere a "today" or local date is needed server-side.
 */

const CT_TIMEZONE = 'America/Chicago';

/**
 * Returns today's date as a YYYY-MM-DD string in Central Time.
 * Use this anywhere you'd otherwise write `new Date().toISOString().split('T')[0]`.
 */
export function todayInCentralTime(): string {
  // 'en-CA' locale formats as YYYY-MM-DD natively.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: CT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

/**
 * Returns the date `daysFromNow` days ahead of today (in Central Time)
 * as a YYYY-MM-DD string. Negative numbers move into the past.
 */
export function dateInCentralTime(daysFromNow: number): string {
  const today = todayInCentralTime();
  // Parse today's CT date string back into a Date and shift by N days.
  // Using noon to avoid DST edge cases on the boundary day.
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + daysFromNow);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
