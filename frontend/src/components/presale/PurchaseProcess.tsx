import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Upload, Link as LinkIcon, Check, ExternalLink } from "lucide-react";
import { NETWORK_NAME } from "@/utils/presale";
import VerificationStrip from "@/components/presale/VerificationStrip";

type ProofMode = "file" | "link";

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

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function PurchaseProcess() {
  const [proofMode, setProofMode] = useState<ProofMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFileError(null);
    setFile(null);
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setFileError("Formato no admitido. Subí una imagen PNG, JPG o WEBP.");
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setFileError(`El archivo supera el tamaño máximo de ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(f);
  };

  const canSubmit = proofMode === "file" ? !!file && !fileError : link.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    // instrumentación F-15: evento "envio_comprobante"
    setSubmitted(true);
  };

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
                Transferí en <span className="font-mono text-white/70">{NETWORK_NAME}</span>{" "}
                únicamente. Revisá el{" "}
                <a href="#tutorial-transferencia" className="inline-flex items-center gap-1 text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors">
                  tutorial de transferencia <ExternalLink className="h-3 w-3" />
                </a>{" "}
                si no lo hiciste antes.
              </p>
              <VerificationStrip compact />
            </div>
          </Step>

          <Step n={3} title="Subí tu comprobante">
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setProofMode("file")}
                  className={`rounded-lg border px-3 py-1.5 font-body text-xs font-semibold transition-colors ${
                    proofMode === "file"
                      ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                      : "border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  <Upload className="mr-1 inline h-3.5 w-3.5" /> Subir captura
                </button>
                <button
                  onClick={() => setProofMode("link")}
                  className={`rounded-lg border px-3 py-1.5 font-body text-xs font-semibold transition-colors ${
                    proofMode === "link"
                      ? "border-purple-500/50 bg-purple-500/10 text-purple-300"
                      : "border-white/10 text-white/40 hover:text-white/70"
                  }`}
                >
                  <LinkIcon className="mr-1 inline h-3.5 w-3.5" /> Ingresar enlace
                </button>
              </div>

              {proofMode === "file" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    className="block w-full font-body text-xs text-white/40 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/[0.03] file:px-3 file:py-1.5 file:text-xs file:text-white/70 hover:file:border-white/20 file:transition-colors"
                  />
                  <p className="mt-1.5 font-body text-xs text-white/25">PNG, JPG o WEBP · máximo {MAX_SIZE_MB} MB.</p>
                  {fileError && <p className="mt-1.5 font-body text-xs text-red-400">{fileError}</p>}
                  {file && !fileError && (
                    <p className="mt-1.5 font-body text-xs text-emerald-400">Archivo listo: {file.name}</p>
                  )}
                </div>
              ) : (
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="https://etherscan.io/tx/..."
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-xs text-white placeholder:text-white/20 focus:border-purple-500/60 focus:outline-none transition-colors"
                />
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-5 py-2.5 font-title text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
              >
                Enviar comprobante
              </button>

              {submitted && (
                <p className="flex items-center gap-1.5 font-body text-xs text-emerald-400 font-medium">
                  <Check className="h-3.5 w-3.5" /> Recibimos tu comprobante. La validación
                  suele tardar hasta 24 horas hábiles.
                </p>
              )}
            </div>
          </Step>

          <Step n={4} title="Esperá la validación">
            Cuando confirmemos que todo es correcto, tu dirección va a aparecer en la lista de
            contribuidores más abajo.
          </Step>

          <Step n={5} title="Reclamá tus HACK al finalizar la preventa">
            Volvé a esta página, conectá tu cartera y seleccioná "Reclamar HACK". La función se
            habilita el 19 de octubre de 2026.{" "}
            <a href="#tutorial-cartera" className="inline-flex items-center gap-1 text-amber-300 underline underline-offset-2 hover:text-amber-200 transition-colors">
              Ver cómo mostrar tus tokens en tu cartera <ExternalLink className="h-3 w-3" />
            </a>
          </Step>
        </ol>
      </motion.div>
    </section>
  );
}