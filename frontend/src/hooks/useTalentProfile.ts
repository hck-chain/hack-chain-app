import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface PublicTalentProfile {
  field_of_study: string | null;
  total_certificates: number;
  photo_url: string | null;
}

interface PublicTalentProfileResponse {
    student: PublicTalentProfile;
}

export function useTalentProfile(wallet?: string, enabled: boolean = true) {
  return useQuery<PublicTalentProfile, Error>({
    queryKey: ['talent-profile', wallet],
    enabled: enabled &&  !!wallet,
    queryFn: async () => {
      const response = await api.getPublic<PublicTalentProfileResponse>(`/api/students/${wallet}/public`);
      return {
        ...response.student,
      };
    },
    staleTime: 30_000,
    retry: 1,
  });
}
