import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Wallet, PenLine, AlertCircle, Loader2 } from "lucide-react";
import type { PresaleWallet } from "@/hooks/usePresaleWallet";
import { shortenAddress } from "@/utils/presale";

interface WalletGateProps {
  wallet: PresaleWallet;
  /** Por qué hace falta la cartera acá. Se muestra sobre el botón. */
  message: string;
  /** Contenido habilitado sólo con la cartera autenticada. */
  children: ReactNode;
}

/**
 * Deja pasar sólo a quien conectó Y firmó. Mientras tanto muestra el paso que
 * falta, en lugar de un formulario que al enviarse daría 401.
 */
export default function WalletGate({ wallet, message, children }: WalletGateProps) {
  if (wallet.isAuthenticated) return <>{children}</>;

  const signing = wallet.needsSignature;

  return (
    <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-white/15 px-6 py-8">
      <p className="font-body text-sm text-white/50 leading-relaxed font-medium">{message}</p>

      {signing && wallet.address && (
        <p className="font-mono text-xs text-white/40">
          Cartera conectada:{" "}
          <span className="text-white/70">{shortenAddress(wallet.address)}</span>
        </p>
      )}

      <button
        onClick={signing ? wallet.signAndLogin : wallet.connect}
        disabled={wallet.isBusy}
        className="inline-flex items-center gap-2 rounded-xl border border-white/15 hover:border-white/30 px-5 py-2.5 font-title text-sm font-bold text-white/80 hover:text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
      >
        {wallet.isBusy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : signing ? (
          <PenLine className="h-4 w-4" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        {wallet.isBusy
          ? "Esperando a tu cartera…"
          : signing
            ? "Firmar para continuar"
            : "Conectar cartera digital"}
      </button>

      {signing && !wallet.isBusy && (
        <p className="font-body text-xs text-white/25">
          La firma no mueve ni autoriza ningún token: sólo demuestra que la cartera es tuya.
        </p>
      )}

      {wallet.isWalletNotFound ? (
        <div className="flex w-full flex-col gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 font-body text-sm">
          <span className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Esta cartera todavía no tiene cuenta en HackChain.
          </span>
          <Link
            to="/register"
            className="ml-6 text-purple-400 underline underline-offset-2 transition-colors hover:text-purple-300"
          >
            Crear una cuenta
          </Link>
        </div>
      ) : (
        wallet.error && (
          <p className="flex items-center gap-2 font-body text-xs text-red-400">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {wallet.error}
          </p>
        )
      )}
    </div>
  );
}
