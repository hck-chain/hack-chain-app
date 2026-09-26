// Clears the self-custodied wallet from the authenticated account.
// No signature required: dropping a profile field cannot lock anyone out, and the caller
// already proved control of the account through the session.
// Returns a result object — never throws on business errors.

async function unlinkOwnWallet({ models, wallet }) {
  if (!models || !wallet) {
    throw new TypeError("unlinkOwnWallet requires { models, wallet }");
  }

  const user = await models.User.findOne({ where: { wallet_address: wallet.toLowerCase() } });
  if (!user) {
    return { ok: false, code: "USER_NOT_FOUND", httpStatus: 404, message: "User not found" };
  }

  if (!user.own_wallet_address) {
    return {
      ok: false,
      code: "NO_WALLET_LINKED",
      httpStatus: 409,
      message: "There is no own wallet linked to this account",
    };
  }

  await user.update({ own_wallet_address: null });

  return { ok: true, data: { own_wallet_address: null } };
}

module.exports = { unlinkOwnWallet };
