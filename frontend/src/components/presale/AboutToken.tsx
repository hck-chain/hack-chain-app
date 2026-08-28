import { ShieldAlert } from "lucide-react";

export default function AboutToken() {
  return (
    <section className="border-b border-zinc-800 py-10">
      <p className="font-mono text-xs uppercase tracking-wide text-zinc-500">Acerca de</p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-50">HACK Token</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
        HACK es un token de utilidad: sirve para pagar dentro de la plataforma, generar más
        tokens HACK mediante finanzas descentralizadas, y acceder a incentivos por logros
        dentro de HackChain. La preventa pública ofrece un precio más accesible que el que
        tendrá en su venta pública futura, dividida en tres fases.
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-zinc-400">
          Comprar un token en fase inicial implica riesgo real de perder el 100% del monto
          aportado. Esto no es asesoramiento financiero y no hay expectativa de ganancia.
          Los aportes no son reembolsables y las fases no tienen un monto mínimo de
          recaudación.
        </p>
      </div>
    </section>
  );
}
