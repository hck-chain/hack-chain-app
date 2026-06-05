// backend/harjoot/adapters/__tests__/nftMintAdapter.test.js
//
// Same shape as polygonProvider tests: cover the mock queue semantics,
// factory env-driven selection, lazy singleton behavior, and the real
// adapter's construction surface (we do not exercise live ethers calls).

const ORIGINAL_ENV = { ...process.env };

function loadFreshModule(envOverrides = {}) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...envOverrides };
  return require("../nftMintAdapter");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  jest.resetModules();
});

const VALID_STUDENT = "0x1111111111111111111111111111111111111111";
const VALID_PARAMS = {
  studentWallet: VALID_STUDENT,
  studentName: "Sty",
  courseName: "Solidity 101",
  tokenUri: "ipfs://bafy.../meta.json",
};

// ---------------------------------------------------------------------------
// Mock adapter
// ---------------------------------------------------------------------------

describe("nftMintAdapter - mock semantics", () => {
  test("returns a deterministic auto-generated tokenId when queue is empty", async () => {
    const { createMockAdapter } = loadFreshModule();
    const adapter = createMockAdapter();
    const first = await adapter.mintCertificate(VALID_PARAMS);
    const second = await adapter.mintCertificate(VALID_PARAMS);
    expect(typeof first.tokenId).toBe("bigint");
    expect(typeof first.txHash).toBe("string");
    expect(first.tokenId).not.toBe(second.tokenId); // monotonic
    expect(first.txHash).not.toBe(second.txHash);
  });

  test("__setNextResult is consumed once, then falls back to auto-gen", async () => {
    const { createMockAdapter } = loadFreshModule();
    const adapter = createMockAdapter();
    adapter.__setNextResult({ tokenId: 42n, txHash: "0xdeadbeef" });

    const first = await adapter.mintCertificate(VALID_PARAMS);
    const second = await adapter.mintCertificate(VALID_PARAMS);

    expect(first).toEqual({ tokenId: 42n, txHash: "0xdeadbeef" });
    expect(second.tokenId).not.toBe(42n);
  });

  test("__setNextResult validates its inputs", () => {
    const { createMockAdapter } = loadFreshModule();
    const adapter = createMockAdapter();
    expect(() => adapter.__setNextResult({ tokenId: 42, txHash: "0xa" })).toThrow(TypeError); // not bigint
    expect(() => adapter.__setNextResult({ tokenId: 42n, txHash: 123 })).toThrow(TypeError);  // not string
  });

  test("__setNextError throws the queued error then resumes normal queue", async () => {
    const { createMockAdapter } = loadFreshModule();
    const adapter = createMockAdapter();
    const bomb = new Error("chain rejected");
    adapter.__setNextError(bomb);
    adapter.__setNextResult({ tokenId: 7n, txHash: "0xabc" });

    await expect(adapter.mintCertificate(VALID_PARAMS)).rejects.toBe(bomb);
    await expect(adapter.mintCertificate(VALID_PARAMS)).resolves.toEqual({
      tokenId: 7n,
      txHash: "0xabc",
    });
  });

  test("__reset clears the queue and resets the auto-id counter", async () => {
    const { createMockAdapter } = loadFreshModule();
    const adapter = createMockAdapter();
    adapter.__setNextResult({ tokenId: 999n, txHash: "0x0" });
    adapter.__setNextResult({ tokenId: 1000n, txHash: "0x1" });
    expect(adapter.__pendingCount()).toBe(2);
    adapter.__reset();
    expect(adapter.__pendingCount()).toBe(0);

    const after = await adapter.mintCertificate(VALID_PARAMS);
    expect(after.tokenId).toBeGreaterThanOrEqual(1000n);
  });

  test("rejects calls with invalid params (programmer-error guard)", async () => {
    const { createMockAdapter } = loadFreshModule();
    const adapter = createMockAdapter();
    await expect(adapter.mintCertificate({ ...VALID_PARAMS, studentWallet: "nope" })).rejects.toThrow(TypeError);
    await expect(adapter.mintCertificate({ ...VALID_PARAMS, studentName: "" })).rejects.toThrow(TypeError);
    await expect(adapter.mintCertificate({ ...VALID_PARAMS, courseName: "" })).rejects.toThrow(TypeError);
    await expect(adapter.mintCertificate({ ...VALID_PARAMS, tokenUri: "" })).rejects.toThrow(TypeError);
  });
});

// ---------------------------------------------------------------------------
// Real adapter — construction surface only
// ---------------------------------------------------------------------------

