'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  STAGE_META,
  type GuideStage,
  type GuideStep,
  type GuideSummary,
  type StageKey,
} from '@/lib/guided-training';

/* ───────── Types (mirror /api/training/guide) ───────── */
interface TeamPerson {
  id: string;
  first_name: string;
  last_initial: string;
  title: string;
  role_level: number;
  photo_url: string | null;
}

interface GuideResponse {
  in_training: boolean;
  stages?: GuideStage[];
  summary?: GuideSummary;
  restaurant_name?: string | null;
  position?: { slug: string; name: string; emoji: string | null } | null;
  assignment?: { trainer_id: string | null; trainer_name: string | null; start_date: string } | null;
  team?: TeamPerson[];
}

interface Props {
  language: 'en' | 'es';
  /** Shown instead when this person isn't in guided training (veterans). */
  fallback: React.ReactNode;
  onOpenLesson: (zone: 'menu' | 'systems', sectionId: string) => void;
  onOpenVideos: (seriesId: string | null) => void;
  onOpenQuizzes: () => void;
  /** Onboarding actions handled by the dashboard (sign handbook, policies, Our Story). */
  onChecklistAction: (action: string) => void;
}

const fmtDate = (iso: string, isES: boolean) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(isES ? 'es-US' : 'en-US', { month: 'short', day: 'numeric' });

const initials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

/* ───────── Guided new-hire training (Training → My Path) ─────────
 *
 * One step at a time: Welcome → Paperwork → Meet your team → Learn the job
 * + Floor training → Floor-ready. Desktop shows the stages as a rail with
 * the open stage beside it (managers often walk a new hire through it at
 * the hiring desk); phones stack them and open the chosen stage in place.
 * Stage order and locking live in src/lib/guided-training.ts.
 */
