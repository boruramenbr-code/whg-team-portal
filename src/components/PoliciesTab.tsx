'use client';

import { useEffect, useState, useCallback } from 'react';
import type { PolicyWithStatus, UserRole } from '@/lib/types';

interface Props {
  language: 'en' | 'es';
}

type Grouped = {
  employee: PolicyWithStatus[];
  manager: PolicyWithStatus[];
  handbook: PolicyWithStatus | null;
};

type Progress = { total: number; signed: number; remaining: number };

export default function PoliciesTab({ language }: Props) {
  const isES = language === 'es';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>('employee');
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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
        onBack={() => setSelected(null)}
        onSigned={handleSigned}
      />
    );
  }

  const showManagerSection = role === 'manager' || role === 'admin' || role === 'assistant_manager' || grouped.manager.length > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
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
      {policy.purpose && (
        <p className="text-xs md:text-sm text-gray-600 line-clamp-2">{policy.purpose}</p>
      )}
    </button>
  );
}

function PolicyDetail({
  policy,
  language,
  onBack,
  onSigned,
}: {
  policy: PolicyWithStatus;
  language: 'en' | 'es';
  onBack: () => void;
  onSigned: () => void;
}) {
  const isES = language === 'es';
  const [typedName, setTypedName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsSign = !policy.signed || policy.needs_resign;

  async function handleSign() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/policies/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy_id: policy.id,
          typed_name: typedName,
          confirm: confirmed,
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
          {policy.purpose && (
            <>
              <h2 className="text-base font-semibold text-[#1B3A6B] mt-6 mb-2">
                {isES ? 'Propósito' : 'Purpose'}
              </h2>
              <p className="whitespace-pre-wrap">{policy.purpose}</p>
            </>
          )}
          {policy.details && (
            <>
              <h2 className="text-base font-semibold text-[#1B3A6B] mt-6 mb-2">
                {isES ? 'Detalles de la Política' : 'Policy Details'}
              </h2>
              <div className="whitespace-pre-wrap">{policy.details}</div>
            </>
          )}
          {policy.consequences && (
            <>
              <h2 className="text-base font-semibold text-[#1B3A6B] mt-6 mb-2">
                {isES ? 'Consecuencias' : 'Consequences'}
              </h2>
              <p className="whitespace-pre-wrap">{policy.consequences}</p>
            </>
          )}
          {policy.location_notes && (
            <>
              <h2 className="text-base font-semibold text-[#1B3A6B] mt-6 mb-2">
                {isES ? 'Notas para su Ubicación' : 'Notes for Your Location'}
              </h2>
              <p className="whitespace-pre-wrap">{policy.location_notes}</p>
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
            {policy.acknowledgment_text}
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
              <label className="block">
                <span className="text-sm font-medium text-gray-700">
                  {isES ? 'Nombre Legal Completo' : 'Full Legal Name'}
                </span>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder={isES ? 'Escriba su nombre completo' : 'Type your full name'}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A6B] focus:border-transparent"
                  disabled={submitting}
                />
              </label>

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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-2 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={handleSign}
                disabled={submitting || !typedName.trim() || !confirmed}
                className="w-full bg-[#1B3A6B] text-white font-semibold py-2.5 rounded-md hover:bg-[#142c50] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {submitting
                  ? (isES ? 'Firmando...' : 'Signing...')
                  : (isES ? 'Firmar y Enviar' : 'Sign & Submit')}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
