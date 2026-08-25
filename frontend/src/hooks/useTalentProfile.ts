import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface PublicTalentProfile {
  walletAddress: string;
  name: string | null;
  lastname: string | null;
  field_of_study: string | null;
  bio: string | null;
  knowledge_areas: string[];
  total_certificates: number;
  joined_at: string | null;
  photo_url: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  instagram_url: string | null;
}

interface PublicTalentProfileResponse {
  student: Omit<PublicTalentProfile, 'walletAddress'> & {
    wallet_address: string;
  };
}

export function useTalentProfile(wallet?: string) {
  return useQuery<PublicTalentProfile, Error>({
    queryKey: ['talent-profile', wallet],
    enabled: !!wallet,
    queryFn: async () => {
      const response = await api.getPublic<PublicTalentProfileResponse>(`/api/students/${wallet}/public`);
      return {
        ...response.student,
        walletAddress: response.student.wallet_address,
      };
    },
    staleTime: 30_000,
    retry: 1,
  });
}
