// backend/harjoot/usecases/inviteTalent.js
//
// DS Section 5 — when an educator tries to issue a certificate to a wallet
// that is not yet a HackChain user, this use case stores a pending invitation
// and emails the talent so they can register and claim the wallet.
//
// Dedupe rule: if there is already a pending invitation from this educator
// to this wallet, do NOT create a duplicate row — return INVITE_ALREADY_PENDING.
// This avoids spamming the talent if an educator clicks invite twice.
//
// Email failures are non-fatal: the invitation row is still created. The
// educator can re-trigger later if they suspect the email never arrived.

const LOG_PREFIX = "[inviteTalent]";

/**
 * Send a talent invitation.
 *
 * @param {object} params
 * @param {object} params.models             db (TalentInvitation, User).
 * @param {object} params.emailService       Must expose sendInvite().
 * @param {object} params.educator           The educator User row (must be issuer + approved).
 * @param {string} params.studentWallet      Target wallet address (0x-prefixed).
 * @param {string} params.email              Email to deliver the invite.
 * @param {string} [params.message]          Optional personal message from the educator.
 * @returns {Promise<{
 *   ok: boolean,
 *   reason?: "INVITE_ALREADY_PENDING",
 *   invitation?: object,
 * }>}
 */
async function inviteTalent({ models, emailService, educator, studentWallet, email, message }) {
  if (!models || !models.TalentInvitation || !emailService || !educator) {
    throw new TypeError(
      "inviteTalent requires { models.TalentInvitation, emailService, educator, studentWallet, email }",
    );
  }
  if (typeof studentWallet !== "string" || !studentWallet.trim()) {
    throw new TypeError("inviteTalent requires a non-empty studentWallet");
  }
  if (typeof email !== "string" || !email.trim()) {
    throw new TypeError("inviteTalent requires a non-empty email");
  }

  const normalizedWallet = studentWallet.toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  // Dedupe — silently swallow re-clicks from the educator.
  const existing = await models.TalentInvitation.findOne({
    where: {
      educator_user_id: educator.id,
      student_wallet_address: normalizedWallet,
      status: "pending",
    },
  });
  if (existing) {
    console.log(
      `${LOG_PREFIX} duplicate-suppressed educator_user_id=${educator.id} wallet=${normalizedWallet}`,
    );
    return { ok: false, reason: "INVITE_ALREADY_PENDING", invitation: existing };
  }

  const invitation = await models.TalentInvitation.create({
    educator_user_id: educator.id,
    student_wallet_address: normalizedWallet,
    email: normalizedEmail,
    status: "pending",
  });

  // Email is a side effect — failures must not undo the invitation row.
  try {
    await emailService.sendInvite({
      to: normalizedEmail,
      walletAddress: normalizedWallet,
      educatorName: educator.name || educator.lastname || "An educator",
      message: typeof message === "string" && message.trim() ? message.trim() : null,
    });
  } catch (err) {
    console.error(
      `${LOG_PREFIX} email failed educator_user_id=${educator.id} wallet=${normalizedWallet}: ${err.name || "Error"}: ${err.message}`,
    );
  }

  console.log(
    `${LOG_PREFIX} created invitation_id=${invitation.id} educator_user_id=${educator.id} wallet=${normalizedWallet}`,
  );
  return { ok: true, invitation };
}

module.exports = { inviteTalent };
