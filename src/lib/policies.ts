import { createHash } from 'crypto';
import type { Policy, PolicyWithStatus, UserRole } from './types';

/**
 * Canonicalize a policy's signable content into a deterministic string,
 * then SHA-256 it. Stored on every signature so we have cryptographic proof
 * of exactly which text the employee agreed to, even if the policy is later
 * edited in place without bumping the version (which we discourage, but the
 * hash guarantees we catch it).
 */
export function hashPolicyContent(policy: Pick<Policy,
  'title' | 'purpose' | 'details' | 'consequences' | 'acknowledgment_text' | 'version'
>): string {
  const canonical = JSON.stringify({
    title:   policy.title ?? '',
    purpose: policy.purpose ?? '',
    details: policy.details ?? '',
    consequences: policy.consequences ?? '',
    acknowledgment_text: policy.acknowledgment_text ?? '',
    version: policy.version,
  });
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/**
 * Filter the full policies table down to what a given user should see.
 * Mirrors the RLS policy defined in 001_policies.sql but executed in-app
 * so we can build the compliance dashboard and onboarding flow.
 */
export function filterPoliciesForUser(
  policies: Policy[],
  user: { role: UserRole; restaurant_id: string | null }
): Policy[] {
  return policies.filter((p) => {
    if (!p.active) return false;

    // Restaurant scope: WHG-wide (null) or matching restaurant.
    if (p.restaurant_id && p.restaurant_id !== user.restaurant_id && user.role !== 'admin') {
      return false;
    }

    // Role scope.
    if (p.role_required === 'all') return true;
    if (user.role === 'admin') return true;
    if (p.role_required === 'employee') return true; // managers sign employee policies too
    if (p.role_required === 'manager' && (user.role === 'manager' || user.role === 'assistant_manager')) return true;

    return false;
  });
}

/**
 * Merge a list of policies with a list of that user's signatures to produce
 * a per-policy status ready for rendering in the Policies sub-tab.
 */
export function decoratePoliciesWithStatus(
  policies: Policy[],
  signatures: Array<{ policy_id: string; policy_version: number; signed_at: string }>,
): PolicyWithStatus[] {
  const sigByPolicy = new Map<string, { policy_version: number; signed_at: string }>();
  for (const s of signatures) {
    const existing = sigByPolicy.get(s.policy_id);
    if (!existing || s.policy_version > existing.policy_version) {
      sigByPolicy.set(s.policy_id, { policy_version: s.policy_version, signed_at: s.signed_at });
    }
  }

  return policies.map((p) => {
    const latestSig = sigByPolicy.get(p.id);
    if (!latestSig) {
      return { ...p, signed: false, signed_at: null, signed_version: null, needs_resign: false };
    }
    return {
      ...p,
      signed: latestSig.policy_version === p.version,
      signed_at: latestSig.signed_at,
      signed_version: latestSig.policy_version,
      needs_resign: latestSig.policy_version < p.version,
    };
  });
}

/**
 * Group policies for the Policies sub-tab display.
 * Employee policies come first (kind=policy, role_required=employee),
 * then manager policies (role_required=manager), sorted by sort_order.
 */
export function groupPoliciesForDisplay(policies: PolicyWithStatus[]) {
  const signable = policies.filter((p) => p.kind === 'policy');
  return {
    employee: signable
      .filter((p) => p.role_required === 'employee' || p.role_required === 'all')
      .sort((a, b) => a.sort_order - b.sort_order),
    manager: signable
      .filter((p) => p.role_required === 'manager')
      .sort((a, b) => a.sort_order - b.sort_order),
    handbook: policies.find((p) => p.kind === 'handbook') ?? null,
  };
}
