import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CopyButton } from '../CopyButton';
import { useMyReferralCode, useMyReferrals, useMyReferralStats } from '@/hooks/useReferrals';
import { Share2, Users, Coins, CheckCircle, Clock } from 'lucide-react';

export function ReferralsSection() {
  const { t } = useTranslation();
  const { data: codeData, isLoading: codeLoading } = useMyReferralCode();
  const { data: statsData, isLoading: statsLoading } = useMyReferralStats();
  const { data: listData, isLoading: listLoading } = useMyReferrals(1, 5);

  const STAKING_ENABLED = false;

  const { code, shareUrl } = codeData || { code: '', shareUrl: '' };
  const stats = statsData || { totalEarnedWei: '0', claimedCount: 0, pendingCount: 0, eligibleCount: 0, monthlyClaimedCount: 0, monthlyCapRemaining: 5 };
  const referrals = listData?.referrals || [];

  return (
    <div className="space-y-6 mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
          <Share2 className="text-primary" />
          {t('referrals.title', 'Referidos')}
        </h2>
        <Link to="/referrals" className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors">
          {t('referrals.viewAll', 'Ver todos')}
        </Link>
      </div>

      {!STAKING_ENABLED && (
        <div className="border border-white/10 rounded-3xl p-5 sm:p-6">
          <div className="flex gap-5 items-start">
            <Clock className="h-10 w-10 text-purple-400 shrink-0" />
            <div>
              <h4 className="font-title text-lg font-bold text-white mb-1.5">{t('referrals.comingSoon.title', '¡El Staking llega pronto!')}</h4>
              <p className="font-body text-sm text-slate-400 leading-relaxed max-w-4xl">
                {t('referrals.comingSoon.desc', 'Pronto tus referidos podrán hacer staking y empezarás a ganar recompensas reales. Empieza a referir ahora y construye tu red de cara a la Fase 2.')}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-white/10 rounded-3xl p-6">
          <h3 className="font-title text-2xl font-bold mb-2 text-white tracking-tight">{t('referrals.shareCode', 'Comparte tu código')}</h3>
          <p className="font-body text-sm text-slate-400 mb-6">
            {t('referrals.instructions', 'Comparte este link. Tu amigo se registra y hace stake de 1000 HACK por 30 días. Tú te llevas 1000 HACK.')}
          </p>

          <div className="space-y-5">
            <div>
              <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-2 block">{t('referrals.yourCode', 'Tu Código')}</label>
              <div className="flex items-center gap-2 bg-black/40 rounded-2xl p-2 pl-4 border border-white/5 min-h-[48px]">
                {codeLoading
                  ? <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
                  : <><span className="font-mono text-xl text-purple-400 font-bold tracking-[0.25em]">{code}</span>
                     <CopyButton value={code} className="ml-auto bg-white/5 hover:bg-white/10 text-white rounded-xl" /></>
                }
              </div>
            </div>
            <div>
              <label className="font-body text-[10px] uppercase tracking-[0.22em] text-white/40 font-bold mb-2 block">{t('referrals.inviteLink', 'Link de invitación')}</label>
              <div className="flex items-center gap-2 bg-black/40 rounded-2xl p-2 pl-4 border border-white/5 min-h-[48px]">
                {codeLoading
                  ? <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                  : <><span className="truncate text-sm text-slate-300 font-mono flex-1">{shareUrl}</span>
                     <CopyButton value={shareUrl} className="bg-white/5 hover:bg-white/10 text-white rounded-xl" /></>
                }
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border border-white/[0.07] rounded-3xl p-5">
          {statsLoading ? (
            <>
              <div className="rounded-2xl p-5 border border-white/10 animate-pulse h-24" />
              <div className="rounded-2xl p-5 border border-white/5 animate-pulse h-24" />
              <div className="col-span-2 rounded-2xl px-5 py-4 border border-white/5 animate-pulse h-12" />
            </>
          ) : (
            <>
              <div className="rounded-2xl p-5 border border-white/10 flex flex-col justify-center">
                <span className="font-title text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold flex items-center gap-2 mb-2"><Coins size={14}/> {t('referrals.stats.totalEarned', 'Total Ganado')}</span>
                <span className="text-3xl font-title font-black text-white">
                  {stats.totalEarnedWei !== '0' ? (BigInt(stats.totalEarnedWei) / 10n**18n).toString() : '0'} <span className="text-lg text-purple-400 font-bold ml-1">HACK</span>
                </span>
              </div>
              <div className="rounded-2xl p-5 border border-white/5 flex flex-col justify-center">
                <span className="font-title text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold flex items-center gap-2 mb-2"><CheckCircle size={14}/> {t('referrals.stats.monthly', 'Mensual')}</span>
                <span className="text-2xl font-title font-bold text-white">
                  {stats.monthlyClaimedCount} <span className="text-sm text-slate-500">/ {stats.monthlyClaimedCount + stats.monthlyCapRemaining}</span>
                </span>
                <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">{t('referrals.stats.paymentsThisMonth', 'Pagos este mes')}</span>
              </div>
              <div className="col-span-2 flex flex-wrap gap-4 text-xs text-slate-400 rounded-2xl px-5 py-4 border border-white/5 font-title font-bold uppercase tracking-wider">
                <div className="flex items-center gap-2"><Users size={14} className="text-blue-400"/> <span className="text-white">{stats.pendingCount}</span> {t('referrals.stats.pending', 'Pendientes')}</div>
                <div className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400"/> <span className="text-white">{stats.claimedCount}</span> {t('referrals.stats.paid', 'Pagados')}</div>
                <div className="flex items-center gap-2"><Clock size={14} className="text-yellow-400"/> <span className="text-white">{stats.eligibleCount}</span> {t('referrals.stats.queued', 'En cola')}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {listLoading && (
        <div className="border border-white/10 rounded-3xl p-6 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}
      {!listLoading && referrals.length > 0 && (
        <div className="border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[480px]">
              <thead className="font-body text-[10px] uppercase tracking-[0.2em] text-white/40 bg-black/20 border-b border-white/10 font-bold">
                <tr>
                  <th className="px-6 py-5">{t('referrals.table.referred', 'Referido')}</th>
                  <th className="px-6 py-5">{t('referrals.table.status', 'Estado')}</th>
                  <th className="px-6 py-5">{t('referrals.table.progress', 'Progreso')}</th>
                  <th className="px-6 py-5 text-right">{t('referrals.table.date', 'Fecha')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {referrals.map((ref) => (
                  <tr key={ref.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5 font-title font-bold text-white text-sm tracking-tight">{ref.referredName}</td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${
                        ref.status === 'claimed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        ref.status === 'pending_stake' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        ref.status === 'queued_next_month' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {ref.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-full bg-black/40 rounded-full h-1.5 max-w-[100px] overflow-hidden border border-white/5">
                          <div className="bg-gradient-to-r from-purple-500 to-fuchsia-500 h-full rounded-full transition-all duration-1000 relative" style={{ width: `${(ref.progressDays / 30) * 100}%` }}>
                            <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono tracking-wider">{ref.progressDays}/30</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right text-slate-400 font-mono text-[10px] tracking-wider">
                      {new Date(ref.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
