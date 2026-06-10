// backend/harjoot/usecases/__tests__/attachReferralOnRegister.test.js
const { attachReferralOnRegister } = require("../attachReferralOnRegister");

describe("attachReferralOnRegister", () => {
  let models;
  let transaction = {};

  beforeEach(() => {
    models = {
      User: { findOne: jest.fn() },
      Referral: {
        findOne: jest.fn(),
        count: jest.fn(),
        create: jest.fn().mockResolvedValue({ id: 99 })
      },
      Sequelize: { Op: { gte: Symbol("gte") } }
    };
  });

  it("should return no_code if referrerCode is missing", async () => {
    const result = await attachReferralOnRegister({
      models, transaction, referredUser: { id: 2 }, referrerCode: null
    });
    expect(result).toEqual({ attached: false, reason: "no_code" });
  });

  it("should return code_not_found if code does not match any user", async () => {
    models.User.findOne.mockResolvedValue(null);
    const result = await attachReferralOnRegister({
      models, transaction, referredUser: { id: 2 }, referrerCode: "INVALID"
    });
    expect(result).toEqual({ attached: false, reason: "code_not_found" });
  });

  it("should return self_referral_id if referred is the referrer", async () => {
    models.User.findOne.mockResolvedValue({ id: 2 });
    const result = await attachReferralOnRegister({
      models, transaction, referredUser: { id: 2 }, referrerCode: "VALID"
    });
    expect(result).toEqual({ attached: false, reason: "self_referral_id" });
  });

  it("should return already_referred if the user was already referred", async () => {
    models.User.findOne.mockResolvedValue({ id: 1 }); // referrer
    models.Referral.findOne.mockResolvedValue({ id: 5 }); // existing referral
    const result = await attachReferralOnRegister({
      models, transaction, referredUser: { id: 2 }, referrerCode: "VALID"
    });
    expect(result).toEqual({ attached: false, reason: "already_referred" });
  });

  it("should create referral and flag requiresReview if IP threshold met", async () => {
    models.User.findOne.mockResolvedValue({ id: 1 });
    models.Referral.findOne.mockResolvedValue(null);
    models.Referral.count.mockResolvedValue(2); // 2 existing today from this IP

    const result = await attachReferralOnRegister({
      models, transaction, referredUser: { id: 2 }, referrerCode: "VALID", ipHash: "hash123", now: new Date("2026-06-09T10:00:00Z")
    });

    expect(result).toEqual({ attached: true, referralId: 99, requiresReview: true });
    expect(models.Referral.create).toHaveBeenCalledWith(
      expect.objectContaining({
        referrer_user_id: 1,
        referred_user_id: 2,
        requires_review: true,
        review_reason: "multiple_referrals_from_ip_24h"
      }),
      { transaction }
    );
  });

  it("should create referral smoothly on happy path", async () => {
    models.User.findOne.mockResolvedValue({ id: 1 });
    models.Referral.findOne.mockResolvedValue(null);
    models.Referral.count.mockResolvedValue(0);

    const result = await attachReferralOnRegister({
      models, transaction, referredUser: { id: 2 }, referrerCode: "VALID"
    });

    expect(result).toEqual({ attached: true, referralId: 99, requiresReview: false });
    expect(models.Referral.create).toHaveBeenCalledWith(
      expect.objectContaining({
        referrer_user_id: 1,
        referred_user_id: 2,
        requires_review: false
      }),
      { transaction }
    );
  });
});
