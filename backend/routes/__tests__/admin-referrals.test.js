const request = require("supertest");
const express = require("express");
const bodyParser = require("body-parser");

jest.mock("../../models", () => {
  return {
    Referral: { findByPk: jest.fn() }
  };
});

jest.mock("../../middleware/auth", () => ({
  authenticate: (req, res, next) => {
    req.auth = { sub: 1, wallet: "0xADMIN" };
    next();
  }
}));

jest.mock("../../middleware/requireAdmin", () => ({
  requireAdmin: (req, res, next) => next(),
  isAdmin: () => true
}));

jest.mock("../../services/emailService", () => ({
  sendEmail: jest.fn().mockResolvedValue({ id: "mock-email-id" })
}));

const adminRoute = require("../admin");

describe("Admin Referrals Routes", () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(bodyParser.json());
    app.use("/api/admin", adminRoute);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/admin/referrals/:id/cancel", () => {
    it("should cancel a referral", async () => {
      const { Referral } = require("../../models");
      const updateMock = jest.fn();
      Referral.findByPk.mockResolvedValue({ id: 10, update: updateMock });

      const res = await request(app).post("/api/admin/referrals/10/cancel").send({ reason: "fraud" });
      expect(res.status).toBe(200);
      expect(updateMock).toHaveBeenCalledWith({ status: "cancelled", review_reason: "fraud" });
    });

    it("should return 404 if not found", async () => {
      require("../../models").Referral.findByPk.mockResolvedValue(null);
      const res = await request(app).post("/api/admin/referrals/10/cancel");
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/admin/referrals/:id/approve-review", () => {
    it("should approve a review", async () => {
      const { Referral } = require("../../models");
      const updateMock = jest.fn();
      Referral.findByPk.mockResolvedValue({ id: 10, update: updateMock });

      const res = await request(app).post("/api/admin/referrals/10/approve-review");
      expect(res.status).toBe(200);
      expect(updateMock).toHaveBeenCalledWith({ requires_review: false });
    });
  });
});
