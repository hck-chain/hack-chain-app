// backend/harjoot/usecases/__tests__/checkPartnerHealth.test.js
//
// Unit tests for the Section 0 partner health check. The mock client provides
// a controllable Harjoot stub so we can exercise success, failure, and the
// "last-known-good" cache behaviour without any network.

const {
  checkPartnerHealth,
  getCachedPartnerInfo,
  getHealthState,
  __resetForTests,
} = require("../checkPartnerHealth");
const { createMockClient } = require("../../client/mockClient");
const { HarjootUnavailableError } = require("../../client/errors");

describe("checkPartnerHealth", () => {
  let client;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    __resetForTests();
    client = createMockClient();
  });

  // ---------------------------------------------------------------------------
  // Success path
  // ---------------------------------------------------------------------------

  test("on success returns ok=true with the partner info from the client", async () => {
    const result = await checkPartnerHealth(client);

    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
    expect(result.info.partner.slug).toBe("hackchain");
    expect(result.info.partner.active).toBe(true);
    expect(result.info.modes).toEqual(expect.arrayContaining(["hash_only"]));
  });

  test("on success updates the in-memory cache", async () => {
    expect(getCachedPartnerInfo()).toBeNull();
    await checkPartnerHealth(client);
    expect(getCachedPartnerInfo()).not.toBeNull();
    expect(getCachedPartnerInfo().partner.slug).toBe("hackchain");
  });

  test("on success updates lastCheckedAt and clears any previous lastError", async () => {
    // Seed a previous failure
    client.__setNextError("getPartnerInfo", new HarjootUnavailableError());
    await checkPartnerHealth(client);
    expect(getHealthState().lastError).not.toBeNull();

    // A successful check clears it
    await checkPartnerHealth(client);
    const state = getHealthState();
    expect(state.hasCache).toBe(true);
    expect(state.lastError).toBeNull();
    expect(state.lastCheckedAt).toBeInstanceOf(Date);
  });

  // ---------------------------------------------------------------------------
  // Failure path
  // ---------------------------------------------------------------------------

  test("on failure returns ok=false and DOES NOT throw", async () => {
    client.__setNextError("getPartnerInfo", new HarjootUnavailableError());

    // The whole point: even an upstream outage must not crash the startup path.
    const result = await checkPartnerHealth(client);

    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(HarjootUnavailableError);
  });

  test("on failure when no previous cache existed, getCachedPartnerInfo stays null", async () => {
    client.__setNextError("getPartnerInfo", new HarjootUnavailableError());
    await checkPartnerHealth(client);
    expect(getCachedPartnerInfo()).toBeNull();
  });

  test("on failure records the error in lastError", async () => {
    const upstream = new HarjootUnavailableError();
    client.__setNextError("getPartnerInfo", upstream);

    await checkPartnerHealth(client);

    const state = getHealthState();
    expect(state.lastError).toMatchObject({
      name: "HarjootUnavailableError",
      message: expect.stringMatching(/Harjoot/),
    });
  });

  // ---------------------------------------------------------------------------
  // Last-known-good cache behaviour
  // ---------------------------------------------------------------------------

  test("a failure AFTER a previous success keeps the last-known-good cache", async () => {
    // First call succeeds and populates the cache
    const firstResult = await checkPartnerHealth(client);
    expect(firstResult.ok).toBe(true);
    const firstCache = getCachedPartnerInfo();
    expect(firstCache).not.toBeNull();

    // Second call fails — but the cache stays
    client.__setNextError("getPartnerInfo", new HarjootUnavailableError());
    const secondResult = await checkPartnerHealth(client);

    expect(secondResult.ok).toBe(false);
    // result.info exposes the last-known-good for callers that care
    expect(secondResult.info).toEqual(firstCache);
    // and the module cache is unchanged
    expect(getCachedPartnerInfo()).toEqual(firstCache);
  });

  // ---------------------------------------------------------------------------
  // getHealthState
  // ---------------------------------------------------------------------------

  test("getHealthState reports hasCache=false before any check runs", () => {
    const state = getHealthState();
    expect(state).toEqual({ hasCache: false, lastCheckedAt: null, lastError: null });
  });

  test("getHealthState reflects the current cache after a successful check", async () => {
    await checkPartnerHealth(client);
    const state = getHealthState();
    expect(state.hasCache).toBe(true);
    expect(state.lastCheckedAt).toBeInstanceOf(Date);
    expect(state.lastError).toBeNull();
  });
});
