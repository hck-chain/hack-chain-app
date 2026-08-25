const WALLET_RE = /^0x[a-fA-F0-9]{40}$/;

/**
 * Public, no auth — anyone sharing a public profile bumps its share_count.
 * No per-user tracking (MVP). Returns a result object — never throws on business errors.
 */
async function registerStudentProfileShare({ models, walletAddress }) {
  if (!models || !walletAddress) {
    throw new TypeError("registerStudentProfileShare requires { models, walletAddress }");
  }

  const wallet = walletAddress.toLowerCase();
  if (!WALLET_RE.test(wallet)) {
    return { ok: false, code: "INVALID_WALLET_ADDRESS", httpStatus: 400, message: "Invalid wallet address" };
  }

  const student = await models.Student.findOne({
    where: { wallet_address: wallet },
    attributes: ["id", "share_count"],
  });
  if (!student) {
    return { ok: false, code: "STUDENT_NOT_FOUND", httpStatus: 404, message: "Student not found" };
  }

  await student.increment("share_count");
  await student.reload();

  return { ok: true, data: { success: true, share_count: student.share_count } };
}

module.exports = { registerStudentProfileShare };