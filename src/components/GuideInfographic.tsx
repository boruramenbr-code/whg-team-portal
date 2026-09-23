'use client';

import type { CSSProperties, ReactNode } from 'react';
import { GuideIcon } from './GuideCover';

/* ───────── Quick Guide infographics ─────────
 *
 * Drawn from data, not uploaded (Sept 2026). Each card stores the shape
 * of its point — a key number, escalation steps, a process, time windows,
 * do/don't, a checklist, a side-by-side, a pay calendar — and the app
 * draws it in the topic's accent color with the same icon set as the
 * covers. Bilingual by construction: any text can be { en, es }. When a
 * policy changes, edit a number, not an image.
 */

export type Txt = string | { en: string; es?: string | null };

type Footer = { text: Txt; icon?: string; tone?: 'warn' | 'info' };

/** Shared by every shape: one line of reason, one line of real-shift example. */
type Context = { why?: Txt; example?: Txt };

export type Infographic = Context & (
  | { type: 'stat'; value: string; unit?: Txt; label: Txt; sub?: Txt; icon?: string; segments?: number; footer?: Footer }
  | { type: 'steps'; tone?: 'process' | 'escalation'; steps: { title: Txt; sub?: Txt }[]; note?: Txt }
  | { type: 'dodont'; do: Txt[]; dont: Txt[]; doLabel?: Txt; dontLabel?: Txt; note?: Txt }
  | { type: 'checklist'; items: Txt[]; badge?: Txt; note?: Txt }
  | { type: 'day'; from: string; to: string; blocks: { start: string; end: string }[]; blockLabel: Txt; openLabel?: Txt }
  | { type: 'compare'; left: CompareSide; right: CompareSide }
  | { type: 'periods'; periods: { range: Txt; pay: Txt }[]; note?: Txt }
  | { type: 'icon'; icon: string; phrase: Txt; sub?: Txt }
);

type CompareSide = { title: Txt; icon?: string; lines: Txt[] };

const JADE = '#5FB49C';
const VERMILION = '#E0694A';
/** Severity ramp for escalation steps — the last step always reads as the most serious. */
const RAMP = ['#93A3BC', '#D9A94E', '#E0694A', '#D64545'];

interface Props {
  data: Infographic;
  accent: string;
  isES: boolean;
}

export default function GuideInfographic({ data, accent, isES }: Props) {
  const t = (v: Txt | undefined | null) =>
    v == null ? '' : typeof v === 'string' ? v : (isES && v.es) || v.en;

  let body: ReactNode = null;
  switch (data.type) {
    case 'stat': body = <Stat d={data} t={t} accent={accent} />; break;
    case 'steps': body = <Steps d={data} t={t} accent={accent} />; break;
    case 'dodont': body = <DoDont d={data} t={t} isES={isES} />; break;
    case 'checklist': body = <Checklist d={data} t={t} accent={accent} />; break;
    case 'day': body = <Day d={data} t={t} accent={accent} />; break;
    case 'compare': body = <Compare d={data} t={t} accent={accent} />; break;
    case 'periods': body = <Periods d={data} t={t} accent={accent} isES={isES} />; break;
    case 'icon': body = <IconCard d={data} t={t} accent={accent} />; break;
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-whg-line p-5 md:p-6"
      style={{
        background: `radial-gradient(110% 90% at 92% 0%, ${accent}24 0%, transparent 55%), linear-gradient(160deg, #1A2944 0%, #0F1928 100%)`,
      }}
    >
      <div
        className="absolute top-0 inset-x-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        aria-hidden
      />
      {body}
      {(data.why || data.example) && (
        <div className="mt-5 pt-4 border-t border-white/10 space-y-3">
          {data.why && <ContextRow icon="bulb" label={isES ? 'Por qué importa' : 'Why it matters'} text={t(data.why)} color={accent} />}
          {data.example && <ContextRow icon="pin" label={isES ? 'Ejemplo' : 'Example'} text={t(data.example)} color={accent} />}
        </div>
      )}
    </div>
  );
}

type T = (v: Txt | undefined | null) => string;

