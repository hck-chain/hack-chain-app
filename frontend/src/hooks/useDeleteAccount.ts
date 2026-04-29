import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { signDeletionMessage } from "@/utils/web3Service";

async function deleteAccount(wallet: string): Promise<void> {
    const { signature, message } = await signDeletionMessage(wallet);
    await api.del("/api/issuers/me", { signature, message });
}

export function useDeleteAccount() {
    return useMutation({
        mutationFn: deleteAccount,
        onError: (error: Error) => {
            console.error("Account deletion failed:", error.message);
        },
    });
}
