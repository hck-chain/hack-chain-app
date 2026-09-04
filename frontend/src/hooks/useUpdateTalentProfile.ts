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

async function updatePhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const result = await api.upload<{ cid: string }>('/api/upload/image', formData);
  const photoUrl = `ipfs://${result.cid}`;
  await api.patch('/api/students/me/photo', { photo_url: photoUrl });
  return photoUrl;
}

async function deletePhoto() {
  await api.patch('/api/students/me/photo', { photo_url: null });
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

export function useUpdateTalentPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-talent-profile'] });
    },
    onError: (error: Error) => {
      console.error('Photo update failed:', error.message);
    },
  });
}

export function useDeleteTalentPhoto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-talent-profile'] });
    },
    onError: (error: Error) => {
      console.error('Photo deletion failed:', error.message);
    },
  });
}
