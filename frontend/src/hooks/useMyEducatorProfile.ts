import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface MyEducatorProfile {
  organization_name: string;
  bio: string | null;
  photo_url: string | null;
  certificate_logo_url: string | null;
  knowledge_areas: string[];
  website_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  wallet_address: string;
  email: string | null;
  email_verified: boolean;
}

export function useMyEducatorProfile() {
  return useQuery({
    queryKey: ['my-educator-profile'],
    queryFn: async () => {
      return api.get<MyEducatorProfile>('/api/issuers/me');
    },
    staleTime: 30_000,
    retry: 1,
  });
}
