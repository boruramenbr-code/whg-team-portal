/**
 * App version + changelog.
 *
 * Single source of truth for "what shipped and when." Update this file as
 * part of every ship commit — add a new entry at the TOP of the array and
 * the app version updates everywhere automatically (login footer + admin
 * Settings → Version History).
 *
 * Versions are date-based (v-YYYY.MM.DD) so the version number itself says
 * when it shipped. Notes are plain English — managers read these, so no
 * file names or jargon.
 */

export interface ChangelogEntry {
  /** e.g. "2026.07.11" — newest entry drives APP_VERSION. */
  version: string;
  /** Display date, e.g. "July 11, 2026" or "June 2026" for backfilled eras. */
  date: string;
  /** One-line headline for the release. */
  title: string;
  /** Plain-English bullets of what changed. */
  notes: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '2026.07.11',
    date: 'July 11, 2026',
    title: 'UI polish & flow fixes',
    notes: [
      'Policy signing now works in portrait — no more being stuck at "turn your phone sideways" when rotation is locked',
      'Bar card scanner saves exactly what you line up in the brackets (better OCR, fewer rescans)',
      'Welcome splash plays once per day instead of every login, and a tap skips it',
      'Login remembers who you are — returning staff go straight to their PIN pad',
      "Today's Pre-Shift moved to the top of Home; \"Coming Soon\" placeholder cards removed",
      'New-hire spotlight shrinks to a compact row after the first week',
      'Onboarding checklist: checking a box no longer reloads the page or closes your section',
      'Finishing onboarding now shows a celebration instead of the checklist quietly disappearing',
      'Welcome wizard, checklist, and signature pad fully translated to Spanish',
    ],
  },
  {
    version: '2026.06.30',
    date: 'June 2026',
    title: 'Training launch + speed pass',
    notes: [
      'Training tab launched: video series with full-screen player (replaced Pre-Shift in the staff bottom nav)',
      '"New Training" spotlight card added to Home',
      'App speed pass: faster first load and much faster repeat visits',
      'Bar card upload hardened: clear error messages, photo compression, names with accents no longer break uploads',
      'Staff full name editable from the admin staff row',
      'Video player fixes for iPhone: Back button visible in portrait, landscape fills the screen',
    ],
  },
  {
    version: '2026.06.15',
    date: 'June 2026',
    title: 'Onboarding overhaul',
    notes: [
      'Welcome Wizard: 4-step first-login flow (install the app, welcome note, Our Story, checklist intro)',
      'Onboarding checklist with dual check-off — you mark your part, your manager confirms',
      'Items auto-complete when you sign the handbook, sign policies, or read Our Story',
      'Handwritten finger-signature pad for the handbook and every policy',
      'Tip tracker for FOH: private cash-tip log with charts — only you can see yours',
      'Admin panel reorganized into grouped tabs with Mission Control dashboard',
    ],
  },
];

/** Current app version — always the newest changelog entry. */
export const APP_VERSION = `v${CHANGELOG[0].version}`;
