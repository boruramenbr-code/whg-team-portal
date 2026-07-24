'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

/* ───────── Button ─────────
 *
 * The one button. Variants cover every pattern currently scattered
 * across the app; screens migrate to this instead of hand-rolling
 * className soup. Thumb-first: min 44px tap target at md size.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'amber';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-whg-navy text-white shadow-sm hover:bg-[#15305A] disabled:bg-gray-300',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:text-gray-300',
  ghost: 'bg-transparent text-whg-navy hover:bg-whg-navy/5 disabled:text-gray-300',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50 disabled:text-gray-300',
  amber: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600 disabled:bg-gray-300',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[11px] rounded-lg',
  md: 'px-4 py-2.5 text-xs rounded-xl',
  lg: 'w-full px-4 py-3 text-sm rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, className = '', children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`tap-highlight inline-flex items-center justify-center gap-1.5 font-bold transition-colors ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    >
      {loading && (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden />
      )}
      {children}
    </button>
  );
});

export default Button;
