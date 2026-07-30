import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';

export interface UpdateProfilePayload {
  bio?: string;
  knowledge_areas?: string[];
  organization_name?: string;
  website_url?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
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

async function updateCertificateLogo(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const result = await api.upload<{ cid: string }>('/api/upload/image', formData);
  const logoUrl = `ipfs://${result.cid}`;
  await api.patch('/api/issuers/me/certificate-logo', {
    certificate_logo_url: logoUrl,
  });

  return logoUrl;
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

export function useUpdateCertificateLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCertificateLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['my-educator-profile'],
      });
    },
    onError: (error: Error) => {
      console.error('Certificate logo update failed:', error.message);
    },
  });
}


async function deletePhoto() {
  await api.patch('/api/issuers/me/photo', { photo_url: null });
}

async function deleteCertificateLogo() {
  await api.patch('/api/issuers/me/certificate-logo', {
    certificate_logo_url: null,
  });
}

export function useDeleteEducatorPhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deletePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-educator-profile'] });
    },
    onError: (error: Error) => {
      console.error('Photo deletion failed:', error.message);
    },
  });
}

export function useDeleteCertificateLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCertificateLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['my-educator-profile'],
      });
    },
    onError: (error: Error) => {
      console.error('Certificate logo deletion failed:', error.message);
    },
  });
}
