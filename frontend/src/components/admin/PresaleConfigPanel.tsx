// frontend/src/components/admin/PresaleConfigPanel.tsx
//
// "Configuración": donde queda cada cosa de la preventa, para que el
// encargado lo analice. Muestra el array de backend/config/presale.js tal
// como esta en efecto: red de pago (Ethereum) con su tesoreria y su token,
// red del token (Polygon) con la multifirma y el contrato, que falta definir,
// que esta sobrescrito por variables de entorno, y cada fase con lo vendido.
//
// Cada direccion enlaza a su explorador para verificarla a mano (regla 33:
// "fijar y verificar ... con revision de mas de una persona").

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';
import { adminApi, PresaleNetwork } from '@/services/admin';

const fmt = (n: string | number) => new Intl.NumberFormat('es-ES').format(Number(n));
const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) + ' UTC';

const CAMPOS: Array<{ key: keyof PresaleNetwork | 'token'; label: string }> = [
  { key: 'treasury', label: 'Tesorería (recibe los pagos)' },
  { key: 'token', label: 'Token aceptado' },
  { key: 'multisig', label: 'Multifirma (administra el contrato)' },
  { key: 'presaleContract', label: 'Contrato de la preventa' },
];

function Direccion({ explorer, address }: { explorer: string; address: string | null | undefined }) {
  if (!address) return <span className="font-medium text-amber-500">Pendiente de definir</span>;
  return (
    <a
      href={`${explorer}/address/${address}`}
      target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 break-all font-mono text-xs underline underline-offset-2"
    >
      {address} <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}

export default function PresaleConfigPanel() {
  const q = useQuery({
    queryKey: ['admin', 'presale', 'config'],
    queryFn: () => adminApi.getPresaleConfig(),
    staleTime: 60_000,
  });
  const c = q.data;

  const sobrescrito = (role: string, field: string) =>
    c?.overrides.find((o) => o.role === role && o.field === field);

  return (
    <div className="space-y-4 rounded-lg border border-border/50 bg-background/40 p-4">
      <div className="space-y-1">
        <h2 className="font-title text-lg">Configuración</h2>
        <p className="max-w-prose text-sm text-muted-foreground">
          Dónde queda cada cosa. Está escrita en un solo lugar,{' '}
          <code>backend/config/presale.js</code>: cualquier cambio de dirección pasa por un PR y
          lo revisa más de una persona. Verificá cada dirección en su explorador.
        </p>
      </div>

      {q.isLoading && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
        </p>
      )}

      {c && (c.overrides.length > 0 || c.phasesOverridden) && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <div>
            <p className="font-medium">Hay valores sobrescritos por variables de entorno</p>
            <p className="text-muted-foreground">
              Sirve para pruebas. En producción no debería haber ninguno:{' '}
              {[...c.overrides.map((o) => o.env), ...(c.phasesOverridden ? ['PRESALE_PHASES'] : [])].join(', ')}.
            </p>
          </div>
        </div>
      )}

      {c && (
        <div className="grid gap-4 md:grid-cols-2">
          {c.networks.map((n) => (
            <div key={n.role} className="space-y-2 rounded-md border border-border/60 p-3 text-sm" data-role={n.role}>
              <div>
                <p className="font-medium">{n.network} <span className="text-muted-foreground">· chainId {n.chainId}</span></p>
                <p className="text-xs text-muted-foreground">{n.description}</p>
              </div>
              <dl className="space-y-2">
                {CAMPOS.filter((f) => f.key in n).map((f) => {
                  const ov = sobrescrito(n.role, f.key === 'token' ? 'token.address' : String(f.key));
                  return (
                    <div key={String(f.key)}>
                      <dt className="text-xs text-muted-foreground">{f.label}</dt>
                      <dd>
                        {f.key === 'token' ? (
                          <span className="space-x-1">
                            <span className="font-medium">{n.token!.symbol}</span>
                            <Direccion explorer={n.explorer} address={n.token!.address} />
                          </span>
                        ) : (
                          <Direccion explorer={n.explorer} address={n[f.key] as string | null} />
                        )}
                        {ov && <span className="mt-0.5 block text-xs text-amber-500">Sobrescrita por {ov.env}</span>}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          ))}
        </div>
      )}

      {c && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-medium">Fase</th>
                <th className="py-2 pr-4 font-medium">Desde</th>
                <th className="py-2 pr-4 font-medium">Hasta</th>
                <th className="py-2 pr-4 font-medium">Precio</th>
                <th className="py-2 pr-4 text-right font-medium">Cupo</th>
                <th className="py-2 pr-4 text-right font-medium">Vendido</th>
                <th className="py-2 text-right font-medium">Disponible</th>
              </tr>
            </thead>
            <tbody>
              {c.phases.map((p) => (
                <tr key={p.id} className="border-t border-border/40">
                  <td className="py-2 pr-4">{p.label}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{fecha(p.start)}</td>
                  <td className="py-2 pr-4 whitespace-nowrap">{fecha(p.end)}</td>
                  <td className="py-2 pr-4">{p.priceUsdt} USDT</td>
                  <td className="py-2 pr-4 text-right">{fmt(p.capHack)}</td>
                  <td className="py-2 pr-4 text-right">{fmt(p.soldHack)}</td>
                  <td className="py-2 text-right">{fmt(p.availableHack)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
