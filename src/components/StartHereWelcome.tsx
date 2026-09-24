'use client';

import { useEffect, useState } from 'react';
import WelcomeVideo from './WelcomeVideo';
import GuideCover, { GuideIcon } from './GuideCover';
import type { GuideSection } from './HandbookGuideTab';
import { STAGE_META, type GuideSummary } from '@/lib/guided-training';

/* ───────── Start Here → Welcome ─────────
 *
 * The first thing a new hire sees in Start Here (Sept 2026): the owner's
 * welcome video, their progress with one Continue button, the first steps
 * (the same steps, in the same order, as the owner's Telegram welcome),
 * their first weeks, their restaurant, their people, the apps they'll use,
 * and the Quick Guide topics to read first.
 */

interface StartHereData {
  first_name: string | null;
  restaurant: { id: string; name: string; slug: string } | null;
  in_training: boolean;
  guided: GuideSummary | null;
  checklist: { sections: { key: string; total: number; done: number }[]; total: number; done: number };
  welcome: { excerpt: string | null; excerpt_es: string | null; video_id: string | null };
  info: Record<string, string | null> | null;
  people: { trainer: { name: string } | null; leaders: { name: string; title: string; photo_url: string | null }[] };
  can_edit: boolean;
}

interface Props {
  language: 'en' | 'es';
  /** Owner's restaurant switcher — view another restaurant's Welcome. */
  restaurantId?: string | null;
  /** Quick Guide topics (already loaded by the dashboard). */
  guideSections: GuideSection[] | null;
  onContinueTraining: () => void;
  onOpenChecklist: () => void;
  onOpenTopic: (sectionId: string) => void;
  onOpenTeam: () => void;
}

const LOGO: Record<string, string> = {
  ichiban: '/logos/ichiban-black.png',
  boru: '/logos/boru-black.png',
  shokudo: '/logos/shokudo-black.png',
};

const SECTION_LABEL: Record<string, { en: string; es: string }> = {
  paperwork: { en: 'Paperwork & setup', es: 'Papeleo y preparación' },
  training: { en: 'Training', es: 'Capacitación' },
  first_week: { en: 'First week', es: 'Primera semana' },
  ongoing: { en: 'First 90 days', es: 'Primeros 90 días' },
};

/** Read first, in this order — the topics a new hire needs before their first shift. */
const FIRST_TOPICS = ['Lates, Call-Outs & Time Off', 'Clocking In & Out', 'Pay & Payroll', 'Your Schedule & Team Apps'];

const I9_URL = 'https://www.uscis.gov/i-9-central/form-i-9-acceptable-documents';

