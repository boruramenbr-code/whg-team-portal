'use client';

import { useEffect, useState, useCallback } from 'react';
import { MenuCategory, MenuItem, allergenMeta } from '@/lib/menu-constants';

interface Props {
  language: 'en' | 'es';
  /** Open directly inside this category (deep-link from a Path module —
   *  e.g. the fry cook's "Study: Hot Small Plates"). */
  initialCategoryId?: string | null;
  /** Owner's master switcher — scopes the menu to this restaurant and
   *  hides the local switcher. */
  viewRestaurantId?: string | null;
  /** 'menu' (default) = food + knowledge bands. 'systems' = the 🧰
   *  Systems & Tools library (OpenTable, Toast POS, 7shifts…) — one
   *  whole section per tool, rendered under Training → Systems. */
  zone?: 'menu' | 'systems';
}

interface PositionInfo {
  slug: string;
  name: string;
  emoji: string | null;
  department: string;
  category_ids: string[];
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
export default function MenuTab({ language, initialCategoryId = null, viewRestaurantId = null, zone = 'menu' }: Props) {
  const isES = language === 'es';
  const systemsView = zone === 'systems';
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [search, setSearch] = useState('');
  // Study mode — item cards open masked (photo only) so staff can test
  // themselves before the real photo exam.
  const [studyMode, setStudyMode] = useState(false);
  // Category-first browsing: null = big category blocks; set = inside one
  // section only. Keeps a fry cook in Hot Small Plates, not lost in 149 items.
  const [selectedCatId, setSelectedCatId] = useState<string | null>(initialCategoryId);
  useEffect(() => { if (initialCategoryId) setSelectedCatId(initialCategoryId); }, [initialCategoryId]);

  // "Explore by Position": browse the sections any role studies —
  // deliberate cross-training, powered by the tracks (zero upkeep).
  const [exploreOpen, setExploreOpen] = useState(false);
  const [exploreSlug, setExploreSlug] = useState<string | null>(null);
  const [positions, setPositions] = useState<PositionInfo[] | null>(null);
  const openExplore = async () => {
    setExploreOpen(true);
    setSelectedCatId(null);
    if (positions) return;
    try {
      const url = restaurantId
        ? `/api/menu/positions?restaurant_id=${encodeURIComponent(restaurantId)}`
        : '/api/menu/positions';
      const r = await fetch(url);
      if (r.ok) {
        const j = await r.json();
        setPositions(j.positions || []);
      }
    } catch { /* button just won't populate — non-fatal */ }
  };

  // "Your Sections": menu categories referenced by this person's training
  // path. The track IS the assignment — refine a position's track and
  // their menu view reorganizes itself. Sections are led-with, never
  // hidden (Randy's rule: gate requirements, not knowledge).
  const [myCategoryIds, setMyCategoryIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/training/path');
        if (!r.ok || cancelled) return;
        const j = await r.json();
        const ids = new Set<string>();
        for (const t of j.tracks || []) {
          for (const m of t.modules || []) {
            if (m.module_type === 'menu_category' && m.ref_id) ids.add(m.ref_id);
          }
        }
        if (!cancelled) setMyCategoryIds(ids);
      } catch { /* non-fatal — falls back to the plain grid */ }
    })();
    return () => { cancelled = true; };
  }, []);

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

  // Owner's master switcher drives the scope when present.
  useEffect(() => { load(viewRestaurantId ?? undefined); }, [load, viewRestaurantId]);

  // Each zone only sees its own sections — the Menu tab never shows
  // tool training, and Systems never shows food. Deep-links still work
  // across zones because selectedCategory looks up the FULL list.
  const zoneCats = categories.filter((c) => (c.zone === 'systems') === systemsView);
  const totalItems = zoneCats.reduce((n, c) => n + c.items.length, 0);
  const allItems = zoneCats.flatMap((c) => c.items);

  // Search filters across every category; results render as one flat grid.
  const q = search.trim().toLowerCase();
  const searchResults = q
    ? allItems.filter((i) =>
        i.name.toLowerCase().includes(q) || (i.name_es || '').toLowerCase().includes(q))
    : null;

  const selectedCategory = selectedCatId
    ? categories.find((c) => c.id === selectedCatId) || null
    : null;

  // Study mode "next" — a random different item that has a photo. Stays
  // inside the selected section so drills match what you're studying.
  const nextStudyItem = (current: MenuItem): MenuItem | null => {
    const pool = (selectedCategory ? selectedCategory.items : allItems)
      .filter((i) => i.photo_url && i.id !== current.id);
    if (pool.length === 0) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  return (
    <div>
      {/* Restaurant switcher — hidden when the master switcher is driving */}
      {!viewRestaurantId && restaurants.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {restaurants.map((r) => (
            <button
              key={r.id}
              onClick={() => { setSelectedCatId(null); setExploreOpen(false); setExploreSlug(null); setPositions(null); load(r.id); }}
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
              placeholder={systemsView
                ? (isES ? 'Buscar una lección…' : 'Find a lesson…')
                : (isES ? 'Buscar un platillo…' : 'Find a dish…')}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/60 bg-white text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          {!systemsView && <button
            onClick={() => setStudyMode((v) => !v)}
            className={`tap-highlight flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              studyMode
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-white/60'
            }`}
            title={isES ? 'Modo estudio: adivina el platillo por la foto' : 'Study mode: guess the dish from the photo'}
          >
            🎴<span className="hidden sm:inline"> {isES ? 'Estudiar' : 'Study'}</span>
          </button>}
          {!systemsView && <button
            onClick={() => (exploreOpen || exploreSlug ? (setExploreOpen(false), setExploreSlug(null)) : openExplore())}
            className={`tap-highlight flex-shrink-0 px-3 py-2.5 rounded-xl text-xs font-bold transition-colors ${
              exploreOpen || exploreSlug
                ? 'bg-[#2E86C1] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-white/60'
            }`}
            title={isES ? 'Explorar por posición: qué estudia cada rol' : 'Explore by position: what each role studies'}
            aria-label={isES ? 'Explorar por posición' : 'Explore by position'}
          >
            🧭<span className="hidden sm:inline"> {isES ? 'Posiciones' : 'Positions'}</span>
          </button>}
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
          <div className="text-4xl mb-3">{systemsView ? '🧰' : '🍣'}</div>
          <p className="text-sm text-gray-500 font-medium">
            {systemsView
              ? (isES ? 'Las lecciones de sistemas vienen en camino.' : 'Systems lessons are on the way.')
              : (isES ? 'Tu menú se está construyendo.' : 'Your menu is being built.')}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {systemsView
              ? (isES
                  ? 'Aquí aprenderás las herramientas del trabajo — OpenTable, el punto de venta y más.'
                  : 'This is where you’ll learn the tools of the job — OpenTable, the POS, and more.')
              : (isES
                  ? 'Pronto verás aquí cada platillo con foto, ingredientes y alérgenos.'
                  : 'Soon you’ll see every dish here with photos, ingredients, and allergens.')}
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
      ) : selectedCategory ? (
        /* ── Inside one section — focused study, no 149-item scroll ── */
        <div>
          <div className="flex items-center justify-between gap-3 mb-3">
            <button
              onClick={() => setSelectedCatId(null)}
              className="tap-highlight flex items-center gap-1.5 text-sm font-semibold text-[#1B3A6B] hover:underline py-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              {exploreSlug
                ? (isES ? 'Atrás' : 'Back')
                : (isES ? 'Todas las secciones' : 'All sections')}
            </button>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
              {selectedCategory.items.length}{' '}
              {selectedCategory.zone === 'systems'
                ? (isES ? 'lecciones' : 'lessons')
                : (isES ? 'platillos' : 'items')}
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#1B3A6B] mb-3">
            {isES && selectedCategory.name_es ? selectedCategory.name_es : selectedCategory.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {selectedCategory.items.map((item) => (
              <ItemCard key={item.id} item={item} isES={isES} studyMode={studyMode} onOpen={() => setActiveItem(item)} />
            ))}
          </div>
        </div>
      ) : exploreSlug ? (
        /* ── One position's assigned sections ── */
        (() => {
          const pos = (positions || []).find((p) => p.slug === exploreSlug);
          const posCats = categories.filter((c) => c.items.length > 0 && pos?.category_ids.includes(c.id));
          return (
            <div>
              <button
                onClick={() => setExploreSlug(null)}
                className="tap-highlight flex items-center gap-1.5 text-sm font-semibold text-[#1B3A6B] hover:underline py-2 mb-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                {isES ? 'Todas las posiciones' : 'All positions'}
              </button>
              <h2 className="text-lg font-bold text-[#1B3A6B] mb-1">
                {pos?.emoji ? `${pos.emoji} ` : ''}{isES ? `Lo que estudia un ${pos?.name}` : `What a ${pos?.name} studies`}
              </h2>
              {posCats.length === 0 ? (
                <div className="mt-3 text-center py-10 bg-white/60 rounded-2xl border border-white/40">
                  <div className="text-3xl mb-2">🧹</div>
                  <p className="text-sm text-gray-600 font-medium">
                    {isES ? 'Esta posición no estudia menús.' : 'This position doesn’t study menus.'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {isES
                      ? 'Su entrenamiento vive en habilidades de piso y videos — míralo en Mi Camino.'
                      : 'Their training lives in floor skills and videos — see it on My Path.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  {posCats.map((c) => {
                    const cover = c.items.find((i) => i.photo_url)?.photo_url || null;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCatId(c.id)}
                        className="tap-highlight relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-[16/10] text-left"
                      >
                        {cover ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1B3A6B] to-[#2C4F8A] flex items-center justify-center text-4xl opacity-90">🍽️</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white font-bold text-sm md:text-base leading-tight drop-shadow">
                            {isES && c.name_es ? c.name_es : c.name}
                          </p>
                          <p className="text-white/70 text-[11px] font-semibold mt-0.5">
                            {c.items.length} {isES ? 'platillos' : 'items'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()
      ) : exploreOpen ? (
        /* ── Position picker — deliberate cross-training ── */
        <div>
          <h2 className="text-lg font-bold text-[#1B3A6B] mb-1">
            🧭 {isES ? 'Explorar por Posición' : 'Explore by Position'}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {isES
              ? 'Mira lo que estudia cada rol. ¿Quieres crecer hacia una posición? Empieza aquí — y díselo a un gerente.'
              : 'See what each role studies. Eyeing your next position? Start here — and tell a manager.'}
          </p>
          {positions === null ? (
            <div className="text-center py-8 text-sm text-gray-400 animate-pulse">
              {isES ? 'Cargando…' : 'Loading…'}
            </div>
          ) : (
            ['FOH', 'BOH', 'Management'].map((dept) => {
              const group = positions.filter((p) => p.department === dept);
              if (group.length === 0) return null;
              return (
                <div key={dept} className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{dept}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.map((p) => (
                      <button
                        key={p.slug}
                        onClick={() => setExploreSlug(p.slug)}
                        className="tap-highlight inline-flex items-center gap-1.5 bg-white border border-white/60 shadow-sm rounded-full px-3.5 py-2 text-xs font-semibold text-gray-700 hover:shadow-md transition-shadow"
                      >
                        {p.emoji && <span aria-hidden>{p.emoji}</span>}
                        {p.name}
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                          p.category_ids.length > 0 ? 'bg-[#2E86C1]/10 text-[#2E86C1]' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {p.category_ids.length > 0
                            ? `${p.category_ids.length} ${isES ? 'secc.' : 'sections'}`
                            : (isES ? 'sin menú' : 'no menu')}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ── Big category blocks — your position's sections lead ── */
        (() => {
          const withItems = zoneCats.filter((c) => c.items.length > 0);
          const mine = withItems.filter((c) => myCategoryIds.has(c.id));
          const others = withItems.filter((c) => !myCategoryIds.has(c.id));
          const renderTile = (c: MenuCategory, isMine: boolean) => {
            const cover = c.items.find((i) => i.photo_url)?.photo_url || null;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCatId(c.id)}
                className={`tap-highlight relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow aspect-[16/10] text-left ${
                  isMine ? 'ring-2 ring-amber-400' : ''
                }`}
              >
                {cover ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1B3A6B] to-[#2C4F8A] flex items-center justify-center text-4xl opacity-90">
                    {systemsView ? '🧰' : '🍽️'}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                {isMine && (
                  <span className="absolute top-2 right-2 bg-amber-400 text-[#1B3A6B] text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full shadow">
                    🎯 {isES ? 'Tuya' : 'Yours'}
                  </span>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-sm md:text-base leading-tight drop-shadow">
                    {isES && c.name_es ? c.name_es : c.name}
                  </p>
                  <p className="text-white/70 text-[11px] font-semibold mt-0.5">
                    {c.items.length}{' '}
                    {systemsView ? (isES ? 'lecciones' : 'lessons') : (isES ? 'platillos' : 'items')}
                  </p>
                </div>
              </button>
            );
          };

          // Two bands: study sections up top, sellable food below a clear
          // divider (Randy's call). Within each band, YOUR sections lead
          // and wear the gold ring. Restaurants without knowledge sections
          // (Boru, for now) fall back to the flat Your/Everything split.
          const knowledge = withItems.filter((c) => c.is_knowledge);
          const food = withItems.filter((c) => !c.is_knowledge);
          const mineFirst = (arr: typeof withItems) =>
            [...arr].sort((a, b) => Number(myCategoryIds.has(b.id)) - Number(myCategoryIds.has(a.id)));

          // Systems zone: one flat band — each tool is its own whole
          // section (OpenTable, Toast POS, 7shifts…). Your position's
          // tools lead and wear the gold ring.
          if (systemsView) {
            return (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1B3A6B] mb-2">
                  🧰 {isES ? 'Sistemas y Herramientas' : 'Systems & Tools'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {mineFirst(withItems).map((c) => renderTile(c, myCategoryIds.has(c.id)))}
                </div>
              </div>
            );
          }

          if (knowledge.length > 0) {
            return (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#1B3A6B] mb-2">
                  📚 {isES ? 'Estudio y Conocimiento' : 'Study & Knowledge'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {mineFirst(knowledge).map((c) => renderTile(c, myCategoryIds.has(c.id)))}
                </div>

                {/* The separator between learning and the sellable menu */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px bg-[#1B3A6B]/25" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B3A6B]">
                    🍽️ {isES ? 'El Menú' : 'The Menu'}
                  </span>
                  <div className="flex-1 h-px bg-[#1B3A6B]/25" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {mineFirst(food).map((c) => renderTile(c, myCategoryIds.has(c.id)))}
                </div>
              </div>
            );
          }

          if (mine.length === 0) {
            return <div className="grid grid-cols-2 gap-3">{withItems.map((c) => renderTile(c, false))}</div>;
          }
          return (
            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2">
                  🎯 {isES ? 'Tus Secciones' : 'Your Sections'}
                </p>
                <div className="grid grid-cols-2 gap-3">{mine.map((c) => renderTile(c, true))}</div>
              </div>
              {others.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {isES ? 'Todo lo Demás' : 'Everything Else'}
                  </p>
                  <div className="grid grid-cols-2 gap-3">{others.map((c) => renderTile(c, false))}</div>
                </div>
              )}
            </div>
          );
        })()
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
        {!studyMode && item.video_youtube_id && (
          <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            ▶
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

          {/* Video — how it's made / how it's cut */}
          {item.video_youtube_id && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                ▶ {isES ? 'Míralo' : 'Watch'}
              </p>
              <div className="aspect-video rounded-xl overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${item.video_youtube_id}?rel=0`}
                  title={name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </div>
          )}

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
