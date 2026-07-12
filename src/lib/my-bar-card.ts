/**
 * Shared, deduped fetch for /api/my-bar-card.
 *
 * Two Home widgets (CardingDateWidget + MyBarCardWidget) both need this
 * response; before this helper each fired its own no-store request on
 * every Home mount — two identical authenticated round trips. Now the
 * first caller fetches and everyone shares the promise for 60s.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached: { at: number; promise: Promise<any> } | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchMyBarCard(): Promise<any> {
  if (cached && Date.now() - cached.at < 60_000) return cached.promise;
  const promise = fetch('/api/my-bar-card')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null);
  cached = { at: Date.now(), promise };
  return promise;
}
