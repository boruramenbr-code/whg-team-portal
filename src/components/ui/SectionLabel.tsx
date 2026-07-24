/* ───────── SectionLabel ─────────
 *
 * The band header used to split feeds and grids (📚 Study & Knowledge,
 * 🍽️ The Menu, 🧰 Systems & Tools). `divider` renders the centered
 * line-through style used between menu bands.
 */

export interface SectionLabelProps {
  children: React.ReactNode;
  /** Centered with flanking rules (the between-bands separator). */
  divider?: boolean;
  /** gray = de-emphasized ("Everything Else"), amber = "yours" bands. */
  tone?: 'navy' | 'gray' | 'amber';
  className?: string;
}

const TONES = { navy: 'text-whg-navy', gray: 'text-gray-400', amber: 'text-amber-700' };

export default function SectionLabel({ children, divider = false, tone = 'navy', className = '' }: SectionLabelProps) {
  const label = (
    <span className={`text-[10px] font-bold uppercase tracking-widest ${TONES[tone]}`}>{children}</span>
  );
  if (!divider) return <p className={`mb-2 ${className}`}>{label}</p>;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="flex-1 h-px bg-whg-navy/25" />
      {label}
      <div className="flex-1 h-px bg-whg-navy/25" />
    </div>
  );
}
