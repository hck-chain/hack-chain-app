import { Wallet } from "lucide-react";
import type { Phase } from "@/types/presale";
import { useCountdown } from "@/hooks/useCountdown";
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
    <div className="flex flex-col items-center">
      <span className="tabular-nums">{String(value).padStart(2, "0")}</span>
      <span className="mt-1 text-[10px] font-sans font-normal uppercase tracking-wide text-zinc-500">
        {label}
      </span>
    </div>
  );
}

export default function CountdownHero({ activePhase, walletConnected, onConnect }: CountdownHeroProps) {
  const targetDate = activePhase ? activePhase.end : null;
  const { now, days, hours, minutes, seconds } = useCountdown(targetDate);

  const preLaunch = !!activePhase && now < activePhase.start;
  const finished = !activePhase;

  return (
    <section className="border-b border-zinc-800 pb-10">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-400">
        Preventa pública · Token HACK
      </p>
      <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-zinc-50 sm:text-4xl">
        El token nativo de HackChain, verificable en cada paso.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base">
        Comprá HACK en tres fases con precio creciente. Cada aporte queda registrado
        públicamente y cada dirección de destino se verifica antes de que confirmes el envío.
      </p>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">
            {finished
              ? "Preventa finalizada"
              : preLaunch
              ? `Fase ${activePhase!.label} comienza en`
              : `Fase ${activePhase!.label} cierra en`}
          </p>
          {!finished && (
            <div className="mt-2 flex gap-3 font-mono text-2xl text-zinc-50 sm:text-3xl">
              <TimeBlock value={days} label="días" />
              <TimeBlock value={hours} label="hs" />
              <TimeBlock value={minutes} label="min" />
              <TimeBlock value={seconds} label="seg" />
            </div>
          )}
        </div>

        <button
          onClick={onConnect}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
        >
          <Wallet className="h-4 w-4" aria-hidden="true" />
          {walletConnected ? "Cartera conectada" : "Conectar cartera digital"}
        </button>
      </div>

      <div className="mt-8">
        <VerificationStrip />
      </div>
    </section>
  );
}
