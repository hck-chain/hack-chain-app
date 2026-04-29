import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface UpdateProfilePayload {
  bio?: string;
  knowledge_areas?: string[];
  organization_name?: string;
}

async function updateProfile(payload: UpdateProfilePayload) {
  return api.patch('/api/issuers/me', payload);
}

async function updatePhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const result = await api.upload<{ cid: string }>('/api/upload/image', formData);
  const photoUrl = `ipfs://${result.cid}`;
  await api.patch('/api/issuers/me/photo', { photo_url: photoUrl });
  return photoUrl;
}

export function useUpdateEducatorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-educator-profile'] });
    },
    onError: (error: Error) => {
      console.error('Profile update failed:', error.message);
    },
  });
}

export function useUpdateEducatorPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-educator-profile'] });
    },
    onError: (error: Error) => {
      console.error('Photo update failed:', error.message);
    },
  });
}
