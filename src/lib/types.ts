export type UserRole = 'employee' | 'manager' | 'assistant_manager' | 'admin';
export type UserStatus = 'active' | 'archived';
export type HandbookSource = 'employee' | 'manager';

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
