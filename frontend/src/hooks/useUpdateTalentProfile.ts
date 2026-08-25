import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface UpdateTalentProfilePayload {
  bio?: string | null;
  field_of_study?: string | null;
  knowledge_areas?: string[];
  github_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  instagram_url?: string | null;
}

async function updateProfile(payload: UpdateTalentProfilePayload) {
  return api.patch('/api/students/me', payload);
}

export function useUpdateTalentProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-talent-profile'] });
    },
    onError: (error: Error) => {
      console.error('Talent profile update failed:', error.message);
    },
  });
}
