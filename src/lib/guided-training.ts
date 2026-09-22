/**
 * Guided new-hire training (Randy, Sept 2026).
 *
 * Turns someone's training ladder + onboarding checklist into six ordered
 * stages they follow one at a time:
 *
 *   1 Welcome        — WHG Foundations (except Meet your team)
 *   2 Paperwork      — onboarding checklist "Paperwork & Setup" items
 *   3 Meet your team — the 'team' step
 *   4 Learn the job  — study steps on their department/position/certification tracks
 *   5 Floor training — hands-on steps (trainer or manager marks them)
 *   6 Floor-ready    — the manager's final sign-off
 *
 * Stages 1–3 unlock in order (day one). Stages 4 and 5 open together —
 * new hires work shifts while they study. Stage 6 opens when both are done.
 * Pure functions, safe to import on the server or in the browser.
 */

export type StageKey = 'welcome' | 'paperwork' | 'team' | 'learn' | 'floor' | 'ready';
export type StageStatus = 'done' | 'current' | 'open' | 'locked';

/**
 * How long after the hire date someone counts as "in training" without a
 * trainer assigned. 90 days matches the 90-day growth path in every position
 * description and Home's "recent hire" window — one number, one meaning.
 * Separate from the semi-annual evaluation, which is about improvement,
 * corrections, and pay.
 */
export const IN_TRAINING_DAYS = 90;
/** No progress for this many days flags a new hire as stuck in Mission Control. */
export const STUCK_AFTER_DAYS = 3;

export const STAGE_ORDER: StageKey[] = ['welcome', 'paperwork', 'team', 'learn', 'floor', 'ready'];

export const STAGE_META: Record<StageKey, { emoji: string; en: string; es: string; blurb: string; blurbEs: string }> = {
  welcome: {
    emoji: '👋', en: 'Welcome', es: 'Bienvenida',
    blurb: 'Start here — who we are and how we take care of people.',
    blurbEs: 'Empieza aquí — quiénes somos y cómo cuidamos a la gente.',
  },
  paperwork: {
    emoji: '📝', en: 'Paperwork', es: 'Papeleo',
    blurb: 'Sign the handbook and get set up for payroll and the team chat.',
    blurbEs: 'Firma el manual y prepárate para nómina y el chat del equipo.',
  },
  team: {
    emoji: '👥', en: 'Meet your team', es: 'Conoce a tu equipo',
    blurb: 'Put faces to names — your managers, your teammates, and your trainer.',
    blurbEs: 'Ponle cara a los nombres — tus gerentes, tus compañeros y tu entrenador.',
  },
  learn: {
    emoji: '📚', en: 'Learn the job', es: 'Aprende el trabajo',
    blurb: 'Videos, lessons, and quizzes for your position — at your own pace.',
    blurbEs: 'Videos, lecciones y cuestionarios de tu posición — a tu ritmo.',
  },
  floor: {
    emoji: '🤝', en: 'Floor training', es: 'Entrenamiento en piso',
    blurb: 'Shadow shifts with your trainer. They mark each one done.',
    blurbEs: 'Turnos de práctica con tu entrenador. Él marca cada uno.',
  },
  ready: {
    emoji: '🎯', en: 'Floor-ready', es: 'Listo para el piso',
    blurb: 'Your manager’s final sign-off — then you’re on your own.',
    blurbEs: 'La firma final de tu gerente — y ya trabajas por tu cuenta.',
  },
};

export interface GuideModuleStep {
  kind: 'module';
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  module_type: string;
  ref_id: string | null;
  ref_zone: string | null;
  completion: string;
  required: boolean;
  done: boolean;
  available: boolean;
  signed_off: boolean;
}

export interface GuideChecklistStep {
  kind: 'checklist';
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  auto_track_source: string | null;
  links: { id: string; label: string; url: string; link_type: string }[];
  required: boolean;
  done: boolean;
  manager_confirmed: boolean;
}

export interface GuideSignoffStep {
  kind: 'signoff';
  id: 'floor-ready';
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  required: boolean;
  done: boolean;
  ready_for_signoff: boolean;
}

export type GuideStep = GuideModuleStep | GuideChecklistStep | GuideSignoffStep;

export interface GuideStage {
  key: StageKey;
  status: StageStatus;
  steps: GuideStep[];
  done: number;
  total: number;
}

export interface GuideSummary {
  /** 1-based number of the first stage that isn't done (6 when all done). */
  step: number;
  of: number;
  current: StageKey | null;
  done: number;
  total: number;
  pct: number;
  complete: boolean;
}

interface PathTrackInput {
  level: string;
  modules: Array<{
    id: string; title: string; title_es: string | null;
    description: string | null; description_es: string | null;
    module_type: string; ref_id: string | null; ref_zone?: string | null;
    completion: string; required: boolean; done: boolean; available: boolean; signed_off: boolean;
  }>;
}

