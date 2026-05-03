'use client';

import { useEffect, useState } from 'react';

interface Props {
  language: 'en' | 'es';
}

/**
 * CardingDateWidget — daily age-verification reference for alcohol-serving staff.
 *
 * Computes the cutoff birthdate (today minus 21 years) and shows it prominently
 * so servers/bartenders can card guests at a glance. Auto-updates every page
 * load — always reflects today's cutoff.
 *
 * Only renders for users where profiles.requires_bar_card = true (gated via
 * /api/my-bar-card response). Hidden for kitchen staff, hosts, etc. who don't
 * serve alcohol.
 *
 * Includes the carding-over-40 guidance — the standard liability-protection
 * rule that keeps the restaurant's liquor license safe.
 */
export default function CardingDateWidget({ language }: Props) {
  const [show, setShow] = useState<boolean | null>(null);
  const isES = language === 'es';

  useEffect(() => {
    let cancelled = false;
    fetch('/api/my-bar-card', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        // Show to anyone who serves alcohol (requires_bar_card=true) OR
        // to leadership tier (admin/manager/asst_manager) who oversee the
        // floor and need to see what staff sees + may card guests themselves.
        const isLeadership = ['admin', 'manager', 'assistant_manager'].includes(data?.role || '');
        setShow(!!data?.requires || isLeadership);
      })
      .catch(() => {
        if (!cancelled) setShow(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (!show) return null;

  // Compute cutoff: today's date minus 21 years
  const today = new Date();
  const cutoff = new Date(
    today.getFullYear() - 21,
    today.getMonth(),
    today.getDate()
  );

  const cutoffStr = cutoff.toLocaleDateString(isES ? 'es-US' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const todayStr = today.toLocaleDateString(isES ? 'es-US' : 'en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-gradient-to-br from-[#7A1F2A] via-[#8E2330] to-[#9A2935] rounded-2xl shadow-md text-white overflow-hidden">
      {/* Section banner — frames the card for any staff who see the dashboard */}
      <div className="bg-black/25 px-5 py-2.5 text-center border-b border-white/10">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
          {isES ? 'Antes de Servir Alcohol' : 'Before Serving Alcohol'}
        </h3>
      </div>

      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between gap-2 border-b border-white/15">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪪</span>
          <h2 className="text-sm font-bold uppercase tracking-widest">
            {isES ? 'Verificación de Edad' : 'Age Verification'}
          </h2>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest bg-white/15 px-2 py-1 rounded-full">
          21+
        </span>
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        <p className="text-[11px] uppercase tracking-widest text-white/70 mb-2 font-semibold">
          {isES ? 'Debe haber nacido en o antes de' : 'Must be born on or before'}
        </p>
        <div className="text-2xl md:text-3xl font-bold leading-tight">
          {cutoffStr}
        </div>
        <p className="text-[11px] text-white/60 italic mt-1">
          {isES ? `Hoy: ${todayStr}` : `As of today: ${todayStr}`}
        </p>

        {/* Guidance */}
        <div className="bg-white/12 backdrop-blur-sm rounded-xl p-3 mt-4">
          <p className="text-sm font-bold mb-1.5 flex items-start gap-1.5">
            <span className="flex-shrink-0">⚠️</span>
            <span>
              {isES
                ? 'Pídale identificación a cualquier persona que parezca menor de 40 años.'
                : 'Card anyone who looks under 40.'}
            </span>
          </p>
          <p className="text-xs text-white/85 leading-relaxed">
            {isES
              ? 'Servir a un menor puede costarle al restaurante su licencia de licor, multas grandes, y a usted personalmente. Si tiene duda, pida la ID. Sin excepción.'
              : 'Serving a minor can cost the restaurant its liquor license, large fines, and put you personally on the line. When in doubt, card them. No exceptions.'}
          </p>
        </div>

        {/* Carding checklist */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 mt-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/85 mb-2">
            {isES ? 'Cómo Verificar la ID' : 'How to Card'}
          </p>
          <ul className="space-y-1.5 text-xs leading-relaxed">
            {(isES ? [
              'Tome la ID en su mano — no deje que se la muestren rápido.',
              'Calcule la edad por la fecha de nacimiento — no confíe en la fecha de vencimiento.',
              'Compare la foto con la persona cuidadosamente.',
              'Las IDs de Louisiana para menores de 21 son verticales — bandera roja inmediata.',
              'Si tiene duda, rechace cortésmente o llame a un gerente.',
            ] : [
              'Take the ID in your hand — don’t let them flash it.',
              'Calculate age from the date of birth — don’t trust the expiration.',
              'Compare the photo to the person carefully.',
              'Louisiana under-21 IDs are vertical — instant red flag.',
              'When in doubt, refuse politely or get a manager.',
            ]).map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-white/60 flex-shrink-0 leading-tight">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
