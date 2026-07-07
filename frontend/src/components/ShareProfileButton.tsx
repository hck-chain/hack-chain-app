import { Check, Copy, Linkedin, MessageCircleMore, RefreshCw, Share2, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { P } from '@/components/profile/palette';
import { useShareProfile } from '@/hooks/useShareProfile';
import { CopyButton } from '@/components/CopyButton';
import {useTranslation} from 'react-i18next'
import {
  FaLinkedin,
  FaWhatsapp,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

interface ShareProfileButtonProps {
  profileUrl: string;
  displayName: string;
  issuerId: string;
}


export function ShareProfileButton({ profileUrl, displayName, issuerId }: ShareProfileButtonProps) {
  const share = useShareProfile(profileUrl, displayName, issuerId);
  
  const shareActions = [
    { key: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp className="w-6 h-6 text-green-500" />, href: share.shareLinks.whatsapp },
    { key: 'linkedin', label: 'LinkedIn', icon: <FaLinkedin className="w-6 h-6 text-[#0A66C2]" />, href: share.shareLinks.linkedin },
    { key: 'twitter', label: 'Twitter / X', icon: <FaXTwitter className="w-6 h-6 text-white" />, href: share.shareLinks.twitter },
  ];
  
  const { t } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="inline-flex h-[34px] min-h-[34px] items-center justify-center gap-1.5 rounded-md px-3 text-[11px] font-mono tracking-wide whitespace-nowrap cursor-pointer select-none"
          style={{ borderColor: P.border, color: P.textSecondary, backgroundColor: P.surface }}
          aria-label="Share profile"
        >
          <Share2 className="h-3 w-3 text-purple-800" />
          {t('Share')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl border-0 p-0 overflow-hidden"
       style={{ background: 'radial-gradient(at 80% 0%, oklch(0.7 0.16 280 / 0.18) 0%, transparent 55%), #09090b' }}
      >
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-left text-xl font-semibold tracking-tight text-white" style={{ color: P.textPrimary }}>
            Share profile
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4 min-w-0">
          <CopyLinkCard profileUrl={profileUrl} onLinkCopy={share.handleLinkCopy} />
          <div>
            <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-2 block">
              Share via
            </label>
            <div className="flex justify-center gap-6 mt-8">
              {shareActions.map((action) => (
                <a
                  key={action.key}
                  href={action.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={share.handleSocialClick}
                  aria-label={action.label}
                  className="
                  inline-flex items-center justify-center
                  w-11 h-11 rounded-full
                  bg-white/10
                  transition-all duration-300
                  hover:bg-white/20 hover:scale-110
                  "
                >
                  {action.icon}
                </a>
              ))}
            </div>
          </div>
 
          <SectionDivider label="Share via" />

          <QrCodeCard
            qrUrl={share.qrUrl}
            qrStatus={share.qrStatus}
            displayName={displayName}
            onLoad={share.handleQrLoad}
            onError={share.handleQrError}
            onRetry={share.retryQr}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface SectionDividerProps {
  label: string;
}

function SectionDivider({ label }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-white/5" />
      <span className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold">{label}</span>
      <span className="h-px flex-1 bg-white/5" />
    </div>
  );
}


interface CopyLinkCardProps {
  profileUrl: string;
  onLinkCopy: () => void;
}


function CopyLinkCard({ profileUrl, onLinkCopy }: CopyLinkCardProps) {
  return (
    <div>
      <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-2 block">
        Profile Link
      </label>
      <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 pl-5 border border-white/5">
        <span className="truncate text-sm sm:text-base text-slate-300 font-mono flex-1 min-w-0">{profileUrl}</span>
        {/* onLinkCopy rides the native click bubble from CopyButton without modifying that shared component */}
        <div onClick={onLinkCopy} className="contents">
          <CopyButton value={profileUrl} className="bg-white/5 hover:bg-white/10 text-white rounded-xl" />
        </div>
      </div>
    </div>
  );
}


interface QrCodeCardProps {
  qrUrl: string;
  qrStatus: 'loading' | 'success' | 'error';
  displayName: string;
  onLoad: () => void;
  onError: () => void;
  onRetry: () => void;
}

 function QrCodeCard({ qrUrl, qrStatus, displayName, onLoad, onError, onRetry }: QrCodeCardProps) {
  return (
    <div className="bg-black/40 rounded-2xl border border-white/5 p-4 text-center">
      <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-3 block">
        QR code
      </label>
      <QrCodeFrame qrUrl={qrUrl} qrStatus={qrStatus} displayName={displayName} onLoad={onLoad} onError={onError} onRetry={onRetry} />
      {qrStatus === 'success' && (
        <>
          <p className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-3 block">Scan to view profile {displayName}</p>
        </>
      )
    }
    </div>
  );
}

function QrCodeFrame({ qrUrl, qrStatus, displayName, onLoad, onError, onRetry }: QrCodeCardProps) {
  return (
    <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl bg-white">
      {qrStatus === 'loading' && <div className="h-full w-full animate-pulse bg-slate-200" />}

      {qrStatus === 'error' && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-slate-500">
          <span>Couldn't load QR</span>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 transition-colors hover:bg-slate-200"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      <img
        src={qrUrl}
        alt={`QR code for ${displayName}`}
        onLoad={onLoad}
        onError={onError}
        className={qrStatus === 'success' ? 'h-full w-full object-contain p-2' : 'hidden'}
      />
    </div>
  );
}