/**
 * In-memory cache for the USD → MXN exchange rate. Refreshed once a day by
 * exchangeRateWorker.js (plus an immediate fetch on server boot) — class
 * prices don't move fast enough to justify hitting the FX API per request.
 */
const FX_API_URL = "https://open.er-api.com/v6/latest/USD";

let cache = { rate: null, updatedAt: null };

async function refreshUsdToMxnRate() {
  const response = await fetch(FX_API_URL);
  if (!response.ok) {
    throw new Error(`FX API responded with ${response.status}`);
  }

  const data = await response.json();
  const rate = data?.rates?.MXN;
  if (typeof rate !== "number") {
    throw new Error("FX API response missing rates.MXN");
  }

  cache = { rate, updatedAt: new Date() };
  return cache;
}

function getUsdToMxnRate() {
  return cache;
}

module.exports = { refreshUsdToMxnRate, getUsdToMxnRate };