interface ChecklistInput {
  id: string;
  section: string;
  sort_order: number;
  title: string;
  description: string | null;
  auto_track_source: string | null;
  requires_employee_check: boolean;
  employee_checked_at: string | null;
  manager_checked_at: string | null;
  links: { id: string; label: string; url: string; link_type: string }[];
}

const ROLE_LEVELS = new Set(['department', 'position', 'certification']);

export function buildGuideStages(input: {
  tracks: PathTrackInput[];
  checklist: ChecklistInput[];
  floorReady: { ready: boolean; ready_for_signoff: boolean };
}): GuideStage[] {
  const moduleStep = (m: PathTrackInput['modules'][number]): GuideModuleStep => ({
    kind: 'module',
    id: m.id,
    title: m.title,
    title_es: m.title_es,
    description: m.description,
    description_es: m.description_es,
    module_type: m.module_type,
    ref_id: m.ref_id,
    ref_zone: m.ref_zone ?? null,
    completion: m.completion,
    required: m.required,
    done: m.done,
    available: m.available,
    signed_off: m.signed_off,
  });

  const welcome = input.tracks
    .filter((t) => t.level === 'foundations')
    .flatMap((t) => t.modules.filter((m) => m.module_type !== 'team'))
    .map(moduleStep);
  const team = input.tracks
    .flatMap((t) => t.modules.filter((m) => m.module_type === 'team'))
    .map(moduleStep);
  const learn = input.tracks
    .filter((t) => ROLE_LEVELS.has(t.level))
    .flatMap((t) => t.modules.filter((m) => m.module_type !== 'skill' && m.module_type !== 'team'))
    .map(moduleStep);
  const floor = input.tracks
    .filter((t) => ROLE_LEVELS.has(t.level))
    .flatMap((t) => t.modules.filter((m) => m.module_type === 'skill'))
    .map(moduleStep);
  const paperwork: GuideChecklistStep[] = input.checklist
    .filter((i) => i.section === 'paperwork' && i.requires_employee_check)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((i) => ({
      kind: 'checklist',
      id: i.id,
      title: i.title,
      title_es: null,
      description: i.description,
      description_es: null,
      auto_track_source: i.auto_track_source,
      links: i.links,
      required: true,
      done: !!i.employee_checked_at,
      manager_confirmed: !!i.manager_checked_at,
    }));
  const ready: GuideSignoffStep[] = [{
    kind: 'signoff',
    id: 'floor-ready',
    title: 'Manager’s final sign-off',
    title_es: 'Firma final del gerente',
    description: null,
    description_es: null,
    required: true,
    done: input.floorReady.ready,
    ready_for_signoff: input.floorReady.ready_for_signoff,
  }];

  const count = (steps: GuideStep[]) => ({
    done: steps.filter((s) => s.required && s.done).length,
    total: steps.filter((s) => s.required).length,
  });
  const complete = (steps: GuideStep[]) => {
    const c = count(steps);
    return c.total === 0 || c.done === c.total;
  };

  const w = complete(welcome);
  const p = complete(paperwork);
  const tm = complete(team);
  const l = complete(learn);
  const f = complete(floor);
  const dayOne = w && p && tm;
  const make = (key: StageKey, steps: GuideStep[], status: StageStatus): GuideStage => ({ key, status, steps, ...count(steps) });

  return [
    make('welcome', welcome, w ? 'done' : 'current'),
    make('paperwork', paperwork, !w ? 'locked' : p ? 'done' : 'current'),
    make('team', team, !(w && p) ? 'locked' : tm ? 'done' : 'current'),
    make('learn', learn, !dayOne ? 'locked' : l ? 'done' : 'open'),
    make('floor', floor, !dayOne ? 'locked' : f ? 'done' : 'open'),
    make('ready', ready, input.floorReady.ready ? 'done' : dayOne && l && f ? 'current' : 'locked'),
  ];
}

export function guideSummary(stages: GuideStage[]): GuideSummary {
  const idx = stages.findIndex((s) => s.status !== 'done');
  const done = stages.reduce((n, s) => n + s.done, 0);
  const total = stages.reduce((n, s) => n + s.total, 0);
  return {
    step: idx === -1 ? stages.length : idx + 1,
    of: stages.length,
    current: idx === -1 ? null : stages[idx].key,
    done,
    total,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
    complete: idx === -1,
  };
}

export function isInTraining(opts: { hireDate: string | null; hasAssignment: boolean; floorReady: boolean }): boolean {
  if (opts.floorReady) return false;
  if (opts.hasAssignment) return true;
  if (!opts.hireDate) return false;
  const days = (Date.now() - new Date(`${opts.hireDate}T12:00:00`).getTime()) / 86_400_000;
  return days >= -30 && days <= IN_TRAINING_DAYS;
}
