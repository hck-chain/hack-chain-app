const cron = require("node-cron");
const { refreshUsdToMxnRate } = require("../services/exchangeRateService");

const LOG = "[exchangeRateWorker]";

async function refreshOnce() {
  const { rate } = await refreshUsdToMxnRate();
  console.log(`${LOG} USD/MXN rate refreshed: ${rate}`);
}

function scheduleExchangeRateRefresh() {
  // Immediate fetch on boot so the cache isn't empty until the first cron tick.
  refreshOnce().catch((err) => console.error(`${LOG} initial fetch failed:`, err.message));

  // Once a day at 06:00 — the rate doesn't move enough intraday to justify more.
  cron.schedule("0 6 * * *", async () => {
    try {
      await refreshOnce();
    } catch (err) {
      console.error(`${LOG} unexpected error:`, err.message);
    }
  });

  console.log(`${LOG} scheduled (daily)`);
}

module.exports = { scheduleExchangeRateRefresh };
