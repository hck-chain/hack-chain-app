import { useCallback, useMemo, useState } from 'react';
import { api } from '@/services/api';
const QR_API_URL = import.meta.env.VITE_QR_API_URL || 'https://api.qrserver.com/v1/create-qr-code/';

type QrStatus = 'loading' | 'success' | 'error';
type SharePlatform = 'whatsapp' | 'linkedin' | 'twitter';

interface ShareLinks {
  whatsapp: string;
  linkedin: string;
  twitter: string;
}

interface UseShareProps {
  url: string;
  shareText: string;
  onShare?: () => void;
}

interface UseShareResult {
  qrUrl: string;
  qrStatus: QrStatus;
  shareLinks: ShareLinks;
  handleLinkCopy: () => void;
  handleSocialClick: () => void;
  handleQrLoad: () => void;
  handleQrError: () => void;
  retryQr: () => void;
}

 export function buildShareUrl(platform: SharePlatform, url: string, shareText: string): string {

  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText} ${url}`)}`;
  }
}

export function buildShareLinks(url: string, shareText: string): ShareLinks {
  return {
    whatsapp: buildShareUrl('whatsapp', url, shareText),
    linkedin: buildShareUrl('linkedin', url, shareText),
    twitter: buildShareUrl('twitter', url, shareText),
  };
}

// cacheBuster forces the <img> to re-request the QR after a manual retry
export function createQrDataUrl(value: string, cacheBuster: number): string {
  const encoded = encodeURIComponent(value);
  return `${QR_API_URL}?size=180x180&data=${encoded}&t=${cacheBuster}`;
}

export function useShare({ url, shareText, onShare }: UseShareProps): UseShareResult {
  const [qrStatus, setQrStatus] = useState<QrStatus>('loading');
  const [qrRetryCount, setQrRetryCount] = useState(0);

  const qrUrl = useMemo(() => createQrDataUrl(url, qrRetryCount), [url, qrRetryCount]);

  const handleLinkCopy = useCallback(() => {
    onShare?.();
  }, [onShare]);

  const handleSocialClick = useCallback(() => {
    onShare?.();
  }, [onShare]);

  const handleQrLoad = useCallback(() => setQrStatus('success'), []);
  const handleQrError = useCallback(() => setQrStatus('error'), []);

  const retryQr = useCallback(() => {
    setQrStatus('loading');
    setQrRetryCount((count) => count + 1);
  }, []);

  const shareLinks = useMemo(() => buildShareLinks(url, shareText), [url, shareText]);

  return { qrUrl, qrStatus, shareLinks, handleLinkCopy, handleSocialClick, handleQrLoad, handleQrError, retryQr };
}
