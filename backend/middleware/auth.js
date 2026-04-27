// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const { User, Issuer, Student, Recruiter, UserSession, Sequelize } = require("../models");
const { Op } = Sequelize;
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "please_set_a_real_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Firma un token JWT con payload.
 * Payload esperado: { wallet }
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

    // Verify an active DB session exists for this wallet
    const session = await UserSession.findOne({
      where: {
        wallet_address: payload.wallet.toLowerCase(),
        expires_at: { [Op.gt]: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({ error: "Session not found or expired" });
    }

    req.auth = payload;
    return next();
  } catch (err) {
    console.error("authenticate error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Obtener usuario desde token usando wallet
 * Devuelve issuer, student o recruiter
 */
async function getUserFromToken(payload) {
  if (!payload || !payload.wallet) return null;

  const wallet = payload.wallet.toLowerCase();

  // Buscar en todas las tablas posibles
  const issuer = await Issuer.findOne({
    where: { wallet_address: wallet },
    include: [{
      model: User,
      attributes: ['name', 'email', 'wallet_address'] // Traemos solo lo que necesitamos
    }]
  });

  if (issuer) {
    return {
      modelName: "issuer",
      user: {
        wallet_address: issuer.wallet_address,
        name: issuer.User?.name,             // 🔹 ahora sí trae el nombre
        organization_name: issuer.organization_name,
        email: issuer.User?.email || issuer.email || null, // prioridad al email del User si existe
      },
    };
  }


  const student = await Student.findOne({
    where: { wallet_address: wallet },
    include: [{
      model: User,
      attributes: ['name', 'email', 'wallet_address']
    }]
  });

  if (student) {
    return {
      modelName: "student",
      user: {
        wallet_address: student.wallet_address,
        name: student.User?.name,
        email: student.User?.email || null,
      },
    };
  }


  const recruiter = await Recruiter.findOne({
    where: { wallet_address: wallet },
    include: [{
      model: User,
      attributes: ['name', 'email', 'wallet_address']
    }]
  });

  if (recruiter) {
    return {
      modelName: "recruiter",
      user: {
        wallet_address: recruiter.wallet_address,
        name: recruiter.User?.name || recruiter.company_name || null,
        company_name: recruiter.company_name,
        email: recruiter.User?.email || recruiter.email || null,
      },
    };
  }

  // No se encontró en ninguna tabla
  return null;
}

module.exports = {
  signToken,
  authenticate,
  getUserFromToken,
};
