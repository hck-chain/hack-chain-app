import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import FeaturedEducatorCard from '@/components/FeaturedEducatorCard/FeaturedEducatorCard';
import { useEducatorsList } from '@/hooks/useEducatorsList';

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function EducatorCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
      <Skeleton className="h-11 w-11 rounded-full bg-white/5 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32 bg-white/5" />
        <Skeleton className="h-3 w-24 bg-white/5" />
        <Skeleton className="h-3 w-40 bg-white/5" />
      </div>
    </div>
  );
}

export default function EducatorsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-white text-sm mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          {t('common.back')}
        </button>

        <div className="flex items-center gap-3 mb-6">
          <img src="/icons/maletinNeon.avif" alt="" className="h-6 w-6 object-contain drop-shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0" />
          <h1 className="text-xl font-bold text-white">{t('discover.allEducators')}</h1>
          {pagination && (
            <span className="text-sm text-slate-500">({pagination.total})</span>
          )}
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={areaInput}
            onChange={handleAreaChange}
            placeholder={t('discover.filterByArea')}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-white/20 transition-all"
          />
        </div>

        {isPending ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <EducatorCardSkeleton key={i} />)}
          </div>
        ) : educators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <img src="/icons/maletinNeon.avif" alt="" className="h-10 w-10 object-contain opacity-30 mb-3" />
            <p className="text-base">{t('discover.noResults')}</p>
          </div>
        ) : (
          <motion.div
            key={`${page}-${debouncedArea}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {educators.map((educator) => (
              <FeaturedEducatorCard key={educator.wallet_address} educator={educator} />
            ))}
          </motion.div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
              {t('common.prev')}
            </button>

            <span className="text-sm text-slate-500">
              {page} / {pagination.pages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
              disabled={page === pagination.pages}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 text-sm text-slate-400 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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
