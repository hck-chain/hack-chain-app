// backend/routes/__tests__/users-register-referral.test.js
const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");

jest.mock("../../models", () => {
  const { Op } = require('sequelize');
  return {
    User: { create: jest.fn(), findOne: jest.fn() },
    Student: { create: jest.fn() },
    Issuer: { create: jest.fn() },
    Recruiter: { create: jest.fn() },
    UserSession: { create: jest.fn(), destroy: jest.fn() },
    Sequelize: { Op },
    sequelize: {
      transaction: jest.fn(cb => cb({}))
    }
  };
});

jest.mock("../../middleware/auth", () => {
  const jwt = require('jsonwebtoken');
  const secret = 'test-secret-for-unit-tests';
  return {
    authenticate: (req, res, next) => { req.auth = { sub: 1, wallet: "0xTEST" }; next(); },
    signToken: jest.fn((payload) => jwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 3600 }, secret)),
    signRefreshToken: jest.fn((payload) => jwt.sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 86400 }, secret)),
    setAuthCookies: jest.fn()
  };
});

jest.mock("../../services/redis", () => ({ cacheSession: jest.fn() }));
jest.mock("../../services/emailService", () => ({ sendEmail: jest.fn().mockResolvedValue({ id: "mock" }) }));
jest.mock("../../services/authorizeIssuer", () => ({ authorizeIssuer: jest.fn().mockResolvedValue({ ok: true }) }));
jest.mock("../../harjoot/client", () => ({ createHarjootClient: jest.fn() }));
jest.mock("../../harjoot/usecases/activateMembership", () => ({ activateMembership: jest.fn() }));
jest.mock("../../harjoot/usecases/claimInvitation", () => ({ claimInvitation: jest.fn() }));
jest.mock("../../usecases/referrals/attachReferralOnRegister", () => ({
  attachReferralOnRegister: jest.fn().mockResolvedValue({ attached: true })
}));

const usersRoute = require("../users");
const { attachReferralOnRegister } = require("../../usecases/referrals/attachReferralOnRegister");
const { User } = require("../../models");

describe("POST /api/users/register - Referrals integration", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(bodyParser.json());
    // In express, req.ip needs trust proxy to work properly if behind proxy, but locally it defaults to ::1
    app.use("/api/users", usersRoute);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call attachReferralOnRegister during registration", async () => {
    User.findOne.mockResolvedValueOnce(null); // No existing user
    User.create.mockResolvedValue({
      id: 99,
      wallet_address: "0x1234567890123456789012345678901234567890",
      role: "student",
      name: "Test",
      lastname: "User",
      email: "test@example.com",
      is_active: true
    });

    const res = await request(app)
      .post("/api/users/register")
      .send({
        wallet_address: "0x1234567890123456789012345678901234567890",
        role: "student",
        name: "Test",
        lastname: "User",
        email: "test@example.com",
        referral_code: "REF12345"
      });

    expect(res.status).toBe(201);
    expect(attachReferralOnRegister).toHaveBeenCalledTimes(1);
    expect(attachReferralOnRegister).toHaveBeenCalledWith(
      expect.objectContaining({
        referrerCode: "REF12345",
        referredUser: expect.objectContaining({ id: 99 })
      })
    );
  });
});
