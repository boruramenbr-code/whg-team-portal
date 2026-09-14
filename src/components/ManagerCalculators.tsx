'use client';

import { useState } from 'react';
import type { LessonWidget, Pillar } from '@/lib/menu-constants';

/* ───────── Manager Academy practice calculators ─────────
 *
 * Teaching tools, not payroll software. Every number is an editable input.
 * Federal and Louisiana figures default to the current published numbers
 * (sources in each footnote); anything WHG-specific — unemployment rate,
 * workers' comp, benefits, labor targets — starts as a labeled example.
 *
 * When federal or Louisiana numbers change: update the constants below,
 * RATES_CHECKED, and the footnote text together.
 */

export type CalculatorKey = LessonWidget;

const RATES_CHECKED = { en: 'September 13, 2026', es: '13 de septiembre de 2026' };

const SS_RATE = 6.2;               // employer Social Security, %
const SS_WAGE_BASE = 184500;       // 2026 (Social Security Administration)
const MEDICARE_RATE = 1.45;        // employer Medicare, %, no cap
const FUTA_NET_RATE = 0.6;         // 6.0% less the 5.4% state credit
const FUTA_WAGE_BASE = 7000;
const LA_UI_WAGE_BASE = 7000;      // 2026 (Louisiana Workforce Commission)
const FEDERAL_MIN_WAGE = 7.25;
const TIPPED_CASH_WAGE = 2.13;
const TIP_CREDIT_BASE_WAGE = 5.15; // IRC §45B uses the 2007 minimum wage
const WEEKS_PER_YEAR = 52;

export const CALCULATORS: {
  key: CalculatorKey;
  emoji: string;
  pillar: Pillar;
  title: string;
  titleEs: string;
  blurb: string;
  blurbEs: string;
}[] = [
  {
    key: 'true_cost',
    emoji: '💵',
    pillar: 'administration',
    title: 'True cost of an employee',
    titleEs: 'Costo real de un empleado',
    blurb: 'Pay + payroll taxes + benefits = what a person really costs.',
    blurbEs: 'Pago + impuestos de nómina + beneficios = lo que realmente cuesta.',
  },
  {
    key: 'labor_budget',
    emoji: '🧮',
    pillar: 'operations',
    title: 'Sales → labor budget → hours',
    titleEs: 'Ventas → presupuesto → horas',
    blurb: 'Turn projected sales into FOH and BOH hours you can schedule.',
    blurbEs: 'Convierte las ventas proyectadas en horas de FOH y BOH.',
  },
];

const num = (s: string) => {
  const n = parseFloat(s);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

const money = (n: number, cents = false) =>
  n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  });

const oneDecimal = (n: number) => (Math.round(n * 10) / 10).toLocaleString('en-US');

/* ───────── Full-screen sheet (Academy → Practice) ───────── */
export function CalculatorSheet({ which, language, onClose }: {
  which: CalculatorKey;
  language: 'en' | 'es';
  onClose: () => void;
}) {
  const isES = language === 'es';
  const meta = CALCULATORS.find((c) => c.key === which);
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 pt-safe bg-[#1B3A6B]">
        <button
          onClick={onClose}
          className="tap-highlight flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium py-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          {isES ? 'Volver' : 'Back'}
        </button>
        <p className="min-w-0 flex-1 text-sm font-semibold text-white truncate text-right">
          {meta ? `${meta.emoji} ${isES ? meta.titleEs : meta.title}` : ''}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto pb-safe">
        <div className="max-w-2xl mx-auto px-5 py-5">
          <CalculatorBlock which={which} language={language} />
        </div>
      </div>
    </div>
  );
}

/** The calculator itself — also rendered inside an Academy lesson card. */
export function CalculatorBlock({ which, language }: { which: CalculatorKey; language: 'en' | 'es' }) {
  const isES = language === 'es';
  return which === 'true_cost' ? <TrueCostCalculator isES={isES} /> : <LaborBudgetCalculator isES={isES} />;
}

