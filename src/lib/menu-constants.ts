/**
 * Shared menu-training constants (staff Menu tab + admin authoring).
 *
 * Allergen keys are canonical — they're stored in menu_items.allergens[]
 * and Phase B's quiz auto-drafting matches on them. Add new keys here AND
 * in the API whitelist (src/app/api/menu/items/route.ts) together.
 */

export interface MenuItem {
  id: string;
  name: string;
  name_es: string | null;
  description: string | null;
  description_es: string | null;
  ingredients: string | null;
  ingredients_es: string | null;
  allergens: string[];
  prep_notes: string | null;
  prep_notes_es: string | null;
  upsell_note: string | null;
  upsell_note_es: string | null;
  price: string | null;
  photo_url: string | null;
  sort_order: number;
  /** Phonetic guide for tough names, e.g. "GYOH-zah". */
  pronunciation: string | null;
  /** true = raw, false = cooked, null = not entered yet. */
  is_raw: boolean | null;
  /** 0-3 chili scale; null = not entered yet. */
  spice_level: number | null;
  /** Optional how-it's-made video (11-char YouTube id). */
  video_youtube_id: string | null;
  /** Manager Academy practice calculator shown inside the card. */
  widget?: LessonWidget | null;
}

export interface MenuCategory {
  id: string;
  /** null = every restaurant (brand-wide / WHG Core). */
  restaurant_id?: string | null;
  name: string;
  name_es: string | null;
  sort_order: number;
  /** true = study section (Fundamentals, Sushi 101…), not sellable food. */
  is_knowledge?: boolean;
  /** 'menu' (default) renders on the Menu tab; 'systems' renders under
   *  Training → 🧰 Systems (OpenTable, Toast POS, 7shifts…); 'academy'
   *  renders under Training → 🎓 Academy (managers only). */
  zone?: 'menu' | 'systems' | 'academy';
  /** 'mgmt' = managers only (enforced by RLS, migration 080). */
  audience?: 'all' | 'mgmt';
  /** Manager Academy pillar. */
  pillar?: Pillar | null;
  /** Review info for lessons on things that change (rules, software, law). */
  version?: number;
  last_reviewed_at?: string | null;
  review_due_at?: string | null;
  sources?: string | null;
  items: MenuItem[];
}

/* ───────── Manager Academy (Sept 2026) ───────── */
export type Pillar = 'leadership' | 'operations' | 'administration';
export type LessonWidget = 'true_cost' | 'labor_budget';

export const PILLARS: { key: Pillar; emoji: string; en: string; es: string; blurb: string; blurbEs: string }[] = [
  { key: 'leadership', emoji: '🤝', en: 'Leadership', es: 'Liderazgo', blurb: 'How to lead people — coaching, accountability, standards, culture.', blurbEs: 'Cómo guiar a la gente — coaching, responsabilidad, estándares, cultura.' },
  { key: 'operations', emoji: '⚙️', en: 'Operations', es: 'Operaciones', blurb: 'How to run the restaurant — shifts, labor, scheduling, systems.', blurbEs: 'Cómo operar el restaurante — turnos, mano de obra, horarios, sistemas.' },
  { key: 'administration', emoji: '📊', en: 'Administration', es: 'Administración', blurb: 'The business behind the restaurant — payroll, costs, compliance.', blurbEs: 'El negocio detrás del restaurante — nómina, costos, cumplimiento.' },
];

export const ALLERGENS: { key: string; emoji: string; en: string; es: string }[] = [
  { key: 'shellfish', emoji: '🦐', en: 'Shellfish', es: 'Mariscos' },
  { key: 'fish',      emoji: '🐟', en: 'Fish', es: 'Pescado' },
  { key: 'soy',       emoji: '🫘', en: 'Soy', es: 'Soya' },
  { key: 'wheat',     emoji: '🌾', en: 'Wheat / Gluten', es: 'Trigo / Gluten' },
  { key: 'egg',       emoji: '🥚', en: 'Egg', es: 'Huevo' },
  { key: 'dairy',     emoji: '🥛', en: 'Dairy', es: 'Lácteos' },
  { key: 'peanut',    emoji: '🥜', en: 'Peanut', es: 'Cacahuate' },
  { key: 'tree_nut',  emoji: '🌰', en: 'Tree Nuts', es: 'Nueces' },
  { key: 'sesame',    emoji: '🟤', en: 'Sesame', es: 'Ajonjolí' },
];

export function allergenMeta(key: string) {
  return ALLERGENS.find((a) => a.key === key) || null;
}
