'use client';

import { useEffect, useState } from 'react';

interface Position {
  id: string;
  slug: string;
  name: string;
  emoji: string;
  department: 'FOH' | 'BOH' | 'Management';
  description: string | null;
  sort_order: number;
}

interface RestaurantOption {
  id: string;
  name: string;
}

interface Props {
  language: 'en' | 'es';
}

const VIEW_RESTAURANT_KEY = 'whg_view_restaurant_id';

/**
 * PositionsSection — full-page tab content showing the position catalog.
 *
 * Renders the entire FOH / BOH / Management grid as the active tab.
 * Tapping a position opens PositionDetailModal with the description.
 *
 * For admins and multi-location managers, a restaurant switcher renders
 * at the top so they can preview any restaurant's catalog. Selection
 * persists in localStorage so the choice sticks across visits.
 */
export default function PositionsSection({ language }: Props) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Position | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [availableRestaurants, setAvailableRestaurants] = useState<RestaurantOption[]>([]);
  const isES = language === 'es';

  // Load any saved restaurant preference on first render
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_RESTAURANT_KEY);
      if (saved) setRestaurantId(saved);
    } catch {
      // localStorage unavailable (private mode, etc.) — fine, fall back to profile default
    }
  }, []);

  // Fetch positions whenever the selected restaurant changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = restaurantId
      ? `/api/positions?restaurant_id=${encodeURIComponent(restaurantId)}`
      : '/api/positions';

    fetch(url, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setPositions(data.positions || []);
        if (Array.isArray(data.available_restaurants)) {
          setAvailableRestaurants(data.available_restaurants);
        }
        // If we hadn't picked one yet, sync to whatever the API resolved
        if (!restaurantId && data.restaurant_id) {
          setRestaurantId(data.restaurant_id);
        }
      })
      .catch(() => { /* ignore */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [restaurantId]);

  const onSelectRestaurant = (id: string) => {
    setRestaurantId(id);
    try { localStorage.setItem(VIEW_RESTAURANT_KEY, id); } catch { /* ignore */ }
  };

  const byDept = {
    FOH: positions.filter((p) => p.department === 'FOH'),
    BOH: positions.filter((p) => p.department === 'BOH'),
    Management: positions.filter((p) => p.department === 'Management'),
  };
  const deptLabels = isES
    ? { FOH: 'Frente de Casa', BOH: 'Cocina', Management: 'Gerencia' }
    : { FOH: 'Front of House', BOH: 'Back of House', Management: 'Management' };

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-whg-night via-[#101B2E] to-whg-night2">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-4">

        {/* ── Header ── */}
        <div className="bg-whg-card border border-whg-line rounded-2xl shadow-sm p-5">
          <h2 className="text-lg font-bold text-whg-snow flex items-center gap-2">
            <span>🧭</span>
            {isES ? 'Posiciones del Equipo' : 'Team Positions'}
          </h2>
          <p className="text-sm text-whg-dim mt-1">
            {isES
              ? 'Toca una posición para ver qué hace.'
              : 'Tap a position to see what it does.'}
          </p>
          <p className="text-xs text-whg-snow/90 font-semibold mt-2 italic leading-relaxed">
            {isES
              ? 'Estos son nuestros estándares. Cualquier cosa por debajo será atendida por la gerencia.'
              : 'These are our standards. Anything below gets addressed by management.'}
          </p>
        </div>

        {/* ── Restaurant switcher (admins / multi-location users) ── */}
        {availableRestaurants.length > 1 && (
          <div className="bg-whg-card border border-whg-line rounded-2xl shadow-sm p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim mb-2">
              {isES ? 'Viendo Como' : 'Viewing As'}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {availableRestaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectRestaurant(r.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    restaurantId === r.id
                      ? 'bg-whg-gold text-whg-goldink shadow-sm'
                      : 'bg-white/10 text-whg-dim hover:bg-white/20'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Know Your Pay (collapsible educational card) ── */}
        <KnowYourPayCard language={language} />

        {/* ── Loading / empty states ── */}
        {loading && (
          <div className="bg-whg-card border border-whg-line rounded-2xl shadow-sm p-8 text-center text-sm text-whg-dim">
            {isES ? 'Cargando…' : 'Loading…'}
          </div>
        )}

        {!loading && positions.length === 0 && (
          <div className="bg-whg-card border border-whg-line rounded-2xl shadow-sm p-8 text-center text-sm text-whg-dim">
            {isES ? 'No hay posiciones todavía.' : 'No positions yet.'}
          </div>
        )}

        {/* ── Department-grouped grids ── */}
        {!loading && positions.length > 0 && (['FOH', 'BOH', 'Management'] as const).map((dept) => {
          const items = byDept[dept];
          if (items.length === 0) return null;
          return (
            <div key={dept} className="bg-whg-card border border-whg-line rounded-2xl shadow-sm p-4">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-whg-dim mb-3 px-1">
                {deptLabels[dept]}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setActive(p)}
                    className="tap-highlight text-left bg-whg-card2 hover:bg-white/5 active:bg-white/10 border border-whg-line rounded-xl px-3 py-3 transition-colors flex items-center gap-2.5"
                  >
                    <span className="text-2xl flex-shrink-0">{p.emoji}</span>
                    <span className="text-sm font-semibold text-whg-snow leading-tight">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Detail modal ── */}
      {active && (
        <PositionDetailModal
          position={active}
          language={language}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  );
}

/* ───────── Position detail modal ───────── */
function PositionDetailModal({
  position,
  language,
  onClose,
}: {
  position: Position;
  language: 'en' | 'es';
  onClose: () => void;
}) {
  const isES = language === 'es';
  const hasDescription = !!position.description?.trim();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const deptLabel = (() => {
    const map = isES
      ? { FOH: 'Frente de Casa', BOH: 'Cocina', Management: 'Gerencia' }
      : { FOH: 'Front of House', BOH: 'Back of House', Management: 'Management' };
    return map[position.department];
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-whg-card border border-whg-line w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-whg-dim/50" />
        </div>

        <div className="px-5 py-4 border-b border-whg-line flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-4xl flex-shrink-0">{position.emoji}</span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-whg-snow leading-tight truncate">
                {position.name}
              </h3>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-whg-dim mt-0.5">
                {deptLabel}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-whg-dim hover:text-whg-snow flex items-center justify-center transition-colors"
            aria-label={isES ? 'Cerrar' : 'Close'}
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 flex-1">
          {hasDescription ? (
            <PositionDescriptionRenderer text={position.description!} />
          ) : (
            <div className="text-center py-8 text-whg-dim">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm font-medium">
                {isES ? 'Descripción próximamente.' : 'Description coming soon.'}
              </p>
              <p className="text-xs text-whg-dim/70 mt-1">
                {isES
                  ? 'Habla con tu gerente si tienes preguntas sobre esta posición.'
                  : 'Talk to your manager if you have questions about this position.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────── Position Description Renderer ─────────
 * Mini markdown-style parser tuned for Boru job description format.
 *
 * Supported syntax:
 *   [POS_INFO] / [/POS_INFO]       — info block (Reports To, Pay Type, etc.)
 *   ## SECTION HEADER              — major section
 *   ### Subsection                 — subsection (numbered responsibilities)
 *   > callout text                 — amber Standard callout
 *   - bullet text                  — bullet list
 *   **bold inline**                — bold inline
 *   *italic inline*                — italic inline
 *   blank line                     — paragraph separator
 *
 * Plain text otherwise renders as paragraph. Designed to render Word-doc
 * job descriptions cleanly on phone + desktop.
 */
function PositionDescriptionRenderer({ text }: { text: string }) {
  type Block =
    | { type: 'info'; rows: { key: string; value: string }[] }
    | { type: 'h2'; text: string }
    | { type: 'h3'; text: string }
    | { type: 'callout'; text: string }
    | { type: 'bullets'; items: string[] }
    | { type: 'p'; text: string };

  // ── Parse into structured blocks ────────────────────────────────────
  const blocks: Block[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    // [POS_INFO] block
    if (trimmed === '[POS_INFO]') {
      const rows: { key: string; value: string }[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== '[/POS_INFO]') {
        const row = lines[i].trim();
        if (row) {
          const idx = row.indexOf(':');
          if (idx > 0) {
            rows.push({ key: row.slice(0, idx).trim(), value: row.slice(idx + 1).trim() });
          }
        }
        i++;
      }
      i++; // skip [/POS_INFO]
      if (rows.length > 0) blocks.push({ type: 'info', rows });
      continue;
    }

    // ## H2
    if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'h2', text: trimmed.slice(3).trim() });
      i++;
      continue;
    }

    // ### H3
    if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'h3', text: trimmed.slice(4).trim() });
      i++;
      continue;
    }

    // > Callout
    if (trimmed.startsWith('> ')) {
      blocks.push({ type: 'callout', text: trimmed.slice(2).trim() });
      i++;
      continue;
    }

    // - Bullet (collect consecutive bullets into one list)
    if (trimmed.startsWith('- ')) {
      const items: string[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t.startsWith('- ')) {
          items.push(t.slice(2).trim());
          i++;
        } else if (!t) {
          // peek next non-empty line — if it's a bullet, continue list
          let j = i + 1;
          while (j < lines.length && !lines[j].trim()) j++;
          if (j < lines.length && lines[j].trim().startsWith('- ')) {
            i = j;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      if (items.length > 0) blocks.push({ type: 'bullets', items });
      continue;
    }

    // Paragraph
    blocks.push({ type: 'p', text: trimmed });
    i++;
  }

  // ── Inline formatter — handles **bold** and *italic* ────────────────
  const renderInline = (s: string): React.ReactNode => {
    const out: React.ReactNode[] = [];
    // Tokenize: **bold** or *italic* or plain
    const regex = /(\*\*[^*]+\*\*|\*[^*]+\*)/g;
    const parts = s.split(regex);
    parts.forEach((p, idx) => {
      if (!p) return;
      if (p.startsWith('**') && p.endsWith('**')) {
        out.push(<strong key={idx} className="font-bold text-whg-snow">{p.slice(2, -2)}</strong>);
      } else if (p.startsWith('*') && p.endsWith('*')) {
        out.push(<em key={idx} className="italic">{p.slice(1, -1)}</em>);
      } else {
        out.push(p);
      }
    });
    return out;
  };

  // ── Render blocks ───────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {blocks.map((b, idx) => {
        switch (b.type) {
          case 'info':
            return (
              <div key={idx} className="bg-whg-card2 border border-whg-line rounded-xl p-3 space-y-1.5">
                {b.rows.map((r, i2) => (
                  <div key={i2} className="flex gap-3 items-baseline">
                    <span className="text-[10px] font-bold text-whg-dim uppercase tracking-widest w-[88px] flex-shrink-0">
                      {r.key}
                    </span>
                    <span className="text-xs text-whg-snow/90 flex-1">{r.value}</span>
                  </div>
                ))}
              </div>
            );
          case 'h2':
            return (
              <h3 key={idx} className="text-sm font-bold uppercase tracking-widest text-whg-snow pt-3 pb-1 border-b border-whg-line">
                {b.text}
              </h3>
            );
          case 'h3':
            return (
              <h4 key={idx} className="text-sm font-bold text-whg-snow pt-2">
                {b.text}
              </h4>
            );
          case 'callout':
            return (
              <div key={idx} className="bg-amber-400/10 border-l-4 border-amber-400 px-3 py-2 rounded-r-md">
                <p className="text-xs italic text-amber-200 leading-relaxed">
                  <strong className="not-italic">Standard:</strong>{' '}
                  {renderInline(b.text.replace(/^Standard:\s*/i, ''))}
                </p>
              </div>
            );
          case 'bullets':
            return (
              <ul key={idx} className="space-y-1.5 pl-1">
                {b.items.map((it, i2) => (
                  <li key={i2} className="flex items-start gap-2 text-sm text-whg-snow/90 leading-relaxed">
                    <span className="text-whg-dim flex-shrink-0 mt-0.5">•</span>
                    <span>{renderInline(it)}</span>
                  </li>
                ))}
              </ul>
            );
          case 'p':
            return (
              <p key={idx} className="text-sm text-whg-snow/90 leading-relaxed">
                {renderInline(b.text)}
              </p>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

/* ───────── Know Your Pay (collapsible educational card) ─────────
 * Shown at the top of the Positions tab. Educates staff on:
 *   • Federal minimum wage ($7.25)
 *   • Louisiana has no state minimum (federal applies)
 *   • Tipped minimum is $2.13 cash + tips, with workweek averaging
 *   • WHG pays at or above these minimums
 *
 * Collapsed by default to avoid putting wage law front-and-center
 * over role descriptions. Bilingual EN/ES.
 */
function KnowYourPayCard({ language }: { language: 'en' | 'es' }) {
  const [open, setOpen] = useState(false);
  const isES = language === 'es';

  return (
    <div className="bg-whg-card border border-whg-line rounded-2xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="tap-highlight w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-white/5 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0 text-left">
          <span className="text-xl flex-shrink-0">💡</span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-whg-snow">
              {isES ? 'Conoce Tu Pago' : 'Know Your Pay'}
            </div>
            <div className="text-[11px] text-whg-dim truncate">
              {isES
                ? 'Cómo funcionan los salarios mínimos en Louisiana.'
                : 'How minimum wage works in Louisiana.'}
            </div>
          </div>
        </div>
        <span className={`text-whg-dim/70 text-base flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>
          ⌄
        </span>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-whg-line">
          {/* Standard minimum */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-whg-dim">
                {isES ? 'Salario Mínimo Estándar' : 'Standard Minimum Wage'}
              </h4>
              <span className="text-xl font-bold text-whg-snow">$7.25/hr</span>
            </div>
            <p className="text-xs text-whg-dim leading-relaxed">
              {isES
                ? 'Louisiana no tiene un salario mínimo estatal, por lo que se aplica el mínimo federal de $7.25 por hora.'
                : 'Louisiana has no state minimum wage, so the federal minimum of $7.25/hr applies.'}
            </p>
          </div>

          {/* Tipped minimum */}
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-3">
            <div className="flex items-baseline justify-between mb-1">
              <h4 className="text-xs font-bold uppercase tracking-widest text-amber-300">
                {isES ? 'Mínimo Para Empleados Con Propinas' : 'Tipped Minimum'}
              </h4>
              <span className="text-xl font-bold text-amber-200">$2.13/hr</span>
            </div>
            <p className="text-xs text-amber-200 leading-relaxed">
              {isES
                ? 'Si recibes propinas (servidor, bartender, etc.), tu salario base es $2.13/hr, y tus propinas hacen el resto. Por ley, tu salario base + propinas debe promediar al menos $7.25/hr cada semana laboral. Si una semana tus propinas no llegan, el restaurante cubre la diferencia.'
                : 'If you receive tips (server, bartender, etc.), your cash wage is $2.13/hr and your tips make up the rest. By law, your cash wage + tips must average at least $7.25/hr each workweek. If a workweek’s tips fall short, the restaurant makes up the difference.'}
            </p>
          </div>

          {/* WHG promise */}
          <div className="bg-whg-card2 border border-whg-line rounded-xl p-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-whg-snow mb-1">
              {isES ? 'Nuestra Promesa' : 'Our Promise'}
            </h4>
            <p className="text-xs text-whg-snow/90 leading-relaxed">
              {isES
                ? 'WHG paga en o por encima de estos mínimos. Si alguna vez tienes preguntas sobre tu pago, habla con tu gerente o pide ver tus reportes de propinas y horas.'
                : 'WHG pays at or above these minimums. If you ever have questions about your pay, talk to your manager or ask to see your tip and hours reports.'}
            </p>
          </div>

          <p className="text-[10px] text-whg-dim/70 italic text-center">
            {isES
              ? 'Información general. Para preguntas específicas, habla con tu gerente.'
              : 'General reference. For specific questions, talk to your manager.'}
          </p>
        </div>
      )}
    </div>
  );
}
