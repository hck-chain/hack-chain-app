import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { OFFICIAL_DOMAIN } from "@/utils/presale";

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className="pt-12"
    >
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <p className="font-body text-xs leading-relaxed text-white/50 font-medium">
          El único dominio oficial de esta preventa es{" "}
          <span className="font-mono text-emerald-300">{OFFICIAL_DOMAIN}</span>. HackChain nunca
          va a pedirte tu frase de recuperación de 12 palabras, por ningún medio.
        </p>
      </div>
      <p className="mt-5 font-body text-xs leading-relaxed text-white/20 font-medium">
        Los aportes realizados durante la preventa no son reembolsables y las fases no están
        sujetas a un monto mínimo de recaudación. Nada de lo publicado en esta página
        constituye asesoramiento financiero ni promesa de rendimiento. HACK es un token de
        utilidad; su valor puede reducirse a cero.
      </p>
    </motion.footer>
  );
}