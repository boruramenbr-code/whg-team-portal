'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MenuCategory, MenuItem, ALLERGENS } from '@/lib/menu-constants';
import { convertToJpeg } from '@/lib/client-image';

/* ───────── Admin Menu authoring (Admin → Training → Menu) ─────────
 *
 * Managers build their restaurant's menu library here: categories, items,
 * photos. Mirrors TrainingAdminTab's list + inline-modal architecture.
 * Restaurant switcher appears for admins / multi-location managers.
 *
 * Photos run through the bar-cards compression pipeline (heic2any +
 * canvas recompress) so iPhone shots can't blow Vercel's body limit.
 */
export default function MenuAdminTab() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<Partial<MenuCategory> | null>(null);
  const [editingItem, setEditingItem] = useState<{ item: Partial<MenuItem>; categoryId: string } | null>(null);

  const load = useCallback(async (rid?: string | null) => {
    setLoading(true);
    try {
      const url = rid ? `/api/menu?restaurant_id=${encodeURIComponent(rid)}` : '/api/menu';
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) {
        setError('Failed to load the menu.');
        return;
      }
      const j = await r.json();
      setCategories(j.categories || []);
      setRestaurants(j.available_restaurants || []);
      setRestaurantId(j.restaurant_id || null);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Every item inside it will also be removed. This cannot be undone.')) return;
    const r = await fetch(`/api/menu/categories?id=${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Delete failed.');
      return;
    }
    load(restaurantId);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this item? This cannot be undone.')) return;
    const r = await fetch(`/api/menu/items?id=${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Delete failed.');
      return;
    }
    load(restaurantId);
  };

  const restaurantName = restaurants.find((r) => r.id === restaurantId)?.name || '';

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 md:py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1B3A6B]">Menu Library</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Build the training menu{restaurantName ? ` for ${restaurantName}` : ''}. Staff see only their restaurant&rsquo;s items. Quizzes (Phase B) draft questions from what you enter here.
          </p>
        </div>
        <button
          onClick={() => setEditingCategory({ name: '', sort_order: (categories.length + 1) * 100 })}
          disabled={!restaurantId}
          className="flex-shrink-0 px-3 py-2 rounded-lg bg-[#1B3A6B] text-white text-xs font-semibold hover:bg-[#15305A] transition-colors disabled:opacity-40"
        >
          + New Category
        </button>
      </div>

      {/* Restaurant switcher */}
      {restaurants.length > 1 && (
        <div className="flex gap-1.5 flex-wrap mb-5">
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

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Loading…</div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-white/60 rounded-2xl border border-white/40">
          <div className="text-4xl mb-3">🍣</div>
          <p className="text-sm text-gray-500 font-medium">No menu yet{restaurantName ? ` for ${restaurantName}` : ''}.</p>
          <p className="text-xs text-gray-400 mt-1">Start with a category — Rolls, Ramen, Apps — then add items with photos.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {/* Category header */}
              <div className="px-4 py-3 border-b border-gray-100 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm md:text-base font-bold text-[#1B3A6B] truncate">{c.name}</h2>
                    {c.name_es && <span className="text-xs text-gray-400 truncate">/ {c.name_es}</span>}
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex-shrink-0">
                      #{c.sort_order}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditingCategory(c)}
                    className="px-2 py-1 text-[11px] font-semibold text-[#2E86C1] hover:bg-blue-50 rounded transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-100">
                {c.items.length === 0 ? (
                  <div className="px-4 py-4 text-center text-xs text-gray-400">No items yet.</div>
                ) : (
                  c.items.map((item) => (
                    <div key={item.id} className="px-4 py-2.5 flex items-center gap-3">
                      <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                        {item.photo_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={item.photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <span className="text-xl opacity-40">🍽️</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                          {item.price && (
                            <span className="text-[10px] text-gray-500 flex-shrink-0">{item.price}</span>
                          )}
                          {!item.photo_url && (
                            <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                              No photo
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 truncate">
                          {item.allergens.length > 0
                            ? `Allergens: ${item.allergens.join(', ')}`
                            : 'No allergens marked'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => setEditingItem({ item, categoryId: c.id })}
                          className="px-2 py-1 text-[11px] font-semibold text-[#2E86C1] hover:bg-blue-50 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add item */}
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() =>
                    setEditingItem({
                      item: { name: '', allergens: [], sort_order: (c.items.length + 1) * 100 },
                      categoryId: c.id,
                    })
                  }
                  className="w-full py-2 text-xs font-semibold text-[#1B3A6B] hover:bg-white border-2 border-dashed border-gray-300 hover:border-[#1B3A6B]/40 rounded-lg transition-colors"
                >
                  + Add Item to &ldquo;{c.name}&rdquo;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingCategory && restaurantId && (
        <CategoryEditor
          initial={editingCategory}
          restaurantId={restaurantId}
          onClose={() => setEditingCategory(null)}
          onSaved={() => { setEditingCategory(null); load(restaurantId); }}
        />
      )}

      {editingItem && (
        <ItemEditor
          initial={editingItem.item}
          categoryId={editingItem.categoryId}
          onClose={() => setEditingItem(null)}
          onSaved={() => { setEditingItem(null); load(restaurantId); }}
        />
      )}
    </div>
  );
}

/* ───────── Category editor modal ───────── */
function CategoryEditor({
  initial,
  restaurantId,
  onClose,
  onSaved,
}: {
  initial: Partial<MenuCategory>;
  restaurantId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial.id;
  const [name, setName] = useState(initial.name || '');
  const [nameEs, setNameEs] = useState(initial.name_es || '');
  const [sortOrder, setSortOrder] = useState<string>(String(initial.sort_order ?? 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError(null);
    const url = isEdit ? `/api/menu/categories?id=${initial.id}` : '/api/menu/categories';
    const r = await fetch(url, {
      method: isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurant_id: restaurantId,
        name: name.trim(),
        name_es: nameEs.trim() || null,
        sort_order: Number(sortOrder) || 100,
      }),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Save failed.');
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1B3A6B]">{isEdit ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 text-xl px-2 py-1">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Specialty Rolls"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">Name (Spanish, optional)</label>
            <input
              type="text"
              value={nameEs}
              onChange={(e) => setNameEs(e.target.value)}
              placeholder="e.g. Rollos Especiales"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
              Sort Order <span className="text-gray-300 normal-case font-normal">(lower = first)</span>
            </label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
              saving || !name.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#15305A]'
            }`}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Item editor modal ─────────
 * Creating: fields save first, then the photo section unlocks (the photo
 * endpoint needs an item id). Editing: photo section is live immediately. */
function ItemEditor({
  initial,
  categoryId,
  onClose,
  onSaved,
}: {
  initial: Partial<MenuItem>;
  categoryId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [itemId, setItemId] = useState<string | null>(initial.id || null);
  const isEdit = !!itemId;
  const [name, setName] = useState(initial.name || '');
  const [nameEs, setNameEs] = useState(initial.name_es || '');
  const [price, setPrice] = useState(initial.price || '');
  const [description, setDescription] = useState(initial.description || '');
  const [descriptionEs, setDescriptionEs] = useState(initial.description_es || '');
  const [ingredients, setIngredients] = useState(initial.ingredients || '');
  const [ingredientsEs, setIngredientsEs] = useState(initial.ingredients_es || '');
  const [allergens, setAllergens] = useState<string[]>(initial.allergens || []);
  const [prepNotes, setPrepNotes] = useState(initial.prep_notes || '');
  const [prepNotesEs, setPrepNotesEs] = useState(initial.prep_notes_es || '');
  const [upsell, setUpsell] = useState(initial.upsell_note || '');
  const [upsellEs, setUpsellEs] = useState(initial.upsell_note_es || '');
  const [sortOrder, setSortOrder] = useState<string>(String(initial.sort_order ?? 100));
  const [photoUrl, setPhotoUrl] = useState(initial.photo_url || null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const toggleAllergen = (key: string) => {
    setAllergens((prev) => (prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]));
  };

  const payload = () => ({
    category_id: categoryId,
    name: name.trim(),
    name_es: nameEs,
    price,
    description,
    description_es: descriptionEs,
    ingredients,
    ingredients_es: ingredientsEs,
    allergens,
    prep_notes: prepNotes,
    prep_notes_es: prepNotesEs,
    upsell_note: upsell,
    upsell_note_es: upsellEs,
    sort_order: Number(sortOrder) || 100,
  });

  const save = async (closeAfter: boolean) => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError(null);
    const url = itemId ? `/api/menu/items?id=${itemId}` : '/api/menu/items';
    const r = await fetch(url, {
      method: itemId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload()),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Save failed.');
      return;
    }
    if (!itemId) {
      const j = await r.json();
      setItemId(j.item?.id || null);
    }
    if (closeAfter) {
      onSaved();
    } else {
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 2000);
    }
  };

  const uploadPhoto = async (file: File) => {
    if (!itemId) return;
    setUploading(true);
    setError(null);
    try {
      const compressed = await convertToJpeg(file);
      const fd = new FormData();
      fd.append('id', itemId);
      fd.append('file', compressed);
      const r = await fetch('/api/menu/items/photo', { method: 'POST', body: fd });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || 'Photo upload failed. Try again.');
        return;
      }
      const j = await r.json();
      setPhotoUrl(j.photo_url);
    } catch {
      setError('Couldn’t process this photo — try a different one.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const inputCls =
    'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20';
  const labelCls = 'block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1B3A6B]">{isEdit ? 'Edit Item' : 'New Item'}</h2>
          <div className="flex items-center gap-2">
            {savedTick && <span className="text-xs font-semibold text-emerald-600">Saved ✓</span>}
            <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600 text-xl px-2 py-1">✕</button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Photo */}
          <div>
            <label className={labelCls}>Photo</label>
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                {photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl opacity-40">🍽️</span>
                )}
              </div>
              <div className="flex-1">
                {isEdit ? (
                  <>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,.heic,.heif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPhoto(f);
                      }}
                    />
                    <button
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="px-3 py-2 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      {uploading ? 'Uploading…' : photoUrl ? 'Replace Photo' : '📷 Add Photo'}
                    </button>
                    <p className="text-[10px] text-gray-400 mt-1">iPhone photos welcome — we compress automatically.</p>
                  </>
                ) : (
                  <p className="text-[11px] text-gray-400">Save the item first, then the photo button unlocks right here.</p>
                )}
              </div>
            </div>
          </div>

          {/* Name / price */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelCls}>Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Tiger Roll" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Price</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$14.95" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Name (Spanish, optional)</label>
            <input type="text" value={nameEs} onChange={(e) => setNameEs(e.target.value)} className={inputCls} />
          </div>

          {/* Allergens */}
          <div>
            <label className={labelCls}>Allergens</label>
            <div className="flex flex-wrap gap-1.5">
              {ALLERGENS.map((a) => {
                const on = allergens.includes(a.key);
                return (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => toggleAllergen(a.key)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                      on
                        ? 'bg-red-50 border-red-300 text-red-800'
                        : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <span aria-hidden>{a.emoji}</span>
                    {a.en}
                    {on && <span aria-hidden>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={labelCls}>Description — what is it, how does it taste</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Description (Spanish, optional)</label>
            <textarea value={descriptionEs} onChange={(e) => setDescriptionEs(e.target.value)} rows={2} className={inputCls} />
          </div>

          {/* Ingredients */}
          <div>
            <label className={labelCls}>Ingredients — one per line</label>
            <textarea
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              rows={4}
              placeholder={'Snow crab\nAvocado\nCucumber\nSpicy mayo'}
              className={`${inputCls} font-mono text-xs`}
            />
          </div>
          <div>
            <label className={labelCls}>Ingredients (Spanish, optional)</label>
            <textarea value={ingredientsEs} onChange={(e) => setIngredientsEs(e.target.value)} rows={3} className={`${inputCls} font-mono text-xs`} />
          </div>

          {/* Prep + upsell */}
          <div>
            <label className={labelCls}>Prep notes (optional)</label>
            <textarea value={prepNotes} onChange={(e) => setPrepNotes(e.target.value)} rows={2} placeholder="Torch the top before serving. No substitutions on the crab." className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Prep notes (Spanish, optional)</label>
            <textarea value={prepNotesEs} onChange={(e) => setPrepNotesEs(e.target.value)} rows={2} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>How to sell it (optional)</label>
            <textarea value={upsell} onChange={(e) => setUpsell(e.target.value)} rows={2} placeholder='"Our most-photographed roll — if it&apos;s your first visit, this is the one."' className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>How to sell it (Spanish, optional)</label>
            <textarea value={upsellEs} onChange={(e) => setUpsellEs(e.target.value)} rows={2} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Sort Order <span className="text-gray-300 normal-case font-normal">(lower = first)</span></label>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B] focus:ring-1 focus:ring-[#1B3A6B]/20" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            {!isEdit && (
              <button
                onClick={() => save(false)}
                disabled={saving || !name.trim()}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                  saving || !name.trim()
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border-2 border-[#1B3A6B] text-[#1B3A6B] hover:bg-blue-50'
                }`}
              >
                {saving ? 'Saving…' : 'Save & Add Photo'}
              </button>
            )}
            <button
              onClick={() => save(true)}
              disabled={saving || !name.trim()}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                saving || !name.trim()
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#1B3A6B] text-white hover:bg-[#15305A]'
              }`}
            >
              {saving ? 'Saving…' : isEdit ? 'Save & Close' : 'Save Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
