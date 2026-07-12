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
  restaurant_id: string | null;
  question_count: number;
}

interface Question {
  id: string;
  question_text: string;
  question_text_es: string | null;
  question_type: 'multiple_choice' | 'true_false';
  sort_order: number;
  choices: Choice[];
}

interface Choice {
  id?: string;
  choice_text: string;
  choice_text_es: string | null;
  is_correct: boolean;
  sort_order: number;
}

/* ───────── Admin Quizzes Tab ─────────
 * List of authored quizzes on the left; tap one to open the editor.
 * Editor covers quiz metadata (title, kind, pass %, attach to video/
 * menu, restaurant scope) + question authoring inline.
 */
export default function QuizzesAdminTab() {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);

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

  const deleteQuiz = async (id: string) => {
    if (!confirm('Delete this quiz? All questions, choices, and attempt records will be removed. This cannot be undone.')) return;
    const r = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      alert(j.error || 'Delete failed.');
      return;
    }
    load();
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#1B3A6B]">Quizzes & Exams</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Exams gate floor-ready status (Phase C). Quizzes are optional knowledge checks. All auto-graded.
          </p>
        </div>
        <button
          onClick={() => setEditing({ id: null })}
          className="flex-shrink-0 px-3 py-2 rounded-lg bg-[#1B3A6B] text-white text-xs font-semibold hover:bg-[#15305A] transition-colors"
        >
          + New Quiz
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-400">Loading…</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12 bg-white/60 rounded-2xl border border-white/40">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm text-gray-500 font-medium">No quizzes yet.</p>
          <p className="text-xs text-gray-400 mt-1">Create your first quiz to start authoring questions.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {quizzes.map((q) => (
            <div key={q.id} className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[#1B3A6B] truncate">{q.title}</p>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                    q.kind === 'exam' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {q.kind}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-0.5">
                  <span>{q.question_count} {q.question_count === 1 ? 'question' : 'questions'}</span>
                  <span>·</span>
                  <span>Pass {q.pass_threshold}%</span>
                  <span>·</span>
                  <span className="uppercase">{q.applies_to}</span>
                  {q.video_id && (<><span>·</span><span>Video</span></>)}
                  {q.menu_category_id && (<><span>·</span><span>Menu</span></>)}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => setEditing({ id: q.id })} className="px-2 py-1 text-[11px] font-semibold text-[#2E86C1] hover:bg-blue-50 rounded">
                  Edit
                </button>
                <button onClick={() => deleteQuiz(q.id)} className="px-2 py-1 text-[11px] font-semibold text-red-500 hover:bg-red-50 rounded">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <QuizEditor
          quizId={editing.id}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

/* ───────── Quiz editor (metadata + question list) ───────── */
function QuizEditor({
  quizId, onClose, onSaved,
}: {
  quizId: string | null;   // null = create new
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!quizId;

  const [title, setTitle] = useState('');
  const [titleEs, setTitleEs] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEs, setDescriptionEs] = useState('');
  const [kind, setKind] = useState<'exam' | 'quiz'>('quiz');
  const [passThreshold, setPassThreshold] = useState(80);
  const [appliesTo, setAppliesTo] = useState<'all' | 'foh' | 'boh' | 'mgmt'>('all');
  const [restaurantId, setRestaurantId] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('');
  const [menuCategoryId, setMenuCategoryId] = useState<string>('');

  const [restaurants, setRestaurants] = useState<{ id: string; name: string }[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [dirtyMeta, setDirtyMeta] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | 'new' | null>(null);
  const [savedQuizId, setSavedQuizId] = useState<string | null>(quizId);

  // Load quiz + questions if editing.
  const load = useCallback(async () => {
    if (!savedQuizId) return;
    const r = await fetch(`/api/quizzes/${savedQuizId}?mode=edit`);
    if (!r.ok) return;
    const j = await r.json();
    const q = j.quiz;
    if (!q) return;
    setTitle(q.title || '');
    setTitleEs(q.title_es || '');
    setDescription(q.description || '');
    setDescriptionEs(q.description_es || '');
    setKind(q.kind || 'quiz');
    setPassThreshold(q.pass_threshold ?? 80);
    setAppliesTo(q.applies_to || 'all');
    setRestaurantId(q.restaurant_id || '');
    setVideoId(q.video_id || '');
    setMenuCategoryId(q.menu_category_id || '');
    setQuestions(q.questions || []);
    setDirtyMeta(false);
  }, [savedQuizId]);

  useEffect(() => { load(); }, [load]);

  // Load restaurants once for the scope picker.
  useEffect(() => {
    fetch('/api/restaurants').then((r) => r.ok ? r.json() : { restaurants: [] }).then((j) => {
      setRestaurants(j.restaurants || []);
    }).catch(() => {});
  }, []);

  const saveMeta = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    setSavingMeta(true); setError(null);
    const body = {
      title, title_es: titleEs, description, description_es: descriptionEs,
      kind, pass_threshold: passThreshold, applies_to: appliesTo,
      restaurant_id: restaurantId || null, video_id: videoId || null,
      menu_category_id: menuCategoryId || null,
    };
    let url = '/api/quizzes';
    let method: 'POST' | 'PATCH' = 'POST';
    if (savedQuizId) { url = `/api/quizzes/${savedQuizId}`; method = 'PATCH'; }
    const r = await fetch(url, {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setSavingMeta(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Save failed.'); return;
    }
    const j = await r.json();
    if (!savedQuizId && j.quiz?.id) {
      setSavedQuizId(j.quiz.id);
      setCreating(true);
      setDirtyMeta(false);
    } else {
      setDirtyMeta(false);
      onSaved();
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    const r = await fetch(`/api/quizzes/questions?id=${id}`, { method: 'DELETE' });
    if (!r.ok) { alert('Delete failed'); return; }
    load();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-bold text-[#1B3A6B]">
            {isEdit || savedQuizId ? 'Edit Quiz' : 'New Quiz'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Metadata */}
          <section className="space-y-4">
            <Field label="Title">
              <input
                type="text" value={title}
                onChange={(e) => { setTitle(e.target.value); setDirtyMeta(true); }}
                placeholder="e.g. Ichiban Signature Rolls Exam"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B]"
              />
            </Field>
            <Field label="Title (Spanish, optional)">
              <input
                type="text" value={titleEs}
                onChange={(e) => { setTitleEs(e.target.value); setDirtyMeta(true); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B]"
              />
            </Field>
            <Field label="Description (optional)">
              <textarea
                value={description} rows={2}
                onChange={(e) => { setDescription(e.target.value); setDirtyMeta(true); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B]"
              />
            </Field>
            <Field label="Description (Spanish, optional)">
              <textarea
                value={descriptionEs} rows={2}
                onChange={(e) => { setDescriptionEs(e.target.value); setDirtyMeta(true); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B]"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Kind">
                <select
                  value={kind}
                  onChange={(e) => { setKind(e.target.value as 'exam' | 'quiz'); setDirtyMeta(true); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="quiz">Quiz (optional)</option>
                  <option value="exam">Exam (gates floor-ready)</option>
                </select>
              </Field>
              <Field label="Pass Threshold %">
                <input
                  type="number" min={0} max={100} value={passThreshold}
                  onChange={(e) => { setPassThreshold(Number(e.target.value)); setDirtyMeta(true); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Applies To">
                <select
                  value={appliesTo}
                  onChange={(e) => { setAppliesTo(e.target.value as 'all' | 'foh' | 'boh' | 'mgmt'); setDirtyMeta(true); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="all">All staff</option>
                  <option value="foh">FOH only</option>
                  <option value="boh">BOH only</option>
                  <option value="mgmt">Managers only</option>
                </select>
              </Field>
              <Field label="Restaurant Scope">
                <select
                  value={restaurantId}
                  onChange={(e) => { setRestaurantId(e.target.value); setDirtyMeta(true); }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                >
                  <option value="">All restaurants</option>
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </Field>
            </div>
          </section>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={saveMeta}
            disabled={savingMeta || (!dirtyMeta && !!savedQuizId)}
            className={`w-full py-3 rounded-xl font-semibold text-sm ${
              savingMeta || (!dirtyMeta && !!savedQuizId)
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#15305A]'
            }`}
          >
            {savingMeta
              ? 'Saving…'
              : savedQuizId
                ? (dirtyMeta ? 'Save changes' : 'Saved')
                : 'Create quiz'}
          </button>

          {/* Questions — only after the quiz has been created */}
          {savedQuizId && (
            <section className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-[#1B3A6B]">Questions</h3>
                <button
                  onClick={() => setEditingQuestion('new')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#2E86C1] text-white text-[11px] font-semibold hover:bg-[#256d9f]"
                >
                  + Add question
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500">No questions yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {questions.map((q, i) => (
                    <div key={q.id} className="border border-gray-200 rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <span className="text-[10px] font-bold text-gray-400 mt-0.5">Q{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 font-semibold leading-snug">{q.question_text}</p>
                          <p className="text-[10px] uppercase tracking-wide text-gray-400 font-bold mt-0.5">
                            {q.question_type === 'true_false' ? 'True / False' : 'Multiple choice'}
                          </p>
                        </div>
                        <button
                          onClick={() => setEditingQuestion(q)}
                          className="px-1.5 py-0.5 text-[10px] font-semibold text-[#2E86C1] hover:bg-blue-50 rounded"
                        >Edit</button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="px-1.5 py-0.5 text-[10px] font-semibold text-red-500 hover:bg-red-50 rounded"
                        >Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {creating && (
            <p className="text-[11px] text-emerald-600 font-semibold text-center">
              Quiz created. Add questions above, then hit Done.
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200"
          >
            Done
          </button>
        </div>
      </div>

      {editingQuestion && savedQuizId && (
        <QuestionEditor
          quizId={savedQuizId}
          initial={editingQuestion === 'new' ? null : editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onSaved={() => { setEditingQuestion(null); load(); }}
        />
      )}
    </div>
  );
}

/* ───────── Question editor modal ───────── */
function QuestionEditor({
  quizId, initial, onClose, onSaved,
}: {
  quizId: string;
  initial: Question | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [text, setText] = useState(initial?.question_text || '');
  const [textEs, setTextEs] = useState(initial?.question_text_es || '');
  const [type, setType] = useState<'multiple_choice' | 'true_false'>(initial?.question_type || 'multiple_choice');
  const [sortOrder, setSortOrder] = useState(initial?.sort_order || 100);
  const [choices, setChoices] = useState<Choice[]>(
    initial?.choices?.map((c) => ({
      id: c.id, choice_text: c.choice_text, choice_text_es: c.choice_text_es,
      is_correct: c.is_correct, sort_order: c.sort_order,
    })) ?? [
      { choice_text: '', choice_text_es: null, is_correct: true, sort_order: 100 },
      { choice_text: '', choice_text_es: null, is_correct: false, sort_order: 200 },
    ]
  );
  const [tfCorrect, setTfCorrect] = useState<'true' | 'false'>(
    initial?.question_type === 'true_false'
      ? (initial?.choices?.[0]?.is_correct ? 'true' : 'false')
      : 'true'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addChoice = () => setChoices([...choices, {
    choice_text: '', choice_text_es: null, is_correct: false,
    sort_order: (choices.length + 1) * 100,
  }]);

  const removeChoice = (idx: number) => {
    if (choices.length <= 2) return;
    setChoices(choices.filter((_, i) => i !== idx));
  };

  const setCorrect = (idx: number) => {
    setChoices(choices.map((c, i) => ({ ...c, is_correct: i === idx })));
  };

  const save = async () => {
    if (!text.trim()) { setError('Question text is required.'); return; }

    let payload: Record<string, unknown>;
    if (type === 'true_false') {
      payload = {
        quiz_id: quizId,
        question_text: text,
        question_text_es: textEs,
        question_type: 'true_false',
        sort_order: sortOrder,
        choices: [
          { choice_text: 'True',  is_correct: tfCorrect === 'true' },
          { choice_text: 'False', is_correct: tfCorrect === 'false' },
        ],
      };
    } else {
      if (choices.length < 2) { setError('Multiple choice needs at least 2 choices.'); return; }
      if (choices.filter((c) => c.is_correct).length !== 1) {
        setError('Pick exactly one correct answer.'); return;
      }
      if (choices.some((c) => !c.choice_text.trim())) {
        setError('Every choice needs text.'); return;
      }
      payload = {
        quiz_id: quizId,
        question_text: text,
        question_text_es: textEs,
        question_type: 'multiple_choice',
        sort_order: sortOrder,
        choices,
      };
    }

    setSaving(true); setError(null);
    const url = isEdit
      ? `/api/quizzes/questions?id=${initial!.id}`
      : '/api/quizzes/questions';
    const method = isEdit ? 'PATCH' : 'POST';
    const r = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setError(j.error || 'Save failed.'); return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl md:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-base font-bold text-[#1B3A6B]">{isEdit ? 'Edit Question' : 'Add Question'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <Field label="Question">
            <textarea
              value={text} rows={2}
              onChange={(e) => setText(e.target.value)}
              placeholder="What are the primary ingredients in a Rainbow Roll?"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B]"
            />
          </Field>
          <Field label="Question (Spanish, optional)">
            <textarea
              value={textEs} rows={2}
              onChange={(e) => setTextEs(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'multiple_choice' | 'true_false')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="multiple_choice">Multiple choice</option>
                <option value="true_false">True / False</option>
              </select>
            </Field>
            <Field label="Sort Order">
              <input
                type="number" value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </Field>
          </div>

          {type === 'true_false' ? (
            <Field label="Correct answer">
              <div className="grid grid-cols-2 gap-2">
                {(['true', 'false'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setTfCorrect(v)}
                    className={`py-2 rounded-lg border-2 text-sm font-semibold capitalize ${
                      tfCorrect === v
                        ? 'bg-[#1B3A6B] border-[#1B3A6B] text-white'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </Field>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Choices</span>
                <button
                  onClick={addChoice}
                  className="text-[11px] font-semibold text-[#2E86C1]"
                >+ Add choice</button>
              </div>
              <div className="space-y-2">
                {choices.map((c, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      onClick={() => setCorrect(idx)}
                      className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        c.is_correct
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      }`}
                      title={c.is_correct ? 'Correct answer' : 'Mark correct'}
                    >
                      {c.is_correct && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      )}
                    </button>
                    <input
                      type="text" value={c.choice_text}
                      onChange={(e) => {
                        const next = [...choices]; next[idx] = { ...c, choice_text: e.target.value };
                        setChoices(next);
                      }}
                      placeholder={`Choice ${idx + 1}`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-[#1B3A6B]"
                    />
                    {choices.length > 2 && (
                      <button
                        onClick={() => removeChoice(idx)}
                        className="flex-shrink-0 text-gray-400 hover:text-red-500 px-1 text-lg leading-none"
                        title="Remove"
                      >×</button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">Tap the circle to mark the correct answer.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || !text.trim()}
            className={`w-full py-3 rounded-xl font-semibold text-sm ${
              saving || !text.trim()
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-[#1B3A6B] text-white hover:bg-[#15305A]'
            }`}
          >
            {saving ? 'Saving…' : (isEdit ? 'Save changes' : 'Add question')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Small helper ───────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
