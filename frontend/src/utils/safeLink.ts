const ALLOWED_SCHEMES = ['http:', 'https:', 'ipfs:'];

// Belt-and-suspenders guard for rendering user-submitted URLs as <a href>.
// The backend already rejects javascript:/data: proof URLs at the source
// (see backend/usecases/classPayments/submitPaymentProof.js) — this just
// makes sure no other unvalidated string ever reaches an href unescaped.
export function isSafeHref(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    return ALLOWED_SCHEMES.includes(new URL(url).protocol);
  } catch {
    return false;
  }
}
