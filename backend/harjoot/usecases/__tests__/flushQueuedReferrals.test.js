const { flushQueuedReferrals } = require("../flushQueuedReferrals");

describe("flushQueuedReferrals", () => {
  it("should promote queued_next_month to eligible", async () => {
    const models = {
      Referral: {
        update: jest.fn().mockResolvedValue([5]) // 5 updated
      }
    };

    const result = await flushQueuedReferrals({ models });
    
    expect(result.processed).toBe(5);
    expect(models.Referral.update).toHaveBeenCalledWith(
      { status: "eligible" },
      { where: { status: "queued_next_month" } }
    );
  });

  it("should throw if models missing", async () => {
    await expect(flushQueuedReferrals({})).rejects.toThrow("requires { models }");
  });
});
