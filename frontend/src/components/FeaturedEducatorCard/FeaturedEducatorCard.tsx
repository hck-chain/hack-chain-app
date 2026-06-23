import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, BookOpen } from 'lucide-react';
import type { FeaturedEducator } from '@/types/dashboard';

interface Props {
  educator: FeaturedEducator;
}

function resolveIpfs(url: string | null): string {
  if (!url) return '';
  return url.startsWith('ipfs://')
    ? url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    : url;
}

function initials(name: string | null, org: string | null): string {
  const source = name || org || '?';
  return source
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const FeaturedEducatorCard = ({ educator }: Props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const displayName =
    [educator.name, educator.lastname].filter(Boolean).join(' ') ||
    educator.organization_name ||
    educator.wallet_address.slice(0, 8);

  const showOrg =
    educator.organization_name && educator.organization_name !== displayName;

  const area = educator.knowledge_areas[0] ?? null;
  const extraAreas = educator.knowledge_areas.length - 1;
  const photoSrc = resolveIpfs(educator.photo_url);

  return (
    <button
      onClick={() => navigate(`/educator/${educator.wallet_address}`)}
      className="group w-full text-left rounded-2xl overflow-hidden border border-white/[0.07] bg-white/[0.03] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30"
      style={{ transition: 'transform 120ms ease-out, border-color 150ms ease-out' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
      aria-label={`${t('discover.viewProfile')} ${displayName}`}
    >
      {/* Photo */}
      <div className="relative w-full aspect-[4/5] overflow-hidden bg-white/[0.06]">
        {photoSrc ? (
          <img
            src={photoSrc}
            alt={displayName}
            className="w-full h-full object-cover object-center"
            style={{ transition: 'transform 300ms ease-out' }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.06] to-white/[0.02]">
            <span className="text-4xl font-black text-white/20 select-none">
              {initials(educator.name, educator.organization_name)}
            </span>
          </div>
        )}

        {/* Bottom gradient overlay with name */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-1 min-w-0">
            <p className="text-[13px] font-bold text-white leading-tight truncate drop-shadow-sm">
              {displayName}
            </p>
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-purple-300/80" />
          </div>
          {showOrg && (
            <p className="text-[11px] text-white/60 truncate mt-0.5 leading-tight">
              {educator.organization_name}
            </p>
          )}
        </div>
      </div>

      {/* Info strip below photo */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {area ? (
            <span className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
              <BookOpen className="h-[10px] w-[10px] shrink-0" />
              {area}
              {extraAreas > 0 && ` +${extraAreas}`}
            </span>
          ) : educator.bio ? (
            <span className="text-[11px] text-slate-500 truncate block">{educator.bio}</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {educator.has_classes && (
            <span className="text-[10px] font-medium text-emerald-500">
              {t('discover.hasClasses')}
            </span>
          )}
          {educator.certificates_issued > 0 && (
            <span className="text-[11px] text-slate-600 tabular-nums">
              {educator.certificates_issued}c
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default FeaturedEducatorCard;
