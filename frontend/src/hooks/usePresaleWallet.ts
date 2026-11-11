import { useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletLogin } from '@/hooks/useWalletLogin';
import { appKit } from '@/config/walletConfig';

/** Lo minimo que necesitamos de un provider EIP-1193. */
interface Eip1193 {
  request(args: { method: string }): Promise<unknown>;
  on?(event: string, handler: (accounts: string[]) => void): void;
  removeListener?(event: string, handler: (accounts: string[]) => void): void;
}

/**
 * Estado de cartera para /presale.
 *
 * Distingue dos cosas que el resto de la página trataba como una sola:
 *
 *  - `isConnected`     la cartera está enlazada (AppKit tiene una dirección),
 *                      pero todavía no demostró ser del usuario.
 *  - `isAuthenticated` además firmó el nonce y el backend abrió sesión.
 *
 * Subir un comprobante exige lo segundo: `/api/upload/payment-proof` corre
 * detrás de `authenticate` y usa `req.auth.wallet` para el rate-limit, así que
 * con la cartera sólo conectada devolvería 401.
 *
 * La firma va en un gesto de usuario aparte del connect — no se encadena
 * automáticamente. En iOS Safari sólo un handler dentro de un gesto activo
 * puede hacer deeplink de vuelta a la app de la cartera; encadenarlo pierde
 * ese contexto cuando el navegador recupera el foco. Ver `useWalletLogin`.
 */
export interface PresaleWallet {
  /** Dirección de la cartera autenticada, o la conectada a la espera de firma. */
  address: string | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  /** Conectada pero sin firmar: hay que mostrar el botón de firma. */
  needsSignature: boolean;
  /**
   * Hay una operación realmente en vuelo: el modal abierto, o la firma y el
   * login en curso.
   *
   * NO incluye la espera a que el usuario pulse "Firmar": en esa fase no hay
   * nada corriendo, la pelota la tiene el usuario. Marcarla como ocupada
   * deshabilitaba el propio botón de firmar y dejaba el flujo trabado en
   * "Esperando a tu cartera…" para siempre.
   */
  isBusy: boolean;
  error?: string;
  /** La cartera no tiene cuenta en HackChain: hay que mandarla a registrarse. */
  isWalletNotFound: boolean;
  connect: () => void;
  signAndLogin: () => void;
  reset: () => void;
}

export function usePresaleWallet(): PresaleWallet {
  const { user, isAuthenticated: hasSession, logout } = useAuth();

  const {
    connect,
    signAndLogin,
    reset,
    walletAddress,
    isAwaitingSignature,
    isConnecting,
    isSigning,
    error,
    isWalletNotFound,
  } = useWalletLogin({
    // Sin esto el login redirige al dashboard según el rol y el comprador
    // pierde la página de preventa (y el formulario a medio llenar).
    onAuthenticated: useCallback(() => { }, []),
  });

  const isAuthenticated = hasSession && !!user?.walletAddress;

  // La deteccion de "cartera fantasma" (bloqueada, desconectada o cambiada
  // antes de firmar) vive en useWalletLogin, para que /login la herede
  // tambien. Aca solo queda lo que es propio de tener sesion abierta.

  // Con sesion abierta la pagina ya no depende de la cartera: la identidad
  // vive en la cookie del servidor. Bloquear MetaMask NO desloguea, igual que
  // bloquear el telefono no te saca del correo.
  //
  // Cambiar de cuenta es otra cosa. El backend asigna los HACK a
  // `req.auth.wallet`, que es la de la SESION: si el comprador se pasa a otra
  // cuenta, transfiere desde esa y sube el comprobante, los tokens quedan
  // registrados a nombre de la anterior y nada en pantalla lo avisa. Por eso
  // aca si cerramos sesion y pedimos firmar de nuevo.
  const sessionWallet = user?.walletAddress;
  useEffect(() => {
    if (!isAuthenticated || !sessionWallet) return;

    const provider = appKit.getProvider('eip155') as Eip1193 | undefined;
    if (!provider) return;

    // Lista vacia = cartera bloqueada o sitio desconectado, no un cambio de
    // cuenta. Ahi la sesion se respeta. Solo cerramos cuando la cartera
    // expone OTRA cuenta distinta de la que firmo.
    const cambioDeCuenta = (cuentas: unknown) =>
      Array.isArray(cuentas) &&
      cuentas.length > 0 &&
      !cuentas.some((c) => String(c).toLowerCase() === sessionWallet.toLowerCase());

    const alCambiarCuentas = (cuentas: string[]) => { if (cambioDeCuenta(cuentas)) logout(); };
    const revisar = () => {
      provider.request({ method: 'eth_accounts' })
        .then((cuentas) => { if (cambioDeCuenta(cuentas)) logout(); })
        .catch(() => { });
    };

    // Tambien al montar: si la pagina se abre con una sesion de la cuenta A
    // mientras la cartera ya esta en la B, el evento nunca va a llegar porque
    // el cambio ocurrio antes de que existiera este listener.
    revisar();

    provider.on?.('accountsChanged', alCambiarCuentas);
    window.addEventListener('focus', revisar);

    return () => {
      provider.removeListener?.('accountsChanged', alCambiarCuentas);
      window.removeEventListener('focus', revisar);
    };
  }, [isAuthenticated, sessionWallet, logout]);

  return {
    address: isAuthenticated ? user.walletAddress : walletAddress,
    isConnected: isAuthenticated || !!walletAddress,
    isAuthenticated,
    needsSignature: !isAuthenticated && isAwaitingSignature,
    // `isAuthenticated` corta cualquier "ocupado" residual: useWalletLogin no
    // devuelve `phase` a 'idle' al terminar bien (en el login no hace falta,
    // navega y se desmonta), y aca la pagina sigue montada, asi que isSigning
    // se quedaria en true para siempre despues de un login exitoso.
    isBusy: !isAuthenticated && (isConnecting || isSigning),
    error,
    isWalletNotFound,
    connect: () => { void connect(); },
    signAndLogin: () => { void signAndLogin(); },
    reset,
  };
}
