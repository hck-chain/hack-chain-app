const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");

jest.mock("../../models", () => {
  const { Op } = require('sequelize');
  return {
    User: { findByPk: jest.fn(), findOne: jest.fn() },
    Referral: { findAndCountAll: jest.fn(), findAll: jest.fn(), count: jest.fn(), findByPk: jest.fn() },
    Sequelize: { Op }
  };
});

// Mock authenticate to set req.auth
jest.mock("../../middleware/auth", () => ({
  authenticate: (req, res, next) => {
    req.auth = { sub: 1, wallet: "0x123" };
    next();
  }
}));

const referralsRoute = require("../referrals");

describe("Referrals Routes", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(bodyParser.json());
    app.use("/api/referrals", referralsRoute);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/referrals/validate/:code", () => {
    it("should return 400 for malformed code", async () => {
      const res = await request(app).get("/api/referrals/validate/SHORT");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ valid: false, error: "malformed" });
    });

    it("should return 404 if code not found", async () => {
      require("../../models").User.findOne.mockResolvedValue(null);
      const res = await request(app).get("/api/referrals/validate/AB3D5678");
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ valid: false, error: "not_found" });
    });

    it("should return valid and referrerName if found", async () => {
      require("../../models").User.findOne.mockResolvedValue({ name: "Hector" });
      const res = await request(app).get("/api/referrals/validate/AB3D5678");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ valid: true, referrerName: "Hector" });
    });
  });

  describe("GET /api/referrals/me/code", () => {
    it("should generate code if user found", async () => {
      const { User } = require("../../models");
      const userInstance = { id: 1, referral_code: "EXISTING" };
      User.findByPk.mockResolvedValue(userInstance);
      
      const res = await request(app).get("/api/referrals/me/code");
      expect(res.status).toBe(200);
      expect(res.body.code).toBe("EXISTING");
      expect(res.body.shareUrl).toContain("EXISTING");
    });
  });

  describe("GET /api/referrals/me", () => {
    it("should return list of referrals", async () => {
      const { Referral } = require("../../models");
      Referral.findAndCountAll.mockResolvedValue({ rows: [{ id: 10, status: "pending_stake", referred: { name: "Alice" } }], count: 1 });
      Referral.count.mockResolvedValue(0);

      const res = await request(app).get("/api/referrals/me?page=1&pageSize=10");
      expect(res.status).toBe(200);
      expect(res.body.referrals).toHaveLength(1);
      expect(res.body.referrals[0].referredName).toBe("Alice");
    });
  });

  describe("GET /api/referrals/me/stats", () => {
    it("should return referral stats", async () => {
      const { Referral } = require("../../models");
      Referral.findAll.mockResolvedValue([
        { status: "claimed", payout_amount_wei: "1000" },
        { status: "pending_stake" }
      ]);
      Referral.count.mockResolvedValue(1); // claimed this month

      const res = await request(app).get("/api/referrals/me/stats");
      expect(res.status).toBe(200);
      expect(res.body.totalEarnedWei).toBe("1000");
      expect(res.body.claimedCount).toBe(1);
      expect(res.body.pendingCount).toBe(1);
    });
  });
});
