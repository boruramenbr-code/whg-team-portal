/* ───────── EmptyState ─────────
 *
 * The "nothing here yet" card, hand-rolled ~7 times across the app.
 * Always says what WILL be here — an empty screen should still teach.
 */

export interface EmptyStateProps {
  emoji: string;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ emoji, title, hint, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`text-center py-12 bg-white/60 rounded-2xl border border-white/40 ${className}`}>
      <div className="text-4xl mb-3" aria-hidden>{emoji}</div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      {hint && <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
