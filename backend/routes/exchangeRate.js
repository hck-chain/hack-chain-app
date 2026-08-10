const express = require("express");
const router = express.Router();
const { getUsdToMxnRate } = require("../services/exchangeRateService");

// GET /api/exchange-rate/usd-mxn — public, no auth: just a display helper for
// class prices, refreshed daily by exchangeRateWorker.
router.get("/usd-mxn", (req, res) => {
  const { rate, updatedAt } = getUsdToMxnRate();

  if (rate == null) {
    return res.status(503).json({ error: "Exchange rate not available yet" });
  }

  return res.json({ rate, updated_at: updatedAt });
});

module.exports = router;
