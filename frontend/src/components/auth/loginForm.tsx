import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWalletLogin } from "@/hooks/useWalletLogin";

interface LoginFormProps {
  disabled?: boolean;
}

const shortAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`;

export const LoginForm = ({ disabled = false }: LoginFormProps) => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const {
    connect,
    signAndLogin,
    reset,
    walletAddress,
    isConnecting,
    isAwaitingSignature,
    isSigning,
    error: walletError,
    isWalletNotFound,
  } = useWalletLogin();

  const handleConnect = async () => {
    setErrorMessage("");
    await connect();
  };

  const handleSign = async () => {
    setErrorMessage("");
    await signAndLogin();
  };

  // Loading screen ONLY shown while signing (the wallet app is open showing
  // the signature prompt). We do NOT show it during connect — the AppKit modal
  // already provides UI for that phase.
  if (isSigning) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 -m-6 w-28 h-28 rounded-full border border-purple-500/30 animate-ping" />
          <div className="absolute inset-0 -m-4 w-24 h-24 rounded-full border border-pink-500/20 animate-pulse" />

          <div
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              boxShadow: '0 0 40px rgba(139, 92, 246, 0.5), 0 0 80px rgba(139, 92, 246, 0.2)',
            }}
          >
            <img src="/icons/wallet.avif" alt="Wallet" className="w-14 h-14 animate-pulse object-contain" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-white animate-pulse">
            {t('loginForm.signing')}
          </h3>
          {walletAddress && (
            <p className="text-xs text-slate-500 font-mono">
              {shortAddress(walletAddress)}
            </p>
          )}
        </div>

        <div className="w-full max-w-[200px] h-1 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"
            style={{
              animation: 'data-flow 1.5s ease-in-out infinite',
              width: '60%',
            }}
          />
        </div>

        <style>{`
          @keyframes data-flow {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {isWalletNotFound ? (
        <div className="flex flex-col gap-2 p-3 text-sm bg-amber-500/10 rounded-lg border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{t('loginForm.walletNotFound')}</span>
          </div>
          <Link
            to="/register"
            className="ml-6 text-purple-400 hover:text-purple-300 underline underline-offset-2 transition-colors"
          >
            {t('loginForm.registerHere')}
          </Link>
        </div>
      ) : (walletError || errorMessage) ? (
        <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{walletError || errorMessage}</span>
        </div>
      ) : null}

      {isAwaitingSignature && walletAddress ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-emerald-300">{t('loginForm.walletConnected')}</p>
                <p className="text-xs text-slate-400 font-mono truncate">{shortAddress(walletAddress)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors flex-shrink-0"
            >
              {t('loginForm.useDifferentWallet')}
            </button>
          </div>

          {/*
            Sign button. The onClick MUST be the entry point for signMessage().
            On iOS Safari, deeplinking back to the wallet app to surface the
            signature prompt only works inside an active user gesture. Auto-
            chaining sign() after connect() loses that gesture and the prompt
            never appears. See useWalletLogin.signAndLogin for context.
          */}
          <button
            type="button"
            onClick={handleSign}
            disabled={disabled}
            className="group relative w-full py-4 px-6 rounded-xl transition-all duration-300 overflow-hidden"
            style={{ background: 'rgba(15, 15, 25, 0.9)' }}
          >
            <span
              className="absolute top-0 left-0 w-full h-0.5"
              style={{
                background: 'linear-gradient(90deg, transparent, #a855f7, transparent)',
                animation: 'neon-top 2s linear infinite',
              }}
            />
            <span
              className="absolute top-0 right-0 w-0.5 h-full"
              style={{
                background: 'linear-gradient(180deg, transparent, #a855f7, transparent)',
                animation: 'neon-right 2s linear infinite 0.5s',
              }}
            />
            <span
              className="absolute bottom-0 right-0 w-full h-0.5"
              style={{
                background: 'linear-gradient(270deg, transparent, #ec4899, transparent)',
                animation: 'neon-bottom 2s linear infinite 1s',
              }}
            />
            <span
              className="absolute bottom-0 left-0 w-0.5 h-full"
              style={{
                background: 'linear-gradient(360deg, transparent, #ec4899, transparent)',
                animation: 'neon-left 2s linear infinite 1.5s',
              }}
            />

            <div className="relative z-10 flex items-center justify-center gap-3">
              <span className="text-base font-semibold text-slate-200 group-hover:text-white transition-colors tracking-wide">
                {t('loginForm.signToLogin')}
              </span>
            </div>

            <style>{`
              @keyframes neon-top { 0% { left: -100%; opacity: 0; } 50%, 100% { left: 100%; opacity: 1; } }
              @keyframes neon-right { 0% { top: -100%; opacity: 0; } 50%, 100% { top: 100%; opacity: 1; } }
              @keyframes neon-bottom { 0% { right: -100%; opacity: 0; } 50%, 100% { right: 100%; opacity: 1; } }
              @keyframes neon-left { 0% { bottom: -100%; opacity: 0; } 50%, 100% { bottom: 100%; opacity: 1; } }
            `}</style>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={isConnecting || disabled}
          className="group relative w-full py-4 px-6 rounded-xl transition-all duration-300 overflow-hidden disabled:opacity-60"
          style={{ background: 'rgba(15, 15, 25, 0.9)' }}
        >
          <span
            className="absolute top-0 left-0 w-full h-0.5"
            style={{
              background: 'linear-gradient(90deg, transparent, #a855f7, transparent)',
              animation: 'neon-top 2s linear infinite',
            }}
          />
          <span
            className="absolute top-0 right-0 w-0.5 h-full"
            style={{
              background: 'linear-gradient(180deg, transparent, #a855f7, transparent)',
              animation: 'neon-right 2s linear infinite 0.5s',
            }}
          />
          <span
            className="absolute bottom-0 right-0 w-full h-0.5"
            style={{
              background: 'linear-gradient(270deg, transparent, #ec4899, transparent)',
              animation: 'neon-bottom 2s linear infinite 1s',
            }}
          />
          <span
            className="absolute bottom-0 left-0 w-0.5 h-full"
            style={{
              background: 'linear-gradient(360deg, transparent, #ec4899, transparent)',
              animation: 'neon-left 2s linear infinite 1.5s',
            }}
          />

          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: 'rgba(168, 85, 247, 0.1)',
              boxShadow: 'inset 0 0 30px rgba(168, 85, 247, 0.15)',
            }}
          />

          <div className="relative z-10 flex items-center justify-center gap-3">
            <img
              src="/icons/wallet.avif"
              alt="Wallet"
              className="w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <span className="text-base font-semibold text-slate-200 group-hover:text-white transition-colors tracking-wide">
              {isConnecting ? t('loginForm.connecting') : t('loginForm.connectWallet')}
            </span>
          </div>

          <style>{`
            @keyframes neon-top { 0% { left: -100%; opacity: 0; } 50%, 100% { left: 100%; opacity: 1; } }
            @keyframes neon-right { 0% { top: -100%; opacity: 0; } 50%, 100% { top: 100%; opacity: 1; } }
            @keyframes neon-bottom { 0% { right: -100%; opacity: 0; } 50%, 100% { right: 100%; opacity: 1; } }
            @keyframes neon-left { 0% { bottom: -100%; opacity: 0; } 50%, 100% { bottom: 100%; opacity: 1; } }
          `}</style>
        </button>
      )}

      <div className="relative flex items-center">
        <div className="flex-1 border-t border-slate-700/50" />
        <span className="px-3 text-xs text-slate-500 uppercase tracking-wide">or</span>
        <div className="flex-1 border-t border-slate-700/50" />
      </div>

      <div className="text-center">
        <p className="text-sm text-slate-500 mb-3">
          {t('loginForm.noAccount')}
        </p>
        <Link
          to="/register"
          className="group inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-200"
        >
          <span className="text-sm font-medium text-purple-400 group-hover:text-purple-300 transition-colors">
            {t('loginForm.createOne')}
          </span>
        </Link>
      </div>
    </div>
  );
};
