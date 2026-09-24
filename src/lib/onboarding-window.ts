/**
 * Who counts as "still onboarding" — one rule for the whole app
 * (Start Here landing, Mission Control alerts, People → Onboarding).
 *
 * Someone is onboarding while their welcome period is active, they were
 * hired in the last 90 days, or they were hired on/after ONBOARDING_SINCE.
 * The last rule keeps a new hire on their checklist past day 90 until it's
 * actually finished — nobody drops off just because the clock ran out.
 * Staff hired before ONBOARDING_SINCE are treated as veterans.
 */
export const ONBOARDING_SINCE = '2026-06-26'; // 90 days before the Welcome page launched

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export function isOnboarding(p: { hire_date?: string | null; welcome_until?: string | null }, now = Date.now()): boolean {
  if (p.welcome_until && new Date(p.welcome_until).getTime() >= now) return true;
  if (!p.hire_date) return false;
  return p.hire_date >= ONBOARDING_SINCE || now - new Date(p.hire_date).getTime() <= NINETY_DAYS_MS;
}

/** Earliest hire_date that can still be onboarding (for DB filters). */
export function onboardingHireCutoff(now = Date.now()): string {
  const ninety = new Date(now - NINETY_DAYS_MS).toISOString().slice(0, 10);
  return ninety < ONBOARDING_SINCE ? ninety : ONBOARDING_SINCE;
}
