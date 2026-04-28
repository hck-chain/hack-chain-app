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

const HackChainLogo = '/images/logoHackchain2.png';

function resolveIpfs(url: string | null): string {
  if (!url) return '';
  return url.startsWith('ipfs://')
    ? url.replace('ipfs://', 'https://ipfs.io/ipfs/')
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
        <Skeleton className="h-24 w-24 rounded-full bg-white/5 shrink-0" />
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
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
      <Icon className="h-5 w-5 text-blue-400 mb-1" />
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-xs text-slate-500 uppercase tracking-wide">{label}</span>
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
              <GraduationCap className="h-10 w-10 mb-3 opacity-30" />
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
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 p-6 rounded-3xl bg-white/5 border border-white/10">
                <Avatar className="h-24 w-24 shrink-0 ring-2 ring-white/10 text-2xl">
                  <AvatarImage
                    src={resolveIpfs(educator.photo_url)}
                    alt={displayName}
                  />
                  <AvatarFallback className="bg-gradient-to-tr from-blue-500 to-indigo-600 text-white font-bold text-2xl">
                    {initials(educator.name, educator.lastname, educator.organization_name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-white truncate">
                    {displayName}
                  </h1>

                  {educator.organization_name !== displayName && (
                    <p className="text-sm text-slate-400 mt-0.5">{educator.organization_name}</p>
                  )}

                  <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1 mt-3">
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Wallet className="h-3.5 w-3.5" />
                      <span className="font-mono">
                        ••••{educator.wallet_address.slice(-4)}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays className="h-3.5 w-3.5" />
                      Desde {formatDate(educator.joined_at)}
                    </span>
                  </div>

                  {educator.bio && (
                    <p className="text-sm text-slate-300 mt-4 leading-relaxed">
                      {educator.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={Award}
                  label="Certificados emitidos"
                  value={educator.certificates_issued}
                />
                <StatCard
                  icon={Users}
                  label="Talentos formados"
                  value={educator.talents_formed}
                />
              </div>

              {/* Knowledge areas */}
              {educator.knowledge_areas.length > 0 && (
                <div className="p-5 rounded-3xl bg-white/5 border border-white/10">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Áreas de conocimiento
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {educator.knowledge_areas.map((area) => (
                      <Badge
                        key={area}
                        variant="secondary"
                        className="bg-blue-500/10 text-blue-300 border-blue-500/20 rounded-full px-3 py-1 text-sm"
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Placeholder: courses / content */}
              <div className="flex flex-col items-center justify-center py-12 rounded-3xl border border-dashed border-white/10 text-slate-500">
                <GraduationCap className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Cursos y contenido — próximamente.</p>
              </div>
            </motion.div>
          )}
        </motion.main>
      </div>
    </Layout>
  );
};

export default EducatorProfile;
