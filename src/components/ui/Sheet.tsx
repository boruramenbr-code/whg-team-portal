'use client';

import { ReactNode, useEffect } from 'react';

/* ───────── Sheet ─────────
 *
 * The mobile-native replacement for centered modals: slides up from
 * the bottom on phones (thumb reach, swipe-down feel), centers as a
 * dialog on md+ screens. Backdrop tap and Escape both close.
 *
 * Migration target for the app's editor/detail modals — one overlay
 * pattern everywhere instead of six hand-rolled ones.
 */

export interface SheetProps {
  onClose: () => void;
  children: ReactNode;
  /** Sheet title row; omit for fully custom headers. */
  title?: ReactNode;
  /** Max height of the sheet on mobile (defaults to 92dvh). */
  className?: string;
}

export default function Sheet({ onClose, title, className = '', children }: SheetProps) {
  // Escape closes; body scroll locks while open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-[2px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-xl max-h-[92dvh] md:max-h-[85dvh] flex flex-col animate-sheet-up ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag-handle affordance (visual only — tap backdrop to close) */}
        <div className="md:hidden flex-shrink-0 pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>
        {title !== undefined && (
          <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 pt-2 md:pt-5 pb-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-whg-navy min-w-0 truncate">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="tap-highlight flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