export default function StartHereWelcome({
  language, restaurantId = null, guideSections, onContinueTraining, onOpenChecklist, onOpenTopic, onOpenTeam,
}: Props) {
  const isES = language === 'es';
  const t = (en: string, es: string) => (isES ? es : en);
  const [data, setData] = useState<StartHereData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const url = restaurantId ? `/api/start-here?restaurant_id=${encodeURIComponent(restaurantId)}` : '/api/start-here';
        const r = await fetch(url, { cache: 'no-store' });
        if (!r.ok) throw new Error();
        const j = await r.json();
        if (!cancelled) setData(j);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [restaurantId]);

  if (failed) {
    return (
      <Shell>
        <p className="text-sm text-whg-dim text-center py-12">{t('Couldn’t load this page. Pull down to refresh.', 'No se pudo cargar esta página. Desliza hacia abajo para actualizar.')}</p>
      </Shell>
    );
  }
  if (!data) {
    return (
      <Shell>
        <div className="space-y-4">
          <div className="h-40 rounded-2xl bg-whg-card/60 animate-pulse" />
          <div className="h-56 rounded-2xl bg-whg-card/60 animate-pulse" />
          <div className="h-40 rounded-2xl bg-whg-card/60 animate-pulse" />
        </div>
      </Shell>
    );
  }

  const logo = data.restaurant ? LOGO[data.restaurant.slug] : undefined;
  const excerpt = isES ? data.welcome.excerpt_es || data.welcome.excerpt : data.welcome.excerpt;
  const g = data.guided;
  const pct = g ? g.pct : data.checklist.total ? Math.round((data.checklist.done / data.checklist.total) * 100) : 0;

  // Quick Guide tiles — keep each topic's cover index so its color and icon match the Quick Guide.
  const allTopics = (guideSections ?? []).filter((s) => s.cards.length > 0);
  const firstTopics = FIRST_TOPICS
    .map((title) => allTopics.find((s) => s.title === title))
    .filter((s): s is GuideSection => !!s);

  return (
    <Shell>
      {/* ── 1. Welcome ── */}
      <section className="rounded-2xl bg-whg-card border border-whg-line overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="flex items-center gap-3">
            {logo && (
              <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white flex items-center justify-center p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" className="max-w-full max-h-full object-contain" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-whg-gold">{t('Start here', 'Empieza aquí')}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-whg-snow leading-tight">
                {data.restaurant
                  ? t(`Welcome to ${data.restaurant.name}${data.first_name ? `, ${data.first_name}` : ''}`, `Te damos la bienvenida a ${data.restaurant.name}${data.first_name ? `, ${data.first_name}` : ''}`)
                  : t(`Welcome${data.first_name ? `, ${data.first_name}` : ''}`, `Te damos la bienvenida${data.first_name ? `, ${data.first_name}` : ''}`)}
              </h1>
            </div>
          </div>

          <div className="mt-5">
            {data.welcome.video_id ? (
              <WelcomeVideo id={data.welcome.video_id} isES={isES} />
            ) : excerpt ? (
              <blockquote className="rounded-xl bg-whg-night/60 border border-whg-line px-4 py-3.5">
                <p className="text-[15px] text-whg-snow/90 leading-relaxed">{excerpt}</p>
                <p className="mt-2 text-xs font-semibold text-whg-gold">— Randy</p>
              </blockquote>
            ) : null}
          </div>

          {/* Progress + the one next move */}
          {(g || data.checklist.total > 0) && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-sm font-semibold text-whg-snow">
                  {g && g.current
                    ? t(`Step ${g.step} of ${g.of}: ${STAGE_META[g.current].en}`, `Paso ${g.step} de ${g.of}: ${STAGE_META[g.current].es}`)
                    : t(`${data.checklist.done} of ${data.checklist.total} onboarding items done`, `${data.checklist.done} de ${data.checklist.total} pasos de incorporación listos`)}
                </p>
                <span className="text-xs font-bold text-whg-gold tabular-nums">{pct}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-whg-gold transition-all" style={{ width: `${pct}%` }} />
              </div>
              <button
                onClick={g ? onContinueTraining : onOpenChecklist}
                className="tap-highlight mt-4 w-full py-3.5 rounded-2xl bg-whg-gold text-whg-goldink font-bold text-base hover:bg-whg-gold2 transition-colors"
              >
                {g ? t('Continue your training →', 'Continúa tu capacitación →') : t('Open your onboarding checklist →', 'Abre tu lista de bienvenida →')}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── 2. First steps — the same as Randy's Telegram welcome ── */}
      <Card title={t('Your first steps', 'Tus primeros pasos')} icon="check">
        <ol className="space-y-3.5">
          {[
            { icon: 'send', title: t('Send Randy your info on Telegram', 'Mándale tus datos a Randy por Telegram'), sub: t('Your full name, email, and cell number — so he can get you into the system.', 'Tu nombre completo, correo y celular — para darte de alta en el sistema.') },
            { icon: 'chat', title: t('Complete the onboarding form in your email', 'Completa el formulario de incorporación en tu correo'), sub: t('Don’t skip it — onboarding isn’t finished until it’s done.', 'No te lo saltes — la incorporación no termina hasta que lo completes.') },
            { icon: 'cash', title: t('Download the Paychex Flex app', 'Descarga la app Paychex Flex'), sub: t('Your paychecks, pay stubs, and tax documents live there.', 'Ahí están tus cheques, talones de pago y documentos de impuestos.') },
            { icon: 'phone', title: t('Add this app to your Home Screen', 'Agrega esta app a tu pantalla de inicio'), sub: t('iPhone: Share → Add to Home Screen. Android: menu → Install app.', 'iPhone: Compartir → Agregar a inicio. Android: menú → Instalar app.') },
            { icon: 'clipboard', title: t('Bring your I-9 documents on your first day', 'Trae tus documentos I-9 tu primer día'), sub: t('Originals of your choice from the acceptable documents list. Your manager looks at them in person.', 'Originales de tu elección de la lista de documentos aceptables. Tu gerente los revisa en persona.'), link: true },
          ].map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="w-8 h-8 flex-shrink-0 rounded-full bg-whg-gold/15 border border-whg-gold/40 text-whg-gold text-sm font-bold flex items-center justify-center tabular-nums">{i + 1}</span>
              <div className="min-w-0 pt-0.5">
                <p className="text-[15px] font-bold text-whg-snow leading-snug">{s.title}</p>
                <p className="text-[13px] text-whg-dim leading-snug mt-0.5">{s.sub}</p>
                {s.link && (
                  <a href={I9_URL} target="_blank" rel="noopener noreferrer" className="inline-block mt-1 text-xs font-semibold text-sky-300 hover:underline">
                    {t('See the I-9 acceptable documents (uscis.gov) ↗', 'Ver los documentos aceptables del I-9 (uscis.gov) ↗')}
                  </a>
                )}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-[13px] leading-snug bg-[#E0694A]/10 border border-[#E0694A]/30 text-[#F4B7A6]">
          <GuideIcon icon="lock" className="w-4 h-4 mt-px flex-shrink-0 text-[#E0694A]" />
          {t('Never send photos of your ID or Social Security card over Telegram. That information goes in your secure onboarding form, and your manager checks the originals in person.', 'Nunca mandes fotos de tu identificación ni de tu tarjeta de Seguro Social por Telegram. Esa información va en tu formulario seguro de incorporación, y tu gerente revisa los originales en persona.')}
        </p>
      </Card>

      {/* ── 3. First weeks — the onboarding checklist, by stage ── */}
      {data.checklist.sections.length > 0 && (
        <Card title={t('Your first weeks', 'Tus primeras semanas')} icon="calendar"
          action={{ label: t('Open checklist', 'Abrir lista'), onClick: onOpenChecklist }}>
          <ol className="grid gap-2.5 sm:grid-cols-2">
            {data.checklist.sections.map((s) => {
              const done = s.done === s.total;
              const label = SECTION_LABEL[s.key] ?? { en: s.key, es: s.key };
              return (
                <li key={s.key}>
                  <button onClick={onOpenChecklist} className="tap-highlight w-full text-left rounded-xl bg-whg-night/60 border border-whg-line px-3.5 py-3 hover:border-whg-gold/40 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-whg-snow">{isES ? label.es : label.en}</p>
                      <span className={`text-xs font-bold tabular-nums ${done ? 'text-[#5FB49C]' : 'text-whg-dim'}`}>{done ? '✓' : `${s.done}/${s.total}`}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.total ? (s.done / s.total) * 100 : 0}%`, background: done ? '#5FB49C' : '#D9A94E' }} />
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      {/* ── 4. Your restaurant ── */}
      {data.info ? (
        <RestaurantCard info={data.info} name={data.restaurant?.name ?? ''} isES={isES} />
      ) : data.can_edit && data.restaurant ? (
        <Card title={t('Your restaurant', 'Tu restaurante')} icon="pin">
          <p className="text-sm text-whg-dim leading-relaxed">
            {t(`Add ${data.restaurant.name}’s address, parking, where to enter, and first-day notes in Mission Control → Pre-Shift → Start Here. Staff won’t see this card until something’s filled in.`,
               `Agrega la dirección, estacionamiento, por dónde entrar y notas del primer día de ${data.restaurant.name} en Mission Control → Pre-Shift → Start Here. El personal no verá esta tarjeta hasta que tenga información.`)}
          </p>
        </Card>
      ) : null}

      {/* ── 5. Your people ── */}
      {(data.people.trainer || data.people.leaders.length > 0) && (
        <Card title={t('Your people', 'Tu gente')} icon="users" action={{ label: t('Meet the whole team', 'Conoce a todo el equipo'), onClick: onOpenTeam }}>
          {data.people.trainer && (
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-whg-gold/10 border border-whg-gold/30 px-3.5 py-3">
              <GuideIcon icon="star" className="w-5 h-5 text-whg-gold flex-shrink-0" />
              <p className="text-sm text-whg-snow">
                <span className="font-bold">{t('Your trainer:', 'Tu entrenador(a):')}</span> {data.people.trainer.name}
              </p>
            </div>
          )}
          {data.people.leaders.length > 0 && (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim mb-2.5">{t('Your leadership team', 'Tu equipo de liderazgo')}</p>
              <div className="flex gap-3 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                {data.people.leaders.slice(0, 10).map((p, i) => (
                  <div key={i} className="w-[76px] flex-shrink-0 text-center">
                    {p.photo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.photo_url} alt="" className="w-16 h-16 mx-auto rounded-full object-cover border border-whg-line" loading="lazy" />
                    ) : (
                      <div className="w-16 h-16 mx-auto rounded-full bg-whg-card2 border border-whg-line flex items-center justify-center text-lg font-bold text-whg-dim">
                        {p.name.charAt(0)}
                      </div>
                    )}
                    <p className="mt-1.5 text-xs font-semibold text-whg-snow leading-tight truncate">{p.name}</p>
                    <p className="text-[10px] text-whg-dim leading-tight line-clamp-2">{p.title}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* ── 6. Apps you'll use ── */}
      <Card title={t('Apps you’ll use', 'Apps que vas a usar')} icon="phone">
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            { icon: 'send', name: 'Telegram', what: t('Your onboarding chat with Randy — your welcome, your next steps, and where to ask him questions.', 'Tu chat de incorporación con Randy — tu bienvenida, tus siguientes pasos y donde puedes hacerle preguntas.'), get: t('Free in the App Store or Google Play', 'Gratis en App Store o Google Play') },
            { icon: 'cash', name: 'Paychex Flex', what: t('Paychecks, pay stubs, W-2s, and direct deposit.', 'Cheques, talones de pago, W-2 y depósito directo.'), get: t('Free in the App Store or Google Play', 'Gratis en App Store o Google Play') },
            { icon: 'calendar', name: '7shifts', what: t('Your schedule (posted by Thursday), time off, shift swaps, and your punches.', 'Tu horario (se publica a más tardar el jueves), tiempo libre, cambios de turno y tus marcas.'), get: t('Free in the App Store or Google Play', 'Gratis en App Store o Google Play') },
            { icon: 'clock', name: '7Punches', what: t('Clock in and out for your shifts and meal breaks.', 'Marca entrada y salida de tus turnos y descansos para comer.'), get: t('On the iPad at your restaurant — nothing to download', 'En el iPad de tu restaurante — no hay que descargar nada') },
          ].map((a) => (
            <div key={a.name} className="flex gap-3 rounded-xl bg-whg-night/60 border border-whg-line px-3.5 py-3">
              <div className="w-9 h-9 flex-shrink-0 rounded-full bg-whg-gold/12 border border-whg-gold/35 flex items-center justify-center">
                <GuideIcon icon={a.icon} className="w-[18px] h-[18px] text-whg-gold" strokeWidth={1.6} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-whg-snow">{a.name}</p>
                <p className="text-[13px] text-whg-snow/80 leading-snug mt-0.5">{a.what}</p>
                <p className="text-[11px] text-whg-dim mt-1">{a.get}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── 7. Know these first ── */}
      {firstTopics.length > 0 && (
        <Card title={t('Know these first', 'Conoce esto primero')} icon="book">
          <div className="grid grid-cols-2 gap-3">
            {firstTopics.map((s) => (
              <button
                key={s.id}
                onClick={() => onOpenTopic(s.id)}
                className="tap-highlight flex flex-col text-left rounded-2xl overflow-hidden bg-whg-night/60 border border-whg-line hover:border-whg-gold/40 transition-colors"
              >
                <div className="relative aspect-[16/10]">
                  <GuideCover emoji={s.emoji} title={s.title} index={allTopics.indexOf(s)} />
                </div>
                <p className="p-2.5 text-[13px] font-bold text-whg-snow leading-snug">{isES && s.title_es ? s.title_es : s.title}</p>
              </button>
            ))}
          </div>
        </Card>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-whg-night via-[#101B2E] to-whg-night2 tab-content-enter">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8 space-y-4">{children}</div>
    </div>
  );
}

function Card({
  title, icon, action, children,
}: { title: string; icon: string; action?: { label: string; onClick: () => void }; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-whg-card border border-whg-line p-4 md:p-5">
      <div className="flex items-center justify-between gap-3 mb-3.5">
        <h2 className="flex items-center gap-2 text-base md:text-lg font-bold text-whg-snow">
          <GuideIcon icon={icon} className="w-5 h-5 text-whg-gold" strokeWidth={1.6} />
          {title}
        </h2>
        {action && (
          <button onClick={action.onClick} className="tap-highlight flex-shrink-0 text-xs font-semibold text-sky-300 hover:underline">
            {action.label} →
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function RestaurantCard({ info, name, isES }: { info: Record<string, string | null>; name: string; isES: boolean }) {
  const t = (en: string, es: string) => (isES ? es : en);
  const pick = (f: string) => (isES && info[`${f}_es`]) || info[f];
  const mapUrl = info.maps_url || (info.address ? `https://maps.google.com/?q=${encodeURIComponent(info.address)}` : null);
  const rows: { icon: string; label: string; value: string | null; href?: string | null }[] = [
    { icon: 'pin', label: t('Address', 'Dirección'), value: info.address, href: mapUrl },
    { icon: 'phone', label: t('Phone', 'Teléfono'), value: info.phone, href: info.phone ? `tel:${info.phone.replace(/[^\d+]/g, '')}` : null },
    { icon: 'clock', label: t('Hours', 'Horario'), value: pick('hours') },
    { icon: 'arrow', label: t('Parking', 'Estacionamiento'), value: pick('parking') },
    { icon: 'door', label: t('Where to enter', 'Por dónde entrar'), value: pick('entrance') },
  ];
  const firstDay = pick('first_day');
  return (
    <Card title={name || t('Your restaurant', 'Tu restaurante')} icon="pin">
      <dl className="space-y-3">
        {rows.filter((r) => r.value).map((r) => (
          <div key={r.label} className="flex gap-3">
            <GuideIcon icon={r.icon} className="w-[18px] h-[18px] mt-0.5 flex-shrink-0 text-whg-gold" />
            <div className="min-w-0">
              <dt className="text-[10px] font-bold uppercase tracking-widest text-whg-dim">{r.label}</dt>
              <dd className="text-sm text-whg-snow leading-snug whitespace-pre-line mt-0.5">
                {r.href ? <a href={r.href} target={r.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="text-sky-300 hover:underline">{r.value}</a> : r.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
      {firstDay && (
        <div className="mt-4 rounded-xl bg-whg-gold/10 border border-whg-gold/30 px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-whg-gold">{t('On your first day', 'Tu primer día')}</p>
          <p className="text-sm text-whg-snow leading-relaxed whitespace-pre-line mt-1">{firstDay}</p>
        </div>
      )}
    </Card>
  );
}
