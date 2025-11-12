import { useState } from 'react';

interface CertificateData {
  issuer_wallet_address: string;
  title: string;
  description?: string;
  certificate_hash?: string;
  blockchain_tx_hash?: string;
  issue_date: string;
}

interface CreateCertificateResponse {
  message: string;
  certificate: {
    id: number;
    issuer_wallet_address: string;
    title: string;
    description?: string;
    certificate_hash?: string;
    blockchain_tx_hash?: string;
    issue_date: string;
    is_revoked: boolean;
    created_at: string;
  };
}

export const useCreateCertificate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createCertificate = async (data: CertificateData): Promise<CreateCertificateResponse | null> => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('http://localhost:3001/api/issuers/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create certificate');
      }

      const result: CreateCertificateResponse = await response.json();
      setSuccess(true);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setSuccess(false);
  };

  return {
    createCertificate,
    isLoading,
    error,
    success,
    reset,
  };
};
