// backend/harjoot/usecases/claimInvitation.js
//
// DS Section 5 — when a freshly registered student matches a wallet that an
// educator had previously invited, mark every pending invitation for that
// wallet as claimed and notify each educator so they can retry issuance.
//
// Designed as a best-effort post-registration hook:
//  - If there are no pending invitations, this is a quick no-op.
//  - If one or more exist, all are claimed in a single pass.
//  - Email failures do not block the claim — the DB transition is the source
//    of truth; educators are informed best-effort.
//
// Like the other Section 5 use cases, this never throws on upstream failures —
// only on programmer errors (missing deps).

const LOG_PREFIX = "[claimInvitation]";

/**
 * Claim all pending invitations matching `studentWallet` and notify the
 * educators who issued them.
 *
 * @param {object} params
 * @param {object} params.models             db (TalentInvitation, User).
 * @param {object} params.emailService       Must expose notifyEducatorClaimed().
 * @param {string} params.studentWallet      The talent's wallet (just registered).
 * @param {object} [params.studentUser]      Optional — the freshly-created
 *                                           student User row, to pass the name
 *                                           through to the educator email.
 * @returns {Promise<{
 *   ok: boolean,
 *   claimedCount: number,
 *   notifiedCount: number,
 * }>}
 */
async function claimInvitation({ models, emailService, studentWallet, studentUser }) {
  if (!models || !models.TalentInvitation || !models.User || !emailService) {
    throw new TypeError(
      "claimInvitation requires { models.TalentInvitation, models.User, emailService, studentWallet }",
    );
  }
  if (typeof studentWallet !== "string" || !studentWallet.trim()) {
    throw new TypeError("claimInvitation requires a non-empty studentWallet");
  }

  const normalizedWallet = studentWallet.toLowerCase();

  const pending = await models.TalentInvitation.findAll({
    where: { student_wallet_address: normalizedWallet, status: "pending" },
  });

  if (pending.length === 0) {
    // Fast path: most registrations have no invitation waiting. Cheap no-op.
    return { ok: true, claimedCount: 0, notifiedCount: 0 };
  }

  const claimedAt = new Date();
  let notifiedCount = 0;

  for (const invite of pending) {
    await invite.update({ status: "claimed", claimed_at: claimedAt });

    // Best-effort educator notification — load the educator row to get their
    // email + name. If any of this fails, log and continue with the next one.
    try {
      const educator = await models.User.findByPk(invite.educator_user_id, {
        attributes: ["email", "name", "lastname"],
      });
      if (educator && educator.email) {
        await emailService.notifyEducatorClaimed({
          to: educator.email,
          educatorName: educator.name || educator.lastname || null,
          studentWallet: normalizedWallet,
          studentName: studentUser ? (studentUser.name || null) : null,
        });
        notifiedCount += 1;
      } else {
        console.warn(
          `${LOG_PREFIX} educator_user_id=${invite.educator_user_id} has no email; skipped notification`,
        );
      }
    } catch (err) {
      console.error(
        `${LOG_PREFIX} email failed invitation_id=${invite.id}: ${err.name || "Error"}: ${err.message}`,
      );
    }
  }

  console.log(
    `${LOG_PREFIX} claimed=${pending.length} notified=${notifiedCount} wallet=${normalizedWallet}`,
  );
  return { ok: true, claimedCount: pending.length, notifiedCount };
}

module.exports = { claimInvitation };
