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
}

export interface MenuCategory {
  id: string;
  name: string;
  name_es: string | null;
  sort_order: number;
  items: MenuItem[];
}

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
