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
 * "Welcome our newest teammates" section. Renders staff who joined in the
 * last 14 days. Auto-hides when there are no new hires.
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
    return isES ? `${d} días en el equipo` : `${d} days in`;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <span className="text-base">🎉</span>
          {isES ? 'Bienvenidos al equipo' : 'Welcome to the team'}
        </h2>
      </div>

      <div className="space-y-2">
        {newHires.map((h) => (
          <div
            key={h.id}
            className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm"
          >
            <div className="w-10 h-10 bg-amber-400/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-amber-700 font-bold text-sm">
                {h.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">
                {h.full_name}
              </p>
              <p className="text-[11px] text-amber-700">
                {h.restaurant_name || ''}
                {h.restaurant_name ? ' · ' : ''}
                {dayLabel(h.days_since)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
