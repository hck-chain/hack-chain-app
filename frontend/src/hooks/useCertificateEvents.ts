import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ethers } from 'ethers';

const WSS_RPC = 'wss://polygon-bor-rpc.publicnode.com';
const CONTRACT_ADDRESS = '0x61d2e94543DD498b7FD86450f1fC8135cB60021C';

// Computed once at module load — keccak256 of the canonical event signature
const CERTIFICATE_ISSUED_TOPIC = ethers.utils.id('CertificateIssued(uint256,address,address)');

const MAX_RECONNECT_ATTEMPTS = 4;
const BASE_RECONNECT_DELAY_MS = 2_000;
// Debounce window: ignore duplicate events within this interval.
// Protects against a compromised node spamming fake events to trigger
// excessive refetches against our own backend.
const REFETCH_DEBOUNCE_MS = 5_000;

function padAddress(address: string): string {
  return '0x' + address.replace('0x', '').toLowerCase().padStart(64, '0');
}

/**
 * Opens a WSS connection to a public Polygon node and subscribes to
 * CertificateIssued events for a specific talent wallet.
 *
 * Security model:
 *  - Only wss:// is accepted — plain ws:// is rejected at runtime.
 *  - Every incoming log is validated against the known contract address,
 *    the known event topic, and the expected talent address before acting.
 *  - The event is ONLY used as a trigger: data always comes from our own
 *    backend via query invalidation, never from the RPC payload.
 *  - A 5-second debounce prevents a malicious node from causing a DoS
 *    against our backend by flooding fake events.
 *  - After MAX_RECONNECT_ATTEMPTS the WebSocket gives up silently;
 *    the polling fallback in useTalentCertificates takes over.
 */
export function useCertificateEvents(
  wallet: string | undefined,
  onNewCertificate?: () => void,
) {
  const queryClient = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);
  const attemptsRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const lastRefetchRef = useRef(0);

  // Keep callback in a ref so changing it never restarts the WebSocket
  const callbackRef = useRef(onNewCertificate);
  useEffect(() => { callbackRef.current = onNewCertificate; }, [onNewCertificate]);

  useEffect(() => {
    if (!wallet) return;
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;

      // Enforce WSS — plain WS would expose the subscription to MITM attacks
      if (!WSS_RPC.startsWith('wss://')) {
        console.error('[useCertificateEvents] Rejected non-secure WebSocket URL');
        return;
      }

      const ws = new WebSocket(WSS_RPC);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        attemptsRef.current = 0;

        // eth_subscribe logs filter:
        //   address  → only our contract (rejects events from other contracts)
        //   topic0   → CertificateIssued signature (rejects other event types)
        //   topic1   → null (any issuer)
        //   topic2   → this talent's padded address (rejects events for other wallets)
        ws.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_subscribe',
          params: [
            'logs',
            {
              address: CONTRACT_ADDRESS,
              topics: [
                CERTIFICATE_ISSUED_TOPIC,
                null,
                padAddress(wallet),
              ],
            },
          ],
        }));
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;

        let msg: any;
        try {
          msg = JSON.parse(event.data as string);
        } catch {
          return;
        }

        // Ignore subscription confirmations — only process push notifications
        const log = msg?.params?.result;
        if (!log?.topics || !Array.isArray(log.topics)) return;

        // --- Security validations (defense in depth) ---

        // 1. Contract address must match exactly our deployed contract
        if (log.address?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) return;

        // 2. topic0 must be the CertificateIssued event signature — not any other log
        if (log.topics[0]?.toLowerCase() !== CERTIFICATE_ISSUED_TOPIC.toLowerCase()) return;

        // 3. topic2 (indexed talent address) must contain this wallet
        //    padAddress() already lowercased — compare without '0x' prefix
        if (!log.topics[2]?.toLowerCase().includes(wallet.toLowerCase().replace('0x', ''))) return;

        // 4. Debounce: a compromised node could flood events to hammer our backend
        const now = Date.now();
        if (now - lastRefetchRef.current < REFETCH_DEBOUNCE_MS) return;
        lastRefetchRef.current = now;

        // The event is only a signal. All displayed data comes from our own backend.
        queryClient.invalidateQueries({ queryKey: ['certificates', wallet] });
        queryClient.invalidateQueries({ queryKey: ['educators', wallet] });
        callbackRef.current?.();
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        if (attemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          // Give up — polling in useTalentCertificates covers the gap
          return;
        }
        attemptsRef.current += 1;
        // Exponential backoff: 2s, 4s, 8s, 16s
        const delay = BASE_RECONNECT_DELAY_MS * Math.pow(2, attemptsRef.current - 1);
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        ws.close(); // triggers onclose → reconnect logic
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect on intentional unmount
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [wallet, queryClient]);
}
