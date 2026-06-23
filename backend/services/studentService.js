const { User, UserSession, sequelize } = require("../models");
const { validateDeletionMessage } = require("./issuerService");
const { deleteSession } = require("./redis");

async function deleteStudentAccount(wallet) {
  await sequelize.transaction(async (t) => {
    await UserSession.destroy({ where: { wallet_address: wallet }, transaction: t });
    // CASCADE: User → Student → certificates DB records (NFTs on-chain are immutable)
    await User.destroy({ where: { wallet_address: wallet }, transaction: t });
  });

  try {
    await deleteSession(wallet);
  } catch (_) {}
}

module.exports = {
  validateDeletionMessage,
  deleteStudentAccount,
};
