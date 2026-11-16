import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Phase } from "@/types/presale";
import { CLAIM_ENABLED_DATE } from "@/utils/presale";
import { usePresaleConfig } from "@/hooks/usePresaleConfig";
import type { PresaleWallet } from "@/hooks/usePresaleWallet";
import VerificationStrip from "@/components/presale/VerificationStrip";
import WalletGate from "@/components/presale/WalletGate";
import PurchaseProofForm from "@/components/presale/PurchaseProofForm";

interface PurchaseProcessProps {
  activePhase: Phase | null;
  wallet: PresaleWallet;
}

interface StepProps {
  n: number;
  title: string;
  children: ReactNode;
}

function Step({ n, title, children }: StepProps) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4 }}
      className="flex gap-4"
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/80 via-fuchsia-500/65 to-purple-700/50 shadow-clay-purple font-mono text-xs font-bold text-white">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-title text-sm font-bold text-white">{title}</p>
        <div className="mt-1.5 font-body text-sm leading-relaxed text-white/50 font-medium">{children}</div>
      </div>
    </motion.li>
  );
}

export default function PurchaseProcess({ activePhase, wallet }: PurchaseProcessProps) {
  const { data: config } = usePresaleConfig();
  const red = config ? `${config.payment.network} (${config.payment.token.symbol})` : "la red indicada abajo";

  return (
    <section className="border-b border-white/10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6 }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/25 font-bold">
          Cómo comprar
        </span>
        <h2 className="mt-3 font-title text-2xl sm:text-3xl font-black text-white mb-8">
          Proceso de compra en <span className="gradient-text">5 pasos</span>
        </h2>

        <ol className="space-y-8">
          <Step n={1} title="Calculá tu monto">
            Usá la calculadora de arriba para saber cuántos USDT necesitás según los HACK que
            querés comprar.
          </Step>

          <Step n={2} title="Enviá los USDT a la dirección oficial">
            <div className="space-y-3">
              <p>
                Transferí en <span className="font-mono text-white/70">{red}</span>{" "}
                únicamente. Revisá el{" "}
                <a href="#tutorial-transferencia" className="inline-flex items-center gap-1 text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors">
                  tutorial de transferencia <ExternalLink className="h-3 w-3" />
                </a>{" "}
                si no lo hiciste antes.
              </p>
              {/* El backend comprueba que el Transfer salga de la wallet que
                  firmo. Un envio desde un exchange sale de la wallet del
                  exchange: la regla acordada es revision manual. */}
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2 text-xs text-amber-200/80">
                Enviá desde <strong className="text-amber-200">la misma cartera que conectás en esta página</strong>:
                así comprobamos automáticamente que el pago es tuyo. Si pagás directo desde un exchange
                (Binance, etc.), la validación es manual y puede demorar más; guardá el comprobante del retiro.
              </p>
              <VerificationStrip compact />
            </div>
          </Step>

          <Step n={3} title="Subí tu comprobante">
            <WalletGate
              wallet={wallet}
              message="Para enviar tu comprobante necesitamos saber a qué cartera asignar los HACK. Conectá la tuya y firmá: así nadie más puede registrar un aporte a tu nombre."
            >
              <PurchaseProofForm activePhase={activePhase} />
            </WalletGate>
          </Step>

          <Step n={4} title="Esperá la validación">
            Cuando confirmemos que todo es correcto, tu dirección va a aparecer en la lista de
            contribuidores más abajo.
          </Step>

          <Step n={5} title="Reclamá tus HACK al finalizar la preventa">
            Volvé a esta página, conectá tu cartera y seleccioná "Reclamar HACK". La función se
            habilita el{" "}
            {CLAIM_ENABLED_DATE.toLocaleDateString("es-ES", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              timeZone: "UTC",
            })}
            .{" "}
            <a href="#tutorial-cartera" className="inline-flex items-center gap-1 text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors">
              Ver cómo mostrar tus tokens en tu cartera <ExternalLink className="h-3 w-3" />
            </a>
          </Step>
        </ol>
      </motion.div>
    </section>
  );
}