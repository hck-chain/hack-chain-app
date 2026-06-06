// backend/harjoot/usecases/__tests__/activateMembership.test.js
//
// Unit tests for the Section 2 membership activation hook. The mock client
// drives the Harjoot side; a stub `models.User` captures the persistence side
// so we can assert exactly what was written without spinning up a database.

const { activateMembership } = require("../activateMembership");
const { createMockClient } = require("../../client/mockClient");
const { HarjootUnavailableError, HarjootAuthError } = require("../../client/errors");

function makeUserModelStub() {
  return {
    update: jest.fn().mockResolvedValue([1]),
  };
}

function makeUser(overrides = {}) {
  return {
    id: 42,
    wallet_address: "0xabc",
    role: "issuer",
    name: "Edu",
    lastname: "Cator",
    email: "edu@example.com",
    ...overrides,
  };
}

describe("activateMembership", () => {
  let client;
  let User;
  let models;

  beforeAll(() => {
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    client = createMockClient();
    User = makeUserModelStub();
    models = { User };
  });

  // ---------------------------------------------------------------------------
  // Happy path
  // ---------------------------------------------------------------------------

  test("on success, returns ok=true with the membership expiry", async () => {
    const user = makeUser({ role: "student" });
    const result = await activateMembership({
      client,
      models,
      role: "student",
      user,
      profile: { field_of_study: "Cybersecurity" },
    });

    expect(result.ok).toBe(true);
    expect(result.error).toBeNull();
    expect(typeof result.expiresAt).toBe("string");
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  test("on success, persists harjoot_membership_expires_at on the user row", async () => {
    const user = makeUser({ id: 17, role: "recruiter" });
    await activateMembership({
      client,
      models,
      role: "recruiter",
      user,
      profile: { company_name: "Acme" },
    });

    expect(User.update).toHaveBeenCalledTimes(1);
    const [update, opts] = User.update.mock.calls[0];
    expect(update.harjoot_membership_expires_at).toBeDefined();
    expect(opts.where).toEqual({ id: 17 });
  });

  test("forwards the HackChain role to client.activateAccess as-is (mapping is the client's job)", async () => {
    const spy = jest.spyOn(client, "activateAccess");
    const user = makeUser({ role: "issuer" });
    await activateMembership({
      client,
      models,
      role: "issuer",
      user,
      profile: { organization_name: "Cyber Academy" },
    });

    expect(spy).toHaveBeenCalledWith("issuer", user, { organization_name: "Cyber Academy" });
  });

  // ---------------------------------------------------------------------------
  // Failure paths — must NEVER throw
  // ---------------------------------------------------------------------------

  test("when Harjoot is unavailable, returns ok=false and does NOT throw", async () => {
    client.__setNextError("activateAccess", new HarjootUnavailableError());
    const user = makeUser();

    // This is the whole point: registration must keep going even if Harjoot is down.
    const result = await activateMembership({
      client,
      models,
      role: "issuer",
      user,
      profile: { organization_name: "X" },
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(HarjootUnavailableError);
    expect(result.expiresAt).toBeNull();
  });

  test("when Harjoot returns auth error, does NOT throw and does NOT persist", async () => {
    client.__setNextError("activateAccess", new HarjootAuthError());
    const user = makeUser();

    const result = await activateMembership({
      client,
      models,
      role: "issuer",
      user,
      profile: { organization_name: "X" },
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBeInstanceOf(HarjootAuthError);
    expect(User.update).not.toHaveBeenCalled();
  });

  test("when activateAccess succeeds but response has no expires_at, skips persistence and still returns ok", async () => {
    client.__setNextResponse("activateAccess", { success: true, membership: { active: true } });
    const user = makeUser();

    const result = await activateMembership({
      client,
      models,
      role: "student",
      user,
      profile: {},
    });

    expect(result.ok).toBe(true);
    expect(result.expiresAt).toBeNull();
    expect(User.update).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Invariants
  // ---------------------------------------------------------------------------

  test("throws TypeError when required deps are missing (caller bug, NOT upstream)", async () => {
    await expect(
      activateMembership({ client, role: "student", user: makeUser(), profile: {} }),
    ).rejects.toThrow(TypeError);

    await expect(
      activateMembership({ models, role: "student", user: makeUser(), profile: {} }),
    ).rejects.toThrow(TypeError);
  });
});
