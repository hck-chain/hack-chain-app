import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Share2, Users, Coins, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '@/components/Layout';
import { CopyButton } from '@/components/CopyButton';
import { useMyReferralCode, useMyReferrals, useMyReferralStats } from '@/hooks/useReferrals';
import { useAuth } from '@/contexts/AuthContext';

const STAKING_ENABLED = false;

export default function Referrals() {
  const { t } = useTranslation();
  const { isLoading: authLoading } = useAuth();
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data: codeData, isLoading: codeLoading } = useMyReferralCode();
  const { data: statsData, isLoading: statsLoading } = useMyReferralStats();
  const { data: listData, isLoading: listLoading, isFetching: listFetching } = useMyReferrals(page, pageSize);

  // authLoading must be included: in React Query v4 disabled queries report isLoading=false,
  // so without this the page renders empty boxes while auth context is still hydrating.
  const isLoading = authLoading || codeLoading || statsLoading;

  const { code, shareUrl } = codeData || { code: '', shareUrl: '' };
  const stats = statsData || { totalEarnedWei: '0', claimedCount: 0, pendingCount: 0, eligibleCount: 0, monthlyClaimedCount: 0, monthlyCapRemaining: 5 };
  const referrals = listData?.referrals || [];
  const totalPages = listData?.totalPages || 1;

  return (
    <Layout>
      <div className="min-h-screen relative font-body text-slate-200 px-4 sm:px-6 md:px-12 pt-12 pb-20 max-w-[1200px] mx-auto">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 space-y-10"
        >
          {/* Header */}
          <header className="mb-14">
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2 font-title flex items-center gap-4">
              <Share2 className="text-purple-400 h-10 w-10" />
              {t('referrals.pageTitle')}
            </h1>
            <p className="text-lg text-slate-400 font-light font-body max-w-2xl mt-2">
              {t('referrals.pageSubtitle')}
            </p>
          </header>

          {!STAKING_ENABLED && (
            <div className="border border-white/10 rounded-3xl p-6 sm:p-8 mb-8">
              <div className="flex gap-6 items-start">
                <Clock className="h-12 w-12 text-purple-400 shrink-0" />
                <div>
                  <h4 className="font-title text-xl font-bold text-white mb-2">{t('referrals.comingSoon.title', '¡El Staking llega pronto!')}</h4>
                  <p className="font-body text-sm text-slate-400 leading-relaxed max-w-4xl">
                    {t('referrals.comingSoon.desc', 'Pronto tus referidos podrán hacer staking y empezarás a ganar recompensas reales. Empieza a referir ahora y construye tu red de cara a la Fase 2. Todo usuario registrado bajo tu enlace será elegible para darte recompensas una vez que se habilite el contrato.')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="animate-pulse space-y-8">
              <div className="h-64 rounded-3xl border border-white/10" />
              <div className="h-96 rounded-3xl border border-white/10" />
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-12 gap-8 items-start">
                {/* Invite section */}
                <div className="md:col-span-7 border border-white/10 rounded-[32px] p-8">
                  <h3 className="font-title text-3xl font-bold mb-3 text-white tracking-tight">{t('referrals.shareCode', 'Comparte tu código')}</h3>
                  <p className="font-body text-base text-slate-400 mb-8">
                    {t('referrals.instructions', 'Comparte este enlace. Tu amigo se registra y hace stake de 1000 HACK por 30 días. Tú te llevas 1000 HACK.')}
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-2 block">{t('referrals.yourCode', 'Tu Código')}</label>
                      <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 pl-5 border border-white/5">
                        <span className="font-mono text-xl sm:text-2xl text-purple-400 font-bold tracking-[0.25em]">{code}</span>
                        <CopyButton value={code} className="ml-auto bg-white/5 hover:bg-white/10 text-white rounded-xl" />
                      </div>
                    </div>

                    <div>
                      <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-2 block">{t('referrals.inviteLink', 'Enlace de invitación')}</label>
                      <div className="flex items-center gap-3 bg-black/40 rounded-2xl p-3 pl-5 border border-white/5">
                        <span className="truncate text-sm sm:text-base text-slate-300 font-mono flex-1">{shareUrl}</span>
                        <CopyButton value={shareUrl} className="bg-white/5 hover:bg-white/10 text-white rounded-xl" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats grid */}
                <div className="md:col-span-5 grid grid-cols-2 gap-4">
                  <div className="col-span-2 rounded-3xl p-6 border border-white/10 flex flex-col justify-center">
                    <span className="font-title text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold flex items-center gap-2 mb-2"><Coins size={14}/> {t('referrals.stats.totalEarned', 'Total Ganado')}</span>
                    <span className="text-4xl sm:text-5xl font-title font-black text-white">
                      {stats.totalEarnedWei !== '0' ? (BigInt(stats.totalEarnedWei) / 10n**18n).toString() : '0'} <span className="text-xl sm:text-2xl text-purple-400 font-bold ml-1">HACK</span>
                    </span>
                  </div>

                  <div className="rounded-3xl p-6 border border-white/[0.07] flex flex-col justify-center">
                    <span className="font-title text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold flex items-center gap-2 mb-3"><CheckCircle size={14}/> {t('referrals.stats.monthly', 'Mensual')}</span>
                    <span className="text-3xl font-title font-bold text-white">
                      {stats.monthlyClaimedCount} <span className="text-lg text-slate-500">/ {stats.monthlyClaimedCount + stats.monthlyCapRemaining}</span>
                    </span>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex-1 rounded-2xl px-5 py-4 border border-white/[0.07] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400 font-bold font-title"><Users size={14} className="text-blue-400"/> {t('referrals.stats.pending', 'Pendientes')}</div>
                      <span className="text-xl font-title font-bold text-white">{stats.pendingCount}</span>
                    </div>
                    <div className="flex-1 rounded-2xl px-5 py-4 border border-white/[0.07] flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400 font-bold font-title"><Clock size={14} className="text-yellow-400"/> {t('referrals.stats.queued', 'En cola')}</div>
                      <span className="text-xl font-title font-bold text-white">{stats.eligibleCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referrals list */}
              <div className="border border-white/10 rounded-3xl overflow-hidden">
                <div className="px-8 py-7 border-b border-white/10 flex items-center justify-between">
                  <h3 className="font-title text-2xl font-bold text-white flex items-center gap-3 tracking-tight">
                    <img src="/icons/talentsPlattform.avif" alt="" className="h-6 w-6 object-contain" />
                    {t('referrals.list.title', 'Mis Referidos')}
                  </h3>
                  <span className="font-title text-[10px] uppercase tracking-[0.2em] text-white/50 border border-white/10 px-4 py-1.5 rounded-full font-bold">
                    {t('referrals.list.total', 'Total:')} {listData?.total || 0}
                  </span>
                </div>

                {referrals.length === 0 ? (
                  <div className="py-24 flex flex-col items-center justify-center text-center px-4">
                    <Share2 className="h-20 w-20 text-purple-400/50 mb-6" />
                    <h4 className="font-title text-2xl font-bold text-white mb-3">{t('referrals.empty.title', 'Aún no tienes referidos')}</h4>
                    <p className="font-body text-slate-400 max-w-md">{t('referrals.empty.desc', 'Comparte tu código de invitación para construir tu red y empezar a ganar recompensas.')}</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto relative">
                      {listFetching && (
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10" />
                      )}
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="font-body text-[10px] uppercase tracking-[0.2em] text-white/40 bg-black/20 border-b border-white/10 font-bold">
                          <tr>
                            <th className="px-8 py-5">{t('referrals.table.referred', 'Referido')}</th>
                            <th className="px-8 py-5">{t('referrals.table.status', 'Estado')}</th>
                            <th className="px-8 py-5">{t('referrals.table.progress', 'Progreso')}</th>
                            <th className="px-8 py-5 text-right">{t('referrals.table.date', 'Fecha de Registro')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {referrals.map((ref) => (
                            <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-6 font-title font-bold text-white text-base tracking-tight">{ref.referredName}</td>
                              <td className="px-8 py-6">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                                  ref.status === 'claimed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                  ref.status === 'pending_stake' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                                  ref.status === 'queued_next_month' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                  'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                }`}>
                                  {ref.status.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-full bg-black/40 rounded-full h-2 max-w-[140px] overflow-hidden border border-white/5">
                                    <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${(ref.progressDays / 30) * 100}%` }}>
                                      <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    </div>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-mono tracking-wider">{ref.progressDays}/30 {t('referrals.table.days', 'días')}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6 text-right text-slate-400 font-mono text-[11px] tracking-wider">
                                {new Date(ref.createdAt).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {totalPages > 1 && (
                      <div className="px-8 py-5 border-t border-white/10 flex items-center justify-between bg-black/20">
                        <span className="font-body text-xs text-slate-400 uppercase tracking-wider font-bold">
                          {t('referrals.pagination', 'Página {{page}} de {{totalPages}}', { page, totalPages })}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </motion.main>
      </div>
    </Layout>
  );
}
