'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import GuideCover, { GuideTopicIcon, guideAccent } from './GuideCover';
import GuideInfographic, { type Infographic } from './GuideInfographic';

/* ───────── Types (mirror /api/handbook-cards) ───────── */
export interface GuideCard {
  id: string;
  sort_order: number;
  headline: string;
  headline_es: string | null;
  points: string | null;
  points_es: string | null;
  callout: string | null;
  callout_es: string | null;
  quick_question: string | null;
  quick_question_es: string | null;
  image_url: string | null;
  /** Drawn infographic (migration 088) — shown in place of image_url when present. */
  infographic?: Infographic | null;
  /** The card's own booklet source (cross-topic cards); falls back to the section's. */
  booklet?: { title: string; sort_order: number } | null;
}

export interface GuideSection {
  id: string;
  title: string;
  title_es: string | null;
  blurb: string | null;
  blurb_es: string | null;
  emoji: string | null;
  cover_url: string | null;
  published: boolean;
  booklet: { title: string; sort_order: number } | null;
  /** Admins only: the booklet section changed after these cards were reviewed. */
  needs_review?: boolean;
  cards: GuideCard[];
}

interface Props {
  language: 'en' | 'es';
  /** null while loading. */
  sections: GuideSection[] | null;
  /** Jump to the full section in the Booklet (sort_order matches across languages). */
  onOpenBooklet: (sortOrder: number) => void;
  /** Send a question to Ask. */
  onAsk: (question: string) => void;
}

const SEEN_KEY = 'whg_guide_seen';

/* ───────── 📘 Quick Guide — the handbook, one card at a time ─────────
 *
 * Handbook → Quick Guide. Staff land on search, "most asked" question
 * chips, and topic tiles; a topic opens a story-style deck (one idea per
 * card, big type, a graphic, a heads-up callout), and the last card hands
 * off to the full Booklet section or to Ask. Cards are summaries — the
 * Booklet stays the official policy.
 *
 * "Seen" progress is per device (localStorage): a friendly checkmark,
 * not a compliance record.
 */
