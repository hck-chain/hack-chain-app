// Exercises the real (non-mock) branch of verifyIdentityToken with the Privy SDK stubbed,
// so what is under test is how linked accounts are turned into email and embedded wallet.

const EMBEDDED = "0x" + "AB".repeat(20);

const ORIGINAL_ENV = { ...process.env };

function loadService(user) {
  process.env.PRIVY_USE_MOCK = "false";
  process.env.PRIVY_APP_ID = "test-app-id";
  process.env.PRIVY_VERIFICATION_KEY = "-----BEGIN PUBLIC KEY-----\\nabc\\n-----END PUBLIC KEY-----";

  let service;
  jest.isolateModules(() => {
    jest.doMock("@privy-io/node", () => ({
      verifyIdentityToken: jest.fn().mockResolvedValue(user),
      verifyAccessToken: jest.fn(),
      isEmbeddedWalletLinkedAccount: (account) =>
        account.type === "wallet" && account.wallet_client_type === "privy",
    }));
    service = require("../privyService");
  });
  return service;
}

const embeddedWallet = {
  type: "wallet",
  wallet_client_type: "privy",
  chain_type: "ethereum",
  address: EMBEDDED,
};

afterEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

describe("privyService.verifyIdentityToken — email by login method", () => {
  it("reads the email of an email login", async () => {
    const service = loadService({
      id: "did:privy:1",
      linked_accounts: [{ type: "email", address: "ana@hackchain.test" }, embeddedWallet],
    });

    const identity = await service.verifyIdentityToken("token");
    expect(identity.email).toBe("ana@hackchain.test");
    expect(identity.did).toBe("did:privy:1");
  });

  it("reads the email of a Google login", async () => {
    const service = loadService({
      id: "did:privy:2",
      linked_accounts: [{ type: "google_oauth", email: "g@hackchain.test", subject: "s" }],
    });

    expect((await service.verifyIdentityToken("token")).email).toBe("g@hackchain.test");
  });

  it("reads the email of an Apple login", async () => {
    const service = loadService({
      id: "did:privy:3",
      linked_accounts: [{ type: "apple_oauth", email: "apple@hackchain.test", subject: "s" }, embeddedWallet],
    });

    const identity = await service.verifyIdentityToken("token");
    expect(identity.email).toBe("apple@hackchain.test");
    expect(identity.embeddedWallet).toBe(EMBEDDED.toLowerCase());
  });

  it("returns a null email when Apple does not share one", async () => {
    const service = loadService({
      id: "did:privy:4",
      linked_accounts: [{ type: "apple_oauth", email: null, subject: "s" }],
    });

    expect((await service.verifyIdentityToken("token")).email).toBeNull();
  });

  const linkedAccounts = [
    { type: "apple_oauth", email: "apple@hackchain.test" },
    { type: "google_oauth", email: "google@hackchain.test" },
    { type: "email", address: "mail@hackchain.test" },
  ];

  it("prefers the email login over Google and Apple when several are linked", async () => {
    const service = loadService({ id: "did:privy:5", linked_accounts: linkedAccounts });
    expect((await service.verifyIdentityToken("token")).email).toBe("mail@hackchain.test");
  });

  it("prefers Google over Apple when there is no email login", async () => {
    const service = loadService({ id: "did:privy:6", linked_accounts: linkedAccounts.slice(0, 2) });
    expect((await service.verifyIdentityToken("token")).email).toBe("google@hackchain.test");
  });

  it("returns a null embedded wallet until Privy provisions it", async () => {
    const service = loadService({
      id: "did:privy:7",
      linked_accounts: [{ type: "email", address: "ana@hackchain.test" }],
    });

    expect((await service.verifyIdentityToken("token")).embeddedWallet).toBeNull();
  });
});
