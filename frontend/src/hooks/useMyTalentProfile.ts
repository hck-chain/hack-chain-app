import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface MyTalentProfile {
  walletAddress: string;
  name: string | null;
  lastname: string | null;
  email: string | null;
  email_verified: boolean;
  field_of_study: string | null;
  bio: string | null;
  knowledge_areas: string[];
  photo_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
}

interface MyTalentProfileResponse {
  wallet_address: string;
  name: string | null;
  lastname: string | null;
  email: string | null;
  email_verified: boolean;
  field_of_study: string | null;
  bio: string | null;
  knowledge_areas: string[];
  photo_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
}

export function useMyTalentProfile(enabled: boolean = true) {
  return useQuery<MyTalentProfile>({
    queryKey: ['my-talent-profile'],
    enabled,
    queryFn: async () => {
      const data = await api.get<MyTalentProfileResponse>('/api/students/me');
      return {
        ...data,
        walletAddress: data.wallet_address,
      };
    },
    staleTime: 30_000,
    retry: 1,
  });
}
