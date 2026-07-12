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
    version: '2026.07.12.7',
    date: 'July 12, 2026',
    title: 'Menu sections as big blocks',
    notes: [
      'The Menu tab now opens on big photo blocks — pick your section, study just that section, no more scrolling 149 items',
      'Path modules open their exact section: a fry cook tapping "Study: Hot Small Plates" lands inside Hot Small Plates, nothing else',
      'Study mode drills stay inside the section you picked',
      'Search still covers the whole menu from anywhere',
    ],
  },
  {
    version: '2026.07.12.6',
    date: 'July 12, 2026',
    title: 'Every Ichiban position has a track',
    notes: [
      'All 18 remaining Ichiban positions now have a working training track — hosts, to-go, expo, bartenders, shift leaders, sushi helpers, prep/fry/line cooks, kitchen leads, and every management role',
      'Every track follows the Journey: floor-training shadow shifts first, then core skills with manager sign-off, menu study and the Photo Test where the job demands it',
      'Expo track requires passing the Menu Photo Test — the window is the last set of eyes before the guest',
      'These are working drafts — each position gets refined one at a time with Randy',
    ],
  },
  {
    version: '2026.07.12.5',
    date: 'July 12, 2026',
    title: 'The Journey: floor training + ongoing growth',
    notes: [
      'Floor Training added to the start of every pilot track — shadow shifts with a senior teammate, signed off by a manager, before the study work begins',
      'New "Ongoing Growth" stage for everyone: menu change-up refreshers, sharpen-one-skill-a-month, raise your hand to cross-train — optional forever, never blocks Floor-Ready',
      'Finishing standard training now says what we mean: growth doesn’t stop here',
      'Groundwork laid for Advanced → Pro → Leadership tiers (activating after Ichiban’s standard content is complete)',
    ],
  },
  {
    version: '2026.07.12.4',
    date: 'July 12, 2026',
    title: 'My Path — position-based training ladder',
    notes: [
      'Training now opens on "My Path" — a personal ladder built for YOUR position: Foundations → Department Core → Position Track → Certifications',
      'Every position has its own track; Server, Busser, Sushi Chef, and Dish Crew launch fully built at Ichiban',
      'Hands-on skills (tray carrying, knife work, dish pit flow) complete only with a manager sign-off — done means verified',
      'Managers: new Progress board under Admin → Training — tap any teammate, see their ladder, sign off skills on the spot',
      'The Library (Videos · Menu · Quizzes) stays open to everyone — your path decides what’s required, never what you’re allowed to learn',
    ],
  },
  {
    version: '2026.07.12.3',
    date: 'July 12, 2026',
    title: 'Speed pass: instant tab switching',
    notes: [
      'Tabs you’ve visited stay loaded — switching back is instant instead of rebuilding the page every time (staff and admin sides)',
      'Home refreshes pre-shift info (86’d items, specials) automatically whenever you re-open the app',
      'Cut a duplicate behind-the-scenes request on every Home load',
      'Removed the "Anonymous Comment" coming-soon button — it returns when the feature is real',
    ],
  },
  {
    version: '2026.07.12.2',
    date: 'July 12, 2026',
    title: 'Menu study tools + Photo Test',
    notes: [
      'Search box on the Menu tab — find any dish in two keystrokes',
      'Study mode: flip through dishes photo-first, guess the name, reveal the answer, jump to the next one',
      '📸 Menu Photo Test: one button (Admin → Training → Menu) builds a name-that-dish exam from real menu photos — decoy answers come from the same category, regenerate anytime the menu changes',
      'New training fields on every item: pronunciation guide, raw/cooked badge, spice meter (0–3 🌶️) — fill in via the item editor',
    ],
  },
  {
    version: '2026.07.12',
    date: 'July 12, 2026',
    title: 'Quizzes live + Ichiban menu loaded',
    notes: [
      'Quiz engine is live: managers build quizzes and exams under Admin → Training; staff take them from the Training tab; unlimited retakes, every attempt recorded',
      'Ichiban menu fully loaded: 149 items across 8 categories, 114 with photos',
      'Menu training card: bigger, bolder "What it is" text — built for studying, not skimming',
      'Price de-emphasized on training cards (small gray reference for servers, out of the way for everyone else)',
    ],
  },
  // Same-day second ship gets a ".2" suffix — versions must stay unique
  // and newest-first.
  {
    version: '2026.07.11.2',
    date: 'July 11, 2026',
    title: 'Menu Training — Phase A',
    notes: [
      'New Menu sub-tab under Training: your restaurant’s dishes with photos, ingredients, allergens, prep notes, and how-to-sell tips',
      'Restaurant-scoped — staff see only their own restaurant’s menu',
      'Full Spanish support on every menu card',
      'Managers: new Menu authoring area under Admin → Training (categories, items, phone-photo uploads)',
      'Foundation for menu quizzes and the Floor-Ready signal (Phase B, coming next)',
    ],
  },
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
