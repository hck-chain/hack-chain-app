import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Award, ChevronRight } from 'lucide-react';
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
  if (!iso) return '';
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
  const showOrg = educator.organization_name && educator.organization_name !== displayName;
  const joinedDate = formatJoinedDate(educator.joined_at);

  return (
    <button
      onClick={() => navigate(`/educator/${educator.wallet_address}`)}
      className="group w-full text-left flex items-center gap-3.5 py-4 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.03] rounded-xl px-2 -mx-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30"
      aria-label={`Ver perfil de ${displayName}`}
    >
      <Avatar className="h-9 w-9 shrink-0 ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
        <AvatarImage src={resolveIpfs(educator.photo_url)} alt={displayName} />
        <AvatarFallback className="bg-purple-950/80 text-purple-200 text-xs font-bold border border-purple-500/20">
          {initials(educator.name, educator.organization_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-white truncate leading-tight">{displayName}</span>
          {educator.is_approved && (
            <img src="/icons/escudoNeon.avif" alt="Verificado" className="h-3 w-3 shrink-0 opacity-80" />
          )}
        </div>
        {showOrg && (
          <p className="text-xs text-slate-500 truncate mt-0.5">{educator.organization_name}</p>
        )}
        {joinedDate && (
          <p className="text-[11px] text-slate-600 mt-0.5">desde {joinedDate}</p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2.5">
        <div className="flex items-center gap-1 text-xs text-slate-500 tabular-nums">
          <Award className="h-3 w-3 text-slate-600" />
          {educator.certs_to_me}
        </div>
        <ChevronRight className="h-3.5 w-3.5 text-slate-700 group-hover:text-slate-400 transition-colors" />
      </div>
    </button>
  );
};

export default EducatorMiniCard;
