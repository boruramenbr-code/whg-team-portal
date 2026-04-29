'use client';

import { useEffect, useState } from 'react';

interface WelcomeMessage {
  id: string;
  content: string;
  content_es: string | null;
  updated_at: string;
}

interface WelcomeNoteModalProps {
  /** When true, force show the modal even if previously dismissed (used by (ℹ️) icon) */
  forceOpen?: boolean;
  /** Called when modal closes (parent can clear forceOpen state) */
  onClose?: () => void;
}

/**
 * Yellow sticky-note style modal that appears on a user's first login (when
 * profiles.welcome_dismissed_at IS NULL) and persists until dismissed.
 *
 * Tap "Got it" → POST /api/welcome/dismiss → modal closes, never shows again
 * for that user (until they tap the (ℹ️) info icon to re-open).
 */
export default function WelcomeNoteModal({ forceOpen, onClose }: WelcomeNoteModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissing, setDismissing] = useState(false);
  const [message, setMessage] = useState<WelcomeMessage | null>(null);
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  // Load on mount and whenever forceOpen flips to true
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/welcome', { cache: 'no-store' });
        if (!r.ok) {
          if (!cancelled) setLoading(false);
          return;
        }
        const d = await r.json();
        if (cancelled) return;
        setMessage(d.message || null);
        setLanguage((d.preferred_language as 'en' | 'es') || 'en');
        // Open if not yet dismissed OR if parent forced it open
        const shouldShow = (!d.dismissed && !!d.message) || forceOpen;
        setOpen(!!shouldShow);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [forceOpen]);

  // If parent toggles forceOpen mid-mount, sync open state
  useEffect(() => {
    if (forceOpen && message) setOpen(true);
  }, [forceOpen, message]);

  const handleDismiss = async () => {
    setDismissing(true);
    try {
      // Only persist dismissal if this isn't a re-open from the info icon.
      // forceOpen means parent wants to re-show — closing it shouldn't re-dismiss.
      if (!forceOpen) {
        await fetch('/api/welcome/dismiss', { method: 'POST' });
      }
    } finally {
      setOpen(false);
      setDismissing(false);
      onClose?.();
    }
  };

  if (loading || !open || !message) return null;

  const content = language === 'es' && message.content_es
    ? message.content_es
    : message.content;
  const isES = language === 'es' && !!message.content_es;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg my-auto"
        style={{ transform: 'rotate(-1.2deg)' }}
      >
        {/* Yellow sticky note */}
        <div className="bg-gradient-to-br from-yellow-200 to-yellow-100 rounded-md shadow-2xl p-7 border-l-[6px] border-yellow-400/60">
          {/* Pin / sticker accent */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-3 bg-yellow-400/40 rounded-full blur-sm" />

          {/* Header */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">📌</span>
            <p className="text-[10px] font-bold text-yellow-900/70 uppercase tracking-widest">
              {isES ? 'Para leer una vez' : 'Read me once'}
            </p>
          </div>

          {/* Content — preserved formatting */}
          <div className="text-[15px] text-yellow-950 leading-relaxed whitespace-pre-wrap font-medium">
            {content}
          </div>

          {/* Got it button */}
          <div className="mt-6 pt-5 border-t border-yellow-400/40">
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="w-full bg-yellow-900 hover:bg-yellow-950 text-yellow-50 font-bold py-3 rounded-lg transition-colors disabled:opacity-60 text-sm tracking-wide"
            >
              {dismissing
                ? (isES ? 'Cerrando...' : 'Closing...')
                : (isES ? '✓ Entendido — vamos' : '✓ Got it — let\'s go')}
            </button>
            <p className="text-center text-[11px] text-yellow-900/60 mt-2">
              {isES
                ? 'Puedes volver a ver este mensaje tocando el ícono ℹ️ en la parte superior.'
                : 'Tap the ℹ️ icon up top any time to see this again.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