describe("nftMintAdapter - real adapter construction", () => {
  // A throwaway private key — random bytes, not derived from any wallet.
  const PRIVKEY = "0x" + "1".repeat(64);
  const CONTRACT = "0x2222222222222222222222222222222222222222";

  test("createRealAdapter returns an object with mintCertificate", () => {
    const { createRealAdapter } = loadFreshModule();
    const adapter = createRealAdapter({
      rpcUrl: "https://polygon-rpc.example/v1",
      privateKey: PRIVKEY,
      contractAddress: CONTRACT,
    });
    expect(typeof adapter.mintCertificate).toBe("function");
    // Mock-only helper should NOT exist on the real surface.
    expect(adapter.__setNextResult).toBeUndefined();
  });

  test("createRealAdapter throws TypeError on missing rpcUrl", () => {
    const { createRealAdapter } = loadFreshModule();
    expect(() => createRealAdapter({ privateKey: PRIVKEY, contractAddress: CONTRACT })).toThrow(TypeError);
  });
  test("createRealAdapter throws TypeError on missing privateKey", () => {
    const { createRealAdapter } = loadFreshModule();
    expect(() => createRealAdapter({ rpcUrl: "https://x", contractAddress: CONTRACT })).toThrow(TypeError);
  });
  test("createRealAdapter throws TypeError on missing contractAddress", () => {
    const { createRealAdapter } = loadFreshModule();
    expect(() => createRealAdapter({ rpcUrl: "https://x", privateKey: PRIVKEY })).toThrow(TypeError);
  });
});

// ---------------------------------------------------------------------------
// Factory + lazy singleton
// ---------------------------------------------------------------------------

describe("nftMintAdapter - factory selection (CHAIN_USE_MOCK)", () => {
  const PRIVKEY = "0x" + "1".repeat(64);

  test("CHAIN_USE_MOCK=true yields the in-process mock", () => {
    const { createNftMintAdapter } = loadFreshModule({ CHAIN_USE_MOCK: "true" });
    const adapter = createNftMintAdapter();
    expect(typeof adapter.__setNextResult).toBe("function");
  });

  test("CHAIN_USE_MOCK=1 also selects the mock", () => {
    const { createNftMintAdapter } = loadFreshModule({ CHAIN_USE_MOCK: "1" });
    const adapter = createNftMintAdapter();
    expect(typeof adapter.__setNextResult).toBe("function");
  });

  test("real mode requires POLYGON_RPC_URL", () => {
    const mod = loadFreshModule({
      CHAIN_USE_MOCK: "false",
      POLYGON_RPC_URL: "",
      POLYGON_OWNER_PRIVATE_KEY: PRIVKEY,
      VITE_CONTRACT_ADDRESS: "0x" + "2".repeat(40),
    });
    expect(() => mod.createNftMintAdapter()).toThrow(mod.NftMintError);
    expect(() => mod.createNftMintAdapter()).toThrow(/POLYGON_RPC_URL/);
  });

  test("real mode requires POLYGON_OWNER_PRIVATE_KEY", () => {
    const mod = loadFreshModule({
      CHAIN_USE_MOCK: "false",
      POLYGON_RPC_URL: "https://x",
      POLYGON_OWNER_PRIVATE_KEY: "",
      VITE_CONTRACT_ADDRESS: "0x" + "2".repeat(40),
    });
    expect(() => mod.createNftMintAdapter()).toThrow(/POLYGON_OWNER_PRIVATE_KEY/);
  });

  test("real mode requires VITE_CONTRACT_ADDRESS", () => {
    const mod = loadFreshModule({
      CHAIN_USE_MOCK: "false",
      POLYGON_RPC_URL: "https://x",
      POLYGON_OWNER_PRIVATE_KEY: PRIVKEY,
      VITE_CONTRACT_ADDRESS: "",
    });
    expect(() => mod.createNftMintAdapter()).toThrow(/VITE_CONTRACT_ADDRESS/);
  });

  test("real mode constructs the real adapter when all env vars are set", () => {
    const { createNftMintAdapter } = loadFreshModule({
      CHAIN_USE_MOCK: "false",
      POLYGON_RPC_URL: "https://x",
      POLYGON_OWNER_PRIVATE_KEY: PRIVKEY,
      VITE_CONTRACT_ADDRESS: "0x" + "2".repeat(40),
    });
    const adapter = createNftMintAdapter();
    expect(adapter.__setNextResult).toBeUndefined();
    expect(typeof adapter.mintCertificate).toBe("function");
  });
});

describe("nftMintAdapter - lazy singleton", () => {
  test("createNftMintAdapter memoizes after the first call", () => {
    const { createNftMintAdapter } = loadFreshModule({ CHAIN_USE_MOCK: "true" });
    const a = createNftMintAdapter();
    const b = createNftMintAdapter();
    expect(a).toBe(b);
  });

  test("__resetForTests clears the cache so a flipped env can take effect", () => {
    const PRIVKEY = "0x" + "1".repeat(64);
    const mod = loadFreshModule({ CHAIN_USE_MOCK: "true" });
    const first = mod.createNftMintAdapter();
    mod.__resetForTests();

    process.env.CHAIN_USE_MOCK = "false";
    process.env.POLYGON_RPC_URL = "https://other";
    process.env.POLYGON_OWNER_PRIVATE_KEY = PRIVKEY;
    process.env.VITE_CONTRACT_ADDRESS = "0x" + "3".repeat(40);

    const second = mod.createNftMintAdapter();
    expect(second).not.toBe(first);
    expect(second.__setNextResult).toBeUndefined();
  });
});
