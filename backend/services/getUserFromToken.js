import { User, Issuer } from "../models/index.js";
console.log("🧩 getUserFromToken FILE LOADED");

export async function getUserFromToken(authPayload) {
  const wallet = authPayload.wallet.toLowerCase();
  console.log("🔑 WALLET FROM TOKEN:", wallet);

  const issuer = await Issuer.findOne({
    where: { wallet_address: wallet },
  });

  console.log("🏛 ISSUER FOUND:", issuer?.dataValues);

  const user = await User.findOne({
    where: { wallet_address: wallet },
  });

  console.log("👤 USER FOUND:", user?.dataValues);

  if (!issuer) return null;

  return {
    modelName: "issuer",
    user: {
      wallet_address: issuer.wallet_address,
      organization_name: issuer.organization_name,
      email: user?.email || null,
    },
  };
}
