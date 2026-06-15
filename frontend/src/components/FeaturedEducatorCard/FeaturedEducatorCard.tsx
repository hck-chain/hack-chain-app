import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, CalendarDays, BadgeCheck } from 'lucide-react';
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

  const maskedWallet = `••••${educator.wallet_address.slice(-4)}`;

  return (
    <button
      onClick={() => navigate(`/educator/${educator.wallet_address}`)}
      className="w-full text-left flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
      aria-label={`${t('discover.viewProfile')} ${displayName}`}
    >
      <Avatar className="h-11 w-11 shrink-0 ring-2 ring-white/10">
        <AvatarImage src={resolveIpfs(educator.photo_url)} alt={displayName} />
        <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-indigo-600 text-white text-sm font-bold">
          {initials(educator.name, educator.organization_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-semibold text-white truncate leading-tight">{displayName}</p>
          <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: '#a855f7' }} title={t('discover.verified')} />
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
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Award className="h-3 w-3" />
            <span>{educator.certificates_issued} {t('discover.certs')}</span>
          </span>
          {educator.knowledge_areas.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <CalendarDays className="h-3 w-3" />
              {educator.knowledge_areas[0]}
              {educator.knowledge_areas.length > 1 && ` +${educator.knowledge_areas.length - 1}`}
            </span>
          )}
        </div>

        {educator.has_classes && (
          <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/10 text-green-400 border border-green-500/20">
            {t('discover.hasClasses')}
          </span>
        )}
      </div>
    </button>
  );
};

export default FeaturedEducatorCard;
