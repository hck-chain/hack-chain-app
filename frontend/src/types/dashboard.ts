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
}

export interface TalentInfo {
  wallet_address: string;
  name?: string;
  email?: string;
  role?: string;
}
