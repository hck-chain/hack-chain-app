import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, BadgeCheck, CalendarDays } from 'lucide-react';
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

  return (
    <button
      onClick={() => navigate(`/educator/${educator.wallet_address}`)}
      className="w-full text-left flex items-start gap-3 p-4 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.07] hover:border-white/20 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40"
      aria-label={`${t('discover.viewProfile')} ${displayName}`}
    >
      <Avatar className="h-11 w-11 shrink-0 ring-1 ring-white/10">
        <AvatarImage src={resolveIpfs(educator.photo_url)} alt={displayName} />
        <AvatarFallback className="bg-purple-950/80 text-purple-200 text-sm font-bold border border-purple-500/20">
          {initials(educator.name, educator.organization_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{displayName}</p>
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-purple-400" />
          {educator.has_classes && (
            <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
              {t('discover.hasClasses')}
            </span>
          )}
        </div>

        {educator.organization_name && educator.organization_name !== displayName && (
          <p className="text-xs text-slate-400 truncate leading-tight mt-0.5">
            {educator.organization_name}
          </p>
        )}

        {educator.bio && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-1">{educator.bio}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          <span className="flex items-center gap-1 text-xs text-slate-500 tabular-nums">
            <Award className="h-3 w-3" />
            {educator.certificates_issued} {t('discover.certs')}
          </span>
          {educator.knowledge_areas.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <CalendarDays className="h-3 w-3" />
              {educator.knowledge_areas[0]}
              {educator.knowledge_areas.length > 1 && ` +${educator.knowledge_areas.length - 1}`}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default FeaturedEducatorCard;
