import { ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export default function AboutToken() {
  return (
    <section className="border-b border-white/10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold">
          Acerca de
        </span>
        <h2 className="mt-3 font-title text-2xl sm:text-3xl font-black text-white">
          HACK <span className="gradient-text">Token</span>
        </h2>
        <p className="mt-4 max-w-2xl font-body text-sm sm:text-base text-white/50 leading-relaxed font-medium">
          HACK es un token de utilidad: sirve para pagar dentro de la plataforma, generar más
          tokens HACK mediante finanzas descentralizadas, y acceder a incentivos por logros
          dentro de HackChain. La preventa pública ofrece un precio más accesible que el que
          tendrá en su venta pública futura, dividida en tres fases.
        </p>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-5 py-4">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
          <p className="font-body text-xs sm:text-sm text-white/50 leading-relaxed font-medium">
            Comprar un token en fase inicial implica riesgo real de perder el 100% del monto
            aportado. Esto no es asesoramiento financiero y no hay expectativa de ganancia.
            Los aportes no son reembolsables y las fases no tienen un monto mínimo de
            recaudación.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
