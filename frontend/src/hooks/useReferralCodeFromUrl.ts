import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useReferralCodeFromUrl() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState<string | null>(() => sessionStorage.getItem('referral_code'));

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && /^[0-9A-HJ-NP-TV-Z]{8}$/i.test(ref)) {
      sessionStorage.setItem('referral_code', ref);
      setCode(ref);
    }
  }, [searchParams]);

  return code;
}
