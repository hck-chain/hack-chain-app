const { createMockAdapter } = require("../incentivesPayoutAdapter");

describe("incentivesPayoutAdapter (Mock)", () => {
  let adapter;

  beforeEach(() => {
    adapter = createMockAdapter();
  });

  it("should return a txHash on success", async () => {
    const result = await adapter.transferHack("0x123", "1000");
    expect(result.txHash).toMatch(/^0xmocktxhash_/);
  });

  it("should throw if error is queued", async () => {
    adapter.__setNextError(new Error("RPC down"));
    await expect(adapter.transferHack("0x123", "1000")).rejects.toThrow("RPC down");
  });
});
