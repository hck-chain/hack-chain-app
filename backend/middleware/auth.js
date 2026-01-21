// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const { User, Issuer } = require("../models");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "please_set_a_real_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Firma un token JWT con payload.
 * Payload expected: { wallet }
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Middleware authenticate
 */
async function authenticate(req, res, next) {
  try {
    const h = req.headers.authorization || "";
    const [type, token] = h.split(" ");
    if (type !== "Bearer" || !token) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.auth = payload; // payload debe tener { wallet }
    return next();
  } catch (err) {
    console.error("authenticate error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * getUserFromToken usando wallet
 */
async function getUserFromToken(payload) {
  if (!payload || !payload.wallet) return null;

  const wallet = payload.wallet.toLowerCase();

  const issuer = await Issuer.findOne({ where: { wallet_address: wallet } });
  const user = await User.findOne({ where: { wallet_address: wallet } });

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

module.exports = {
  signToken,
  authenticate,
  getUserFromToken,
};
