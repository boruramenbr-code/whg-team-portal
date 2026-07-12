'use client';

import { useEffect, useState, useCallback } from 'react';

/* ───────── Types ───────── */
interface QuizListItem {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  kind: 'exam' | 'quiz';
  pass_threshold: number;
  applies_to: 'all' | 'foh' | 'boh' | 'mgmt';
  video_id: string | null;
  menu_category_id: string | null;
  question_count: number;
  my_best_score: number | null;
  my_last_attempt_at: string | null;
  my_passed: boolean;
}

interface QuizDetail {
  id: string;
  title: string;
  title_es: string | null;
  description: string | null;
  description_es: string | null;
  kind: 'exam' | 'quiz';
  pass_threshold: number;
  questions: Question[];
}

interface Question {
  id: string;
  question_text: string;
  question_text_es: string | null;
  question_type: 'multiple_choice' | 'true_false';
  sort_order: number;
  /** Photo questions (e.g. the Menu Photo Test) show this above the text. */
  image_url?: string | null;
  choices: Choice[];
}

interface Choice {
  id: string;
  choice_text: string;
  choice_text_es: string | null;
  sort_order: number;
}

interface SubmitDetail {
  question_id: string;
  selected_choice_id: string | null;
  is_correct: boolean;
  correct_choice_id: string | null;
}

interface SubmitResult {
  attempt: { id: string; score: number; passed: boolean; submitted_at: string };
  details: SubmitDetail[];
}

interface Props {
  language: 'en' | 'es';
}

/* ───────── Employee Quizzes Sub-Tab ─────────
 * Sub-tab under Training. Lists quizzes visible to the current user
 * with pass status + best score. Tap a quiz to open the full-screen
 * player; on submit, the server grades and returns per-question detail
 * for the review screen. Unlimited retakes.
 */
export default function QuizzesTab({ language }: Props) {
  const isES = language === 'es';
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<QuizDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/quizzes');
      if (!r.ok) return;
      const j = await r.json();
      setQuizzes(j.quizzes || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openQuiz = async (id: string) => {
    const r = await fetch(`/api/quizzes/${id}`);
    if (!r.ok) return;
    const j = await r.json();
    if (j.quiz) setActive(j.quiz);
  };

  const label = (en: string, es: string | null | undefined) => (isES && es ? es : en);

  if (loading) {
    return <div className="text-center text-sm text-gray-400 py-12">{isES ? 'Cargando…' : 'Loading…'}</div>;
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-12 bg-white/60 rounded-2xl border border-white/40">
        <div className="text-4xl mb-3">📝</div>
        <p className="text-sm text-gray-500 font-medium">{isES ? 'Aún no hay cuestionarios.' : 'No quizzes yet.'}</p>
        <p className="text-xs text-gray-400 mt-1">{isES ? 'Tus managers están preparando algunos.' : 'Your managers are putting some together.'}</p>
      </div>
    );
  }

  const exams = quizzes.filter((q) => q.kind === 'exam');
  const optionals = quizzes.filter((q) => q.kind === 'quiz');

  return (
    <>
      <div className="space-y-6">
        {exams.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>🎯</span>
              {isES ? 'Exámenes requeridos' : 'Required Exams'}
            </h2>
            <div className="space-y-2">
              {exams.map((q) => (
                <QuizRow key={q.id} quiz={q} onOpen={() => openQuiz(q.id)} isES={isES} label={label} />
              ))}
            </div>
          </section>
        )}

        {optionals.length > 0 && (
          <section>
            <h2 className="text-[11px] font-bold text-[#2E86C1] uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>📝</span>
              {isES ? 'Cuestionarios' : 'Knowledge Checks'}
            </h2>
            <div className="space-y-2">
              {optionals.map((q) => (
                <QuizRow key={q.id} quiz={q} onOpen={() => openQuiz(q.id)} isES={isES} label={label} />
              ))}
            </div>
          </section>
        )}
      </div>

      {active && (
        <QuizPlayer
          quiz={active}
          isES={isES}
          onClose={() => { setActive(null); load(); }}
        />
      )}
    </>
  );
}