/* ── The context strip — same place on every card ── */
function ContextRow({ icon, label, text, color }: { icon: string; label: string; text: string; color: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <GuideIcon icon={icon} className="w-[18px] h-[18px] mt-0.5 flex-shrink-0" style={{ color }} strokeWidth={1.7} />
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>{label}</p>
        <p className="text-sm md:text-[15px] text-whg-snow/85 leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  );
}

/* ── Medallion: icon in a soft ring, the same motif as the covers ── */
function Medallion({ icon, color, size = 'md' }: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const box = size === 'lg' ? 'w-16 h-16' : size === 'sm' ? 'w-9 h-9' : 'w-12 h-12';
  const glyph = size === 'lg' ? 'w-8 h-8' : size === 'sm' ? 'w-[18px] h-[18px]' : 'w-6 h-6';
  return (
    <div
      className={`${box} flex-shrink-0 rounded-full flex items-center justify-center`}
      style={{ border: `1px solid ${color}73`, background: `${color}17`, boxShadow: `0 0 22px ${color}26` }}
    >
      <GuideIcon icon={icon} className={glyph} style={{ color }} strokeWidth={1.5} />
    </div>
  );
}

function Note({ text, tone = 'info', icon }: { text: string; tone?: 'warn' | 'info'; icon?: string }) {
  if (!text) return null;
  const color = tone === 'warn' ? VERMILION : '#93A3BC';
  return (
    <div
      className="mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px] leading-snug"
      style={{ background: `${color}14`, border: `1px solid ${color}33`, color: tone === 'warn' ? '#F4B7A6' : '#C3CEDD' }}
    >
      <GuideIcon icon={icon || (tone === 'warn' ? 'alert' : 'bulb')} className="w-4 h-4 mt-px flex-shrink-0" style={{ color }} />
      <span>{text}</span>
    </div>
  );
}

/* ── 1. A key number ── */
function Stat({ d, t, accent }: { d: Extract<Infographic, { type: 'stat' }>; t: T; accent: string }) {
  const number = (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[64px] md:text-[76px] font-extralight leading-[0.85] tabular-nums" style={{ color: accent }}>
        {d.value}
      </span>
      {d.unit && <span className="text-lg md:text-xl font-semibold text-whg-snow/80">{t(d.unit)}</span>}
    </div>
  );
  return (
    <div>
      <div className="flex items-center gap-4">
        {d.segments ? <SegmentRing count={d.segments} accent={accent} value={d.value} unit={t(d.unit)} /> : (
          <div className="flex-1 min-w-0">{number}</div>
        )}
        {d.segments ? (
          <div className="flex-1 min-w-0">
            <p className="text-lg md:text-xl font-bold text-whg-snow leading-snug">{t(d.label)}</p>
          </div>
        ) : d.icon ? <Medallion icon={d.icon} color={accent} size="lg" /> : null}
      </div>
      {!d.segments && <p className="mt-3 text-lg md:text-xl font-bold text-whg-snow leading-snug">{t(d.label)}</p>}
      {d.sub && <p className="mt-1.5 text-sm md:text-[15px] text-whg-dim leading-relaxed">{t(d.sub)}</p>}
      {d.footer && <Note text={t(d.footer.text)} tone={d.footer.tone} icon={d.footer.icon} />}
    </div>
  );
}

/** A ring of N segments around the number — "12 clean months", one arc per month. */
function SegmentRing({ count, accent, value, unit }: { count: number; accent: string; value: string; unit: string }) {
  const r = 44, c = 52, gap = 10;
  const per = 360 / count;
  const arc = (i: number) => {
    const a0 = ((i * per + gap / 2 - 90) * Math.PI) / 180;
    const a1 = (((i + 1) * per - gap / 2 - 90) * Math.PI) / 180;
    return `M ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`;
  };
  return (
    <div className="relative w-[112px] h-[112px] flex-shrink-0">
      <svg viewBox="0 0 104 104" className="absolute inset-0 w-full h-full" aria-hidden>
        {Array.from({ length: count }, (_, i) => (
          <path key={i} d={arc(i)} fill="none" stroke={accent} strokeWidth="7" strokeLinecap="butt"
            style={{ opacity: 0.35 + (0.65 * (i + 1)) / count }} />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[34px] font-extralight leading-none tabular-nums" style={{ color: accent }}>{value}</span>
        {unit && <span className="text-[10px] font-bold uppercase tracking-widest text-whg-snow/70 mt-1">{unit}</span>}
      </div>
    </div>
  );
}

/* ── 2. Steps: a process, or an escalation that gets more serious ── */
function Steps({ d, t, accent }: { d: Extract<Infographic, { type: 'steps' }>; t: T; accent: string }) {
  const n = d.steps.length;
  const colorAt = (i: number) =>
    d.tone === 'escalation' ? RAMP[Math.min(RAMP.length - 1, RAMP.length - n + i)] : accent;
  return (
    <div>
      <ol className="relative">
        {d.steps.map((s, i) => {
          const color = colorAt(i);
          const last = i === n - 1;
          return (
            <li key={i} className="relative flex gap-3.5 pb-4 last:pb-0">
              {!last && (
                <span
                  className="absolute left-[17px] top-9 bottom-0 w-px"
                  style={{ background: `linear-gradient(${color}80, ${colorAt(i + 1)}80)` }}
                  aria-hidden
                />
              )}
              <span
                className="relative z-10 w-[35px] h-[35px] flex-shrink-0 rounded-full flex items-center justify-center text-sm font-bold tabular-nums"
                style={{ border: `1.5px solid ${color}`, background: `${color}1F`, color }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-1">
                <p className="text-[15px] md:text-base font-bold text-whg-snow leading-snug">{t(s.title)}</p>
                {s.sub && <p className="text-[13px] md:text-sm text-whg-dim leading-snug mt-0.5">{t(s.sub)}</p>}
              </div>
            </li>
          );
        })}
      </ol>
      {d.note && <Note text={t(d.note)} />}
    </div>
  );
}

/* ── 3. Do / Don't ── */
function DoDont({ d, t, isES }: { d: Extract<Infographic, { type: 'dodont' }>; t: T; isES: boolean }) {
  const col = (label: string, items: Txt[], color: string, icon: string) => (
    <div className="rounded-xl p-3.5" style={{ background: `${color}1A`, border: `1px solid ${color}4D` }}>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color }}>
        <GuideIcon icon={icon} className="w-4 h-4" strokeWidth={2} /> {label}
      </p>
      <ul className="space-y-2">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-whg-snow/90 leading-snug">
            <span className="mt-[7px] w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span>{t(it)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        {col(t(d.doLabel) || (isES ? 'Sí' : 'Do'), d.do, JADE, 'check')}
        {col(t(d.dontLabel) || (isES ? 'No' : "Don't"), d.dont, VERMILION, 'x')}
      </div>
      {d.note && <Note text={t(d.note)} />}
    </div>
  );
}

/* ── 4. Checklist ── */
function Checklist({ d, t, accent }: { d: Extract<Infographic, { type: 'checklist' }>; t: T; accent: string }) {
  return (
    <div>
      {d.badge && (
        <span
          className="inline-block mb-3 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ color: accent, background: `${accent}1A`, border: `1px solid ${accent}40` }}
        >
          {t(d.badge)}
        </span>
      )}
      <ul className="space-y-2.5">
        {d.items.map((it, i) => (
          <li key={i} className="flex items-center gap-3">
            <span
              className="w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center"
              style={{ background: `${accent}1F`, border: `1px solid ${accent}66` }}
            >
              <GuideIcon icon="check" className="w-4 h-4" style={{ color: accent }} strokeWidth={2.2} />
            </span>
            <span className="text-[15px] font-semibold text-whg-snow leading-snug">{t(it)}</span>
          </li>
        ))}
      </ul>
      {d.note && <Note text={t(d.note)} />}
    </div>
  );
}

/* ── 5. Time windows across the day ── */
const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
};
const clock = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  const h12 = ((h + 11) % 12) + 1;
  return `${h12}${m ? `:${String(m).padStart(2, '0')}` : ''}${h < 12 ? 'a' : 'p'}`;
};

function Day({ d, t, accent }: { d: Extract<Infographic, { type: 'day' }>; t: T; accent: string }) {
  const start = toMin(d.from), end = toMin(d.to), span = end - start;
  const pct = (hhmm: string) => ((toMin(hhmm) - start) / span) * 100;
  const hours: number[] = [];
  for (let m = Math.ceil(start / 120) * 120; m <= end; m += 120) hours.push(m);
  const hatch: CSSProperties = {
    background: `repeating-linear-gradient(135deg, ${VERMILION}CC 0 6px, ${VERMILION}8C 6px 12px)`,
  };
  return (
    <div>
      <div className="relative h-12 rounded-xl overflow-hidden" style={{ background: `${accent}1A`, border: `1px solid ${accent}40` }}>
        {d.blocks.map((b, i) => (
          <div
            key={i}
            className="absolute top-0 bottom-0 flex items-center justify-center"
            style={{ left: `${pct(b.start)}%`, width: `${pct(b.end) - pct(b.start)}%`, ...hatch }}
          >
            <GuideIcon icon="x" className="w-4 h-4 text-white/90" strokeWidth={2.4} />
          </div>
        ))}
      </div>
      {/* Hour ticks */}
      <div className="relative h-5 mt-1.5">
        {hours.map((m) => {
          const hh = `${Math.floor(m / 60)}:00`;
          return (
            <span
              key={m}
              className="absolute -translate-x-1/2 text-[10px] font-semibold text-whg-dim tabular-nums"
              style={{ left: `${((m - start) / span) * 100}%` }}
            >
              {clock(hh)}
            </span>
          );
        })}
      </div>
      {/* The windows, spelled out */}
      <div className="mt-3 flex flex-wrap gap-2">
        {d.blocks.map((b, i) => (
          <span
            key={i}
            className="text-sm font-bold tabular-nums px-3 py-1.5 rounded-lg"
            style={{ color: '#F4B7A6', background: `${VERMILION}1F`, border: `1px solid ${VERMILION}4D` }}
          >
            {clock(b.start)} – {clock(b.end)}
          </span>
        ))}
      </div>
      <p className="mt-3 text-[15px] font-bold text-whg-snow leading-snug">{t(d.blockLabel)}</p>
      {d.openLabel && <p className="mt-1 text-sm text-whg-dim leading-snug">{t(d.openLabel)}</p>}
    </div>
  );
}

/* ── 6. Side by side ── */
function Compare({ d, t, accent }: { d: Extract<Infographic, { type: 'compare' }>; t: T; accent: string }) {
  const side = (s: CompareSide) => (
    <div className="rounded-xl p-4" style={{ background: `${accent}10`, border: `1px solid ${accent}33` }}>
      <div className="flex items-center gap-2.5 mb-2.5">
        {s.icon && <Medallion icon={s.icon} color={accent} size="sm" />}
        <p className="text-[15px] font-bold text-whg-snow leading-snug">{t(s.title)}</p>
      </div>
      <ul className="space-y-1.5">
        {s.lines.map((l, i) => (
          <li key={i} className="text-sm text-whg-snow/85 leading-snug">{t(l)}</li>
        ))}
      </ul>
    </div>
  );
  return <div className="grid gap-3 sm:grid-cols-2">{side(d.left)}{side(d.right)}</div>;
}

/* ── 7. Pay periods → paydays ── */
function Periods({ d, t, accent, isES }: { d: Extract<Infographic, { type: 'periods' }>; t: T; accent: string; isES: boolean }) {
  return (
    <div>
      <div className="space-y-3">
        {d.periods.map((p, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="flex-1 min-w-0 rounded-xl px-3.5 py-3" style={{ background: `${accent}14`, border: `1px solid ${accent}38` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim">{isES ? 'Trabajas' : 'Worked'}</p>
              <p className="text-[15px] font-bold text-whg-snow tabular-nums leading-snug">{t(p.range)}</p>
            </div>
            <GuideIcon icon="arrow" className="w-5 h-5 flex-shrink-0" style={{ color: accent }} strokeWidth={2} />
            <div className="flex-1 min-w-0 rounded-xl px-3.5 py-3" style={{ background: `${accent}2E`, border: `1px solid ${accent}73` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: accent }}>{isES ? 'Te pagan' : 'Paid'}</p>
              <p className="text-[15px] font-bold text-whg-snow tabular-nums leading-snug">{t(p.pay)}</p>
            </div>
          </div>
        ))}
      </div>
      {d.note && <Note text={t(d.note)} />}
    </div>
  );
}

/* ── 8. One idea, one icon ── */
function IconCard({ d, t, accent }: { d: Extract<Infographic, { type: 'icon' }>; t: T; accent: string }) {
  return (
    <div className="flex flex-col items-center text-center py-2">
      <Medallion icon={d.icon} color={accent} size="lg" />
      <p className="mt-4 text-xl md:text-2xl font-bold text-whg-snow leading-snug">{t(d.phrase)}</p>
      {d.sub && <p className="mt-1.5 text-sm md:text-[15px] text-whg-dim leading-relaxed max-w-md">{t(d.sub)}</p>}
    </div>
  );
}
