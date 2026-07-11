'use client';

import { useEffect, useState, useCallback } from 'react';
import SignaturePadModal from './SignaturePadModal';
import type { PolicyWithStatus, UserRole } from '@/lib/types';

interface Props {
  language: 'en' | 'es';
  /** When set, auto-opens the policy with this id (deep-link from the
   *  onboarding checklist). The parent is responsible for clearing it. */
  initialPolicyId?: string | null;
  /** Called after the deep-linked policy is opened so the parent can
   *  reset the initialPolicyId state. */
  onInitialPolicyOpened?: () => void;
}

type Grouped = {
  employee: PolicyWithStatus[];
  manager: PolicyWithStatus[];
  handbook: PolicyWithStatus | null;
};

type Progress = { total: number; signed: number; remaining: number };

export default function PoliciesTab({ language, initialPolicyId, onInitialPolicyOpened }: Props) {
  const isES = language === 'es';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('employee');
  const [fullName, setFullName] = useState<string>('');
  const [grouped, setGrouped] = useState<Grouped>({ employee: [], manager: [], handbook: null });
  const [progress, setProgress] = useState<Progress>({ total: 0, signed: 0, remaining: 0 });
  const [selected, setSelected] = useState<PolicyWithStatus | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/policies', { cache: 'no-store' });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Failed to load policies');
      }
      const j = await res.json();
      setGrouped(j.grouped);
      setProgress(j.progress);
      setRole(j.role);
      setFullName(j.full_name ?? '');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Deep-link: when initialPolicyId arrives, auto-open it once data has loaded.
  // Handles both the handbook acknowledgment and any other policy id passed in.
  useEffect(() => {
    if (!initialPolicyId || loading) return;
    const all: PolicyWithStatus[] = [
      ...(grouped.handbook ? [grouped.handbook] : []),
      ...grouped.employee,
      ...grouped.manager,
    ];
    const match = all.find((p) => p.id === initialPolicyId);
    if (match) {
      setSelected(match);
      onInitialPolicyOpened?.();
    }
  }, [initialPolicyId, loading, grouped, onInitialPolicyOpened]);

  const handleSigned = async () => {
    setSelected(null);
    await load();
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 text-sm">{isES ? 'Cargando...' : 'Loading...'}</div>;
  }
  if (error) {
    return <div className="p-8 text-center text-red-600 text-sm">{error}</div>;
  }

  if (selected) {
    return (
      <PolicyDetail
        policy={selected}
        language={language}
        fullName={fullName}
        onBack={() => setSelected(null)}
        onSigned={handleSigned}
      />
    );
  }

  const showManagerSection = role === 'manager' || role === 'admin' || role === 'assistant_manager' || grouped.manager.length > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#C5D3E2] via-[#CDDAE7] to-[#D5E0EB]">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B] mb-1">
          {isES ? 'Políticas' : 'Policies'}
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          {isES
            ? 'Lea y firme cada política. Su firma queda registrada con fecha y hora.'
            : 'Read and sign each policy. Your signature is recorded with a date and time stamp.'}
        </p>

        <ProgressBar progress={progress} language={language} />

        {/* ── Handbook Acknowledgment — master document, sits above all
            individual policies. Distinct navy card so it reads as the
            foundational sign-this-first. ── */}
        {grouped.handbook && (
          <>
            <SectionHeading>
              {isES ? 'Reconocimiento del Manual' : 'Handbook Acknowledgment'}
            </SectionHeading>
            <HandbookCard
              policy={grouped.handbook}
              language={language}
              onClick={() => setSelected(grouped.handbook!)}
            />
          </>
        )}

        <SectionHeading>
          {isES ? 'Políticas de Empleado' : 'Employee Policies'}
        </SectionHeading>
        <div className="grid gap-3 mb-8">
          {grouped.employee.map((p) => (
            <PolicyCard key={p.id} policy={p} language={language} onClick={() => setSelected(p)} />
          ))}
          {grouped.employee.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              {isES ? 'No hay políticas de empleado por ahora.' : 'No employee policies yet.'}
            </p>
          )}
        </div>

        {showManagerSection && grouped.manager.length > 0 && (
          <>
            <SectionHeading>
              {isES ? 'Políticas de Gerente' : 'Manager Policies'}
            </SectionHeading>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3 mb-3">
              {isES
                ? 'Como gerente, acepta un deber de cuidado superior al de los empleados que supervisa.'
                : 'As a manager, you accept a higher duty of care than the employees you supervise.'}
            </p>
            <div className="grid gap-3">
              {grouped.manager.map((p) => (
                <PolicyCard key={p.id} policy={p} language={language} onClick={() => setSelected(p)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 mt-6">
      {children}
    </h2>
  );
}

function ProgressBar({ progress, language }: { progress: Progress; language: 'en' | 'es' }) {
  const isES = language === 'es';
  const pct = progress.total === 0 ? 0 : Math.round((progress.signed / progress.total) * 100);
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-[#1B3A6B]">
          {isES ? 'Progreso' : 'Your progress'}
        </span>
        <span className="text-sm text-gray-600">
          {progress.signed} / {progress.total} {isES ? 'firmadas' : 'signed'}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-[#1B3A6B]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {progress.remaining > 0 && (
        <p className="text-xs text-amber-700 mt-2">
          {isES
            ? `Le faltan ${progress.remaining} por firmar.`
            : `${progress.remaining} remaining to sign.`}
        </p>
      )}
    </div>
  );
}

/** Helper: pick Spanish field if available when language is 'es', else fall back to English. */
function esOrEn(policy: PolicyWithStatus, field: 'purpose' | 'details' | 'consequences' | 'acknowledgment_text' | 'location_notes', lang: 'en' | 'es'): string | null {
  if (lang === 'es') {
    const esKey = `${field}_es` as keyof PolicyWithStatus;
    const esVal = policy[esKey];
    if (typeof esVal === 'string' && esVal) return esVal;
  }
  const enVal = policy[field];
  return typeof enVal === 'string' ? enVal : null;
}

/** Master Handbook Acknowledgment card — distinct from individual policies.
 *  Sits at the top of the Policies tab. Navy gradient + larger type to
 *  read as the foundational sign-this-first document. */
function HandbookCard({
  policy,
  language,
  onClick,
}: {
  policy: PolicyWithStatus;
  language: 'en' | 'es';
  onClick: () => void;
}) {
  const isES = language === 'es';
  const signed = !!policy.signed && !policy.needs_resign;
  const badge = policy.needs_resign
    ? { label: isES ? 'Nueva versión — firme de nuevo' : 'New version — re-sign', cls: 'bg-orange-100 text-orange-800 border-orange-200' }
    : signed
    ? { label: isES ? `Firmado ${new Date(policy.signed_at!).toLocaleDateString()}` : `Signed ${new Date(policy.signed_at!).toLocaleDateString()}`, cls: 'bg-green-100 text-green-800 border-green-200' }
    : { label: isES ? 'Firma requerida' : 'Signature required', cls: 'bg-amber-100 text-amber-900 border-amber-200' };

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-gradient-to-br from-[#1B3A6B] to-[#2C4F8A] rounded-2xl p-5 mb-6 shadow-lg hover:shadow-xl transition-all border border-[#1B3A6B]"
    >
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-300 mb-1">
            📘 {isES ? 'Documento Fundacional' : 'Foundational document'}
          </p>
          <h3 className="font-bold text-white text-base md:text-lg leading-tight">{policy.title}</h3>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border whitespace-nowrap shrink-0 ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      <p className="text-sm text-white/80 leading-relaxed mt-2">
        {isES
          ? 'Lea el manual completo en la pestaña Manual, luego firme aquí para confirmar que lo entiende y acepta cumplirlo.'
          : 'Read the full handbook in the Handbook tab, then sign here to confirm you understand and agree to follow it.'}
      </p>
      <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
        {signed ? '✓' : '✍️'} {signed ? (isES ? 'Firmado' : 'Signed') : (isES ? 'Tocar para firmar' : 'Tap to sign')} →
      </div>
    </button>
  );
}

function PolicyCard({
  policy,
  language,
  onClick,
}: {
  policy: PolicyWithStatus;
  language: 'en' | 'es';
  onClick: () => void;
}) {
  const isES = language === 'es';
  const badge = policy.needs_resign
    ? { label: isES ? 'Versión nueva — firme de nuevo' : 'New version — re-sign', cls: 'bg-orange-100 text-orange-800 border-orange-200' }
    : policy.signed
    ? { label: isES ? `Firmada ${new Date(policy.signed_at!).toLocaleDateString()}` : `Signed ${new Date(policy.signed_at!).toLocaleDateString()}`, cls: 'bg-green-100 text-green-800 border-green-200' }
    : { label: isES ? 'Firma requerida' : 'Signature required', cls: 'bg-amber-100 text-amber-800 border-amber-200' };

  const purpose = esOrEn(policy, 'purpose', language);

  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-gray-200 rounded-lg p-4 hover:border-[#1B3A6B] hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-1">
        <h3 className="font-semibold text-[#1B3A6B] text-sm md:text-base">{policy.title}</h3>
        <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${badge.cls}`}>
          {badge.label}
        </span>
      </div>
      {purpose && (
        <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{purpose}</p>
      )}
    </button>
  );
}

function PolicyDetail({
  policy,
  language,
  fullName,
  onBack,
  onSigned,
}: {
  policy: PolicyWithStatus;
  language: 'en' | 'es';
  fullName: string;
  onBack: () => void;
  onSigned: () => void;
}) {
  const isES = language === 'es';
  const [confirmed, setConfirmed] = useState(false);
  const [showPad, setShowPad] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsSign = !policy.signed || policy.needs_resign;

  async function handleSigned(signatureDataUrl: string) {
    setShowPad(false);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/policies/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy_id: policy.id,
          confirm: confirmed,
          signature_image: signatureDataUrl,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed to sign');
      onSigned();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to sign');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <button
          onClick={onBack}
          className="text-sm text-[#1B3A6B] hover:underline mb-4 flex items-center gap-1"
        >
          ← {isES ? 'Volver a políticas' : 'Back to policies'}
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-[#1B3A6B] mb-1">{policy.title}</h1>
        <p className="text-xs text-gray-500 mb-6">
          {isES ? 'Versión' : 'Version'} {policy.version}
          {policy.effective_date && ` · ${isES ? 'Vigente desde' : 'Effective'} ${new Date(policy.effective_date).toLocaleDateString()}`}
        </p>

        <article className="prose prose-sm md:prose-base max-w-none text-gray-800 leading-relaxed">
          {esOrEn(policy, 'purpose', language) && (
            <>
              <h2 className="text-base font-semibold text-[#1B3A6B] mt-6 mb-2">
                {isES ? 'Propósito' : 'Purpose'}
              </h2>
              <p className="whitespace-pre-wrap">{esOrEn(policy, 'purpose', language)}</p>
            </>
          )}
          {esOrEn(policy, 'details', language) && (
            <>
              <h2 className="text-base font-semibold text-[#1B3A6B] mt-6 mb-2">
                {isES ? 'Detalles de la Política' : 'Policy Details'}
              </h2>
              <div className="whitespace-pre-wrap">{esOrEn(policy, 'details', language)}</div>
            </>
          )}
          {esOrEn(policy, 'consequences', language) && (
            <>
              <h2 className="text-base font-semibold text-[#1B3A6B] mt-6 mb-2">
                {isES ? 'Consecuencias' : 'Consequences'}
              </h2>
              <p className="whitespace-pre-wrap">{esOrEn(policy, 'consequences', language)}</p>
            </>
          )}
          {esOrEn(policy, 'location_notes', language) && (
            <>
              <h2 className="text-base font-semibold text-[#1B3A6B] mt-6 mb-2">
                {isES ? 'Notas para su Ubicación' : 'Notes for Your Location'}
              </h2>
              <p className="whitespace-pre-wrap">{esOrEn(policy, 'location_notes', language)}</p>
            </>
          )}
        </article>

        <hr className="my-8 border-gray-200" />

        <section className="bg-gray-50 border border-gray-200 rounded-lg p-5">
          <h2 className="text-base font-semibold text-[#1B3A6B] mb-3">
            {policy.role_required === 'manager'
              ? (isES ? 'Reconocimiento del Gerente' : 'Manager Acknowledgment')
              : (isES ? 'Reconocimiento del Empleado' : 'Employee Acknowledgment')}
          </h2>
          <p className="text-sm text-gray-800 italic whitespace-pre-wrap mb-4">
            {esOrEn(policy, 'acknowledgment_text', language) || policy.acknowledgment_text}
          </p>

          {!needsSign ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
              ✓ {isES
                ? `Firmada el ${new Date(policy.signed_at!).toLocaleString()}`
                : `Signed on ${new Date(policy.signed_at!).toLocaleString()}`}
            </div>
          ) : (
            <div className="space-y-4">
              {policy.needs_resign && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs p-2 rounded">
                  {isES
                    ? `Ha firmado la versión ${policy.signed_version}. La versión actual es ${policy.version}. Por favor firme de nuevo.`
                    : `You signed version ${policy.signed_version}. The current version is ${policy.version}. Please re-sign.`}
                </div>
              )}

              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5"
                  disabled={submitting}
                />
                <span className="text-sm text-gray-700">
                  {isES
                    ? 'He leído y entiendo esta política y acepto cumplirla.'
                    : 'I have read and understand this policy and agree to follow it.'}
                </span>
              </label>

              <p className="text-xs text-gray-500">
                {isES
                  ? `Firmará como `
                  : `Signing as `}
                <span className="font-semibold text-[#1B3A6B]">{fullName || (isES ? 'su nombre legal' : 'your legal name')}</span>
                {isES
                  ? `. Su firma se registrará con fecha y hora.`
                  : `. Your signature will be timestamped on submission.`}
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-2 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={() => setShowPad(true)}
                disabled={submitting || !confirmed}
                className="w-full bg-[#1B3A6B] text-white font-semibold py-3 rounded-md hover:bg-[#142c50] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <span>{isES ? 'Enviando...' : 'Submitting...'}</span>
                ) : (
                  <>
                    <span>✍️</span>
                    <span>{isES ? 'Firmar con el dedo' : 'Sign with your finger'}</span>
                  </>
                )}
              </button>
            </div>
          )}
        </section>
      </div>

      {showPad && (
        <SignaturePadModal
          title={policy.title}
          employeeName={fullName || (isES ? 'Su firma' : 'Your signature')}
          onSigned={handleSigned}
          onCancel={() => setShowPad(false)}
          language={language}
        />
      )}
    </div>
  );
}
