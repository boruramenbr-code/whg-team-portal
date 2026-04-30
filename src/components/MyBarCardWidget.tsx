'use client';

import { useEffect, useState } from 'react';

type Status = 'missing' | 'expired' | 'critical' | 'expiring' | 'valid' | 'not_required';

interface BarCardResponse {
  requires: boolean;
  status: Status;
  card: { expiration_date: string; image_url: string } | null;
  days_until: number | null;
}

interface Props {
  language: 'en' | 'es';
}

/**
 * Personal bar card widget on the home tab.
 *
 * Visibility rules — only renders when actionable:
 *   - missing  (no card on file but role requires one)
 *   - expired
 *   - critical (≤7 days left)
 *   - expiring (8-30 days left)
 *
 * Hidden when card is valid >30 days out, or when bar card not required.
 */
export default function MyBarCardWidget({ language }: Props) {
  const [data, setData] = useState<BarCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const isES = language === 'es';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/my-bar-card', { cache: 'no-store' });
        if (!r.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const d: BarCardResponse = await r.json();
        if (!cancelled) setData(d);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !data || !data.requires || data.status === 'not_required' || data.status === 'valid') {
    return null;
  }

  const { status, days_until, card } = data;

  // Style + copy per status
  const config = (() => {
    switch (status) {
      case 'missing':
        return {
          emoji: '🆕',
          bg: 'from-orange-50 to-amber-50',
          border: 'border-orange-300',
          accent: 'bg-orange-500',
          textTitle: 'text-orange-900',
          textBody: 'text-orange-800',
          title: isES ? 'Acción requerida: envía tu Bar Card' : 'Action needed: submit your bar card',
          body: isES
            ? 'Tu rol requiere una bar card vigente. Lleva la tuya a tu gerente para que la suba.'
            : 'Your role requires an active bar card. Bring yours to your manager so they can upload it.',
        };
      case 'expired':
        return {
          emoji: '❌',
          bg: 'from-red-50 to-rose-50',
          border: 'border-red-400',
          accent: 'bg-red-600',
          textTitle: 'text-red-900',
          textBody: 'text-red-800',
          title: isES
            ? `Tu bar card venció hace ${Math.abs(days_until ?? 0)} día${Math.abs(days_until ?? 0) === 1 ? '' : 's'}`
            : `Bar card expired ${Math.abs(days_until ?? 0)} day${Math.abs(days_until ?? 0) === 1 ? '' : 's'} ago`,
          body: isES
            ? 'No puedes servir alcohol hasta renovarla. Renuévala lo antes posible y entrégasela a tu gerente.'
            : 'You can\'t serve alcohol until you renew. Get a new card and give it to your manager ASAP.',
        };
      case 'critical':
        return {
          emoji: '🚨',
          bg: 'from-red-50 to-rose-50',
          border: 'border-red-400',
          accent: 'bg-red-600',
          textTitle: 'text-red-900',
          textBody: 'text-red-800',
          title: isES
            ? `Tu bar card vence en ${days_until} día${days_until === 1 ? '' : 's'}`
            : `Bar card expires in ${days_until} day${days_until === 1 ? '' : 's'}`,
          body: isES
            ? 'Renuévala YA. No esperes — toma menos tiempo del que crees.'
            : 'Renew NOW. Don\'t wait — it takes less time than you think.',
        };
      case 'expiring':
        return {
          emoji: '⚠️',
          bg: 'from-amber-50 to-yellow-50',
          border: 'border-amber-400',
          accent: 'bg-amber-500',
          textTitle: 'text-amber-900',
          textBody: 'text-amber-800',
          title: isES
            ? `Renueva tu bar card pronto — vence en ${days_until} días`
            : `Renew your bar card soon — expires in ${days_until} days`,
          body: isES
            ? 'Inicia la renovación esta semana para evitar problemas en el trabajo.'
            : 'Start your renewal this week to avoid issues at work.',
        };
      default:
        return null;
    }
  })();

  if (!config) return null;

  const formatExpDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString(isES ? 'es-MX' : undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <section>
      <div
        className={`relative bg-gradient-to-r ${config.bg} border-l-4 ${config.border} rounded-2xl px-5 py-4 shadow-sm overflow-hidden`}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5" aria-hidden>{config.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${config.textBody}`}>
              {isES ? 'Bar Card' : 'Your Bar Card'}
            </p>
            <p className={`text-sm font-bold leading-tight ${config.textTitle}`}>
              {config.title}
            </p>
            <p className={`text-xs mt-1.5 leading-relaxed ${config.textBody}`}>
              {config.body}
            </p>
            {card && (
              <p className={`text-[11px] mt-2 ${config.textBody} opacity-75`}>
                {isES ? 'Vence: ' : 'Expires: '}
                <span className="font-semibold">{formatExpDate(card.expiration_date)}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
