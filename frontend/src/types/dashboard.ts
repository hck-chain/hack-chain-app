export interface OpenSeaCertificate {
  identifier: string;
  contract: string;
  name?: string;
  description?: string;
  image_url: string;
  display_image_url?: string;
  original_image_url?: string;
}

export interface Educator {
  wallet_address: string;
  organization_name: string;
  name: string | null;
  lastname: string | null;
  photo_url: string | null;
  bio: string | null;
  knowledge_areas: string[];
  certificates_issued: number;
  joined_at: string | null;
  certs_to_me: number;
  is_approved?: boolean;
}

export interface EducatorProfile extends Omit<Educator, 'certs_to_me'> {
  talents_formed: number;
  website_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  is_approved?: boolean;
  class_settings: ClassSettings | null;
}

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayAvailability {
  enabled: boolean;
  start: string;
  end: string;
}

export type WeeklyAvailability = Record<DayKey, DayAvailability>;

export interface ClassSettings {
  hourly_rate_usd: number | null;
  accept_usdc: boolean;
  durations: number[];
  availability: WeeklyAvailability;
  google_calendar_url: string | null;
}

export interface FeaturedEducator {
  wallet_address: string;
  organization_name: string | null;
  name: string | null;
  lastname: string | null;
  photo_url: string | null;
  bio: string | null;
  knowledge_areas: string[];
  certificates_issued: number;
  has_classes: boolean;
}

export interface IssuerClass {
  id: number;
  name: string;
  description: string | null;
  topics: string[];
  is_active?: boolean;
}

export interface TalentInfo {
  wallet_address: string;
  name?: string;
  email?: string;
  role?: string;
}
