import { Wallet } from "lucide-react";
import { motion } from "framer-motion";
import type { Phase } from "@/types/presale";
import { useCountdown } from "@/hooks/useCountdown";
import { PRESALE_PAUSED } from "@/utils/presale";
import VerificationStrip from "@/components/presale/VerificationStrip";

interface CountdownHeroProps {
  activePhase: Phase | null;
  walletConnected: boolean;
  onConnect: () => void;
}

interface TimeBlockProps {
  value: number;
  label: string;
}

function TimeBlock({ value, label }: TimeBlockProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-2xl sm:text-3xl font-bold gradient-text tabular-nums">
        {String(value).padStart(2, "0")}
      </span>
      <span className="font-body text-[10px] uppercase tracking-[0.2em] text-white/25 font-semibold">
        {label}
      </span>
    </div>
  );
}

export default function CountdownHero({ activePhase, walletConnected, onConnect }: CountdownHeroProps) {
  const finished = !activePhase;
const preLaunch = PRESALE_PAUSED || (!!activePhase && new Date() < activePhase.start);  const targetDate = activePhase && !preLaunch ? activePhase.end : null;
  const { days, hours, minutes, seconds } = useCountdown(targetDate);

  return (
    <section className="relative overflow-hidden pb-12 mb-12 border-b border-white/10">
      {/* Ambient glow — sin superficie, solo luz */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-purple-500/[0.08] rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3 mb-6"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/40 font-bold">
            Preventa pública · Token HACK
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-title text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4"
        >
          El token nativo de <span className="gradient-text">HackChain</span>, verificable en cada paso.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="font-body text-sm sm:text-base text-white/50 leading-relaxed max-w-xl mb-10 font-medium"
        >
          Comprá HACK en tres fases con precio creciente. Cada aporte queda registrado
          públicamente y cada dirección de destino se verifica antes de que confirmes el envío.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <span className="font-body text-xs uppercase tracking-[0.2em] text-white/25 font-semibold">
              {finished
                ? "Preventa finalizada"
                : preLaunch
                ? "Preventa"
                : `Fase ${activePhase!.label} cierra en`}
            </span>

            {preLaunch && (
              <p className="mt-3 font-title text-2xl sm:text-3xl font-black gradient-text">
                Próximamente
              </p>
            )}

            {!finished && !preLaunch && (
              <div className="mt-3 flex gap-4">
                <TimeBlock value={days} label="días" />
                <TimeBlock value={hours} label="hs" />
                <TimeBlock value={minutes} label="min" />
                <TimeBlock value={seconds} label="seg" />
              </div>
            )}
          </div>

          <button
            onClick={onConnect}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-6 py-3 font-title text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all group"
          >
            <Wallet className="h-4 w-4 group-hover:scale-110 transition-transform" aria-hidden="true" />
            {walletConnected ? "Cartera conectada" : "Conectar cartera digital"}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-10"
        >
          <VerificationStrip />
        </motion.div>
      </div>
    </section>
  );
}