/* ───────── Row card in the list ───────── */
function QuizRow({
  quiz, onOpen, isES, label,
}: {
  quiz: QuizListItem;
  onOpen: () => void;
  isES: boolean;
  label: (en: string, es: string | null | undefined) => string;
}) {
  const hasScore = quiz.my_best_score !== null;
  return (
    <button
      onClick={onOpen}
      className="w-full text-left bg-white rounded-2xl border border-white/80 shadow-sm hover:shadow-md transition-shadow px-4 py-3 flex items-center gap-3"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[#1B3A6B] truncate">
          {label(quiz.title, quiz.title_es)}
        </p>
        {(quiz.description || quiz.description_es) && (
          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">
            {label(quiz.description ?? '', quiz.description_es)}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            {quiz.question_count} {isES ? (quiz.question_count === 1 ? 'pregunta' : 'preguntas') : (quiz.question_count === 1 ? 'question' : 'questions')}
          </span>
          <span className="text-gray-300">·</span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
            {isES ? 'Aprobar' : 'Pass'} {quiz.pass_threshold}%
          </span>
        </div>
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-1">
        {quiz.my_passed ? (
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wide">
            {isES ? '✓ Aprobado' : '✓ Passed'}
          </span>
        ) : hasScore ? (
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wide">
            {isES ? 'Reintentar' : 'Retry'}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-[#1B3A6B] text-white text-[10px] font-bold uppercase tracking-wide">
            {isES ? 'Empezar' : 'Start'}
          </span>
        )}
        {hasScore && (
          <span className="text-[10px] text-gray-400">
            {isES ? 'Mejor' : 'Best'}: {quiz.my_best_score}%
          </span>
        )}
      </div>
    </button>
  );
}

/* ───────── Full-screen player ───────── */
function QuizPlayer({
  quiz, isES, onClose,
}: {
  quiz: QuizDetail;
  isES: boolean;
  onClose: () => void;
}) {
  const [selections, setSelections] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const label = (en: string, es: string | null | undefined) => (isES && es ? es : en);
  const total = quiz.questions.length;
  const answered = Object.values(selections).filter((v) => !!v).length;
  const allAnswered = answered === total;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const answers = quiz.questions.map((q) => ({
      question_id: q.id,
      selected_choice_id: selections[q.id] ?? null,
    }));
    const r = await fetch(`/api/quizzes/${quiz.id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers }),
    });
    setSubmitting(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Submit failed.');
      return;
    }
    const j = (await r.json()) as SubmitResult;
    setResult(j);
  };

  const retake = () => {
    setSelections({});
    setResult(null);
    setError(null);
  };

  const detailByQ = new Map(result?.details.map((d) => [d.question_id, d]) ?? []);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F1E3C] flex flex-col overflow-y-auto">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex-shrink-0 flex items-center gap-3 px-4 py-3 pt-safe bg-[#0F1E3C]/95 backdrop-blur-sm border-b border-white/10">
        <button
          onClick={onClose}
          className="tap-highlight flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {result ? (isES ? 'Cerrar' : 'Close') : (isES ? 'Salir' : 'Exit')}
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-[10px] text-white/50 uppercase tracking-widest">
            {quiz.kind === 'exam' ? (isES ? 'Examen' : 'Exam') : (isES ? 'Cuestionario' : 'Quiz')}
            <span className="mx-1">·</span>
            {isES ? 'Aprobar' : 'Pass'} {quiz.pass_threshold}%
          </p>
          <p className="text-sm font-semibold text-white truncate">{label(quiz.title, quiz.title_es)}</p>
        </div>
        <div className="w-14 text-right text-[11px] text-white/60 font-semibold">
          {result ? '—' : `${answered}/${total}`}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-6 max-w-2xl w-full mx-auto">
        {result ? (
          <ResultScreen result={result} quiz={quiz} isES={isES} onRetake={retake} onClose={onClose} label={label} />
        ) : (
          <>
            {(quiz.description || quiz.description_es) && (
              <p className="text-sm text-white/70 leading-relaxed mb-6">
                {label(quiz.description ?? '', quiz.description_es)}
              </p>
            )}

            <div className="space-y-5">
              {quiz.questions.map((q, i) => (
                <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">
                    {isES ? 'Pregunta' : 'Question'} {i + 1} / {total}
                  </p>
                  {q.image_url && (
                    <div className="mb-3 rounded-xl overflow-hidden bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={q.image_url} alt="" className="w-full max-h-72 object-cover" loading="lazy" />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-white mb-4 leading-snug">
                    {label(q.question_text, q.question_text_es)}
                  </p>
                  <div className="space-y-2">
                    {q.choices.map((c) => {
                      const isSelected = selections[q.id] === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setSelections((prev) => ({ ...prev, [q.id]: c.id }))}
                          className={`tap-highlight w-full text-left px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-[#2E86C1] border-[#2E86C1] text-white'
                              : 'bg-white/5 border-white/10 text-white/80 hover:bg-white/10'
                          }`}
                        >
                          {label(c.choice_text, c.choice_text_es)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="mt-4 bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-3 text-xs text-red-200 font-medium">
                {error}
              </div>
            )}

            <div className="sticky bottom-0 pt-4 pb-safe -mx-4 px-4 bg-gradient-to-t from-[#0F1E3C] via-[#0F1E3C]/95 to-transparent">
              <button
                onClick={submit}
                disabled={submitting || !allAnswered}
                className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
                  submitting || !allAnswered
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg'
                }`}
              >
                {submitting
                  ? (isES ? 'Enviando…' : 'Submitting…')
                  : allAnswered
                    ? (isES ? 'Enviar respuestas' : 'Submit answers')
                    : (isES ? `Responde ${total - answered} más` : `${total - answered} more to answer`)}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ───────── Result / review screen ───────── */
function ResultScreen({
  result, quiz, isES, onRetake, onClose, label,
}: {
  result: SubmitResult;
  quiz: QuizDetail;
  isES: boolean;
  onRetake: () => void;
  onClose: () => void;
  label: (en: string, es: string | null | undefined) => string;
}) {
  const passed = result.attempt.passed;
  const detailByQ = new Map(result.details.map((d) => [d.question_id, d]));

  return (
    <div>
      <div className={`rounded-3xl border-2 p-6 text-center mb-6 ${
        passed
          ? 'border-emerald-400/40 bg-emerald-500/10'
          : 'border-amber-400/40 bg-amber-500/10'
      }`}>
        <div className="text-5xl mb-2">{passed ? '🎯' : '📚'}</div>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${
          passed ? 'text-emerald-300' : 'text-amber-300'
        }`}>
          {passed ? (isES ? 'Aprobado' : 'Passed') : (isES ? 'No aprobado' : 'Not yet')}
        </p>
        <p className="text-4xl font-bold text-white mt-2">{result.attempt.score}%</p>
        <p className="text-[11px] text-white/60 mt-1">
          {isES ? 'Aprobar' : 'Pass'} {quiz.pass_threshold}%
        </p>
      </div>

      <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">
        {isES ? 'Revisión' : 'Review'}
      </p>
      <div className="space-y-3">
        {quiz.questions.map((q, i) => {
          const d = detailByQ.get(q.id);
          const wasCorrect = d?.is_correct ?? false;
          return (
            <div
              key={q.id}
              className={`rounded-2xl border p-4 ${
                wasCorrect ? 'border-emerald-400/25 bg-emerald-500/5' : 'border-red-400/25 bg-red-500/5'
              }`}
            >
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1.5">
                {isES ? 'Pregunta' : 'Question'} {i + 1}
                <span className={`ml-2 ${wasCorrect ? 'text-emerald-300' : 'text-red-300'}`}>
                  {wasCorrect ? (isES ? '✓ Correcto' : '✓ Correct') : (isES ? '✕ Incorrecto' : '✕ Incorrect')}
                </span>
              </p>
              {q.image_url && (
                <div className="mb-3 rounded-xl overflow-hidden bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={q.image_url} alt="" className="w-full max-h-48 object-cover" loading="lazy" />
                </div>
              )}
              <p className="text-sm text-white font-semibold mb-3 leading-snug">
                {label(q.question_text, q.question_text_es)}
              </p>
              <div className="space-y-1.5">
                {q.choices.map((c) => {
                  const isPicked = d?.selected_choice_id === c.id;
                  const isKey = d?.correct_choice_id === c.id;
                  const bg =
                    isKey
                      ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
                      : isPicked
                        ? 'bg-red-500/15 border-red-400/40 text-red-100'
                        : 'bg-white/5 border-white/10 text-white/70';
                  return (
                    <div key={c.id} className={`px-3 py-2 rounded-lg border text-xs font-medium ${bg}`}>
                      <span>{label(c.choice_text, c.choice_text_es)}</span>
                      {isKey && <span className="ml-2 text-[10px] uppercase tracking-widest opacity-80">{isES ? 'Respuesta' : 'Answer'}</span>}
                      {isPicked && !isKey && <span className="ml-2 text-[10px] uppercase tracking-widest opacity-80">{isES ? 'Tu elección' : 'You picked'}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky bottom-0 pt-4 pb-safe mt-6 -mx-4 px-4 bg-gradient-to-t from-[#0F1E3C] via-[#0F1E3C]/95 to-transparent grid grid-cols-2 gap-3">
        <button
          onClick={onClose}
          className="py-3 rounded-2xl bg-white/10 text-white text-sm font-bold hover:bg-white/20"
        >
          {isES ? 'Terminar' : 'Done'}
        </button>
        <button
          onClick={onRetake}
          className="py-3 rounded-2xl bg-[#2E86C1] text-white text-sm font-bold hover:bg-[#256d9f]"
        >
          {passed ? (isES ? 'Repetir' : 'Retake') : (isES ? 'Intentar de nuevo' : 'Try again')}
        </button>
      </div>
    </div>
  );
}