export default function HandbookGuideTab({ language, sections, onOpenBooklet, onAsk }: Props) {
  const isES = language === 'es';
  const pick = useCallback((en: string | null, es: string | null) => (isES && es ? es : en || ''), [isES]);

  const [search, setSearch] = useState('');
  const [deck, setDeck] = useState<{ sectionId: string; index: number } | null>(null);
  const [seen, setSeen] = useState<Record<string, true>>({});

  useEffect(() => {
    try { setSeen(JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')); } catch { /* private mode */ }
  }, []);

  const markSeen = useCallback((cardId: string) => {
    setSeen((prev) => {
      if (prev[cardId]) return prev;
      const next: Record<string, true> = { ...prev, [cardId]: true };
      try { localStorage.setItem(SEEN_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  }, []);

  const all = (sections ?? []).filter((s) => s.cards.length > 0);
  const openAt = (sectionId: string, cardId?: string) => {
    const section = all.find((s) => s.id === sectionId);
    const index = cardId ? Math.max(0, section?.cards.findIndex((c) => c.id === cardId) ?? 0) : 0;
    setDeck({ sectionId, index });
  };

  const q = search.trim().toLowerCase();
  const results = q
    ? all.flatMap((s) =>
        s.cards
          .filter((c) =>
            [c.headline, c.headline_es, c.points, c.points_es, c.callout, c.callout_es, c.quick_question, c.quick_question_es]
              .some((t) => (t || '').toLowerCase().includes(q)))
          .map((c) => ({ section: s, card: c })))
    : [];
  const quickQuestions = all.flatMap((s) =>
    s.cards.filter((c) => c.quick_question).map((c) => ({ section: s, card: c })));

  const activeSection = deck ? all.find((s) => s.id === deck.sectionId) || null : null;
  const nextSection = activeSection ? all[all.indexOf(activeSection) + 1] || null : null;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-whg-night via-[#101B2E] to-whg-night2">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-whg-snow">
          📘 {isES ? 'Guía Rápida' : 'Quick Guide'}
        </h1>
        <p className="text-sm text-whg-dim mt-1 mb-4">
          {isES
            ? 'El manual, una tarjeta a la vez. Toca un tema y ve pasando.'
            : 'The handbook, one card at a time. Tap a topic and flip through.'}
        </p>

        {sections === null ? (
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="aspect-[16/11] rounded-2xl bg-whg-card/60 animate-pulse" />
            ))}
          </div>
        ) : all.length === 0 ? (
          <div className="text-center py-12 bg-whg-card/60 rounded-2xl border border-whg-line">
            <div className="text-4xl mb-3">📘</div>
            <p className="text-sm text-whg-dim font-medium">
              {isES ? 'La guía se está preparando.' : 'The guide is being put together.'}
            </p>
          </div>
        ) : (
          <>
            {/* Search — the fastest way to an answer */}
            <div className="relative mb-5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-whg-dim text-sm" aria-hidden>🔍</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={isES ? 'Busca: tarde, tiempo libre, propinas…' : 'Search: late, time off, tips…'}
                className="w-full pl-9 pr-3 py-3 rounded-2xl border border-whg-line bg-whg-card text-base md:text-sm text-whg-snow placeholder:text-whg-dim/60 focus:outline-none focus:border-whg-gold focus:ring-1 focus:ring-whg-gold/20"
              />
            </div>

            {q ? (
              results.length === 0 ? (
                <div className="text-center py-10 bg-whg-card/60 rounded-2xl border border-whg-line">
                  <p className="text-sm text-whg-dim font-medium">
                    {isES ? `No hay tarjetas sobre “${search.trim()}” todavía.` : `No cards about “${search.trim()}” yet.`}
                  </p>
                  <button
                    onClick={() => onAsk(search.trim())}
                    className="tap-highlight mt-3 px-4 py-2.5 rounded-xl bg-whg-gold text-whg-goldink text-xs font-bold hover:bg-whg-gold2 transition-colors"
                  >
                    💬 {isES ? 'Pregúntale a Ask' : 'Ask about it'}
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map(({ section, card }) => (
                    <button
                      key={card.id}
                      onClick={() => openAt(section.id, card.id)}
                      className="tap-highlight w-full text-left bg-whg-card border border-whg-line rounded-2xl px-4 py-3 hover:bg-whg-card2 transition-colors"
                    >
                      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-whg-dim">
                        <GuideTopicIcon emoji={section.emoji} title={section.title} index={all.indexOf(section)} className="w-3.5 h-3.5 flex-shrink-0" />
                        {pick(section.title, section.title_es)}
                      </p>
                      <p className="text-sm font-semibold text-whg-snow mt-0.5">{pick(card.headline, card.headline_es)}</p>
                    </button>
                  ))}
                </div>
              )
            ) : (
              <>
                {/* Most asked — real questions, one tap to the answer card */}
                {quickQuestions.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-whg-gold mb-2">
                      ❓ {isES ? 'Lo más preguntado' : 'Most asked'}
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
                      {quickQuestions.map(({ section, card }) => (
                        <button
                          key={card.id}
                          onClick={() => openAt(section.id, card.id)}
                          className="tap-highlight flex-shrink-0 px-3.5 py-2 rounded-full bg-whg-card border border-whg-line text-xs font-semibold text-whg-snow/90 hover:border-whg-gold/40 transition-colors"
                        >
                          {pick(card.quick_question, card.quick_question_es)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Topics */}
                <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim mb-2">
                  {isES ? 'Temas' : 'Topics'}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {all.map((s, i) => {
                    const seenCount = s.cards.filter((c) => seen[c.id]).length;
                    const done = seenCount === s.cards.length;
                    const minutes = Math.max(1, Math.round((s.cards.length * 20) / 60));
                    return (
                      <button
                        key={s.id}
                        onClick={() => openAt(s.id)}
                        className="tap-highlight relative flex flex-col text-left rounded-2xl overflow-hidden bg-whg-card border border-whg-line shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="relative aspect-[16/10] bg-whg-card2">
                          <GuideCover emoji={s.emoji} title={s.title} index={i} />
                          {done && (
                            <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-whg-gold text-whg-goldink text-xs font-bold flex items-center justify-center shadow">
                              ✓
                            </span>
                          )}
                          {!s.published && (
                            <span className="absolute top-2 left-2 bg-black/60 text-whg-gold text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full">
                              {isES ? 'Vista previa' : 'Preview'}
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-bold text-whg-snow leading-snug">{pick(s.title, s.title_es)}</p>
                          <p className="text-[11px] text-whg-dim mt-1">
                            {s.cards.length} {isES ? 'tarjetas' : 'cards'} · ~{minutes} min
                            {seenCount > 0 && !done && (
                              <span className="text-whg-gold"> · {seenCount}/{s.cards.length}</span>
                            )}
                          </p>
                          {s.needs_review && (
                            <p className="text-[10px] font-semibold text-amber-300 mt-1">
                              ⚠️ {isES ? 'El manual cambió — revisar' : 'Booklet changed — review cards'}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-whg-dim/70 text-center mt-6 leading-relaxed">
                  {isES
                    ? 'Las tarjetas son resúmenes. El Manual del Empleado completo es la política oficial.'
                    : 'Cards are summaries. The full Employee Handbook is the official policy.'}
                </p>
              </>
            )}
          </>
        )}
      </div>

      {deck && activeSection && (
        <CardDeck
          key={activeSection.id}
          section={activeSection}
          sectionIndex={all.indexOf(activeSection)}
          startIndex={deck.index}
          isES={isES}
          pick={pick}
          nextSection={nextSection}
          onSeen={markSeen}
          onClose={() => setDeck(null)}
          onOpenSection={(id) => setDeck({ sectionId: id, index: 0 })}
          onOpenBooklet={(sortOrder) => { setDeck(null); onOpenBooklet(sortOrder); }}
          onAsk={(question) => { setDeck(null); onAsk(question); }}
        />
      )}
    </div>
  );
}

/* ───────── Story-style card deck ─────────
 * Full screen, one card at a time. Next/Back buttons, swipe, and arrow
 * keys; a progress bar of segments up top. Past the last card: a
 * "you're caught up" screen with the next topic, the Booklet, and Ask.
 */
function CardDeck({
  section, sectionIndex, startIndex, isES, pick, nextSection, onSeen, onClose, onOpenSection, onOpenBooklet, onAsk,
}: {
  section: GuideSection;
  /** Position in the topic list — picks the same accent and icon as its cover. */
  sectionIndex: number;
  startIndex: number;
  isES: boolean;
  pick: (en: string | null, es: string | null) => string;
  nextSection: GuideSection | null;
  onSeen: (cardId: string) => void;
  onClose: () => void;
  onOpenSection: (id: string) => void;
  onOpenBooklet: (sortOrder: number) => void;
  onAsk: (question: string) => void;
}) {
  const total = section.cards.length;
  const [index, setIndex] = useState(Math.min(startIndex, total - 1));
  const finished = index >= total;
  const card = finished ? null : section.cards[index];
  const scrollRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const next = useCallback(() => setIndex((i) => Math.min(i + 1, total)), [total]);
  const back = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    if (card) onSeen(card.id);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [card, onSeen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') next();
      else if (e.key === 'ArrowLeft') back();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [next, back, onClose]);

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    touch.current = null;
    if (!start) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) next();
      else back();
    }
  };

  const points = card ? pick(card.points, card.points_es).split('\n').map((p) => p.trim()).filter(Boolean) : [];
  const callout = card ? pick(card.callout, card.callout_es) : '';

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-whg-night via-[#101B2E] to-whg-night2">
      {/* Top bar + progress */}
      <div className="flex-shrink-0 px-4 pt-safe pb-3 border-b border-whg-line bg-whg-night/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            aria-label={isES ? 'Cerrar' : 'Close'}
            className="tap-highlight flex-shrink-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-whg-snow flex items-center justify-center transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <p className="flex-1 min-w-0 flex items-center gap-2 text-sm font-bold text-whg-snow">
            <GuideTopicIcon emoji={section.emoji} title={section.title} index={sectionIndex} className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{pick(section.title, section.title_es)}</span>
          </p>
          <span className="flex-shrink-0 text-[11px] font-bold text-whg-dim">
            {finished ? '✓' : `${index + 1} / ${total}`}
          </span>
        </div>
        <div className="flex gap-1 mt-3" aria-hidden>
          {section.cards.map((c, i) => (
            <div key={c.id} className={`h-1 flex-1 rounded-full transition-colors ${i <= index ? 'bg-whg-gold' : 'bg-white/15'}`} />
          ))}
        </div>
      </div>

      {/* Card */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={onTouchEnd}
      >
        {card ? (
          <div key={card.id} className="max-w-xl mx-auto px-5 py-5 space-y-5 animate-sheet-up">
            {/* With an infographic, it carries the explanation: headline, then
                the graphic — its data already holds the points and the heads-up.
                Without one, the classic picture → headline → points → callout. */}
            {card.infographic ? (
              <>
                <h2 className="text-2xl md:text-3xl font-bold text-whg-snow leading-tight">
                  {pick(card.headline, card.headline_es)}
                </h2>
                <GuideInfographic data={card.infographic} accent={guideAccent(sectionIndex)} isES={isES} />
              </>
            ) : (<>
            {card.image_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={card.image_url}
                alt=""
                className="w-full aspect-[16/10] object-cover rounded-2xl border border-whg-line"
              />
            )}
            <h2 className="text-2xl md:text-3xl font-bold text-whg-snow leading-tight">
              {pick(card.headline, card.headline_es)}
            </h2>
            {points.length > 0 && (
              <ul className="space-y-3">
                {points.map((p, i) => {
                  const numbered = p.match(/^(\d+)\.\s+(.*)$/);
                  return (
                    <li key={i} className="flex gap-3 text-base md:text-[17px] text-whg-snow/90 leading-relaxed">
                      <span className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-whg-gold/15 text-whg-gold text-xs font-bold flex items-center justify-center">
                        {numbered ? numbered[1] : '✓'}
                      </span>
                      <span>{numbered ? numbered[2] : p}</span>
                    </li>
                  );
                })}
              </ul>
            )}
            {callout && (
              <div className="rounded-2xl bg-amber-400/10 border border-amber-400/30 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1">
                  ⚠️ {isES ? 'Importante' : 'Heads up'}
                </p>
                <p className="text-[15px] text-amber-100 leading-relaxed">{callout}</p>
              </div>
            )}
            </>)}
            {/* The release valve that lets cards stay short — a real button,
                right under the content. */}
            {(card.booklet ?? section.booklet) && (
              <button
                onClick={() => onOpenBooklet((card.booklet ?? section.booklet)!.sort_order)}
                className="tap-highlight w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-whg-snow text-sm font-semibold transition-colors"
              >
                📖 {isES ? 'Leer la política completa en el Manual' : 'Read the full policy in the Handbook'} →
              </button>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <button
                onClick={() => onAsk(pick(card.quick_question, card.quick_question_es) || pick(card.headline, card.headline_es))}
                className="tap-highlight text-xs font-semibold text-sky-300 hover:underline py-1"
              >
                💬 {isES ? 'Preguntar sobre esto' : 'Ask about this'}
              </button>
            </div>
            <p className="text-[11px] text-whg-dim/70 leading-relaxed">
              {isES
                ? 'Resumen — el Manual del Empleado es la política oficial.'
                : 'Summary — the Employee Handbook is the official policy.'}
            </p>
          </div>
        ) : (
          /* Caught up */
          <div className="max-w-xl mx-auto px-5 py-12 text-center animate-sheet-up">
            <div className="mx-auto w-20 h-20 rounded-full bg-whg-gold text-whg-goldink text-4xl font-bold flex items-center justify-center shadow-lg">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-whg-snow mt-5">
              {isES ? '¡Listo!' : 'You’re caught up!'}
            </h2>
            <p className="text-sm text-whg-dim mt-2">
              {isES
                ? `Terminaste ${pick(section.title, section.title_es)} — ${total} tarjetas.`
                : `You finished ${pick(section.title, section.title_es)} — ${total} cards.`}
            </p>
            <div className="mt-8 space-y-2.5">
              {nextSection && (
                <button
                  onClick={() => onOpenSection(nextSection.id)}
                  className="tap-highlight w-full py-3.5 rounded-2xl bg-whg-gold text-whg-goldink font-bold text-base hover:bg-whg-gold2 transition-colors"
                >
                  {isES ? 'Siguiente tema' : 'Next topic'}: {pick(nextSection.title, nextSection.title_es)} →
                </button>
              )}
              {section.booklet && (
                <button
                  onClick={() => onOpenBooklet(section.booklet!.sort_order)}
                  className="tap-highlight w-full py-3 rounded-2xl bg-white/10 text-whg-snow font-semibold text-sm hover:bg-white/20 transition-colors"
                >
                  📖 {isES ? 'Leer la sección completa en el Manual' : 'Read the full section in the Booklet'}
                </button>
              )}
              <button
                onClick={() => onAsk(isES ? `Tengo una pregunta sobre ${pick(section.title, section.title_es)}` : `I have a question about ${pick(section.title, section.title_es)}`)}
                className="tap-highlight w-full py-3 rounded-2xl bg-white/10 text-whg-snow font-semibold text-sm hover:bg-white/20 transition-colors"
              >
                💬 {isES ? '¿Aún tienes una pregunta? Pregunta' : 'Still have a question? Ask'}
              </button>
              <button
                onClick={onClose}
                className="tap-highlight w-full py-3 text-sm font-semibold text-whg-dim hover:text-whg-snow transition-colors"
              >
                {isES ? 'Volver a la guía' : 'Back to the guide'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav — thumb reach */}
      {!finished && (
        <div className="flex-shrink-0 px-4 pt-3 pb-safe border-t border-whg-line bg-whg-night/80 backdrop-blur-sm">
          <div className="max-w-xl mx-auto flex gap-3 pb-2">
            <button
              onClick={back}
              disabled={index === 0}
              className="tap-highlight flex-shrink-0 px-5 py-3.5 rounded-2xl bg-white/10 text-whg-snow font-semibold text-sm hover:bg-white/20 disabled:opacity-30 transition-colors"
            >
              ← {isES ? 'Atrás' : 'Back'}
            </button>
            <button
              onClick={next}
              className="tap-highlight flex-1 py-3.5 rounded-2xl bg-whg-gold text-whg-goldink font-bold text-base hover:bg-whg-gold2 transition-colors"
            >
              {index === total - 1 ? (isES ? 'Terminar ✓' : 'Finish ✓') : (isES ? 'Siguiente →' : 'Next →')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
