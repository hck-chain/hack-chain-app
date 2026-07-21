import { Check, Copy, Linkedin, MessageCircleMore, RefreshCw, Share2, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { P } from '@/components/profile/palette';
import { useShare } from '@/hooks/useShare';
import { CopyButton } from '@/components/CopyButton';
import { useTranslation } from 'react-i18next'
import {
  FaLinkedin,
  FaWhatsapp,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';

interface ShareButtonProps {
  url: string;
  displayName: string;
  shareText: string;
  qrCaption: string;
  variant?: "outline" | "gradient";
  onShare?: () => void;
}

const buttonStyles = {
  outline:
    "inline-flex h-[34px] min-h-[34px] items-center justify-center gap-1.5 rounded-md px-3 text-[11px] font-mono tracking-wide whitespace-nowrap cursor-pointer select-none [&_svg]:text-purple-800 [&_svg]:size-3",

  gradient:
    "!h-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-600 hover:to-purple-700 text-white text-xs font-semibold shadow transition-[transform,opacity] duration-200 active:scale-95 [&_svg]:text-white [&_svg]:size-3",
};

export function ShareButton({ url, displayName, qrCaption, shareText, variant, onShare }: ShareButtonProps) {
  const { t } = useTranslation();
  const share = useShare({ url, shareText, onShare });
  
  const shareActions = [
    { key: 'whatsapp', label: 'WhatsApp', icon: <FaWhatsapp className="w-6 h-6 text-green-500" />, href: share.shareLinks.whatsapp },
    { key: 'linkedin', label: 'LinkedIn', icon: <FaLinkedin className="w-6 h-6 text-[#0A66C2]" />, href: share.shareLinks.linkedin },
    { key: 'twitter', label: 'Twitter / X', icon: <FaXTwitter className="w-6 h-6 text-white" />, href: share.shareLinks.twitter },
  ];
  

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant === "outline" ? "outline" : undefined}
          className={buttonStyles[variant]}
          style={
              variant === "outline"
                  ? {
                        borderColor: P.border,
                        color: P.textSecondary,
                        backgroundColor: P.surface,
                    }
                  : undefined
          }
        >
          <Share2 />
          {t('share.shareButton')} 
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl border-0 p-0 overflow-hidden"
       style={{ background: 'radial-gradient(at 80% 0%, oklch(0.7 0.16 280 / 0.18) 0%, transparent 55%), #09090b' }}
       aria-describedby={undefined}
      >
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-left text-xl font-semibold tracking-tight text-white" style={{ color: P.textPrimary }}>
            {t('share.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4 min-w-0">
          <CopyLinkCard url={url} onLinkCopy={share.handleLinkCopy} t={t} />
          <div>
            <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-2 block">
              {t('share.shareVia')}
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
 
         

          <QrCodeCard
            qrUrl={share.qrUrl}
            qrStatus={share.qrStatus}
            displayName={displayName}
            qrCaption={qrCaption}
            t={t}
            onLoad={share.handleQrLoad}
            onError={share.handleQrError}
            onRetry={share.retryQr}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}


interface CopyLinkCardProps {
  url: string;
  onLinkCopy: () => void;
  t: (key: string) => string;
}


function CopyLinkCard({ url, onLinkCopy, t }: CopyLinkCardProps) {
  return (
    <div>
      <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-2 block">
        {t('share.profileLink')}
      </label>
      <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 pl-5 border border-white/5">
        <span className="truncate text-sm sm:text-base text-slate-300 font-mono flex-1 min-w-0">{url}</span>
        {/* onLinkCopy rides the native click bubble from CopyButton without modifying that shared component */}
        <div onClick={onLinkCopy} className="contents">
          <CopyButton value={url} className="bg-white/5 hover:bg-white/10 text-white rounded-xl" />
        </div>
      </div>
    </div>
  );
}


interface QrCodeCardProps {
  qrUrl: string;
  qrStatus: 'loading' | 'success' | 'error';
  qrCaption: string;
  displayName: string;
  t: (key: string) => string;
  onLoad: () => void;
  onError: () => void;
  onRetry: () => void;
}

 function QrCodeCard({ qrUrl, qrStatus, qrCaption, displayName, t, onLoad, onError, onRetry }: QrCodeCardProps) {
  return (
    <div className="bg-black/40 rounded-2xl border border-white/5 p-4 text-center">
      <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-3 block">
        {t('share.qrCode')}
      </label>
      <QrCodeFrame qrUrl={qrUrl} qrStatus={qrStatus} qrCaption={qrCaption} displayName={displayName} t ={t} onLoad={onLoad} onError={onError} onRetry={onRetry} />
      {qrStatus === 'success' && (
        <>
          <p className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-3 block"> {qrCaption} </p>
        </>
      )
    }
    </div>
  );
}

function QrCodeFrame({ qrUrl, qrStatus, displayName, t, onLoad, onError, onRetry }: QrCodeCardProps) {
  return (
    <div className="mx-auto mb-4 flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl bg-white">
      {qrStatus === 'loading' && <div className="h-full w-full animate-pulse bg-slate-200" />}

      {qrStatus === 'error' && (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-xs text-slate-500">
          <span>{t('share.couldNotLoadQr')}</span>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 transition-colors hover:bg-slate-200"
          >
            <RefreshCw className="h-3 w-3" />
            {t('share.retry')}
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
