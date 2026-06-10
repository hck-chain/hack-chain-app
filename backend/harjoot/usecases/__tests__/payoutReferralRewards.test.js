const { payoutReferralRewards } = require("../payoutReferralRewards");
const { createMockAdapter } = require("../../adapters/incentivesPayoutAdapter");

describe("payoutReferralRewards", () => {
  let models;
  let adapter;
  let config;
  let transactionFn;

  beforeEach(() => {
    adapter = createMockAdapter();
    config = { referrals: { rewardHackWei: "1000", monthlyCap: 5, dailyPayoutCap: 50 } };
    
    transactionFn = jest.fn(async (cb) => cb({}));

    models = {
      Referral: {
        count: jest.fn().mockResolvedValue(0),
        findAll: jest.fn().mockResolvedValue([]),
        update: jest.fn()
      },
      User: {},
      IncentivesPoolLedger: { create: jest.fn() },
      Sequelize: { Op: { gte: Symbol("gte") } },
      sequelize: { transaction: transactionFn }
    };
  });

  it("should do nothing if daily cap reached", async () => {
    models.Referral.count.mockResolvedValueOnce(50); // daily limit reached
    const result = await payoutReferralRewards({ models, adapter, config });
    expect(result).toEqual({ processed: 0, skipped: 0, reason: "daily_cap_reached" });
  });

  it("should payout eligible referrals", async () => {
    const refUpdate = jest.fn();
    models.Referral.findAll.mockResolvedValue([
      { id: 1, referrer: { id: 10, wallet_address: "0xABC" }, update: refUpdate }
    ]);
    
    // First count for daily limit = 0
    // Second count for monthly limit = 0
    models.Referral.count
      .mockResolvedValueOnce(0) // daily
      .mockResolvedValueOnce(0); // monthly

    const result = await payoutReferralRewards({ models, adapter, config });
    
    expect(result.processed).toBe(1);
    expect(result.skipped).toBe(0);
    expect(refUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "claimed", payout_amount_wei: "1000" }),
      expect.anything()
    );
    expect(models.IncentivesPoolLedger.create).toHaveBeenCalled();
  });

  it("should queue for next month if monthly limit reached", async () => {
    const refUpdate = jest.fn();
    models.Referral.findAll.mockResolvedValue([
      { id: 1, referrer: { id: 10, wallet_address: "0xABC" }, update: refUpdate }
    ]);
    
    models.Referral.count
      .mockResolvedValueOnce(0) // daily
      .mockResolvedValueOnce(5); // monthly cap reached

    const result = await payoutReferralRewards({ models, adapter, config });
    
    expect(result.processed).toBe(0);
    expect(result.skipped).toBe(1);
    expect(refUpdate).toHaveBeenCalledWith({ status: "queued_next_month" });
    expect(models.IncentivesPoolLedger.create).not.toHaveBeenCalled();
  });
});
