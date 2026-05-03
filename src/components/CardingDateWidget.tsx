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
        <div className="flex items-start justify-between gap-3">
          {/* Left: cutoff date display */}
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-widest text-white/70 mb-2 font-semibold">
              {isES ? 'Debe haber nacido en o antes de' : 'Must be born on or before'}
            </p>
            <div className="text-2xl md:text-3xl font-bold leading-tight">
              {cutoffStr}
            </div>
            <p className="text-[11px] text-white/60 italic mt-1">
              {isES ? `Hoy: ${todayStr}` : `As of today: ${todayStr}`}
            </p>
          </div>

          {/* Right: prohibition / age-restriction sign */}
          <div className="flex-shrink-0" aria-hidden="true">
            <svg
              viewBox="0 0 100 100"
              className="w-20 h-20 md:w-24 md:h-24 drop-shadow-lg"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* White inner circle */}
              <circle cx="50" cy="50" r="42" fill="#ffffff" />
              {/* Red border */}
              <circle cx="50" cy="50" r="42" fill="none" stroke="#DC2626" strokeWidth="9" />
              {/* "21" text */}
              <text
                x="50"
                y="64"
                textAnchor="middle"
                fontSize="36"
                fontWeight="900"
                fill="#1B1B1B"
                fontFamily="system-ui, -apple-system, sans-serif"
              >
                21
              </text>
              {/* Diagonal prohibition slash (top-right to bottom-left) */}
              <line
                x1="22"
                y1="78"
                x2="78"
                y2="22"
                stroke="#DC2626"
                strokeWidth="9"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

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
              'Las IDs de LA para menores de 21 son verticales con texto rojo "Under 21" o "Under 18" junto a la foto.',
              'Si tiene duda, rechace cortésmente o llame a un gerente.',
            ] : [
              'Take the ID in your hand — don’t let them flash it.',
              'Calculate age from the date of birth — don’t trust the expiration.',
              'Compare the photo to the person carefully.',
              'LA under-21 IDs are vertical with red "Under 21" or "Under 18" next to the photo.',
              'When in doubt, refuse politely or get a manager.',
            ]).map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-white/60 flex-shrink-0 leading-tight">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Spot a Fake ID — expandable */}
        <FakeIdSection language={language} />
      </div>
    </div>
  );
}

/* ───────── Spot a Fake ID (collapsible inside CardingDateWidget) ─────────
 * Quick checks only — keeps it scannable. External links at the bottom
 * for staff who want to learn more on their own time.
 */
function FakeIdSection({ language }: { language: 'en' | 'es' }) {
  const [open, setOpen] = useState(false);
  const isES = language === 'es';

  const bullets = isES ? [
    'Sienta la fecha de nacimiento y la firma — las IDs reales tienen relieve.',
    'Los bordes deben ser lisos y sellados — si se despegan, es falsa.',
    'Incline la tarjeta — el sello holográfico debe cambiar de color.',
    'Busque la estrella dorada REAL ID (requerida desde mayo 2025).',
    'Cuidado con comportamiento nervioso o múltiples IDs presentadas.',
    'Si sospecha, rechace cortésmente y llame al gerente. No discuta.',
  ] : [
    'Feel the DOB and signature — real IDs have raised, tactile features.',
    'Edges should be smooth and sealed — peeling = fake.',
    'Tilt the card — the holographic seal should shift color.',
    'Look for the gold REAL ID star (required since May 2025).',
    'Watch for nervous behavior or multiple IDs being shown.',
    'If you suspect a fake — refuse politely, call a manager. Don’t argue.',
  ];

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl mt-3 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="tap-highlight w-full flex items-center justify-between gap-2 px-3 py-2.5 hover:bg-white/5 transition-colors"
        aria-expanded={open}
      >
        <span className="text-[11px] font-bold uppercase tracking-widest text-white/85 flex items-center gap-1.5">
          <span>🔍</span>
          {isES ? 'Detectar una ID Falsa' : 'Spot a Fake ID'}
        </span>
        <span className={`text-white/60 text-base transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-white/10">
          <ul className="space-y-1.5 text-xs leading-relaxed pt-2">
            {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-white/60 flex-shrink-0 leading-tight">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {/* External links */}
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-widest text-white/60 font-semibold mb-1.5">
              {isES ? '¿Quiere aprender más?' : 'Want to learn more?'}
            </p>
            <div className="space-y-1">
              <a
                href="https://atc.louisiana.gov/resources/vertical-driver-s-license-information/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/95 hover:text-white underline underline-offset-2 flex items-center gap-1.5"
              >
                <span>📘</span>
                <span>{isES ? 'Guía oficial de LA ATC' : 'Official LA ATC guide'}</span>
                <span className="text-[10px] text-white/50">↗</span>
              </a>
              <a
                href="https://www.driverslicenseguide.com/states/check-louisiana-id.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-white/95 hover:text-white underline underline-offset-2 flex items-center gap-1.5"
              >
                <span>🔎</span>
                <span>{isES ? 'Cómo detectar una ID falsa de LA' : 'How to spot a fake LA ID'}</span>
                <span className="text-[10px] text-white/50">↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
