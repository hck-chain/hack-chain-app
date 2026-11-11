import { useRef, useState } from "react";
import { Upload, Check, Loader2, AlertCircle, FileText } from "lucide-react";
import type { Phase } from "@/types/presale";
import { formatNumber, MIN_PURCHASE_USDT } from "@/utils/presale";
import { useSubmitContribution } from "@/hooks/useSubmitContribution";

interface PurchaseProofFormProps {
  activePhase: Phase | null;
}

// Alineado con MAX_PROOF_FILE_SIZE en backend/routes/upload.js. Antes el front
// cortaba en 5 MB y el backend aceptaba 10, asi que el front rechazaba
// archivos que el servidor habria tomado sin problema.
const MAX_SIZE_MB = 10;
// Los mismos tres que valida validateImageBuffer por numero magico. Declarar
// aca un cuarto formato solo conseguiria un 415 del servidor.
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const TX_HASH_REGEX = /^0x[a-fA-F0-9]{64}$/;

/** Acepta el hash pelado o pegado dentro de una URL de explorador. */
function extractTxHash(input: string): string | null {
  const match = input.trim().match(/0x[a-fA-F0-9]{64}/);
  return match ? match[0] : null;
}

export default function PurchaseProofForm({ activePhase }: PurchaseProofFormProps) {
  const [usdtInput, setUsdtInput] = useState("");
  const [txInput, setTxInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = useSubmitContribution();

  const usdtAmount = Number(usdtInput);
  const hasAmount = usdtInput.trim() !== "" && Number.isFinite(usdtAmount) && usdtAmount > 0;
  const hackAmount = activePhase && hasAmount ? Math.floor(usdtAmount / activePhase.price) : 0;
  const txHash = extractTxHash(txInput);

  let formError: string | null = null;
  if (hasAmount && usdtAmount < MIN_PURCHASE_USDT) {
    formError = `El mínimo de compra es ${MIN_PURCHASE_USDT} USDT.`;
  } else if (activePhase && hackAmount > activePhase.maxPerPurchase) {
    formError = `El máximo por compra en esta fase es ${formatNumber(activePhase.maxPerPurchase)} HACK.`;
  } else if (txInput.trim() !== "" && !txHash) {
    formError = "No encontramos un hash de transacción válido en lo que pegaste.";
  }

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

  // El hash es obligatorio: el aporte se valida contra la transferencia en
  // Polygon, y una captura sola no se puede verificar. La captura queda como
  // respaldo opcional.
  const canSubmit =
    !!activePhase && hasAmount && !!txHash && !formError && !fileError && !submit.isPending;

  const handleSubmit = () => {
    if (!canSubmit || !activePhase) return;
    submit.mutate({
      phaseId: activePhase.id,
      usdtAmount,
      hackAmount,
      txHash,
      file,
    });
  };

  if (submit.isSuccess) {
    return (
      <div className="space-y-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] px-5 py-4">
        <p className="flex items-center gap-1.5 font-body text-sm font-medium text-emerald-400">
          <Check className="h-4 w-4" /> Recibimos tu comprobante.
        </p>
        <p className="font-body text-xs text-white/40">
          Registramos {formatNumber(submit.data.hack)} HACK por ${submit.data.usdt} USDT. La
          validación suele tardar hasta 24 horas hábiles; cuando esté lista vas a verla en tu
          panel individual y en la lista de contribuidores.
        </p>
        <button
          onClick={() => {
            submit.reset();
            setUsdtInput("");
            setTxInput("");
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
          className="font-body text-xs text-purple-400 underline underline-offset-2 transition-colors hover:text-purple-300"
        >
          Registrar otro aporte
        </button>
      </div>
    );
  }

  if (!activePhase) {
    return (
      <p className="font-body text-sm text-white/40">
        No hay una fase abierta en este momento, así que todavía no se pueden enviar comprobantes.
      </p>
    );
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-sm text-white placeholder:text-white/20 focus:border-purple-500/60 focus:outline-none transition-colors";

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">
          Cuántos USDT transferiste
        </span>
        <input
          type="number"
          min="0"
          inputMode="decimal"
          value={usdtInput}
          onChange={(e) => setUsdtInput(e.target.value)}
          placeholder="0.00"
          className={inputClass}
        />
        {hasAmount && !formError && (
          <span className="mt-1.5 block font-body text-xs text-white/40">
            Te corresponden{" "}
            <span className="font-mono text-amber-300">{formatNumber(hackAmount)} HACK</span> en la
            fase {activePhase.label}.
          </span>
        )}
      </label>

      <label className="block">
        <span className="font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">
          Hash o enlace de la transacción <span className="text-purple-400">*</span>
        </span>
        <input
          type="text"
          value={txInput}
          onChange={(e) => setTxInput(e.target.value)}
          placeholder="0x… o https://polygonscan.com/tx/0x…"
          className={inputClass}
        />
        <span className="mt-1.5 block font-body text-xs text-white/25">
          Lo encontrás en el historial de tu cartera, en el detalle de la transferencia.
        </span>
      </label>

      <div>
        <span className="font-body text-xs uppercase tracking-[0.15em] text-white/25 font-semibold">
          Captura del comprobante <span className="normal-case tracking-normal text-white/20">(opcional)</span>
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Captura del comprobante (opcional)"
          onChange={handleFileChange}
          className="mt-2 block w-full font-body text-xs text-white/40 file:mr-3 file:rounded-lg file:border file:border-white/10 file:bg-white/[0.03] file:px-3 file:py-1.5 file:text-xs file:text-white/70 hover:file:border-white/20 file:transition-colors"
        />
        <p className="mt-1.5 font-body text-xs text-white/25">
          PNG, JPG o WEBP · máximo {MAX_SIZE_MB} MB. Sirve de respaldo si hay que revisar
          tu pago a mano.
        </p>
        {file && !fileError && (
          <p className="mt-1.5 flex items-center gap-1.5 font-body text-xs text-emerald-400">
            <FileText className="h-3.5 w-3.5" /> {file.name}
          </p>
        )}
        {fileError && <p className="mt-1.5 font-body text-xs text-red-400">{fileError}</p>}
      </div>

      <p className="font-body text-xs text-white/25">
        La captura no se guarda en nuestros servidores: va directo a IPFS y sólo conservamos el
        enlace.
      </p>

      {formError && (
        <p className="flex items-center gap-1.5 font-body text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {formError}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-5 py-2.5 font-title text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:shadow-none"
      >
        {submit.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {submit.isPending ? "Enviando…" : "Enviar comprobante"}
      </button>

      {submit.isError && (
        <p className="flex items-center gap-1.5 font-body text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {submit.error instanceof Error ? submit.error.message : "No pudimos registrar tu aporte."}
        </p>
      )}

      {!txHash && hasAmount && !formError && (
        <p className="flex items-center gap-1.5 font-body text-xs text-white/30">
          <Upload className="h-3.5 w-3.5 shrink-0" /> Falta el hash de la transacción para poder enviar.
        </p>
      )}
    </div>
  );
}