/* ───────── Shared pieces ───────── */
function NumField({ label, value, onChange, prefix, suffix, hint }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold uppercase tracking-wide text-gray-500 mb-1">{label}</span>
      <span className="flex items-center rounded-lg border border-gray-300 bg-white focus-within:border-[#1B3A6B] focus-within:ring-1 focus-within:ring-[#1B3A6B]/20">
        {prefix && <span className="pl-3 text-sm text-gray-400">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full min-w-0 bg-transparent px-2 py-2 text-base text-gray-900 focus:outline-none"
        />
        {suffix && <span className="pr-3 text-xs text-gray-400 whitespace-nowrap">{suffix}</span>}
      </span>
      {hint && <span className="block text-[10px] text-gray-400 mt-1 leading-snug">{hint}</span>}
    </label>
  );
}

function Line({ label, value, note, strong = false, muted = false }: {
  label: string;
  value: string;
  note?: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${strong ? 'border-t border-gray-200 mt-1 pt-2.5' : ''}`}>
      <span className={`text-sm ${strong ? 'font-bold text-gray-900' : muted ? 'text-gray-400' : 'text-gray-700'}`}>
        {label}
        {note && <span className="block text-[10px] font-normal text-gray-400 leading-snug">{note}</span>}
      </span>
      <span className={`text-sm tabular-nums whitespace-nowrap ${strong ? 'font-bold text-gray-900' : muted ? 'text-gray-400' : 'font-semibold text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
}

function Segmented<T extends string>({ options, value, onChange }: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${
            value === o.key ? 'bg-white text-[#1B3A6B] shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{children}</p>;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1B3A6B] text-white text-xs font-bold flex items-center justify-center mt-0.5">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900">{title}</p>
        <div className="mt-1.5">{children}</div>
      </div>
    </div>
  );
}

/* ───────── True cost of an employee ───────── */
function TrueCostCalculator({ isES }: { isES: boolean }) {
  const t = (en: string, es: string) => (isES ? es : en);
  const [payType, setPayType] = useState<'hourly' | 'tipped' | 'salary'>('hourly');
  const [wage, setWage] = useState('15');
  const [cashWage, setCashWage] = useState(String(TIPPED_CASH_WAGE));
  const [tipsPerHour, setTipsPerHour] = useState('14');
  const [hoursPerWeek, setHoursPerWeek] = useState('30');
  const [salary, setSalary] = useState('50000');
  const [salaryHours, setSalaryHours] = useState('50');
  // WHG-specific — examples until the owner fills in real rates.
  const [uiRate, setUiRate] = useState('1.5');
  const [compPer100, setCompPer100] = useState('1');
  const [healthMonthly, setHealthMonthly] = useState('0');
  const [matchPct, setMatchPct] = useState('0');
  const [ptoHours, setPtoHours] = useState('0');
  const [otherYearly, setOtherYearly] = useState('0');

  const tipped = payType === 'tipped';
  const salaried = payType === 'salary';
  const weeklyHours = num(salaried ? salaryHours : hoursPerWeek);
  const yearlyHours = weeklyHours * WEEKS_PER_YEAR;
  const hourlyRate = salaried
    ? (yearlyHours > 0 ? num(salary) / yearlyHours : 0)
    : tipped ? num(cashWage) : num(wage);
  const basePay = salaried ? num(salary) : hourlyRate * yearlyHours;
  const tips = tipped ? num(tipsPerHour) * yearlyHours : 0;
  // Tip credit rule: cash wage + tips must reach the federal minimum wage,
  // or the restaurant pays the difference.
  const makeUp = tipped
    ? Math.max(0, FEDERAL_MIN_WAGE - (num(cashWage) + num(tipsPerHour))) * yearlyHours
    : 0;
  // A salaried person's vacation is already inside their salary.
  const ptoPay = salaried ? 0 : num(ptoHours) * hourlyRate;
  const payroll = basePay + makeUp + ptoPay;
  // Reported tips count as wages for payroll taxes, even though guests pay them.
  const taxable = payroll + tips;
  const socialSecurity = Math.min(taxable, SS_WAGE_BASE) * (SS_RATE / 100);
  const medicare = taxable * (MEDICARE_RATE / 100);
  const futa = Math.min(taxable, FUTA_WAGE_BASE) * (FUTA_NET_RATE / 100);
  const stateUi = Math.min(taxable, LA_UI_WAGE_BASE) * (num(uiRate) / 100);
  const workersComp = (payroll / 100) * num(compPer100);
  const health = num(healthMonthly) * 12;
  const match = payroll * (num(matchPct) / 100);
  const other = num(otherYearly);
  const trueCost = payroll + socialSecurity + medicare + futa + stateUi + workersComp + health + match + other;
  const onTop = trueCost - payroll;
  const onTopPct = payroll > 0 ? (onTop / payroll) * 100 : 0;
  // §45B estimate: employer Social Security + Medicare on tips above what it
  // takes to reach $5.15/hour. Claimed on the tax return, not in payroll.
  const creditableTips = tipped
    ? Math.max(0, tips - Math.max(0, TIP_CREDIT_BASE_WAGE - num(cashWage)) * yearlyHours)
    : 0;
  const tipCredit = creditableTips * ((SS_RATE + MEDICARE_RATE) / 100);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1B3A6B] leading-tight">
          💵 {t('True cost of an employee', 'Costo real de un empleado')}
        </h2>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          {t(
            'A $1,000 paycheck doesn’t cost the restaurant $1,000. Payroll taxes, insurance, and benefits sit on top of pay. Change any number to see how it moves.',
            'Un cheque de $1,000 no le cuesta $1,000 al restaurante. Los impuestos de nómina, el seguro y los beneficios van encima del pago. Cambia cualquier número para ver cómo se mueve.'
          )}
        </p>
      </div>

      <Segmented
        options={[
          { key: 'hourly', label: t('Hourly', 'Por hora') },
          { key: 'tipped', label: t('Tipped', 'Con propinas') },
          { key: 'salary', label: t('Salary', 'Salario') },
        ]}
        value={payType}
        onChange={setPayType}
      />

      <div className="grid grid-cols-2 gap-3">
        {payType === 'hourly' && (
          <>
            <NumField label={t('Hourly pay', 'Pago por hora')} prefix="$" value={wage} onChange={setWage} />
            <NumField label={t('Hours per week', 'Horas por semana')} value={hoursPerWeek} onChange={setHoursPerWeek} />
          </>
        )}
        {tipped && (
          <>
            <NumField
              label={t('Cash wage per hour', 'Pago por hora')}
              prefix="$"
              value={cashWage}
              onChange={setCashWage}
              hint={t('Federal minimum for tipped staff: $2.13', 'Mínimo federal con propinas: $2.13')}
            />
            <NumField label={t('Reported tips per hour', 'Propinas reportadas por hora')} prefix="$" value={tipsPerHour} onChange={setTipsPerHour} />
            <NumField label={t('Hours per week', 'Horas por semana')} value={hoursPerWeek} onChange={setHoursPerWeek} />
          </>
        )}
        {salaried && (
          <>
            <NumField label={t('Yearly salary', 'Salario anual')} prefix="$" value={salary} onChange={setSalary} />
            <NumField
              label={t('Hours per week', 'Horas por semana')}
              value={salaryHours}
              onChange={setSalaryHours}
              hint={t('Used for cost per hour', 'Para el costo por hora')}
            />
          </>
        )}
      </div>

      <div>
        <SectionTitle>{t('Employer costs — example numbers', 'Costos del empleador — números de ejemplo')}</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <NumField
            label={t('Louisiana unemployment rate', 'Tasa de desempleo de Luisiana')}
            suffix="%"
            value={uiRate}
            onChange={setUiRate}
            hint={t('Each employer’s rate is on its yearly notice', 'Cada empleador recibe su tasa en un aviso anual')}
          />
          <NumField
            label={t("Workers' comp per $100 of pay", 'Seguro laboral por cada $100')}
            prefix="$"
            value={compPer100}
            onChange={setCompPer100}
            hint={t('From the insurance policy', 'Viene de la póliza de seguro')}
          />
          <NumField label={t('Health insurance (employer) / month', 'Seguro médico (empleador) / mes')} prefix="$" value={healthMonthly} onChange={setHealthMonthly} />
          <NumField label={t('401(k) match', 'Aporte al 401(k)')} suffix={t('% of pay', '% del pago')} value={matchPct} onChange={setMatchPct} />
          {!salaried && (
            <NumField label={t('Paid time off / year', 'Tiempo pagado / año')} suffix={t('hours', 'horas')} value={ptoHours} onChange={setPtoHours} />
          )}
          <NumField
            label={t('Other costs / year', 'Otros costos / año')}
            prefix="$"
            value={otherYearly}
            onChange={setOtherYearly}
            hint={t('Bonuses, uniforms, staff meals', 'Bonos, uniformes, comidas')}
          />
        </div>
      </div>

      {/* Result */}
      <div className="rounded-2xl bg-[#1B3A6B] text-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">{t('True cost', 'Costo real')}</p>
        <p className="text-3xl font-bold tabular-nums">
          {money(trueCost)} <span className="text-sm font-semibold text-white/70">/ {t('year', 'año')}</span>
        </p>
        <p className="text-sm text-white/85 tabular-nums mt-0.5">
          {money(trueCost / WEEKS_PER_YEAR)} / {t('week', 'semana')} · {money(yearlyHours > 0 ? trueCost / yearlyHours : 0, true)} / {t('hour worked', 'hora trabajada')}
        </p>
        <p className="mt-2 inline-block rounded-full bg-[#D9A94E] text-[#2A1F08] text-xs font-bold px-2.5 py-1">
          +{oneDecimal(onTopPct)}% {t('on top of pay', 'encima del pago')} ({money(onTop)})
        </p>
      </div>

      <div>
        <SectionTitle>{t('Where it goes (per year)', 'A dónde va (por año)')}</SectionTitle>
        <div className="divide-y divide-gray-100">
          <Line label={salaried ? t('Salary', 'Salario') : t('Pay from the restaurant', 'Pago del restaurante')} value={money(basePay)} />
          {makeUp > 0 && (
            <Line
              label={t('Make-up to $7.25/hour', 'Diferencia hasta $7.25/hora')}
              value={money(makeUp)}
              note={t('Cash wage + tips fell short of the minimum wage', 'El pago + propinas no llegaron al mínimo')}
            />
          )}
          {ptoPay > 0 && <Line label={t('Paid time off', 'Tiempo pagado')} value={money(ptoPay)} />}
          <Line
            label={`${t('Social Security', 'Seguro Social')} (${SS_RATE}%)`}
            value={money(socialSecurity)}
            note={tipped ? t('Includes tax on reported tips', 'Incluye el impuesto sobre propinas') : undefined}
          />
          <Line label={`Medicare (${MEDICARE_RATE}%)`} value={money(medicare)} />
          <Line
            label={`${t('Federal unemployment', 'Desempleo federal')} (FUTA ${FUTA_NET_RATE}%)`}
            value={money(futa)}
            note={t(`First ${money(FUTA_WAGE_BASE)} of pay each year`, `Primeros ${money(FUTA_WAGE_BASE)} de pago al año`)}
          />
          <Line
            label={t('Louisiana unemployment', 'Desempleo de Luisiana')}
            value={money(stateUi)}
            note={t(`First ${money(LA_UI_WAGE_BASE)} of pay each year`, `Primeros ${money(LA_UI_WAGE_BASE)} de pago al año`)}
          />
          <Line label={t("Workers' comp", 'Seguro laboral')} value={money(workersComp)} />
          {health > 0 && <Line label={t('Health insurance', 'Seguro médico')} value={money(health)} />}
          {match > 0 && <Line label={t('401(k) match', 'Aporte al 401(k)')} value={money(match)} />}
          {other > 0 && <Line label={t('Other costs', 'Otros costos')} value={money(other)} />}
          <Line strong label={t('True cost', 'Costo real')} value={money(trueCost)} />
          {tipped && (
            <>
              <Line
                muted
                label={t('Tips guests paid', 'Propinas de los clientes')}
                value={money(tips)}
                note={t('The employee’s income, not a restaurant cost — but payroll taxes apply', 'Ingreso del empleado, no costo del restaurante — pero sí causan impuestos')}
              />
              <Line
                muted
                label={t('Federal tip credit (estimate)', 'Crédito federal por propinas (estimado)')}
                value={`− ${money(tipCredit)}`}
                note={t('Form 8846 — claimed on the tax return, not in payroll. The CPA confirms it.', 'Formulario 8846 — se reclama en la declaración, no en nómina. Lo confirma el contador.')}
              />
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
          💡 {t('Not a restaurant cost', 'No es costo del restaurante')}
        </p>
        <p className="text-sm text-amber-900 leading-relaxed">
          {t(
            'Income tax withholding and the employee’s own 7.65% (Social Security + Medicare) come out of their paycheck. The restaurant only holds that money and sends it in. The costs above are the ones the restaurant pays on top.',
            'La retención de impuestos y el 7.65% del propio empleado (Seguro Social + Medicare) salen de su cheque. El restaurante solo guarda ese dinero y lo envía. Los costos de arriba son los que el restaurante paga encima.'
          )}
        </p>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        {t(`Rates checked ${RATES_CHECKED.en}. `, `Tasas revisadas el ${RATES_CHECKED.es}. `)}
        {t(
          'Social Security 6.2% up to $184,500 and Medicare 1.45% (Social Security Administration, 2026). FUTA 0.6% on the first $7,000 — Louisiana was not a 2025 credit-reduction state (U.S. Department of Labor). Louisiana unemployment wage base $7,000 for 2026 (Louisiana Workforce Commission). A tipped cash wage of $2.13 must reach $7.25 with tips (Fair Labor Standards Act). Tip credit on tips above $5.15/hour (IRC §45B, IRS Form 8846). Practice numbers only, not tax advice — WHG’s CPA confirms real figures.',
          'Seguro Social 6.2% hasta $184,500 y Medicare 1.45% (Administración del Seguro Social, 2026). FUTA 0.6% sobre los primeros $7,000 — Luisiana no tuvo reducción de crédito en 2025 (Departamento de Trabajo de EE. UU.). Base de desempleo de Luisiana $7,000 en 2026 (Louisiana Workforce Commission). Un pago de $2.13 con propinas debe llegar a $7.25 (Ley de Normas Justas de Trabajo). Crédito por propinas arriba de $5.15/hora (IRC §45B, Formulario 8846). Solo números de práctica, no es consejo fiscal — el contador de WHG confirma las cifras reales.'
        )}
      </p>
    </div>
  );
}

/* ───────── Sales → labor budget → hours ───────── */
function LaborBudgetCalculator({ isES }: { isES: boolean }) {
  const t = (en: string, es: string) => (isES ? es : en);
  const [sales, setSales] = useState('15000');
  const [target, setTarget] = useState('30');
  const [onTop, setOnTop] = useState('12');
  const [salaries, setSalaries] = useState('0');
  const [fohShare, setFohShare] = useState('40');
  const [fohWage, setFohWage] = useState('9');
  const [bohWage, setBohWage] = useState('15');
  const [actual, setActual] = useState('');

  const projected = num(sales);
  const fullPct = num(target);
  // "Two numbers" (Randy, Sept 2026): the P&L target includes taxes and
  // benefits; the schedule shows pay — so managers schedule to the lower one.
  const wagePct = fullPct / (1 + num(onTop) / 100);
  const fullBudget = projected * (fullPct / 100);
  const wageBudget = projected * (wagePct / 100);
  const hourlyBudget = Math.max(0, wageBudget - num(salaries));
  const share = Math.min(100, num(fohShare)) / 100;
  const fohBudget = hourlyBudget * share;
  const bohBudget = hourlyBudget - fohBudget;
  const fohHours = num(fohWage) > 0 ? fohBudget / num(fohWage) : 0;
  const bohHours = num(bohWage) > 0 ? bohBudget / num(bohWage) : 0;
  const fohPctOfSales = projected > 0 ? (fohBudget / projected) * 100 : 0;
  const bohPctOfSales = projected > 0 ? (bohBudget / projected) * 100 : 0;
  const actualSales = actual.trim() === '' ? null : num(actual);
  const swing = actualSales === null ? 0 : (actualSales - projected) * (wagePct / 100);
  const fohSwingHours = num(fohWage) > 0 ? (swing * share) / num(fohWage) : 0;
  const bohSwingHours = num(bohWage) > 0 ? (swing * (1 - share)) / num(bohWage) : 0;
  const cut = swing < 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-[#1B3A6B] leading-tight">
          🧮 {t('Sales → labor budget → hours', 'Ventas → presupuesto → horas')}
        </h2>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          {t(
            'Why can John work Tuesday at 4? Because the sales forecast pays for those hours. Work it through step by step — then build the schedule in 7shifts.',
            '¿Por qué puede John trabajar el martes a las 4? Porque las ventas proyectadas pagan esas horas. Hazlo paso a paso — y luego arma el horario en 7shifts.'
          )}
        </p>
        <p className="text-[11px] text-gray-400 mt-1">
          {t('Example: one Saturday. Your restaurant’s real targets come from the owner.', 'Ejemplo: un sábado. Las metas reales de tu restaurante las da el dueño.')}
        </p>
      </div>

      <Step n={1} title={t('Projected sales', 'Ventas proyectadas')}>
        <NumField label={t('Sales for the day or week', 'Ventas del día o la semana')} prefix="$" value={sales} onChange={setSales} />
      </Step>

      <Step n={2} title={t('Labor target — the P&L number', 'Meta de mano de obra — la del P&L')}>
        <div className="grid grid-cols-2 gap-3">
          <NumField label={t('Labor target', 'Meta')} suffix={t('% of sales', '% de ventas')} value={target} onChange={setTarget} />
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{t('Allowable labor', 'Mano de obra permitida')}</p>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{money(fullBudget)}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
          {t('Full cost: pay, payroll taxes, workers’ comp, and benefits.', 'Costo completo: pago, impuestos de nómina, seguro laboral y beneficios.')}
        </p>
      </Step>

      <Step n={3} title={t('Take out the costs on top of pay', 'Quita los costos que van encima del pago')}>
        <div className="grid grid-cols-2 gap-3">
          <NumField
            label={t('Costs on top of pay', 'Costos encima del pago')}
            suffix="%"
            value={onTop}
            onChange={setOnTop}
            hint={t('See: True cost of an employee', 'Ver: Costo real de un empleado')}
          />
          <div className="rounded-lg bg-[#1B3A6B] text-white px-3 py-2">
            <p className="text-[10px] font-bold uppercase tracking-wide text-white/60">{t('Schedule to', 'Programa a')}</p>
            <p className="text-lg font-bold tabular-nums">{oneDecimal(wagePct)}%</p>
            <p className="text-xs text-white/80 tabular-nums">{money(wageBudget)}</p>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5 leading-snug">
          {t(
            `The schedule shows pay, not taxes and benefits — so you schedule to ${oneDecimal(wagePct)}% to land at ${oneDecimal(fullPct)}% on the P&L.`,
            `El horario muestra el pago, no los impuestos ni beneficios — por eso programas a ${oneDecimal(wagePct)}% para llegar a ${oneDecimal(fullPct)}% en el P&L.`
          )}
        </p>
      </Step>

      <Step n={4} title={t('Take out salaried managers', 'Quita a los gerentes asalariados')}>
        <NumField
          label={t('Salaried pay for this day or week', 'Pago asalariado de este día o semana')}
          prefix="$"
          value={salaries}
          onChange={setSalaries}
          hint={t(`Leaves ${money(hourlyBudget)} for hourly staff`, `Quedan ${money(hourlyBudget)} para el personal por hora`)}
        />
      </Step>

      <Step n={5} title={t('Split FOH and BOH, then turn dollars into hours', 'Divide FOH y BOH, y convierte dólares en horas')}>
        <NumField
          label={t('FOH share of hourly pay', 'Parte de FOH del pago por hora')}
          suffix="%"
          value={fohShare}
          onChange={setFohShare}
          hint={t('Example: 12% FOH + 18% BOH of a 30% target = 40% / 60%', 'Ejemplo: 12% FOH + 18% BOH de una meta de 30% = 40% / 60%')}
        />
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="rounded-xl border border-gray-200 p-3 space-y-2">
            <p className="text-xs font-bold text-[#1B3A6B]">🍽️ FOH</p>
            <NumField
              label={t('Average pay / hour', 'Pago promedio / hora')}
              prefix="$"
              value={fohWage}
              onChange={setFohWage}
              hint={t('Tipped servers pull this down', 'Los meseros con propinas lo bajan')}
            />
            <p className="text-xs text-gray-500 tabular-nums">{money(fohBudget)} · {oneDecimal(fohPctOfSales)}% {t('of sales', 'de ventas')}</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {oneDecimal(fohHours)} <span className="text-xs font-semibold text-gray-500">{t('hours', 'horas')}</span>
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3 space-y-2">
            <p className="text-xs font-bold text-[#1B3A6B]">🔪 BOH</p>
            <NumField label={t('Average pay / hour', 'Pago promedio / hora')} prefix="$" value={bohWage} onChange={setBohWage} />
            <p className="text-xs text-gray-500 tabular-nums">{money(bohBudget)} · {oneDecimal(bohPctOfSales)}% {t('of sales', 'de ventas')}</p>
            <p className="text-2xl font-bold text-gray-900 tabular-nums">
              {oneDecimal(bohHours)} <span className="text-xs font-semibold text-gray-500">{t('hours', 'horas')}</span>
            </p>
          </div>
        </div>
      </Step>

      <Step n={6} title={t('Sales running different? Adjust the schedule', '¿Las ventas van diferente? Ajusta el horario')}>
        <NumField
          label={t('What sales are actually pacing at', 'A cuánto van las ventas en realidad')}
          prefix="$"
          value={actual}
          onChange={setActual}
          hint={t('Leave blank to skip', 'Déjalo en blanco para omitir')}
        />
        {actualSales !== null && Math.abs(swing) >= 1 && (
          <div className={`mt-3 rounded-xl p-3 border ${cut ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <p className={`text-sm font-bold ${cut ? 'text-red-800' : 'text-emerald-800'}`}>
              {cut ? t('Cut about', 'Recorta cerca de') : t('You can add about', 'Puedes agregar cerca de')}{' '}
              {oneDecimal(Math.abs(fohSwingHours))} {t('FOH hours and', 'horas de FOH y')}{' '}
              {oneDecimal(Math.abs(bohSwingHours))} {t('BOH hours', 'horas de BOH')}
            </p>
            <p className={`text-[11px] mt-1 leading-snug ${cut ? 'text-red-700' : 'text-emerald-700'}`}>
              {cut
                ? t('Delay a start, make an earlier cut, or trim overlap — but protect the rush.', 'Retrasa una entrada, corta más temprano o quita traslapes — pero cuida la hora pico.')
                : t('Busier than forecast: add coverage where guests will feel it first.', 'Más ocupado de lo proyectado: agrega personal donde el cliente lo note primero.')}
            </p>
          </div>
        )}
      </Step>

      <div className="rounded-xl bg-amber-50 border border-amber-200 p-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
          💡 {t('Targets, not walls', 'Metas, no muros')}
        </p>
        <p className="text-sm text-amber-900 leading-relaxed">
          {t(
            'FOH and BOH shares are targets. If FOH runs under and the kitchen truly needs another hour, the total is what protects the business — make that trade on purpose, not by accident.',
            'Las partes de FOH y BOH son metas. Si FOH va por debajo y la cocina de verdad necesita otra hora, lo que protege al negocio es el total — haz ese cambio a propósito, no por accidente.'
          )}
        </p>
      </div>

      <p className="text-[10px] text-gray-400 leading-relaxed">
        {t(
          'Practice numbers only. Each restaurant’s labor target, FOH/BOH split, and average pay come from the owner.',
          'Solo números de práctica. La meta, la división FOH/BOH y el pago promedio de cada restaurante los da el dueño.'
        )}
      </p>
    </div>
  );
}
