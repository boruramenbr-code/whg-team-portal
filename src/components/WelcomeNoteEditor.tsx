'use client';

import { useState, useEffect, useCallback } from 'react';

interface WelcomeMessage {
  id: string;
  content: string;
  content_es: string | null;
  updated_at: string;
}

/**
 * Admin-only editor for the canonical welcome note.
 * Edits create a new active row (history preserved). Side-effect: future
 * staff who haven't dismissed yet still see the latest version on first
 * login. Already-dismissed staff don't auto-see updates — they can hit
 * the (ℹ️) icon to view.
 */
export default function WelcomeNoteEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [content, setContent] = useState('');
  const [contentEs, setContentEs] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<'en' | 'es'>('en');

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/welcome', { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      const msg: WelcomeMessage | null = d.message;
      setContent(msg?.content || '');
      setContentEs(msg?.content_es || '');
      setLastUpdated(msg?.updated_at || null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    if (!content.trim()) {
      setError('English content is required.');
      return;
    }
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/welcome', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, content_es: contentEs }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save');
      } else {
        setSaved(true);
        await load();
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetMyView = async () => {
    if (!confirm('Reset YOUR welcome note? It will show up the next time you load the home tab. (Doesn\'t affect other staff.)')) return;
    setResetting(true);
    try {
      await fetch('/api/welcome/dismiss', { method: 'DELETE' });
      alert('Reset. Refresh the home tab to see the welcome note.');
    } finally {
      setResetting(false);
    }
  };

  const formatUpdated = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">📌</span>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Welcome Note</h3>
            <p className="text-[11px] text-gray-500">
              The yellow sticky-note shown on a staff member&apos;s first login. Bilingual.
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
        ) : (
          <>
            {/* Language tabs */}
            <div className="flex gap-2">
              {(['en', 'es'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                    activeLang === lang
                      ? 'bg-[#1B3A6B] text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {lang === 'en' ? '🇺🇸 English' : '🇲🇽 Español'}
                </button>
              ))}
            </div>

            {activeLang === 'en' ? (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  English content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={14}
                  placeholder="Write the welcome note that staff will see on their first login..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 font-mono leading-relaxed"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Plain text. Use blank lines between paragraphs. Use ALL-CAPS for section headers.
                </p>
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Spanish content
                </label>
                <textarea
                  value={contentEs}
                  onChange={(e) => setContentEs(e.target.value)}
                  rows={14}
                  placeholder="Versión en español..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-300 font-mono leading-relaxed"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Shown to staff with preferred_language = es. Leave blank to fall back to English for everyone.
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">
                {error}
              </div>
            )}
            {saved && (
              <div className="bg-green-50 border border-green-100 text-green-700 text-sm px-4 py-2.5 rounded-xl">
                Welcome note saved. New staff will see this on their first login.
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-bold py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm"
              >
                {saving ? 'Saving...' : 'Save Welcome Note'}
              </button>
              <button
                onClick={handleResetMyView}
                disabled={resetting}
                className="px-4 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl text-xs font-semibold disabled:opacity-60"
                title="See it as a new staff member would"
              >
                Preview as new hire
              </button>
            </div>

            {lastUpdated && (
              <p className="text-[11px] text-gray-400 text-center">
                Last updated {formatUpdated(lastUpdated)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
