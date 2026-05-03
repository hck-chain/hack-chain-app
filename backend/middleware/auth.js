// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const { User, Issuer, Student, Recruiter, UserSession, Sequelize } = require("../models");
const { Op } = Sequelize;
const { cacheSession, sessionExists, deleteSession } = require("../services/redis");
require("dotenv").config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

if (!process.env.REFRESH_SECRET) {
  throw new Error("REFRESH_SECRET environment variable is required");
}
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN || "7d";

const _isProd = process.env.NODE_ENV === 'production';
const _COOKIE_BASE = {
  httpOnly: true,
  secure: _isProd,
  sameSite: _isProd ? 'none' : 'lax',
};

const ACCESS_COOKIE_OPTIONS = { ..._COOKIE_BASE, maxAge: 15 * 60 * 1000, path: '/' };
const REFRESH_COOKIE_OPTIONS = { ..._COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000, path: '/api/auth/refresh' };

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function signRefreshToken(payload) {
  const { iat, exp, ...clean } = payload;
  return jwt.sign({ ...clean, type: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN, algorithm: 'HS256' });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, { algorithms: ['HS256'] });
}

function setAuthCookies(res, accessToken, refreshToken) {
  res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
  res.cookie('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
}

function setAccessCookie(res, accessToken) {
  res.cookie('access_token', accessToken, ACCESS_COOKIE_OPTIONS);
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', { ..._COOKIE_BASE, path: '/' });
  res.clearCookie('refresh_token', { ..._COOKIE_BASE, path: '/api/auth/refresh' });
}

/**
 * Middleware authenticate
 */
async function authenticate(req, res, next) {
  try {
    const token = req.cookies?.access_token || (() => {
      const h = req.headers.authorization || "";
      const [type, t] = h.split(" ");
      return type === "Bearer" && t ? t : null;
    })();

    if (!token) {
      return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Redis-first session check: ~1ms cache hit avoids a DB round-trip on every request.
    // On Redis failure, fall back to DB so auth never breaks because of cache.
    const wallet = payload.wallet.toLowerCase();
    let cached = false;
    try {
      cached = await sessionExists(wallet);
    } catch (_) {
      // Redis unavailable — fall through to DB
    }

    if (!cached) {
      const session = await UserSession.findOne({
        where: {
          wallet_address: wallet,
          expires_at: { [Op.gt]: new Date() },
        },
      });

      if (!session) {
        return res.status(401).json({ error: "Session not found or expired" });
      }

      // Warm cache — best effort, don't fail the request if Redis is down.
      try {
        const ttl = Math.floor((new Date(session.expires_at) - Date.now()) / 1000);
        if (ttl > 0) await cacheSession(wallet, ttl);
      } catch (_) {}
    }

    req.auth = payload;
    return next();
  } catch (err) {
    console.error("authenticate error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

const USER_INCLUDE = [{ model: User, attributes: ['name', 'email', 'wallet_address'] }];

async function queryIssuer(wallet) {
  const issuer = await Issuer.findOne({ where: { wallet_address: wallet }, include: USER_INCLUDE });
  if (!issuer) return null;
  return {
    modelName: "issuer",
    user: {
      wallet_address: issuer.wallet_address,
      name: issuer.User?.name,
      organization_name: issuer.organization_name,
      email: issuer.User?.email || issuer.email || null,
    },
  };
}

async function queryStudent(wallet) {
  const student = await Student.findOne({ where: { wallet_address: wallet }, include: USER_INCLUDE });
  if (!student) return null;
  return {
    modelName: "student",
    user: {
      wallet_address: student.wallet_address,
      name: student.User?.name,
      email: student.User?.email || null,
    },
  };
}

async function queryRecruiter(wallet) {
  const recruiter = await Recruiter.findOne({ where: { wallet_address: wallet }, include: USER_INCLUDE });
  if (!recruiter) return null;
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

// JWT payload always contains role (set by signToken in routes/auth.js).
// Dispatch directly to the correct table — avoids up to 3 sequential queries.
async function getUserFromToken(payload) {
  if (!payload || !payload.wallet || !payload.role) return null;

  const wallet = payload.wallet.toLowerCase();

  switch (payload.role) {
    case "issuer":    return queryIssuer(wallet);
    case "student":   return queryStudent(wallet);
    case "recruiter": return queryRecruiter(wallet);
    default:          return null;
  }
}

module.exports = {
  signToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  setAccessCookie,
  clearAuthCookies,
  authenticate,
  getUserFromToken,
};
