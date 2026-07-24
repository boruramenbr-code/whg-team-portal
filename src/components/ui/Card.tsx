'use client';

import { HTMLAttributes, forwardRef } from 'react';

/* ───────── Card ─────────
 *
 * The feed unit. Home, Training, and admin lists are stacks of these.
 * `pressable` adds the tap affordance for cards that navigate — the
 * social-feed pattern: the whole card is the button, not a tiny link.
 */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Whole-card tap affordance (hover shadow + active scale). */
  pressable?: boolean;
  /** Softer translucent style used on tinted backgrounds. */
  soft?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { pressable = false, soft = false, className = '', children, ...rest },
  ref
) {
  return (
    <div
      ref={ref}
      className={`rounded-2xl overflow-hidden ${
        soft ? 'bg-white/70 border border-white/50' : 'bg-white border border-gray-200'
      } shadow-sm ${
        pressable ? 'tap-highlight cursor-pointer hover:shadow-md active:scale-[0.99] transition-all' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
});

export default Card;
