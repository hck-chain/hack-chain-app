// backend/tests/referralModels.test.js
const { User, Referral, IncentivesPoolLedger, sequelizeAdmin } = require("../models");

describe("Referrals Models", () => {
  beforeAll(async () => {
    // Basic sync if needed, assuming test setup handles db init
    await sequelizeAdmin.sync();
  });

  afterAll(async () => {
    await sequelizeAdmin.close();
  });

  let referrer, referred;

  const TEST_WALLETS = ["0x_test_referrer_1", "0x_test_referred_1", "0x_test_extra_1"];

  beforeEach(async () => {
    await IncentivesPoolLedger.destroy({ where: {} });
    await Referral.destroy({ where: {} });
    await User.destroy({ where: { wallet_address: TEST_WALLETS } });

    referrer = await User.create({
      wallet_address: "0x_test_referrer_1",
      role: "student",
      nonce: "nonce1",
      referral_code: "TREF0001"
    });

    referred = await User.create({
      wallet_address: "0x_test_referred_1",
      role: "student",
      nonce: "nonce2",
      referral_code: "TREF0002"
    });
  });

  afterEach(async () => {
    await IncentivesPoolLedger.destroy({ where: {} });
    await Referral.destroy({ where: {} });
    await User.destroy({ where: { wallet_address: TEST_WALLETS } });
  });

  it("should create a referral with default status", async () => {
    const ref = await Referral.create({
      referrer_user_id: referrer.id,
      referred_user_id: referred.id,
      referral_code_used: "REF12345"
    });

    expect(ref.status).toBe("pending_stake");
    expect(ref.requires_review).toBe(false);
  });

  it("should enforce UNIQUE constraint on referred_user_id", async () => {
    await Referral.create({
      referrer_user_id: referrer.id,
      referred_user_id: referred.id,
      referral_code_used: "REF12345"
    });

    await expect(
      Referral.create({
        referrer_user_id: referrer.id,
        referred_user_id: referred.id,
        referral_code_used: "REF12345"
      })
    ).rejects.toThrow();
  });

  it("should reject invalid status values if DB has CHECK constraint (or model validates)", async () => {
    // In Sequelize, if no validate is present, Postgres CHECK constraint catches it.
    await expect(
      Referral.create({
        referrer_user_id: referrer.id,
        referred_user_id: referred.id,
        referral_code_used: "REF12345",
        status: "invalid_status"
      })
    ).rejects.toThrow();
  });

  it("should enforce UNIQUE on payout_tx_hash", async () => {
    await Referral.create({
      referrer_user_id: referrer.id,
      referred_user_id: referred.id,
      referral_code_used: "REF12345",
      payout_tx_hash: "0xABC"
    });

    const anotherReferred = await User.create({
      wallet_address: "0x_test_extra_1",
      role: "student",
      nonce: "nonce3"
    });

    await expect(
      Referral.create({
        referrer_user_id: referrer.id,
        referred_user_id: anotherReferred.id,
        referral_code_used: "REF12345",
        payout_tx_hash: "0xABC"
      })
    ).rejects.toThrow();
  });

  it("should enforce referrer_user_id <> referred_user_id", async () => {
    await expect(
      Referral.create({
        referrer_user_id: referrer.id,
        referred_user_id: referrer.id,
        referral_code_used: "REF12345"
      })
    ).rejects.toThrow();
  });
});