export default function GuidedTrainingTab({
  language, fallback, onOpenLesson, onOpenVideos, onOpenQuizzes, onChecklistAction,
}: Props) {
  const isES = language === 'es';
  const t = (en: string, es: string) => (isES ? es : en);
  const [data, setData] = useState<GuideResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<StageKey | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showLadder, setShowLadder] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/training/guide', { cache: 'no-store' });
      if (!r.ok) return;
      const j: GuideResponse = await r.json();
      setData(j);
      setSelected((prev) => prev ?? j.summary?.current ?? 'ready');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-32 rounded-2xl bg-whg-card/60 animate-pulse" />
        {[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-2xl bg-whg-card/60 animate-pulse" />)}
      </div>
    );
  }

  if (!data?.in_training || !data.stages || !data.summary) return <>{fallback}</>;

  const stages = data.stages;
  const summary = data.summary;
  const selectedStage = stages.find((s) => s.key === selected) ?? stages[0];

  const markModule = async (moduleId: string) => {
    setBusy(moduleId);
    setError(null);
    try {
      const r = await fetch('/api/training/path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: moduleId }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || t('That didn’t save. Try again.', 'No se guardó. Intenta de nuevo.'));
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const markChecklist = async (itemId: string) => {
    setBusy(itemId);
    setError(null);
    try {
      const r = await fetch('/api/onboarding/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, column: 'employee', checked: true }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || t('That didn’t save. Try again.', 'No se guardó. Intenta de nuevo.'));
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  const continueNow = () => {
    setSelected(summary.current ?? 'ready');
    // Desktop: the panel sits beside the rail. Phone: it opens under the stage.
    requestAnimationFrame(() => {
      const target = window.matchMedia('(min-width: 768px)').matches
        ? panelRef.current
        : document.getElementById(`guide-stage-${summary.current ?? 'ready'}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const stagePanel = (stage: GuideStage) => (
    <StagePanel
      stage={stage}
      stages={stages}
      data={data}
      isES={isES}
      busy={busy}
      onMarkModule={markModule}
      onMarkChecklist={markChecklist}
      onOpenLesson={onOpenLesson}
      onOpenVideos={onOpenVideos}
      onOpenQuizzes={onOpenQuizzes}
      onChecklistAction={onChecklistAction}
    />
  );

  const currentMeta = summary.current ? STAGE_META[summary.current] : null;
  const trainerName = data.assignment?.trainer_name ?? null;

  return (
    <div className="space-y-4">
      {/* Header — where you are, who's training you, one button forward */}
      <div className="rounded-2xl p-4 md:p-5 bg-whg-card2 border border-whg-gold/30 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-widest text-whg-gold">
          🧭 {t('Your training', 'Tu entrenamiento')}
          {data.position ? ` · ${data.position.emoji ? `${data.position.emoji} ` : ''}${data.position.name}` : ''}
          {data.restaurant_name ? ` · ${data.restaurant_name}` : ''}
        </p>
        <div className="mt-1 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xl md:text-2xl font-bold text-whg-snow leading-snug">
              {summary.complete
                ? t('You’re floor-ready 🎯', '¡Listo para el piso! 🎯')
                : `${t('Step', 'Paso')} ${summary.step} ${t('of', 'de')} ${summary.of}: ${currentMeta ? (isES ? currentMeta.es : currentMeta.en) : ''}`}
            </p>
            <p className="text-xs text-whg-dim mt-1">
              {trainerName
                ? `🤝 ${t('Your trainer', 'Tu entrenador')}: ${trainerName}`
                : t('Your manager will assign your trainer.', 'Tu gerente te asignará un entrenador.')}
              {data.assignment?.start_date ? ` · ${t('Started', 'Empezaste')} ${fmtDate(data.assignment.start_date, isES)}` : ''}
            </p>
          </div>
          {!summary.complete && (
            <button
              onClick={continueNow}
              className="tap-highlight flex-shrink-0 px-5 py-3 rounded-xl bg-whg-gold text-whg-goldink text-sm font-bold hover:bg-whg-gold2 transition-colors"
            >
              {t('Continue', 'Continuar')} →
            </button>
          )}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-whg-gold transition-all" style={{ width: `${summary.pct}%` }} />
          </div>
          <span className="text-[11px] font-bold text-whg-dim flex-shrink-0">
            {summary.done}/{summary.total} {t('steps', 'pasos')}
          </span>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-200 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="md:grid md:grid-cols-[260px_minmax(0,1fr)] md:gap-5 md:items-start">
        {/* Stage rail (desktop) / stacked stages (phone) */}
        <nav className="space-y-2 md:sticky md:top-2" aria-label={t('Training steps', 'Pasos del entrenamiento')}>
          {stages.map((s, i) => {
            const meta = STAGE_META[s.key];
            const active = selectedStage.key === s.key;
            return (
              <div key={s.key} id={`guide-stage-${s.key}`} className="scroll-mt-2">
                <button
                  onClick={() => setSelected(s.key)}
                  aria-current={active ? 'step' : undefined}
                  className={`tap-highlight w-full flex items-center gap-3 rounded-2xl px-3 py-3 text-left border transition-colors ${
                    active
                      ? 'bg-whg-card2 border-whg-gold/60'
                      : 'bg-whg-card border-whg-line hover:bg-whg-card2'
                  } ${s.status === 'locked' ? 'opacity-60' : ''}`}
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    s.status === 'done'
                      ? 'bg-emerald-400/15 text-emerald-300'
                      : s.status === 'locked'
                        ? 'bg-white/5 text-whg-dim'
                        : 'bg-whg-gold text-whg-goldink'
                  }`} aria-hidden>
                    {s.status === 'done' ? '✓' : s.status === 'locked' ? '🔒' : i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-whg-snow truncate">
                      {meta.emoji} {isES ? meta.es : meta.en}
                    </span>
                    <span className="block text-[11px] text-whg-dim">
                      {s.status === 'done'
                        ? t('Done', 'Listo')
                        : s.status === 'locked'
                          ? t('Unlocks later', 'Se abre después')
                          : s.total === 0
                            ? t('Nothing to do yet', 'Nada por ahora')
                            : `${s.done}/${s.total} ${t('done', 'listos')}`}
                    </span>
                  </span>
                  {(s.status === 'current' || s.status === 'open') && (
                    <span className="flex-shrink-0 text-[9px] font-bold uppercase tracking-wide text-whg-gold">
                      {t('Now', 'Ahora')}
                    </span>
                  )}
                </button>
                {active && <div className="md:hidden mt-2">{stagePanel(s)}</div>}
              </div>
            );
          })}
        </nav>

        <div ref={panelRef} className="hidden md:block scroll-mt-2">
          {stagePanel(selectedStage)}
        </div>
      </div>

      <div className="text-center pt-1">
        <button
          onClick={() => setShowLadder((v) => !v)}
          className="text-[11px] font-semibold text-sky-300 hover:underline"
        >
          {showLadder ? t('Hide the full training ladder', 'Ocultar la escalera completa') : t('See the full training ladder', 'Ver la escalera completa')}
        </button>
      </div>
      {showLadder && fallback}
    </div>
  );
}

/* ───────── One stage, opened ───────── */
function StagePanel({
  stage, stages, data, isES, busy,
  onMarkModule, onMarkChecklist, onOpenLesson, onOpenVideos, onOpenQuizzes, onChecklistAction,
}: {
  stage: GuideStage;
  stages: GuideStage[];
  data: GuideResponse;
  isES: boolean;
  busy: string | null;
  onMarkModule: (id: string) => void;
  onMarkChecklist: (id: string) => void;
  onOpenLesson: (zone: 'menu' | 'systems', sectionId: string) => void;
  onOpenVideos: (seriesId: string | null) => void;
  onOpenQuizzes: () => void;
  onChecklistAction: (action: string) => void;
}) {
  const t = (en: string, es: string) => (isES ? es : en);
  const meta = STAGE_META[stage.key];
  const locked = stage.status === 'locked';
  const firstOpen = stages.find((s) => s.status !== 'done');
  const nextStepId = locked ? null : stage.steps.find((s) => s.required && !s.done)?.id ?? null;

  return (
    <section className="rounded-2xl bg-whg-card border border-whg-line p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-whg-snow">{meta.emoji} {isES ? meta.es : meta.en}</h2>
          <p className="text-xs text-whg-dim mt-0.5">{isES ? meta.blurbEs : meta.blurb}</p>
        </div>
        {stage.total > 0 && (
          <span className="flex-shrink-0 text-[11px] font-bold text-whg-dim">{stage.done}/{stage.total}</span>
        )}
      </div>

      {locked && firstOpen && (
        <p className="mt-3 text-xs text-amber-200 bg-amber-400/10 border border-amber-400/30 rounded-xl px-3 py-2">
          🔒 {t('Finish', 'Termina')} “{isES ? STAGE_META[firstOpen.key].es : STAGE_META[firstOpen.key].en}” {t('first — this opens right after.', 'primero — esto se abre justo después.')}
        </p>
      )}

      {stage.key === 'team' && <TeamGallery data={data} isES={isES} />}

      {stage.steps.length === 0 ? (
        <p className="mt-4 text-sm text-whg-dim">
          {stage.key === 'learn'
            ? t('Lessons for your position are being built. Your trainer will walk you through it on the floor.', 'Las lecciones de tu posición se están preparando. Tu entrenador te enseñará en el piso.')
            : stage.key === 'floor'
              ? t('Your trainer will set up your shadow shifts.', 'Tu entrenador preparará tus turnos de práctica.')
              : t('Nothing to do here for your position.', 'Nada que hacer aquí para tu posición.')}
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {stage.steps.map((step) => (
            <StepRow
              key={step.id}
              step={step}
              isNext={step.id === nextStepId}
              locked={locked}
              isES={isES}
              busy={busy === step.id}
              onMarkModule={onMarkModule}
              onMarkChecklist={onMarkChecklist}
              onOpenLesson={onOpenLesson}
              onOpenVideos={onOpenVideos}
              onOpenQuizzes={onOpenQuizzes}
              onChecklistAction={onChecklistAction}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

/* ───────── One step ───────── */
function StepRow({
  step, isNext, locked, isES, busy,
  onMarkModule, onMarkChecklist, onOpenLesson, onOpenVideos, onOpenQuizzes, onChecklistAction,
}: {
  step: GuideStep;
  isNext: boolean;
  locked: boolean;
  isES: boolean;
  busy: boolean;
  onMarkModule: (id: string) => void;
  onMarkChecklist: (id: string) => void;
  onOpenLesson: (zone: 'menu' | 'systems', sectionId: string) => void;
  onOpenVideos: (seriesId: string | null) => void;
  onOpenQuizzes: () => void;
  onChecklistAction: (action: string) => void;
}) {
  const t = (en: string, es: string) => (isES ? es : en);
  const [expanded, setExpanded] = useState(false);
  const title = isES && step.title_es ? step.title_es : step.title;
  const description = isES && step.description_es ? step.description_es : step.description;

  const primary = 'tap-highlight px-3.5 py-2 rounded-lg text-xs font-bold bg-whg-gold text-whg-goldink hover:bg-whg-gold2 transition-colors disabled:opacity-40';
  const secondary = 'tap-highlight px-3.5 py-2 rounded-lg text-xs font-bold bg-white/10 text-whg-snow/90 hover:bg-white/20 transition-colors disabled:opacity-40';
  // The check-off is the main action when nothing else comes first.
  const doneButton = (onClick: () => void, label = t('Mark done', 'Marcar listo')) => (
    <button onClick={onClick} disabled={busy || locked} className={isNext && actions.length === 0 ? primary : secondary}>
      {busy ? '…' : `✓ ${label}`}
    </button>
  );

  let note: string | null = null;
  const actions: React.ReactNode[] = [];

  if (step.kind === 'module') {
    switch (step.module_type) {
      case 'note':
        if (description) {
          actions.push(
            <button key="read" onClick={() => setExpanded((v) => !v)} className={isNext ? primary : secondary}>
              {expanded ? t('Hide', 'Ocultar') : t('Read', 'Leer')}
            </button>
          );
        }
        if (!step.done) actions.push(<span key="done">{doneButton(() => onMarkModule(step.id))}</span>);
        break;
      case 'video_series':
        actions.push(
          <button key="watch" onClick={() => onOpenVideos(step.ref_id)} disabled={locked} className={isNext ? primary : secondary}>
            ▶ {t('Watch', 'Ver')}
          </button>
        );
        if (!step.done) actions.push(<span key="done">{doneButton(() => onMarkModule(step.id), t('I watched it', 'Ya lo vi'))}</span>);
        break;
      case 'menu_category':
        if (step.ref_id && step.ref_zone !== 'academy') {
          const zone = step.ref_zone === 'systems' ? 'systems' : 'menu';
          actions.push(
            <button key="open" onClick={() => onOpenLesson(zone, step.ref_id as string)} disabled={locked} className={isNext ? primary : secondary}>
              📖 {t('Open lesson', 'Abrir lección')}
            </button>
          );
        }
        if (!step.done) actions.push(<span key="done">{doneButton(() => onMarkModule(step.id), t('I studied it', 'Ya lo estudié'))}</span>);
        break;
      case 'quiz':
      case 'photo_test':
        note = step.available
          ? t('Marks itself done when you pass.', 'Se marca solo cuando apruebas.')
          : t('This test is coming soon.', 'Este examen viene pronto.');
        if (!step.done && step.available) {
          actions.push(
            <button key="quiz" onClick={onOpenQuizzes} disabled={locked} className={isNext ? primary : secondary}>
              📝 {t('Take the test', 'Tomar el examen')}
            </button>
          );
        }
        break;
      case 'team':
        if (!step.done) actions.push(<span key="done">{doneButton(() => onMarkModule(step.id), t('I’ve met my team', 'Ya conocí a mi equipo'))}</span>);
        break;
      case 'skill':
        note = step.done
          ? t('Signed off', 'Firmado')
          : step.completion === 'trainer'
            ? t('Your trainer marks this after the shift.', 'Tu entrenador lo marca después del turno.')
            : t('A manager signs this off when you’re ready.', 'Un gerente lo firma cuando estés listo.');
        break;
    }
  } else if (step.kind === 'checklist') {
    const action =
      step.auto_track_source === 'handbook_signed' ? { key: 'sign_handbook', label: t('Sign the handbook', 'Firmar el manual') } :
      step.auto_track_source === 'policy_signatures_all' || step.auto_track_source === 'policy_signatures_any'
        ? { key: 'sign_policies', label: t('Sign policies', 'Firmar políticas') } :
      step.auto_track_source === 'our_story_ack' ? { key: 'acknowledge_story', label: t('Read Our Story', 'Leer Nuestra Historia') } :
      null;
    if (!step.done) {
      if (action) {
        actions.push(
          <button key="act" onClick={() => onChecklistAction(action.key)} disabled={locked} className={isNext ? primary : secondary}>
            ✍️ {action.label}
          </button>
        );
      } else if (step.auto_track_source === 'bar_card_uploaded') {
        note = t('Your manager uploads your bar card.', 'Tu gerente sube tu tarjeta de bar.');
      } else if (!step.auto_track_source) {
        actions.push(<span key="done">{doneButton(() => onMarkChecklist(step.id))}</span>);
      }
    } else if (!step.manager_confirmed) {
      note = t('Done — your manager will confirm it.', 'Listo — tu gerente lo confirmará.');
    }
    for (const link of step.links) {
      actions.push(
        <a
          key={link.id}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${secondary} inline-block`}
        >
          🔗 {link.label}
        </a>
      );
    }
  } else {
    note = step.done
      ? t('Your manager signed you off. You’re on your own now — keep growing.', 'Tu gerente te firmó. Ya trabajas por tu cuenta — sigue creciendo.')
      : step.ready_for_signoff
        ? t('Every step is done — ask your manager for your final sign-off.', 'Todos los pasos están listos — pide a tu gerente tu firma final.')
        : t('Opens when Learn the job and Floor training are done.', 'Se abre cuando termines Aprende el trabajo y Entrenamiento en piso.');
  }

  return (
    <li className={`rounded-xl border px-3 py-3 ${
      isNext ? 'border-whg-gold/60 bg-whg-gold/5' : 'border-whg-line bg-whg-night/40'
    }`}>
      <div className="flex items-start gap-3">
        <span className={`flex-shrink-0 mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
          step.done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-whg-dim'
        }`} aria-hidden>
          {step.done ? '✓' : '•'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-semibold ${step.done ? 'text-whg-dim line-through decoration-whg-dim/50' : 'text-whg-snow'}`}>
              {title}
            </p>
            {isNext && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-whg-gold">{t('Next', 'Siguiente')}</span>
            )}
            {!step.required && (
              <span className="text-[9px] font-bold uppercase tracking-wide text-whg-dim/70">{t('optional', 'opcional')}</span>
            )}
          </div>
          {note && <p className="text-[11px] text-whg-dim mt-0.5">{note}</p>}
          {(expanded || (step.kind === 'checklist' && !step.done)) && description && (
            <p className="text-xs text-whg-dim leading-relaxed mt-1 whitespace-pre-wrap">{description}</p>
          )}
          {actions.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{actions}</div>}
        </div>
      </div>
    </li>
  );
}

/* ───────── Meet your team ───────── */
function TeamGallery({ data, isES }: { data: GuideResponse; isES: boolean }) {
  const t = (en: string, es: string) => (isES ? es : en);
  const team = data.team ?? [];
  const leaders = team.filter((p) => p.role_level <= 4);
  const crew = team.filter((p) => p.role_level > 4);
  const trainer = data.assignment?.trainer_name ?? null;

  const person = (p: TeamPerson) => (
    <div key={p.id} className="flex flex-col items-center text-center">
      {p.photo_url ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={p.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border border-whg-line" loading="lazy" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-whg-card2 border border-whg-line flex items-center justify-center text-sm font-bold text-whg-dim">
          {`${p.first_name[0] ?? ''}${p.last_initial ?? ''}`.toUpperCase()}
        </div>
      )}
      <p className="text-xs font-semibold text-whg-snow mt-1.5 leading-tight">{p.first_name} {p.last_initial}.</p>
      <p className="text-[10px] text-whg-dim leading-tight">{p.title}</p>
    </div>
  );

  return (
    <div className="mt-4 space-y-4">
      {trainer && (
        <div className="flex items-center gap-3 rounded-xl bg-whg-gold/10 border border-whg-gold/40 px-3 py-3">
          <div className="w-12 h-12 rounded-full bg-whg-gold text-whg-goldink flex items-center justify-center font-bold">
            {initials(trainer)}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-whg-gold">{t('Your trainer', 'Tu entrenador')}</p>
            <p className="text-sm font-bold text-whg-snow">{trainer}</p>
            <p className="text-[11px] text-whg-dim">{t('Stick close on your first shifts — ask anything.', 'Quédate cerca en tus primeros turnos — pregunta lo que sea.')}</p>
          </div>
        </div>
      )}
      {team.length === 0 ? (
        <p className="text-xs text-whg-dim">
          {t('Team photos are coming soon — your manager will introduce you in person.', 'Las fotos del equipo vienen pronto — tu gerente te presentará en persona.')}
        </p>
      ) : (
        <>
          {leaders.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim mb-2">{t('Your leaders', 'Tus líderes')}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">{leaders.map(person)}</div>
            </div>
          )}
          {crew.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-whg-dim mb-2">{t('The team', 'El equipo')}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">{crew.map(person)}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ───────── For trainers: your trainees' shadow shifts ───────── */
interface TraineeStep { id: string; title: string; title_es: string | null; completion: string; required: boolean; done: boolean }
interface Trainee { id: string; full_name: string; position_name: string | null; start_date: string; steps: TraineeStep[] }

export function TraineesCard({ language }: { language: 'en' | 'es' }) {
  const isES = language === 'es';
  const t = (en: string, es: string) => (isES ? es : en);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/training/trainees', { cache: 'no-store' });
      if (!r.ok) return;
      const j = await r.json();
      setTrainees(j.trainees || []);
    } catch { /* card just stays hidden */ }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (trainees.length === 0) return null;

  const mark = async (traineeId: string, step: TraineeStep) => {
    setBusy(step.id);
    setError(null);
    try {
      const r = await fetch('/api/training/path', {
        method: step.done ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module_id: step.id, user_id: traineeId }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || t('That didn’t save. Try again.', 'No se guardó. Intenta de nuevo.'));
        return;
      }
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl bg-whg-card border border-emerald-400/30 p-4 mb-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
        🤝 {t('You’re training', 'Estás entrenando a')}
      </p>
      {error && <p className="text-xs text-red-200 mt-2">{error}</p>}
      <div className="mt-2 space-y-2">
        {trainees.map((tr) => {
          const mine = tr.steps.filter((s) => s.completion === 'trainer');
          const done = tr.steps.filter((s) => s.required && s.done).length;
          const total = tr.steps.filter((s) => s.required).length;
          const isOpen = open === tr.id;
          return (
            <div key={tr.id} className="rounded-xl border border-whg-line bg-whg-night/40">
              <button
                onClick={() => setOpen(isOpen ? null : tr.id)}
                className="tap-highlight w-full flex items-center gap-3 px-3 py-3 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-400/15 text-emerald-200 flex items-center justify-center text-xs font-bold">
                  {initials(tr.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-whg-snow truncate">{tr.full_name}</p>
                  <p className="text-[11px] text-whg-dim truncate">
                    {[tr.position_name, `${t('started', 'empezó')} ${fmtDate(tr.start_date, isES)}`].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-[11px] font-bold text-whg-dim">{done}/{total}</span>
              </button>
              {isOpen && (
                <ul className="border-t border-whg-line divide-y divide-whg-line/60">
                  {tr.steps.length === 0 && (
                    <li className="px-3 py-3 text-xs text-whg-dim">{t('No floor steps set up for this position yet.', 'Aún no hay pasos de piso para esta posición.')}</li>
                  )}
                  {tr.steps.map((s) => (
                    <li key={s.id} className="px-3 py-2.5 flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${s.done ? 'bg-emerald-400/15 text-emerald-300' : 'bg-white/10 text-whg-dim'}`} aria-hidden>
                        {s.done ? '✓' : '•'}
                      </span>
                      <p className={`flex-1 text-sm ${s.done ? 'text-whg-dim' : 'text-whg-snow/90'}`}>{isES && s.title_es ? s.title_es : s.title}</p>
                      {s.completion === 'trainer' ? (
                        <button
                          onClick={() => mark(tr.id, s)}
                          disabled={busy === s.id}
                          className={`tap-highlight flex-shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors disabled:opacity-40 ${
                            s.done ? 'bg-white/10 text-whg-dim hover:bg-white/20' : 'bg-emerald-500 text-white hover:bg-emerald-600'
                          }`}
                        >
                          {busy === s.id ? '…' : s.done ? t('Undo', 'Deshacer') : t('Mark done', 'Marcar listo')}
                        </button>
                      ) : (
                        <span className="flex-shrink-0 text-[10px] text-whg-dim">{t('Manager signs', 'Firma el gerente')}</span>
                      )}
                    </li>
                  ))}
                  {mine.length === 0 && tr.steps.length > 0 && (
                    <li className="px-3 py-2.5 text-[11px] text-whg-dim">{t('A manager signs off these steps.', 'Un gerente firma estos pasos.')}</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
