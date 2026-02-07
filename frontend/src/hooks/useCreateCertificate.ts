import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { web3Service } from "@/utils/web3Service";

const API = import.meta.env.VITE_API_URL;

export const useCreateCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const createCertificate = async (data: any, organizationName: string) => {
    setIsLoading(true);

    try {
      // get the actual wallet address from the auth session
      const token = localStorage.getItem("authToken");
      const authRes = await fetch(`${API}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!authRes.ok) throw new Error("Failed to verify issuer identity.");
      const authData = await authRes.json();
      const realIssuerWallet = authData.user.wallet_address;

      // check if student and issuer exist in db before wasting gas
      const validationRes = await fetch(`${API}/api/issuers/mint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentWalletAddress: data.studentWallet,
          professor: realIssuerWallet,
          tokenUri: "pending_validation"
        }),
      });

      const valData = await validationRes.json();
      if (!validationRes.ok || !valData.ok) {
        throw new Error(valData.error || "Validation failed: Student or Issuer not found.");
      }

      // push metadata to ipfs via pinata
      const metaRes = await fetch(`${API}/api/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.studentName,
          course: data.courseName,
          professor: organizationName,
          date: new Date().toISOString().split("T")[0],
          imageCID: data.imageCID,
        }),
      });

      if (!metaRes.ok) throw new Error("IPFS metadata upload failed.");
      const metaData = await metaRes.json();
      const tokenUri = `ipfs://${metaData.cid}`;

      // trigger the smart contract minting
      const { success, txHash, tokenId } = await web3Service.mintCertificateOnChain(
        data.studentWallet,
        data.studentName,
        data.courseName,
        tokenUri
      );

      if (!success) throw new Error("Blockchain transaction failed.");

      // save the certificate record to the database
      const payloadDB = {
        student_wallet_address: data.studentWallet.toLowerCase().trim(),
        issuer_wallet_address: realIssuerWallet.toLowerCase().trim(),
        title: data.courseName,
        description: "HackChain Tokenized Certificate",
        certificate_hash: data.imageCID,
        blockchain_tx_hash: txHash,
        token_id: tokenId,
        issue_date: new Date().toISOString().split("T")[0],
      };

      const dbRes = await fetch(`${API}/api/certificates/database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadDB),
      });

      if (!dbRes.ok) {
        const errorDetail = await dbRes.json();
        throw new Error(errorDetail.details || "Failed to sync with database.");
      }

      // update the certificate count for the educator dashboard
      const incrementRes = await fetch(`${API}/api/issuers/increment-certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issuerWallet: realIssuerWallet }),
      });

      if (!incrementRes.ok) {
        console.warn("Certificate issued but failed to update counter in DB.");
      }

      toast({ title: "Success", description: "Certificate issued and dashboard updated." });
      return true;

    } catch (err: any) {
      console.error("Certificate creation flow error:", err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { createCertificate, isLoading };
};