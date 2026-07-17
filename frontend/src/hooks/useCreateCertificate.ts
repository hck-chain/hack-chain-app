import { useState, useRef } from 'react';
import { ethers } from 'ethers';
import { useToast } from "@/components/ui/use-toast";
import { web3Service } from '@/utils/web3Service';
import { api, ApiServiceError } from '@/services/api';

export interface CertificateData {
  talentName: string;
  talentWallet: string;
  courseName: string;
  imageUri: string;
  professorName: string;
  issueDate: string;
  classRequestId?: number | null;
}

interface CertificateMetadataResponse {
  uri: string;
}

interface ReserveCertificateResponse {
  id: number;
}

export interface DuplicateCertificateInfo {
  id: number;
  issue_date: string | null;
}

export type ReserveOutcome =
  | { reserved: true; id: number }
  | { reserved: false; duplicate: DuplicateCertificateInfo };

export const useCreateCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const pendingRef = useRef(false);
  const { toast } = useToast();

  /**
   * Reserves a certificate row (status: 'pending') before any image render
   * or on-chain mint happens. If a matching certificate is already issued
   * and `force` wasn't passed, returns the duplicate info instead of
   * reserving — the caller shows a confirmation prompt and re-calls with
   * `force: true` if the educator confirms.
   */
  const reserveCertificate = async (
    data: Pick<CertificateData, 'talentWallet' | 'courseName' | 'classRequestId'>,
    force = false,
  ): Promise<ReserveOutcome> => {
    try {
      const result = await api.post<ReserveCertificateResponse>('/api/certificates/reserve', {
        student_wallet_address: data.talentWallet,
        title: data.courseName,
        ...(data.classRequestId != null ? { class_request_id: data.classRequestId } : {}),
        force,
      });
      return { reserved: true, id: result.id };
    } catch (error) {
      if (error instanceof ApiServiceError && error.status === 409) {
        const existing = (error.data as { existing?: DuplicateCertificateInfo })?.existing;
        if (existing) {
          return { reserved: false, duplicate: existing };
        }
      }
      throw error;
    }
  };

  /**
   * Renders the metadata, mints on-chain, and finalizes the certificate
   * that was already reserved with reserveCertificate — certificateId is
   * required, there is no path that creates a certificate without a prior
   * reservation.
   */
  const createCertificate = async (data: CertificateData, professorWallet: string, certificateId: number) => {
    if (pendingRef.current) return false;
    pendingRef.current = true;
    setIsLoading(true);
    try {
      // 0. Validate Inputs
      if (!data.talentWallet || !ethers.utils.isAddress(data.talentWallet)) {
        throw new Error("Invalid talent wallet address");
      }

      // 1. Backend: Upload JSON metadata to Pinata
      const payload = {
        name: data.talentName,
        course: data.courseName,
        professor: data.professorName,
        date: data.issueDate,
        imageCID: data.imageUri.replace('ipfs://', ''),
        certificateId,
      };

      const result = await api.post<CertificateMetadataResponse>('/api/certificates', payload);
      const tokenUri = result.uri;

      // 2. Blockchain: Mint Certificate, then finalize the reservation
      const mintSuccess = await web3Service.mintCertificateOnChain(
        data.talentWallet,
        data.talentName,
        data.courseName,
        tokenUri,
        professorWallet,
        certificateId,
      );

      if (!mintSuccess) {
        throw new Error("User rejected transaction or blockchain error occurred.");
      }

      toast({
        title: "Success!",
        description: "Certificate minted and sent to talent's wallet.",
      });

      return true;

    } catch (error: any) {
      console.error('Certificate creation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create certificate",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
      pendingRef.current = false;
    }
  };

  return {
    reserveCertificate,
    createCertificate,
    isLoading,
  };
};
