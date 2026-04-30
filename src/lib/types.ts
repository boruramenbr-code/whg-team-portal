export type UserRole = 'employee' | 'manager' | 'assistant_manager' | 'admin';
export type UserStatus = 'active' | 'archived';
export type HandbookSource = 'employee' | 'manager';
export type PreferredLanguage = 'en' | 'es';

export interface Restaurant {
  id: string;
  name: string;
  slug?: string;
  is_active?: boolean;
}

export interface Profile {
  id: string;
  full_name: string;
  restaurant_id: string;
  role: UserRole;
  status: UserStatus;
  preferred_language: PreferredLanguage;
  employee_pin?: string;
  date_of_birth?: string | null;
  welcome_until?: string | null;
  requires_bar_card?: boolean;
  created_at: string;
  updated_at: string;
  restaurants?: Restaurant;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export interface HandbookChunk {
  id: string;
  content: string;
  source: HandbookSource;
  section?: string;
  similarity?: number;
}

export interface RestaurantPolicy {
  id: string;
  restaurant_id: string;
  policy_key: string;
  policy_value: string;
}

export type PolicyKind = 'handbook' | 'policy';
export type PolicyRoleRequired = 'employee' | 'manager' | 'all';

export interface Policy {
  id: string;
  restaurant_id: string | null;
  role_required: PolicyRoleRequired;
  kind: PolicyKind;
  title: string;
  purpose: string | null;
  details: string | null;
  consequences: string | null;
  acknowledgment_text: string;
  location_notes: string | null;
  // Spanish translation columns (nullable — populated by migration 011)
  purpose_es: string | null;
  details_es: string | null;
  consequences_es: string | null;
  acknowledgment_text_es: string | null;
  location_notes_es: string | null;
  version: number;
  effective_date: string;
  sort_order: number;
  active: boolean;
}

export interface PolicySignature {
  id: string;
  policy_id: string;
  policy_version: number;
  user_id: string;
  restaurant_id_at_signing: string | null;
  role_at_signing: UserRole;
  employee_name_typed: string;
  acknowledgment_text_signed: string;
  content_hash: string;
  signed_at: string;
}

/** A policy enriched with the current user's signature status. */
export interface PolicyWithStatus extends Policy {
  signed: boolean;
  signed_at: string | null;
  signed_version: number | null;
  needs_resign: boolean; // signed a previous version but a newer active version exists
}
