const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Public — returns occupied time slots for the booking UI.
 * Only exposes date + time + duration, never student data.
 * Returns a result object — never throws on business errors.
 */
async function getIssuerBusySlots({ models, walletAddress }) {
  if (!models || !walletAddress) {
    throw new TypeError("getIssuerBusySlots requires { models, walletAddress }");
  }

  const wallet = walletAddress.toLowerCase();
  if (!WALLET_RE.test(wallet)) {
    return { ok: false, code: "INVALID_WALLET_ADDRESS", httpStatus: 400, message: "Invalid wallet address" };
  }

  const requests = await models.ClassRequest.findAll({
    where: {
      issuer_wallet_address: wallet,
      status: ["pending", "confirmed"],
    },
    attributes: ["requested_date", "start_time", "duration_minutes"],
  });

  const slots = requests.map((r) => ({
    date: r.requested_date,
    startTime: r.start_time,
    durationMinutes: r.duration_minutes,
  }));

  return { ok: true, data: { slots } };
}

module.exports = { getIssuerBusySlots };
