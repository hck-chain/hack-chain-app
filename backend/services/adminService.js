const { listAdmins } = require("../middleware/requireAdmin");
const { Op } = require("sequelize");

/**
 * Returns email addresses for all configured admin wallets that have a
 * registered User with a non-null email. Silently drops admins without an
 * account or without an email — they just won't receive the notification.
 */
async function getAdminEmails(User) {
  const adminWallets = listAdmins();
  if (adminWallets.length === 0) return [];

  const users = await User.findAll({
    where: {
      wallet_address: { [Op.in]: adminWallets },
      email: { [Op.not]: null },
    },
    attributes: ["email"],
  });

  return users.map((u) => u.email).filter(Boolean);
}

module.exports = { getAdminEmails };
