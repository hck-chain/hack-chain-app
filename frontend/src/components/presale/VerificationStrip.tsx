import { useState } from "react";
import { Copy, Check, ShieldAlert } from "lucide-react";
import { OFFICIAL_ADDRESS, OFFICIAL_DOMAIN, NETWORK_NAME, shortenAddress } from "@/utils/presale";

interface VerificationStripProps {
  compact?: boolean;
}

export default function VerificationStrip({ compact = false }: VerificationStripProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // instrumentación F-15: evento "copiado_direccion"
    navigator.clipboard?.writeText(OFFICIAL_ADDRESS).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-amber-500/30 bg-zinc-900">
      <div className="flex items-center gap-2 border-b border-amber-500/20 px-4 py-2">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
        <p className="text-xs font-medium uppercase tracking-wide text-amber-300">
          Dirección oficial de recepción — verificá antes de enviar
        </p>
      </div>
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <code className="truncate font-mono text-sm text-zinc-100 sm:text-base">
              {compact ? shortenAddress(OFFICIAL_ADDRESS) : OFFICIAL_ADDRESS}
            </code>
            <button
              onClick={handleCopy}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
              aria-label="Copiar dirección oficial"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiada" : "Copiar"}
            </button>
          </div>
          <p className="mt-1 font-mono text-xs text-zinc-500">Red requerida: {NETWORK_NAME}</p>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-red-400">
          Un envío a otra dirección o por otra red no se puede recuperar. Verificá siempre que el sitio sea{" "}
          <span className="font-mono text-red-300">{OFFICIAL_DOMAIN}</span>.
        </p>
      </div>
    </div>
  );
}
