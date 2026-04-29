'use client';

import { useEffect, useState } from 'react';

interface NewHire {
  id: string;
  full_name: string;
  role: string;
  restaurant_name: string | null;
  days_since: number;
}

interface Props {
  language: 'en' | 'es';
}

/**
 * "Welcome to the team" section. Top of the home tab.
 *
 * Layout:
 *   - Newest hire = SPOTLIGHT card (big, bold, gradient, confetti)
 *   - Additional hires within 30 days = compact cards below
 *
 * Auto-hides if no one is in the last 30 days. Server-side cutoff also
 * protects against the initial bulk import flooding the screen.
 */
export default function NewHiresSection({ language }: Props) {
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [loading, setLoading] = useState(true);
  const isES = language === 'es';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/new-hires', { cache: 'no-store' });
        if (!r.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const d = await r.json();
        if (!cancelled) setNewHires(d.new_hires || []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || newHires.length === 0) return null;

  const dayLabel = (d: number) => {
    if (d === 0) return isES ? 'comenzó hoy' : 'started today';
    if (d === 1) return isES ? 'comenzó ayer' : 'started yesterday';
    return isES ? `hace ${d} días` : `${d} days ago`;
  };

  const initials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  const firstName = (name: string) => name.split(' ')[0];

  // Newest = first in array (API sorts created_at DESC)
  const featured = newHires[0];
  const others = newHires.slice(1);

  return (
    <section>
      {/* ── SPOTLIGHT: newest hire ────────────────────────────────────────── */}
      <div className="rounded-3xl bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-300 p-[3px] shadow-xl shadow-amber-300/40">
        <div className="rounded-[22px] bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 px-6 py-7 relative overflow-hidden">
          {/* Decorative confetti corners */}
          <div className="absolute -top-2 -left-2 text-2xl opacity-60 select-none" aria-hidden>🎊</div>
          <div className="absolute -top-2 -right-2 text-2xl opacity-60 select-none" aria-hidden>✨</div>
          <div className="absolute -bottom-2 -left-2 text-2xl opacity-50 select-none" aria-hidden>🎉</div>
          <div className="absolute -bottom-2 -right-2 text-2xl opacity-50 select-none" aria-hidden>🌟</div>

          {/* Banner label */}
          <p className="text-[10px] font-extrabold text-amber-700 uppercase tracking-[0.25em] text-center mb-3">
            🎉 {isES ? 'Nuevo en la Familia WHG' : 'New to the WHG Family'} 🎉
          </p>

          {/* Big avatar */}
          <div className="flex justify-center mb-3">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white">
              <span className="text-white text-2xl font-extrabold tracking-wide">
                {initials(featured.full_name)}
              </span>
            </div>
          </div>

          {/* Big welcome heading */}
          <h3 className="text-2xl md:text-3xl font-extrabold text-amber-900 text-center leading-tight">
            {isES
              ? `¡Bienvenido(a), ${firstName(featured.full_name)}!`
              : `Welcome, ${firstName(featured.full_name)}!`}
          </h3>

          {/* Full name (smaller) */}
          <p className="text-center text-sm text-amber-800 mt-1 font-semibold">
            {featured.full_name}
          </p>

          {/* Restaurant + days */}
          <p className="text-center text-xs text-amber-700 mt-2">
            {isES ? 'Se unió al equipo de ' : 'Joined the '}
            <span className="font-bold">{featured.restaurant_name || ''}</span>
            {isES ? ' team — ' : ' team — '}
            {dayLabel(featured.days_since)}
          </p>

          {/* Action prompt */}
          <div className="mt-4 pt-3 border-t border-amber-300/50">
            <p className="text-center text-xs text-amber-800 italic">
              🤝 {isES
                ? 'Salúdalo(a) cuando lo veas — muéstrale cómo lo hacemos.'
                : 'Say hi when you see them — show them the ropes.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Additional new hires (compact) ────────────────────────────────── */}
      {others.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold text-amber-700/70 uppercase tracking-widest mb-2 ml-1">
            {isES ? 'También nuevos este mes' : 'Also new this month'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {others.map((h) => (
              <div
                key={h.id}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-xl px-3 py-2.5 flex items-center gap-3 shadow-sm"
              >
                <div className="w-9 h-9 bg-amber-400/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 font-bold text-xs">
                    {initials(h.full_name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-amber-900 text-sm truncate">
                    {h.full_name}
                  </p>
                  <p className="text-[11px] text-amber-700 truncate">
                    {h.restaurant_name || ''}
                    {h.restaurant_name ? ' · ' : ''}
                    {dayLabel(h.days_since)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
