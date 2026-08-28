import { useRef, useState, type ReactNode } from "react";
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
    <li className="flex gap-4">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-zinc-700 font-mono text-xs text-zinc-400">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-100">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-zinc-400">{children}</div>
      </div>
    </li>
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
    <section className="border-b border-zinc-800 py-10">
      <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">Cómo comprar</p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-50">Proceso de compra en 5 pasos</h2>

      <ol className="mt-6 space-y-6">
        <Step n={1} title="Calculá tu monto">
          Usá la calculadora de arriba para saber cuántos USDT necesitás según los HACK que
          querés comprar.
        </Step>

        <Step n={2} title="Enviá los USDT a la dirección oficial">
          <div className="space-y-3">
            <p>
              Transferí en <span className="font-mono text-zinc-200">{NETWORK_NAME}</span>{" "}
              únicamente. Revisá el{" "}
              <a href="#tutorial-transferencia" className="inline-flex items-center gap-1 text-amber-300 underline underline-offset-2">
                tutorial de transferencia <ExternalLink className="h-3 w-3" />
              </a>{" "}
              si no lo hiciste antes.
            </p>
            <VerificationStrip compact />
          </div>
        </Step>

        <Step n={3} title="Subí tu comprobante">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setProofMode("file")}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                  proofMode === "file"
                    ? "border-amber-400 bg-amber-400/10 text-amber-300"
                    : "border-zinc-700 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Upload className="mr-1 inline h-3.5 w-3.5" /> Subir captura
              </button>
              <button
                onClick={() => setProofMode("link")}
                className={`rounded-md border px-3 py-1.5 text-xs font-medium transition ${
                  proofMode === "link"
                    ? "border-amber-400 bg-amber-400/10 text-amber-300"
                    : "border-zinc-700 text-zinc-400 hover:text-zinc-200"
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
                  className="block w-full text-xs text-zinc-400 file:mr-3 file:rounded-md file:border file:border-zinc-700 file:bg-zinc-900 file:px-3 file:py-1.5 file:text-xs file:text-zinc-200 hover:file:border-zinc-500"
                />
                <p className="mt-1 text-xs text-zinc-500">PNG, JPG o WEBP · máximo {MAX_SIZE_MB} MB.</p>
                {fileError && <p className="mt-1 text-xs text-red-400">{fileError}</p>}
                {file && !fileError && (
                  <p className="mt-1 text-xs text-teal-400">Archivo listo: {file.name}</p>
                )}
              </div>
            ) : (
              <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://etherscan.io/tx/..."
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
              />
            )}

            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="rounded-md bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-600"
            >
              Enviar comprobante
            </button>

            {submitted && (
              <p className="flex items-center gap-1.5 text-xs text-teal-400">
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
          <a href="#tutorial-cartera" className="inline-flex items-center gap-1 text-amber-300 underline underline-offset-2">
            Ver cómo mostrar tus tokens en tu cartera <ExternalLink className="h-3 w-3" />
          </a>
        </Step>
      </ol>
    </section>
  );
}
