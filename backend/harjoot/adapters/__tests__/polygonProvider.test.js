// backend/harjoot/adapters/__tests__/polygonProvider.test.js
//
// Covers (a) the mock provider's queue semantics, (b) factory-level
// selection between real and mock based on env, and (c) the lazy
// singleton's cache + reset behavior. The real ethers JsonRpcProvider
// is exercised at the construction surface only — its network behavior
// is not our concern (that's ethers' test suite).

const ORIGINAL_ENV = { ...process.env };

function loadFreshModule(envOverrides = {}) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...envOverrides };
  return require("../polygonProvider");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

describe("polygonProvider - mock adapter semantics", () => {
  test("returns null when nothing has been queued (unknown tx behavior)", async () => {
    const { createMockProvider } = loadFreshModule();
    const provider = createMockProvider();
    await expect(provider.getTransactionReceipt("0xabc")).resolves.toBeNull();
  });

  test("returns canned receipts in FIFO order then falls back to null", async () => {
    const { createMockProvider } = loadFreshModule();
    const provider = createMockProvider();
    const r1 = { status: 1, hash: "0x1" };
    const r2 = { status: 1, hash: "0x2" };
    provider.__setNextReceipt(r1);
    provider.__setNextReceipt(r2);

    await expect(provider.getTransactionReceipt("0xa")).resolves.toBe(r1);
    await expect(provider.getTransactionReceipt("0xa")).resolves.toBe(r2);
    await expect(provider.getTransactionReceipt("0xa")).resolves.toBeNull();
  });

  test("throws the queued error and keeps subsequent queue entries intact", async () => {
    const { createMockProvider } = loadFreshModule();
    const provider = createMockProvider();
    const bomb = new Error("RPC blew up");
    const r = { status: 1, hash: "0xok" };
    provider.__setNextError(bomb);
    provider.__setNextReceipt(r);

    await expect(provider.getTransactionReceipt("0xa")).rejects.toBe(bomb);
    await expect(provider.getTransactionReceipt("0xa")).resolves.toBe(r);
  });

  test("__reset clears the queue", async () => {
    const { createMockProvider } = loadFreshModule();
    const provider = createMockProvider();
    provider.__setNextReceipt({ status: 1 });
    provider.__setNextReceipt({ status: 1 });
    expect(provider.__pendingCount()).toBe(2);
    provider.__reset();
    expect(provider.__pendingCount()).toBe(0);
    await expect(provider.getTransactionReceipt("0xa")).resolves.toBeNull();
  });
});

describe("polygonProvider - real adapter construction", () => {
  test("createRealProvider returns an object with getTransactionReceipt", () => {
    const { createRealProvider } = loadFreshModule();
    const provider = createRealProvider({ rpcUrl: "https://polygon-rpc.example/v1" });
    expect(typeof provider.getTransactionReceipt).toBe("function");
  });

  test("createRealProvider throws TypeError on missing rpcUrl", () => {
    const { createRealProvider } = loadFreshModule();
    expect(() => createRealProvider({})).toThrow(TypeError);
    expect(() => createRealProvider({ rpcUrl: "" })).toThrow(TypeError);
  });
});

describe("polygonProvider - factory selection (CHAIN_USE_MOCK)", () => {
  test("CHAIN_USE_MOCK=true yields the in-process mock with test helpers", () => {
    const { createPolygonProvider } = loadFreshModule({ CHAIN_USE_MOCK: "true" });
    const provider = createPolygonProvider();
    // The mock exposes __setNextReceipt; the real adapter does not.
    expect(typeof provider.__setNextReceipt).toBe("function");
    expect(typeof provider.__reset).toBe("function");
  });

  test("CHAIN_USE_MOCK=1 (numeric) also selects the mock", () => {
    const { createPolygonProvider } = loadFreshModule({ CHAIN_USE_MOCK: "1" });
    const provider = createPolygonProvider();
    expect(typeof provider.__setNextReceipt).toBe("function");
  });

  test("real mode requires POLYGON_RPC_URL — throws PolygonProviderError when missing", () => {
    const mod = loadFreshModule({ CHAIN_USE_MOCK: "false", POLYGON_RPC_URL: "" });
    expect(() => mod.createPolygonProvider()).toThrow(mod.PolygonProviderError);
    expect(() => mod.createPolygonProvider()).toThrow(/POLYGON_RPC_URL/);
  });

  test("real mode constructs the real provider when POLYGON_RPC_URL is set", () => {
    const { createPolygonProvider } = loadFreshModule({
      CHAIN_USE_MOCK: "false",
      POLYGON_RPC_URL: "https://polygon-rpc.example/v1",
    });
    const provider = createPolygonProvider();
    // Real adapter does NOT expose mock-only helpers.
    expect(provider.__setNextReceipt).toBeUndefined();
    expect(typeof provider.getTransactionReceipt).toBe("function");
  });
});

describe("polygonProvider - lazy singleton", () => {
  test("createPolygonProvider memoizes after the first call", () => {
    const { createPolygonProvider } = loadFreshModule({ CHAIN_USE_MOCK: "true" });
    const a = createPolygonProvider();
    const b = createPolygonProvider();
    expect(a).toBe(b);
  });

  test("__resetForTests clears the cache so a flipped env can take effect", () => {
    const mod = loadFreshModule({ CHAIN_USE_MOCK: "true" });
    const first = mod.createPolygonProvider();
    mod.__resetForTests();
    // Flip the env on the fly — Node sees it since createPolygonProvider
    // reads process.env at call time, not at module load.
    process.env.CHAIN_USE_MOCK = "false";
    process.env.POLYGON_RPC_URL = "https://other-rpc.example/v1";
    const second = mod.createPolygonProvider();
    expect(second).not.toBe(first);
    // Confirm the second one is the real branch (no mock helpers).
    expect(second.__setNextReceipt).toBeUndefined();
  });
});
