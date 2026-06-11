import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Wallet, CalendarDays, Award } from 'lucide-react';
import type { Educator } from '@/types/dashboard';

interface Props {
  educator: Educator;
}

function resolveIpfs(url: string | null): string {
  if (!url) return '';
  return url.startsWith('ipfs://')
    ? url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    : url;
}

function formatJoinedDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-MX', { month: 'short', year: 'numeric' }).format(new Date(iso));
}

function initials(name: string | null, org: string): string {
  const source = name || org;
  return source
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

const EducatorMiniCard = ({ educator }: Props) => {
  const navigate = useNavigate();
  const displayName = [educator.name, educator.lastname].filter(Boolean).join(' ') || educator.organization_name;
  const maskedWallet = `••••${educator.wallet_address.slice(-4)}`;

  return (
    <button
      onClick={() => navigate(`/educator/${educator.wallet_address}`)}
      className="w-full text-left flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 active:scale-[0.98] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 min-h-[72px]"
      aria-label={`Ver perfil de ${displayName}`}
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
          {educator.is_approved && (
            <img src="/icons/escudoNeon.avif" alt="Verificado" className="h-3.5 w-3.5 shrink-0" />
          )}
        </div>
        {educator.organization_name !== displayName && (
          <p className="text-xs text-slate-400 truncate leading-tight mt-0.5">{educator.organization_name}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <Wallet className="h-3 w-3" />
            <span className="font-mono">{maskedWallet}</span>
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays className="h-3 w-3" />
            {formatJoinedDate(educator.joined_at)}
          </span>
        </div>
      </div>

      <Badge
        variant="secondary"
        className="shrink-0 self-start mt-0.5 bg-blue-500/10 text-blue-400 border-blue-500/20 text-xs"
      >
        <Award className="h-3 w-3 mr-1" />
        {educator.certs_to_me}
      </Badge>
    </button>
  );
};

export default EducatorMiniCard;
