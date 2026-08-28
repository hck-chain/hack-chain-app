import { ShieldCheck } from "lucide-react";
import { OFFICIAL_DOMAIN } from "@/utils/presale";

export default function Footer() {
  return (
    <footer className="pt-10">
      <div className="flex items-start gap-2 rounded-md border border-teal-500/20 bg-teal-500/5 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-zinc-400">
          El único dominio oficial de esta preventa es{" "}
          <span className="font-mono text-teal-300">{OFFICIAL_DOMAIN}</span>. HackChain nunca
          va a pedirte tu frase de recuperación de 12 palabras, por ningún medio.
        </p>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-600">
        Los aportes realizados durante la preventa no son reembolsables y las fases no están
        sujetas a un monto mínimo de recaudación. Nada de lo publicado en esta página
        constituye asesoramiento financiero ni promesa de rendimiento. HACK es un token de
        utilidad; su valor puede reducirse a cero.
      </p>
    </footer>
  );
}
