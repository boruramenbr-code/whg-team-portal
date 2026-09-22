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
    version: '2026.09.22.4',
    date: 'September 22, 2026',
    title: '📋 Consistency pass on positions',
    notes: [
      'Pay is out of the staff-facing position descriptions — starting pay lives on the manager-only Pay Rates screen, where a manager sees their own restaurant and the owner sees all of them',
      'Assistant Managers are shown with full void and comp authority, matching the handbook (servers have none — they bring a manager)',
      '“FOH Manager” is retired in favor of Restaurant Manager, the title that actually exists',
      'Guided training now runs for 90 days, matching the 90-day path in every description (separate from the semi-annual evaluation)',
    ],
  },
  {
    version: '2026.09.22.3',
    date: 'September 22, 2026',
    title: '📋 One WHG standard per position',
    notes: [
      'Position descriptions can now live at the WHG level — one version every restaurant reads, so a server trained at one restaurant meets the same standard at another',
      'Server is the first one: rewritten around hospitality (30-second greet, a genuine recommendation at every table, knowing your regulars, and what to do when something goes wrong)',
      'Anything restaurant-specific — POS, menu, station flow, uniform — moves into that restaurant’s own training modules',
      'A restaurant can still show a different version of a position when it truly needs one',
    ],
  },
  {
    version: '2026.09.22.2',
    date: 'September 22, 2026',
    title: '⚡ Faster opens, part 2',
    notes: [
      'Home starts loading its news, pre-shift, and training the moment the page arrives, instead of waiting for the app to finish starting up',
      'Home checks who you are once per open instead of nine times, and reads your profile once instead of seven — much less work for the database',
      '“Last seen” (the adoption tracker) updates at most every 5 minutes per person instead of on every screen',
    ],
  },
  {
    version: '2026.09.22',
    date: 'September 22, 2026',
    title: '⚡ Faster opens',
    notes: [
      'The owner view no longer loads Home twice on every open',
      'Mission Control loads once for your restaurant — it used to load up to four times (twice for all of WHG, twice for your restaurant)',
      'Training progress on Home comes back in about two trips to the database instead of nine',
      'Logos are about 98% lighter — the WHG logo went from 2.5 MB to 50 KB, which matters most on a new hire’s first open over phone data',
      'The Tip Tracker loads when you open it instead of with Home',
    ],
  },
  {
    version: '2026.09.16',
    date: 'September 16, 2026',
    title: '🧭 Guided training for new hires',
    notes: [
      'New hires now get a step-by-step path in Training → My Path: Welcome, Paperwork, Meet your team, Learn the job, Floor training, then Floor-ready — one step at a time, with a Continue button and a way back after every lesson',
      'Works side by side on a computer (for walking a new hire through it at the hiring desk) and stacked on a phone',
      'Managers: Mission Control → Training → 🧭 New Hires. Start training (position, trainer, start date), see every new hire’s step, spot anyone stuck, and copy a day-one link',
      'Trainers see “You’re training” on their My Path and mark each shadow shift done from their phone',
      'Floor-ready now takes a manager’s final sign-off once every step is done (or early, with a note)',
      'The 🎓 Academy and the manager training videos moved into Mission Control → Training',
    ],
  },
  {
    version: '2026.09.13',
    date: 'September 13, 2026',
    title: '🎓 Manager Academy (foundation)',
    notes: [
      'New 🎓 Academy in Training, for managers only: manager videos, lessons, and practice tools grouped into Leadership, Operations, and Administration',
      'Two practice calculators: the true cost of an employee (pay + payroll taxes + benefits), and sales → labor budget → FOH/BOH hours',
      'Any section can now be set to managers-only — staff never see it. Manager-only videos no longer show up on the staff Home screen',
      'Lessons and videos can carry a last-reviewed date, version, and sources; Mission Control flags anything coming due for review',
      'Copy a link to any lesson or video (for an Asana task) — it opens right to it, even if you have to sign in first',
      'Systems lessons now read like lessons: “Key points” and “Remember this” instead of prep notes and selling tips',
    ],
  },
  {
    version: '2026.09.12.3',
    date: 'September 12, 2026',
    title: '📘 Handbook Quick Guide (preview)',
    notes: [
      'New Quick Guide in the Handbook: the handbook broken into short, friendly cards you flip through like stories — one idea per card, big text, a picture, and a heads-up when something has consequences',
      'Search, “Most asked” questions, and a “You’re caught up” finish that links to the full handbook section or to Ask',
      'First up: Lates, Call-Outs & Time Off, and Clocking In & Out. The owner is previewing them now; topics roll out to everyone one at a time after approval',
      'The full handbook stays exactly as it is — it’s still the official policy',
    ],
  },
  {
    version: '2026.09.12.2',
    date: 'September 12, 2026',
    title: 'One look everywhere: Handbook & Team go Midnight',
    notes: [
      'The Handbook — Checklist, Handbook reader, Policies, signing, and Ask — now wears the same Midnight Navy & Gold look as Home and Training',
      'Team (Our Team org chart and Positions), the Tip Tracker, and the first-login welcome screens match too',
      'Signatures are still drawn on a white pad, like signing on paper',
    ],
  },
  {
    version: '2026.09.12',
    date: 'September 12, 2026',
    title: 'Faster logins: lighter Memories + quicker welcome',
    notes: [
      'The Memories card on Home and every tile on the wall now load small preview images instead of full photos and videos — the full file only loads when you tap',
      'New videos posted to Memories get a still-frame preview automatically, so the wall never has to dig into video files just to show a tile',
      'The welcome screen on your first open of the day is now about a second instead of three',
      'Home now loads in one trip instead of about ten — pre-shift, owner’s message, birthdays, events, training, new hires, and Memories all arrive together',
    ],
  },
  {
    version: '2026.08.09.4',
    date: 'August 9, 2026',
    title: 'Bigger play button on Memories videos',
    notes: [
      'Videos on the Memories wall and the Home card now wear a clear centered play button — no more guessing which tiles are videos',
    ],
  },
  {
    version: '2026.08.09.3',
    date: 'August 9, 2026',
    title: '⭐ Events front the Memories wall',
    notes: [
      'Big moments — company parties, crawfish boils, grand openings — now get gold event cards in an Events row at the top of the wall',
      'Company-wide events show on every restaurant’s wall; single-restaurant events front their own',
      'When posting, managers tick “⭐ Feature as an event” — long compilations work best as YouTube links (no length limit)',
    ],
  },
  {
    version: '2026.08.09.2',
    date: 'August 9, 2026',
    title: 'Memories: video upload',
    notes: [
      'Videos now go straight on the Memories wall — managers pick them from the camera roll in the same Add Photos form, up to 100MB each',
      'Video tiles show a ▶ badge and play full-screen with sound; YouTube links still work too',
    ],
  },
  {
    version: '2026.08.09',
    date: 'August 9, 2026',
    title: 'Memories card shows your restaurant',
    notes: [
      'The Home Memories card now previews YOUR restaurant’s photos — Ichiban sees Ichiban, Boru sees Boru (brand-wide WHG moments show for everyone)',
      'The full wall under Team → Memories stays open to every restaurant, exactly as before',
    ],
  },
  {
    version: '2026.08.08',
    date: 'August 8, 2026',
    title: 'Memories: Coming Soon walls',
    notes: [
      'Shokudo and Central Hub now show a ✨ Coming Soon sign on their Memories walls — their chapters start when the doors open',
      'The sign disappears on its own the moment the first photo is posted',
    ],
  },
  {
    version: '2026.08.07.2',
    date: 'August 7, 2026',
    title: '🎞 Memories — the WHG photo wall',
    notes: [
      'Home gets a Memories card showing the latest photos from the wall — tap it to jump straight to the collage',
      'New Memories section under Team: a photo and video collage of the history, games, events, and fun we’ve had — at every restaurant',
      'Everyone can browse every restaurant’s wall. You land on your own; one tap visits the others. Brand-wide WHG moments show everywhere',
      'Managers post the photos — got pictures from an event? Send them to a manager. And if you’re in a photo you’d rather not have up, tell a manager and it comes down, no questions',
    ],
  },
  {
    version: '2026.08.07',
    date: 'August 7, 2026',
    title: 'Manager Training',
    notes: [
      'A new Manager Training band sits at the top of Training → Videos — visible only to management. Staff never see it',
      'When creating or editing a video series, managers now choose the audience: 👥 Whole team or 🔒 Managers only',
      'The first Manager Training series is ready and waiting for its videos',
    ],
  },
  {
    version: '2026.07.24.6',
    date: 'July 24, 2026',
    title: 'Midnight look: Training, Menu & Systems',
    notes: [
      'The whole Training area — My Path, Videos, Menu, Systems, and Quizzes — now wears the Midnight Navy & Gold look. Food photos and lesson tiles really shine on the dark background',
      'Dish cards and quiz screens stay bright when you open them — reading ingredients, allergens, and test questions deserves maximum clarity',
      'Handbook and Team switch over next',
    ],
  },
  {
    version: '2026.07.24.5',
    date: 'July 24, 2026',
    title: 'A new look: Midnight Navy & Gold',
    notes: [
      'The Home screen and navigation wear the portal’s new colors — deep navy that’s easy on the eyes in a dim dining room, with gold marking where you are and what’s yours',
      'Everything is exactly where it was — same cards, same order, same taps. Only the paint changed',
      'The other screens switch over one at a time in the coming updates, so expect a mix of light and dark for a few days',
    ],
  },
  {
    version: '2026.07.24.4',
    date: 'July 24, 2026',
    title: 'Design foundation (under the hood)',
    notes: [
      'Laid the groundwork for the portal’s visual refresh: one shared kit of buttons, cards, filters, and pop-ups that every screen will move to, one at a time',
      'Nothing looks different yet — screens migrate gradually so nobody has to relearn where anything lives',
    ],
  },
  {
    version: '2026.07.24.3',
    date: 'July 24, 2026',
    title: 'Systems & Tools gets its own home',
    notes: [
      'New 🧰 Systems sub-tab under Training: software and tool training now lives in its own library, out of the menu — one whole section per system',
      'OpenTable and Table Management are now separate sections (each is a big topic on its own), and POS Basics is now Toast POS',
      '7shifts (scheduling) and Paychex Flex (payroll) sections added as starters — each opens with an intro card and will grow lesson by lesson',
      'In the menu editor, Systems & Tools sections sit below their own divider so the food menu stays clean',
    ],
  },
  {
    version: '2026.07.24.2',
    date: 'July 24, 2026',
    title: 'Track Builder + OpenTable & POS training',
    notes: [
      'New 🛠 Builder tab under Admin → Training (owner/admin only): create a training block once — a menu section, video series, quiz, or skill — and checkbox every position that should have it. No more one-track-at-a-time editing',
      'Two new study sections live now: “OpenTable & Table Management” (FOH management) and “POS Basics” (FOH management, servers, bartenders, and hosts) — assigned to the right Ichiban paths automatically',
      'Blocks can be edited or removed from any track later; removing a block also clears staff completion records for it, and the Builder warns you first',
    ],
  },
  {
    version: '2026.07.24',
    date: 'July 24, 2026',
    title: 'Tip Tracker visible to admins',
    notes: [
      'Admins now see the 💰 My Tips quick action on Home (it was FOH-only, which hid it from ownership) — so you can demo the tracker to your servers',
      'Nothing changed for staff: FOH sees it, BOH doesn’t, and every person’s tips stay private to them — no admin can see anyone else’s entries, by design',
    ],
  },
  {
    version: '2026.07.15.7',
    date: 'July 15, 2026',
    title: 'Weekly Owner’s Inspiration',
    notes: [
      'The Owner’s Message card never sits empty: 28 standing notes from Randy rotate weekly — gratitude, growth, standards, and taking care of each other',
      'A real Owner’s Message always takes over the card; when it expires, the weekly rotation resumes automatically',
      'Same note all week, English and Spanish, cycles year-round',
    ],
  },
  {
    version: '2026.07.15.6',
    date: 'July 15, 2026',
    title: 'Daily Mindset + faster pre-shift posting',
    notes: [
      'The pre-shift brief never shows up empty again: any gap managers leave (FOH, BOH, or Focus) fills with a rotating Daily Mindset line — hospitality and craft principles inspired by Preston Lee’s 30% Rule and Mike Bausch’s Unsliced, clearly marked as the house voice',
      'Same line for everyone all day, in English and Spanish',
      'Managers: new "📋 Copy previous day" button in the pre-shift editor — pre-fills yesterday’s note so you edit instead of retype (items re-tag with your initials)',
      'Reminder: the Tomorrow toggle drafts the next day’s note and posts it automatically at midnight — closing managers, that one’s for you',
    ],
  },
  {
    version: '2026.07.15.5',
    date: 'July 15, 2026',
    title: 'Master switcher on the Team Portal side',
    notes: [
      'The owner’s "Viewing:" switcher now appears on the staff-facing side too (admins only) — Home, Menu, Positions, and Team all follow it',
      'One setting across both sides of the app: pick Boru in admin, the Team Portal side is already on Boru',
      'See the app exactly as any restaurant’s crew sees it, without logging in as someone else',
    ],
  },
  {
    version: '2026.07.15.4',
    date: 'July 15, 2026',
    title: 'Owner’s restaurant switcher',
    notes: [
      'Admins get one "Viewing:" switcher at the top of the admin area — pick a restaurant once, and Staff, Bar Cards, Menu, Onboarding, and Training Progress all scope to it',
      'The choice sticks across visits, and every open tab re-scopes instantly on switch',
      'Per-screen restaurant pickers step aside when the global switcher is driving',
    ],
  },
  {
    version: '2026.07.15.3',
    date: 'July 15, 2026',
    title: 'Floor-Ready (Phase C) + brand-wide service standard',
    notes: [
      'New brand-wide section: "Service: Beginning to End" — the full WHG service cycle, greet to genuine thank-you, identical at every restaurant, on every FOH path',
      '🎯 Floor-Ready is live: complete your required path and your Home card turns green',
      'Managers: the Progress board now shows every person’s progress bar and Floor-Ready status at a glance',
      'Manager judgment calls: grant (or revoke) Floor-Ready with an override — always recorded with who made the call',
      'Ichiban quality on the record: the "Is It Fresh?" card now teaches the sushi-grade #1 tuna standard — with class, never trash talk',
    ],
  },
  {
    version: '2026.07.15.2',
    date: 'July 15, 2026',
    title: 'Videos on menu items',
    notes: [
      'Menu items can now carry a video alongside the photo — paste any YouTube link in the item editor (Admin → Training → Menu)',
      'The training card plays it right under the photo: how it’s made, how it’s cut, how it plates',
      'Menu tiles show a ▶ badge when an item has a video',
      'Same rules as training videos: upload Unlisted, embedding ON, not made-for-kids',
    ],
  },
  {
    version: '2026.07.15',
    date: 'July 15, 2026',
    title: 'Study sections separated + Oh, I Didn’t Know That',
    notes: [
      'New menu section: "Oh, I Didn’t Know That" — 14 cards of classic order mix-ups and the exact question that prevents each one (required study for servers, to-go, bartenders, expo)',
      'The Menu tab now splits into two bands: 📚 Study & Knowledge up top, a clean divider, then 🍽️ The Menu below',
      'Photo Test now pulls only real dishes — study cards (soy bottles, wasabi tubes) excluded from "name this dish" questions',
      'Sushi 101 finished with photos on every card, five new deep-dive cards, and its own 10-question Knowledge Check quiz',
    ],
  },
  {
    version: '2026.07.12.10',
    date: 'July 12, 2026',
    title: 'Navigation restructure (UX revamp Phase 1)',
    notes: [
      'Bottom nav reordered by what you actually use: Home · Training · Menu · Handbook · Team',
      'Menu promoted to its own tab — one tap from anywhere',
      '"Onboarding" renamed to "Handbook" — clearer for everyone past their first month',
      'Positions merged into the Team tab (org chart and job descriptions side by side)',
      'New Continue Training card on Home: your progress ring, your next module, one tap in',
    ],
  },
  {
    version: '2026.07.12.9',
    date: 'July 12, 2026',
    title: 'Explore by Position',
    notes: [
      'New 🧭 Positions button on the Menu tab — tap any role and see exactly which menu sections that position studies',
      'Positions without menu training (bussers, dish crew) say so plainly — their path is floor skills and videos',
      'Built for growth: eyeing your next position? Browse its sections, then tell a manager',
      'Busser track is now pure floor skills — menu removed per Randy, training videos take that slot as they’re recorded',
    ],
  },
  {
    version: '2026.07.12.8',
    date: 'July 12, 2026',
    title: 'Menu sections matched to your position',
    notes: [
      'The Menu tab now leads with "Your Sections" 🎯 — the menus your position\'s training path assigns you (fry cooks see Hot Small Plates first, sushi chefs see the sushi sections first)',
      'Everything else stays browsable below — we point you at your sections, we never lock the rest away',
      'Assignments come straight from your training track, so refining a position automatically reorganizes their menu view',
    ],
  },
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
