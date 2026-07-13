import { useCallback, useMemo, useState } from 'react';
import { api } from '@/services/api';
const QR_API_URL = import.meta.env.VITE_QR_API_URL;

type QrStatus = 'loading' | 'success' | 'error';
type SharePlatform = 'whatsapp' | 'linkedin' | 'twitter';

interface ShareLinks {
  whatsapp: string;
  linkedin: string;
  twitter: string;
}

interface UseShareProfileResult {
  qrUrl: string;
  qrStatus: QrStatus;
  shareLinks: ShareLinks;
  handleLinkCopy: () => void;
  handleSocialClick: () => void;
  handleQrLoad: () => void;
  handleQrError: () => void;
  retryQr: () => void;
}

 export function buildShareUrl(platform: SharePlatform, url: string, name: string): string {
  const text = `Check out ${name}'s profile on HackChain`;

  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text} ${url}`)}`;
  }
}

export function buildShareLinks(profileUrl: string, displayName: string): ShareLinks {
  return {
    whatsapp: buildShareUrl('whatsapp', profileUrl, displayName),
    linkedin: buildShareUrl('linkedin', profileUrl, displayName),
    twitter: buildShareUrl('twitter', profileUrl, displayName),
  };
}

// cacheBuster forces the <img> to re-request the QR after a manual retry
export function createQrDataUrl(value: string, cacheBuster: number): string {
  const encoded = encodeURIComponent(value);
  return `${QR_API_URL}?size=180x180&data=${encoded}&t=${cacheBuster}`;
}

export function useShareProfile(profileUrl: string, displayName: string, issuerWallet: string): UseShareProfileResult {
  const [qrStatus, setQrStatus] = useState<QrStatus>('loading');
  const [qrRetryCount, setQrRetryCount] = useState(0);

  const qrUrl = useMemo(() => createQrDataUrl(profileUrl, qrRetryCount), [profileUrl, qrRetryCount]);

  const handleLinkCopy = useCallback(() => {
    api.registerProfileShare(issuerWallet);
  }, [issuerWallet]);

  const handleSocialClick = useCallback(() => {
    api.registerProfileShare(issuerWallet);
  }, [issuerWallet]);

  const handleQrLoad = useCallback(() => setQrStatus('success'), []);
  const handleQrError = useCallback(() => setQrStatus('error'), []);

  const retryQr = useCallback(() => {
    setQrStatus('loading');
    setQrRetryCount((count) => count + 1);
  }, []);

  const shareLinks = useMemo(() => buildShareLinks(profileUrl, displayName), [profileUrl, displayName]);

  return { qrUrl, qrStatus, shareLinks, handleLinkCopy, handleSocialClick, handleQrLoad, handleQrError, retryQr };
}
