'use client';

import { useEffect, useState, useCallback } from 'react';
import { MenuCategory, MenuItem, allergenMeta } from '@/lib/menu-constants';

interface Props {
  language: 'en' | 'es';
}

/* ───────── Staff Menu tab (Training → Menu) ─────────
 *
 * Restaurant-scoped menu library. Staff see ONLY their restaurant's menu
 * (the API + RLS enforce it); admins and multi-location managers get a
 * switcher when they can view more than one.
 *
 * Browse: category sections with a photo grid. Tap an item → full-screen
 * training card (photo, description, ingredients, allergens, prep notes,
 * how-to-sell tip). Phase B hangs quizzes off this same content.
 */
export default function MenuTab({ language }: Props) {
  const isES = language === 'es';
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState('');
  // Study mode — item cards open masked (photo only) so staff can test
  // themselves before the real photo exam.
  const [studyMode, setStudyMode] = useState(false);

  const load = useCallback(async (rid?: string | null) => {
    setLoading(true);
    try {
      const url = rid ? `/api/menu?restaurant_id=${encodeURIComponent(rid)}` : '/api/menu';
      const r = await fetch(url);
      if (!r.ok) return;
      const j = await r.json();
      setCategories(j.categories || []);
      setRestaurants(j.available_restaurants || []);
      setRestaurantId(j.restaurant_id || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalItems = categories.reduce((n, c) => n + c.items.length, 0);
  const allItems = categories.flatMap((c) => c.items);

  // Search filters across every category; results render as one flat grid.
  const q = search.trim().toLowerCase();
  const searchResults = q
    ? allItems.filter((i) =>
        i.name.toLowerCase().includes(q) || (i.name_es || '').toLowerCase().includes(q))
    : null;

  // Study mode "next" — a random different item that has a photo.
  const nextStudyItem = (current: MenuItem): MenuItem | null => {
    const pool = allItems.filter((i) => i.photo_url && i.id !== current.id);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  return (
    <div>
      {/* Restaurant switcher — only when the user can see more than one */}
      {restaurants.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => load(r.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                restaurantId === r.id
                  ? 'bg-[#1B3A6B] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {r.name}
            </button>
          ))}
        </div>
      )}

      {/* Search + study mode — the two fastest paths into the content */}
      {!loading && totalItems > 0 && (
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden>🔍</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isES ? 'Buscar un platillo…' : 'Find a dish…'}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/60 bg-white text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <button
            onClick={() => setStudyMode((v) => !v)}
            className={`tap-highlight flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              studyMode
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-white/60'
            }`}
            title={isES ? 'Modo estudio: adivina el platillo por la foto' : 'Study mode: guess the dish from the photo'}
          >
            🎴 {isES ? 'Estudiar' : 'Study'}
          </button>
        </div>
      )}

      {studyMode && !loading && (
        <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
          {isES
            ? 'Modo estudio: toca un platillo, di el nombre en voz alta y luego revela la respuesta.'
            : 'Study mode is on — tap a dish, say its name out loud, then reveal the answer.'}
        </p>
      )}

      {loading ? (
        /* Card-shaped skeleton so the grid doesn't reflow on arrival */
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/60 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-200/60" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200/60 rounded w-3/4" />
                <div className="h-2.5 bg-gray-200/60 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : totalItems === 0 ? (
        <div className="text-center py-12 bg-white/60 rounded-2xl border border-white/40">
          <div className="text-4xl mb-3">🍣</div>
          <p className="text-sm text-gray-500 font-medium">
            {isES ? 'Tu menú se está construyendo.' : 'Your menu is being built.'}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {isES
              ? 'Pronto verás aquí cada platillo con foto, ingredientes y alérgenos.'
              : 'Soon you’ll see every dish here with photos, ingredients, and allergens.'}
          </p>
        </div>
      ) : searchResults ? (
        searchResults.length === 0 ? (
          <div className="text-center py-10 bg-white/60 rounded-2xl border border-white/40">
            <p className="text-sm text-gray-500 font-medium">
              {isES ? `Nada para “${search.trim()}”.` : `Nothing for “${search.trim()}”.`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isES ? 'Revisa la ortografía o busca menos letras.' : 'Check the spelling or try fewer letters.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {searchResults.map((item) => (
              <ItemCard key={item.id} item={item} isES={isES} studyMode={studyMode} onOpen={() => setActiveItem(item)} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-6">
          {categories.filter((c) => c.items.length > 0).map((c) => (
            <section key={c.id}>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-2.5">
                {isES && c.name_es ? c.name_es : c.name}
                <span className="ml-2 text-[10px] font-semibold text-gray-400 normal-case tracking-normal">
                  {c.items.length}
                </span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {c.items.map((item) => (
                  <ItemCard key={item.id} item={item} isES={isES} studyMode={studyMode} onOpen={() => setActiveItem(item)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Full-screen training card */}
      {activeItem && (
        <ItemDetail
          item={activeItem}
          isES={isES}
          studyMode={studyMode}
          onNext={studyMode ? () => setActiveItem(nextStudyItem(activeItem)) : undefined}
          onClose={() => setActiveItem(null)}
        />
      )}
    </div>
  );
}

/* ───────── Grid card ─────────
 * In study mode the name is hidden — the photo IS the question. */
function ItemCard({ item, isES, studyMode, onOpen }: { item: MenuItem; isES: boolean; studyMode: boolean; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="bg-white rounded-2xl border border-white/60 shadow-sm overflow-hidden text-left hover:shadow-md transition-shadow"
    >
      <div className="aspect-square bg-gray-100 relative">
        {item.photo_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={item.photo_url}
            alt={studyMode ? '' : item.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-40">🍽️</div>
        )}
        {!studyMode && item.allergens.length > 0 && (
          <span className="absolute top-1.5 right-1.5 bg-white/90 text-[10px] px-1.5 py-0.5 rounded-full shadow-sm">
            {item.allergens.slice(0, 3).map((a) => allergenMeta(a)?.emoji).join('')}
          </span>
        )}
      </div>
      <div className="p-2.5">
        {studyMode ? (
          <p className="text-xs font-bold text-amber-600 leading-snug">
            {isES ? '¿Qué es esto?' : 'What is this?'}
          </p>
        ) : (
          <>
            <p className="text-xs font-bold text-[#1B3A6B] leading-snug line-clamp-2">
              {isES && item.name_es ? item.name_es : item.name}
            </p>
            {item.price && (
              <p className="text-[11px] text-gray-500 mt-0.5">{item.price}</p>
            )}
          </>
        )}
      </div>
    </button>
  );
}

/* ───────── Full-screen item training card ─────────
 * studyMode: opens masked (photo only) with a reveal button; onNext jumps
 * to another random item so staff can drill the whole menu hands-free. */
function ItemDetail({ item, isES, studyMode = false, onNext, onClose }: {
  item: MenuItem;
  isES: boolean;
  studyMode?: boolean;
  onNext?: () => void;
  onClose: () => void;
}) {
  const [revealed, setRevealed] = useState(!studyMode);
  // Re-mask when study mode jumps to the next item.
  useEffect(() => { setRevealed(!studyMode); }, [item.id, studyMode]);

  const name = isES && item.name_es ? item.name_es : item.name;
  const altName = isES && item.name_es ? item.name : item.name_es;
  const description = isES && item.description_es ? item.description_es : item.description;
  const ingredients = isES && item.ingredients_es ? item.ingredients_es : item.ingredients;
  const prepNotes = isES && item.prep_notes_es ? item.prep_notes_es : item.prep_notes;
  const upsell = isES && item.upsell_note_es ? item.upsell_note_es : item.upsell_note;
  const ingredientLines = (ingredients || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 pt-safe bg-[#1B3A6B]">
        <button
          onClick={onClose}
          className="tap-highlight flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium py-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {isES ? 'Volver al menú' : 'Back to menu'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-safe">
        {/* Photo */}
        <div className="w-full max-w-2xl mx-auto aspect-[4/3] bg-gray-100">
          {item.photo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={item.photo_url} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">🍽️</div>
          )}
        </div>

        {/* Study mode: everything below the photo is masked until revealed */}
        {!revealed ? (
          <div className="max-w-2xl mx-auto px-5 py-8 text-center space-y-5">
            <p className="text-lg font-bold text-[#1B3A6B]">
              {isES ? '¿Qué platillo es este?' : 'What dish is this?'}
            </p>
            <p className="text-sm text-gray-500">
              {isES ? 'Dilo en voz alta — nombre e ingredientes.' : 'Say it out loud — name and what’s in it.'}
            </p>
            <button
              onClick={() => setRevealed(true)}
              className="w-full max-w-xs mx-auto py-3.5 rounded-2xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 shadow-md block"
            >
              {isES ? 'Revelar respuesta' : 'Reveal answer'}
            </button>
          </div>
        ) : (
        <div className="max-w-2xl mx-auto px-5 py-5 space-y-5">
          {/* Name — price is deliberately quiet: this is a training page,
              not a menu. It stays only as a reference for servers who get
              asked at the table. */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B] leading-tight">{name}</h1>
            {item.pronunciation && (
              <p className="text-sm text-[#2E86C1] font-semibold mt-0.5">
                🔊 {item.pronunciation}
              </p>
            )}
            {altName && <p className="text-sm text-gray-400 mt-0.5">{altName}</p>}
            {item.price && (
              <p className="text-xs text-gray-400 mt-1">{item.price}</p>
            )}
          </div>

          {/* Raw/cooked + spice — the two questions guests actually ask.
              Render only once the data has been entered. */}
          {(item.is_raw !== null || item.spice_level !== null) && (
            <div className="flex flex-wrap gap-2">
              {item.is_raw === true && (
                <span className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-full">
                  🍣 {isES ? 'CRUDO' : 'RAW'}
                </span>
              )}
              {item.is_raw === false && (
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full">
                  🔥 {isES ? 'COCIDO' : 'COOKED'}
                </span>
              )}
              {item.spice_level !== null && (
                <span className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold px-3 py-1.5 rounded-full">
                  {item.spice_level === 0
                    ? (isES ? 'No picante' : 'Not spicy')
                    : '🌶️'.repeat(item.spice_level)}
                </span>
              )}
            </div>
          )}

          {/* Allergens — the safety-critical block sits right under the name */}
          {item.allergens.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-700 mb-2">
                ⚠️ {isES ? 'Alérgenos' : 'Allergens'}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {item.allergens.map((a) => {
                  const meta = allergenMeta(a);
                  if (!meta) return null;
                  return (
                    <span
                      key={a}
                      className="inline-flex items-center gap-1 bg-white border border-red-200 text-red-800 text-xs font-semibold px-2.5 py-1 rounded-full"
                    >
                      <span aria-hidden>{meta.emoji}</span>
                      {isES ? meta.es : meta.en}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description — the core study content, sized to read like a
              lesson, not a caption. */}
          {description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                {isES ? 'Descripción' : 'What it is'}
              </p>
              <p className="text-base md:text-lg font-medium text-gray-900 leading-relaxed whitespace-pre-wrap">{description}</p>
            </div>
          )}

          {/* Ingredients */}
          {ingredientLines.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                {isES ? 'Ingredientes' : 'Ingredients'}
              </p>
              <ul className="space-y-1">
                {ingredientLines.map((line, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-[#2E86C1] mt-0.5 flex-shrink-0">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Prep notes */}
          {prepNotes && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                🔪 {isES ? 'Notas de Preparación' : 'Prep Notes'}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{prepNotes}</p>
            </div>
          )}

          {/* Upsell tip */}
          {upsell && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1.5">
                💬 {isES ? 'Cómo Venderlo' : 'How to Sell It'}
              </p>
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap italic">{upsell}</p>
            </div>
          )}

          {/* Study mode: keep the drill moving */}
          {studyMode && onNext && (
            <button
              onClick={onNext}
              className="w-full py-3.5 rounded-2xl bg-[#1B3A6B] text-white text-sm font-bold hover:bg-[#2C4F8A] shadow-md"
            >
              {isES ? 'Siguiente platillo →' : 'Next dish →'}
            </button>
          )}

          <div className="h-4" />
        </div>
        )}
      </div>
    </div>
  );
}
