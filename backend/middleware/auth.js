// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const userService = require("../services/userService");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "please_set_a_real_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Firma un token JWT con payload.
 * Payload expected: { sub, role, email, ... }
 */
function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * authenticate middleware:
 * - acepta Authorization: Bearer <token>
 * - o bien req.session.user si usas sesiones (opcional)
 * Añade req.auth = payload
 */
async function authenticate(req, res, next) {
  try {
    // 1) check session
    if (req.session && req.session.user) {
      req.auth = {
        sub: req.session.user.id,
        role: req.session.user.role,
        email: req.session.user.email,
      };
      return next();
    }

    // 2) check bearer token
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

    // attach to request
    req.auth = payload;
    return next();
  } catch (err) {
    console.error("authenticate error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Dado el payload (o req.auth), devuelve el usuario de la DB y el tipo de modelo
 * Retorna: { modelName, user } o null
 */
async function getUserFromToken(payload) {
  if (!payload || !payload.sub || !payload.role) return null;
  const id = payload.sub;
  const role = payload.role;
  const result = await userService.getUserByIdAndRole(id, role);
  if (!result || !result.user) return null;

  // remove sensitive fields
  const out = result.user.toJSON ? result.user.toJSON() : { ...result.user };
  if (out.passwordHash) delete out.passwordHash;
  if (out.privateKey) delete out.privateKey;
  return { modelName: result.modelName, user: out };
}

module.exports = {
  signToken,
  authenticate,
  getUserFromToken,
};
