import { useState } from "react";
import { Copy, Check, ShieldAlert, Loader2 } from "lucide-react";
import { OFFICIAL_DOMAIN, shortenAddress } from "@/utils/presale";
import { usePresaleConfig } from "@/hooks/usePresaleConfig";

interface VerificationStripProps {
  compact?: boolean;
}

/**
 * Direccion oficial de recepcion. Sale del backend (config/presale.js), que
 * es el unico lugar donde esta escrita: antes habia una copia en el front y
 * las dos tenian que coincidir a mano. Si todavia no esta definida o no se
 * pudo cargar, NO se muestra ninguna: una direccion equivocada es dinero que
 * no se recupera.
 */
export default function VerificationStrip({ compact = false }: VerificationStripProps) {
  const [copied, setCopied] = useState(false);
  const { data, isLoading, isError } = usePresaleConfig();

  const treasury = data?.payment.treasury ?? null;
  const red = data ? `${data.payment.network} · ${data.payment.token.symbol}` : null;

  const handleCopy = () => {
    if (!treasury) return;
    // instrumentación F-15: evento "copiado_direccion"
    navigator.clipboard?.writeText(treasury).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-amber-500/25 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-amber-500/15 bg-amber-500/[0.04] px-4 py-2.5">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
        <p className="font-body text-xs font-bold uppercase tracking-[0.1em] text-amber-300">
          Dirección oficial de recepción — verificá antes de enviar
        </p>
      </div>
      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          {isLoading ? (
            <p className="flex items-center gap-2 font-body text-sm text-white/40">
              <Loader2 className="h-4 w-4 animate-spin" /> Cargando la dirección oficial…
            </p>
          ) : treasury ? (
            <div className="flex items-center gap-2">
              <code className="truncate font-mono text-sm text-white/80 sm:text-base">
                {compact ? shortenAddress(treasury) : treasury}
              </code>
              <button
                onClick={handleCopy}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/10 hover:border-white/25 px-2.5 py-1.5 font-body text-xs font-semibold text-white/60 hover:text-white transition-colors"
                aria-label="Copiar dirección oficial"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copiada" : "Copiar"}
              </button>
            </div>
          ) : (
            <p className="font-body text-sm text-amber-300/80">
              {isError
                ? "No pudimos cargar la dirección oficial. No envíes nada hasta verla acá."
                : "La dirección oficial todavía no fue publicada. No envíes nada hasta verla acá."}
            </p>
          )}
          {red && <p className="mt-1.5 font-mono text-xs text-white/25">Red requerida: {red}</p>}
        </div>
        <p className="max-w-sm font-body text-xs leading-relaxed text-red-400 font-medium">
          Un envío a otra dirección o por otra red no se puede recuperar. Verificá siempre que el sitio sea{" "}
          <span className="font-mono text-red-300">{OFFICIAL_DOMAIN}</span>.
        </p>
      </div>
    </div>
  );
}
