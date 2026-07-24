'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

/* ───────── Form fields ─────────
 *
 * One consistent input family for every editor/modal. 16px font on
 * inputs is deliberate — anything smaller makes iOS Safari zoom the
 * whole page on focus.
 */

const FIELD_CLS =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-base md:text-sm ' +
  'focus:outline-none focus:border-whg-navy focus:ring-1 focus:ring-whg-navy/20 ' +
  'placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-400';

export function FieldLabel({ children, hint, className = '' }: { children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <label className={`block mb-1.5 ${className}`}>
      <span className="text-xs font-bold text-gray-700">{children}</span>
      {hint && <span className="ml-1.5 text-[10px] text-gray-400 font-normal">{hint}</span>}
    </label>
  );
}

export function TextInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${FIELD_CLS} ${className}`} {...rest} />;
}

export function TextArea({ className = '', ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${FIELD_CLS} min-h-[90px] ${className}`} {...rest} />;
}

export function Select({ className = '', children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${FIELD_CLS} appearance-none ${className}`} {...rest}>
      {children}
    </select>
  );
}

/** Search input with the leading 🔍 — the browse-screen standard. */
export function SearchInput({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" aria-hidden>🔍</span>
      <input type="search" className={`${FIELD_CLS} pl-9`} {...rest} />
    </div>
  );
}
