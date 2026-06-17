import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Search, X, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Layout from '@/components/Layout';
import { useEducatorsList } from '@/hooks/useEducatorsList';
import type { FeaturedEducator } from '@/types/dashboard';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function resolveIpfs(url: string | null): string {
  if (!url) return '';
  return url.startsWith('ipfs://')
    ? url.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
    : url;
}

function initials(name: string | null, org: string | null): string {
  const source = name || org || '?';
  return source.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function EducatorRow({ educator }: { educator: FeaturedEducator }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const displayName =
    [educator.name, educator.lastname].filter(Boolean).join(' ') ||
    educator.organization_name ||
    educator.wallet_address.slice(0, 8);

  const showOrg = educator.organization_name && educator.organization_name !== displayName;

  return (
    <button
      onClick={() => navigate(`/educator/${educator.wallet_address}`)}
      className="group w-full text-left flex items-center gap-4 py-4 border-b border-white/[0.05] last:border-b-0 hover:bg-white/[0.03] rounded-xl px-2 -mx-2 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/30"
      aria-label={`Ver perfil de ${displayName}`}
    >
      <Avatar className="h-11 w-11 shrink-0 ring-1 ring-white/10 group-hover:ring-white/20 transition-all">
        <AvatarImage src={resolveIpfs(educator.photo_url)} alt={displayName} />
        <AvatarFallback className="bg-purple-950/80 text-purple-200 text-sm font-bold border border-purple-500/20">
          {initials(educator.name, educator.organization_name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[15px] font-semibold text-white leading-tight truncate">
            {displayName}
          </span>
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-purple-400" />
          {educator.has_classes && (
            <span className="inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wide shrink-0">
              {t('discover.hasClasses')}
            </span>
          )}
        </div>

        {showOrg && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{educator.organization_name}</p>
        )}

        {educator.knowledge_areas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {educator.knowledge_areas.slice(0, 3).map((area) => (
              <span key={area} className="text-[11px] text-slate-500 bg-white/[0.04] px-1.5 py-px rounded">
                {area}
              </span>
            ))}
            {educator.knowledge_areas.length > 3 && (
              <span className="text-[11px] text-slate-600 self-center">
                +{educator.knowledge_areas.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-3">
        <span className="hidden sm:block text-xs text-slate-600 tabular-nums">
          {educator.certificates_issued} <span className="text-slate-700 text-[10px] font-medium">NFT</span>
        </span>
        <ChevronRight className="h-4 w-4 text-slate-700 group-hover:text-slate-400 transition-colors" />
      </div>
    </button>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 py-4 border-b border-white/[0.05] px-2 animate-pulse">
      <div className="h-11 w-11 rounded-full bg-white/[0.05] shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-36 bg-white/[0.05] rounded-full" />
        <div className="h-2.5 w-24 bg-white/[0.04] rounded-full" />
        <div className="flex gap-1.5 mt-1">
          <div className="h-4 w-16 bg-white/[0.03] rounded" />
          <div className="h-4 w-14 bg-white/[0.03] rounded" />
        </div>
      </div>
      <div className="h-3 w-5 bg-white/[0.04] rounded-full hidden sm:block" />
    </div>
  );
}

export default function EducatorsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(1);
  const [areaInput, setAreaInput] = useState('');
  const debouncedArea = useDebounce(areaInput.trim() || undefined, 400);

  const { data, isPending } = useEducatorsList(page, 12, debouncedArea as string | undefined);
  const educators = data?.educators ?? [];
  const pagination = data?.pagination;

  const handleAreaChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAreaInput(e.target.value);
    setPage(1);
  }, []);

  const clearSearch = useCallback(() => {
    setAreaInput('');
    setPage(1);
    inputRef.current?.focus();
  }, []);

  return (
    <Layout>
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/[0.06]"
        style={{ backgroundColor: 'oklch(0.11 0.012 280 / 0.88)' }}
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14 gap-2">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors min-h-[44px] px-2 -ml-2 rounded-lg"
              aria-label={t('common.back')}
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{t('common.back', 'Volver')}</span>
            </button>

            <div className="flex items-center gap-2">
              <img
                src="/icons/maletinNeon.avif"
                alt=""
                className="h-5 w-5 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.6)] shrink-0"
              />
              <h1 className="font-title text-sm font-semibold text-white">
                {t('discover.allEducators')}
              </h1>
            </div>

            {/* Balance spacer */}
            <div className="w-16 sm:w-20" aria-hidden="true" />
          </div>

          {/* Search */}
          <div className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-600 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={areaInput}
                onChange={handleAreaChange}
                placeholder={t('discover.searchEducators', 'Buscar por nombre o área...')}
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/30 focus:bg-white/[0.05] transition-all duration-150"
              />
              <AnimatePresence>
                {areaInput && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.1 }}
                    onClick={clearSearch}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-28">

        {isPending && (
          <div>
            {[...Array(8)].map((_, i) => <RowSkeleton key={i} />)}
          </div>
        )}

        {!isPending && educators.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <img
              src="/icons/maletinNeon.avif"
              alt=""
              className="h-10 w-10 object-contain opacity-20"
            />
            <p className="text-sm text-slate-500">{t('discover.noResults')}</p>
            {areaInput && (
              <button
                onClick={clearSearch}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors min-h-[44px] px-3"
              >
                {t('common.clearSearch', 'Limpiar búsqueda')}
              </button>
            )}
          </div>
        )}

        {!isPending && educators.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${page}-${debouncedArea}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {educators.map((educator) => (
                <EducatorRow key={educator.wallet_address} educator={educator} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.05]">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('common.prev')}
            </button>

            <span className="text-xs text-slate-600 tabular-nums">
              {page} / {pagination.pages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="flex items-center gap-1.5 min-h-[44px] px-4 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] disabled:opacity-25 disabled:cursor-not-allowed transition-all"
            >
              {t('common.next')}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
