import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, CalendarDays, Award, Users, BookOpen, GraduationCap } from 'lucide-react';
import Layout from '@/components/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEducatorProfile } from '@/hooks/useEducatorProfile';
import type { EducatorProfile as EducatorProfileType } from '@/types/dashboard';
import { AnimeParticles } from '@/components/animations/AnimeComponents';

const HackChainLogo = '/images/logoHackchain2.webp';

function resolveIpfs(url: string | null): string {
  if (!url) return '';
  return url.startsWith('ipfs://')
    ? `https://gateway.pinata.cloud/ipfs/${url.slice('ipfs://'.length)}`
    : url;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

function initials(name: string | null, lastname: string | null, org: string): string {
  const source = [name, lastname].filter(Boolean).join(' ') || org;
  return source
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-3xl bg-white/5 border border-white/10">
        <Skeleton className="h-24 w-24 rounded-2xl bg-white/5 shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <Skeleton className="h-5 w-48 bg-white/5" />
          <Skeleton className="h-4 w-32 bg-white/5" />
          <Skeleton className="h-4 w-56 bg-white/5" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-20 rounded-2xl bg-white/5" />
        <Skeleton className="h-20 rounded-2xl bg-white/5" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <div className="relative overflow-hidden flex flex-col items-center justify-center p-4 rounded-2xl bg-white/[0.03] border-2 border-white/30 shadow-lg text-center">
      <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] pointer-events-none" />
      <AnimeParticles />
      <div className="relative z-10 flex flex-col items-center justify-center gap-1">
        {typeof Icon === 'string' ? <img src={Icon} className="h-6 w-6 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mb-1" alt={label} /> : <Icon className="h-5 w-5 text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] mb-1" />}
        <span className="text-2xl font-bold text-white drop-shadow-sm">{value}</span>
        <span className="text-xs text-white uppercase tracking-wider font-bold drop-shadow-md">{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

const EducatorProfile = () => {
  const { wallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const { data: educator, isPending, isError } = useEducatorProfile(wallet);

  const displayName =
    [educator?.name, educator?.lastname].filter(Boolean).join(' ') ||
    educator?.organization_name ||
    '—';

  return (
    <Layout>
      <div className="min-h-screen font-body text-slate-200">
        <motion.main
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 px-4 sm:px-6 md:px-10 pt-10 pb-20 max-w-3xl mx-auto"
        >
          {/* ---- Header ---- */}
          <header className="mb-8 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full px-4 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Volver</span>
            </Button>

            <img src={HackChainLogo} alt="HackChain" className="h-10 object-contain" />
          </header>

          {/* ---- Error state ---- */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <img src="/icons/graduado.avif" className="h-12 w-12 mb-3 opacity-30 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              <p className="text-base">No se encontró el educador.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="mt-4 text-blue-400 hover:text-blue-300"
              >
                Volver
              </Button>
            </div>
          )}

          {/* ---- Loading ---- */}
          {isPending && !isError && <ProfileSkeleton />}

          {/* ---- Profile ---- */}
          {educator && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Profile card */}
              <div className="relative overflow-hidden p-6 rounded-3xl bg-white/[0.03] border-2 border-white/30 shadow-lg">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
                <AnimeParticles />

                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <Avatar className="h-24 w-24 shrink-0 rounded-2xl ring-2 ring-white/10 text-2xl">
                    <AvatarImage
                      src={resolveIpfs(educator.photo_url)}
                      alt={displayName}
                      className="rounded-2xl object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-2xl rounded-2xl">
                      {initials(educator.name, educator.lastname, educator.organization_name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 text-center sm:text-left min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-white truncate drop-shadow-md">
                      {displayName}
                    </h1>

                    {educator.organization_name !== displayName && (
                      <p className="text-sm font-semibold text-slate-200 drop-shadow-sm mt-0.5">{educator.organization_name}</p>
                    )}

                    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1 mt-3">
                      <span className="flex items-center gap-1.5 text-xs text-white drop-shadow-md font-bold">
                        <img src="/icons/wallet.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        <span className="font-mono">
                          {educator.wallet_address ? `${educator.wallet_address.slice(0, 6)}…${educator.wallet_address.slice(-4)}` : "—"}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-white drop-shadow-md font-bold">
                        <img src="/icons/calendario.avif" className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        Desde {formatDate(educator.joined_at)}
                      </span>
                    </div>

                    {educator.bio && (
                      <p className="text-sm text-slate-100 font-medium mt-4 leading-relaxed drop-shadow-sm">
                        {educator.bio}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={"/icons/medalla.avif"}
                  label="Certificados emitidos"
                  value={educator.certificates_issued}
                />
                <StatCard
                  icon={"/icons/talentsPlattform.avif"}
                  label="Talentos formados"
                  value={educator.talents_formed}
                />
              </div>

              {/* Knowledge areas */}
              {educator.knowledge_areas.length > 0 && (
                <div className="relative overflow-hidden p-5 rounded-3xl bg-white/[0.03] border-2 border-white/30 shadow-lg">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
                  <AnimeParticles />
                  <div className="relative z-10">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white drop-shadow-md mb-3 flex items-center gap-2">
                      <img src="/icons/libroNeon.avif" className="h-6 w-6 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                       Áreas de conocimiento
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {educator.knowledge_areas.map((area) => (
                        <Badge
                          key={area}
                          variant="secondary"
                          className="bg-purple-500/10 text-purple-300 border-purple-500/20 rounded-full px-3 py-1 text-sm shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                        >
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Placeholder: courses / content */}
              <div className="relative overflow-hidden flex flex-col items-center justify-center py-12 rounded-3xl border-2 border-dashed border-white/30 bg-white/[0.03] shadow-lg">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />
                <AnimeParticles />
                <div className="relative z-10 flex flex-col items-center justify-center text-slate-300">
                  <img src="/icons/graduado.avif" className="h-10 w-10 mb-2 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                  <p className="text-sm font-bold drop-shadow-md text-white">Cursos y contenido — próximamente.</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.main>
      </div>
    </Layout>
  );
};

export default EducatorProfile;
