import { useMutation, useQueryClient } from '@tanstack/react-query';
import { presaleService } from '@/services/presale';

export interface SubmitContributionInput {
  phaseId: number;
  usdtAmount: number;
  hackAmount: number;
  txHash?: string | null;
  file?: File | null;
}

/**
 * Envia un aporte en dos pasos: primero el comprobante a Pinata, despues el
 * registro en la base con el CID que Pinata devolvio.
 *
 * El orden importa. Si se registrara primero, un fallo en la subida dejaria
 * una fila sin comprobante que nadie puede validar; asi, un fallo en la subida
 * corta antes de escribir nada y el comprador puede reintentar.
 */
export function useSubmitContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phaseId, usdtAmount, hackAmount, txHash, file }: SubmitContributionInput) => {
      let proof: { cid: string; uri: string } | null = null;
      if (file) {
        proof = await presaleService.uploadProof(file);
      }

      return presaleService.register({
        phase_id: phaseId,
        usdt_amount: usdtAmount,
        hack_amount: hackAmount,
        tx_hash: txHash || null,
        proof_cid: proof?.cid ?? null,
        proof_uri: proof?.uri ?? null,
      });
    },
    onSuccess: () => {
      // El panel individual debe reflejar el aporte recien enviado.
      queryClient.invalidateQueries({ queryKey: ['presale-my-contributions'] });
    },
  });
}
