import { useMutation } from "@tanstack/react-query";
import { api } from "@/services/api";
import { signDeletionMessage } from "@/utils/web3Service";

async function deleteStudentAccount(wallet: string): Promise<void> {
  const { signature, message } = await signDeletionMessage(wallet);
  await api.del("/api/students/me", { signature, message });
}

export function useDeleteStudentAccount() {
  return useMutation({
    mutationFn: deleteStudentAccount,
    onError: (error: Error) => {
      console.error("Student account deletion failed:", error.message);
    },
  });
}
