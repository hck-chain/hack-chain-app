const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { linkOwnWallet } = require("../linkOwnWallet");
const { unlinkOwnWallet } = require("../unlinkOwnWallet");
const { bindPrivyIdentity } = require("../bindPrivyIdentity");

jest.setTimeout(15000);

const SESSION_WALLET = "0x" + "11".repeat(20);
const OWN_WALLET = "0x" + "22".repeat(20);
const OTHER_WALLET = "0x" + "33".repeat(20);
const EMBEDDED = "0x" + "44".repeat(20);
const DID = "did:privy:abc123";

const signedMessage = (nonce = "n1") => `Link wallet\nTimestamp: ${new Date().toISOString()}\nNonce: ${nonce}`;

// Stands in for services/issuerService.validateDeletionMessage.
const acceptSignature = jest.fn().mockReturnValue({ ok: true });

function makeRedis() {
  const seen = new Set();
  return {
    getRedis: () => ({
      set: async (key) => {
        if (seen.has(key)) return null; // NX semantics: already present
        seen.add(key);
        return "OK";
      },
    }),
  };
}

describe("Privy user usecases", () => {
  let sequelize, models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;
    const User = require("../../../models/users")(sequelize, DataTypes);
    const Student = require("../../../models/students")(sequelize, DataTypes);
    Student.rawAttributes.wallet_address.unique = true;
    const Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    const Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    const UserSession = require("../../../models/userSessions")(sequelize, DataTypes);
    const Certificate = require("../../../models/certificates")(sequelize, DataTypes);

    models = {
      User, Student, Issuer, Recruiter, UserSession, Certificate,
      sequelize, Sequelize: SequelizePkg,
    };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
  });

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    acceptSignature.mockClear();
    acceptSignature.mockReturnValue({ ok: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  function seed(attrs = {}) {
    return models.User.create({
      wallet_address: SESSION_WALLET,
      role: "student",
      email: `u${Math.random()}@hackchain.test`,
      nonce: crypto.randomBytes(16).toString("hex"),
      is_active: true,
      ...attrs,
    });
  }

  function link(overrides = {}) {
    return linkOwnWallet({
      models: { User: models.User, sequelize },
      validateSignedMessage: acceptSignature,
      redis: makeRedis(),
      wallet: SESSION_WALLET,
      ownWalletAddress: OWN_WALLET,
      message: signedMessage(),
      signature: "0xsig",
      ...overrides,
    });
  }

  describe("linkOwnWallet", () => {
    it("throws a TypeError when dependencies are missing", async () => {
      await expect(linkOwnWallet({ wallet: SESSION_WALLET })).rejects.toThrow(TypeError);
    });

    it("rejects a malformed address", async () => {
      await seed();
      const result = await link({ ownWalletAddress: "0x123" });
      expect(result.code).toBe("INVALID_WALLET_ADDRESS");
      expect(result.httpStatus).toBe(400);
    });

    it("requires message and signature", async () => {
      await seed();
      const result = await link({ signature: undefined });
      expect(result.code).toBe("MISSING_SIGNATURE");
    });

    it("rejects an invalid or expired signature", async () => {
      await seed();
      acceptSignature.mockReturnValue({ ok: false, error: "Signature expired or invalid timestamp" });
      const result = await link();
      expect(result.code).toBe("INVALID_SIGNATURE");
      expect(result.httpStatus).toBe(401);
    });

    it("requires a nonce inside the signed message", async () => {
      await seed();
      const result = await link({ message: `Link wallet\nTimestamp: ${new Date().toISOString()}` });
      expect(result.code).toBe("MISSING_NONCE");
    });

    it("verifies the signature against the wallet being linked, not the session wallet", async () => {
      await seed();
      await link();
      expect(acceptSignature).toHaveBeenCalledWith(expect.any(String), "0xsig", OWN_WALLET);
    });

    it("links the wallet", async () => {
      const user = await seed();
      const result = await link();
      expect(result.ok).toBe(true);
      expect(result.data.own_wallet_address).toBe(OWN_WALLET);
      await user.reload();
      expect(user.own_wallet_address).toBe(OWN_WALLET);
    });

    it("refuses a wallet already used as another user's own wallet", async () => {
      await seed();
      await seed({ wallet_address: OTHER_WALLET, own_wallet_address: OWN_WALLET });
      const result = await link();
      expect(result.code).toBe("WALLET_ALREADY_LINKED");
      expect(result.httpStatus).toBe(409);
    });

    it("refuses a wallet that already identifies another account", async () => {
      await seed();
      await seed({ wallet_address: OWN_WALLET });
      const result = await link();
      expect(result.code).toBe("WALLET_ALREADY_LINKED");
    });

    it("lets a pre-Privy user declare their own identity wallet", async () => {
      const user = await seed();
      const result = await link({ ownWalletAddress: SESSION_WALLET });
      expect(result.ok).toBe(true);
      await user.reload();
      expect(user.own_wallet_address).toBe(SESSION_WALLET);
    });

    it("blocks a replayed signature reusing the same nonce", async () => {
      await seed();
      const redis = makeRedis();
      const message = signedMessage("same-nonce");
      const first = await link({ redis, message });
      expect(first.ok).toBe(true);

      const second = await link({ redis, message });
      expect(second.code).toBe("NONCE_ALREADY_USED");
      expect(second.httpStatus).toBe(409);
    });
  });

  describe("unlinkOwnWallet", () => {
    it("clears the wallet", async () => {
      const user = await seed({ own_wallet_address: OWN_WALLET });
      const result = await unlinkOwnWallet({ models: { User: models.User }, wallet: SESSION_WALLET });
      expect(result.ok).toBe(true);
      await user.reload();
      expect(user.own_wallet_address).toBeNull();
    });

    it("returns 409 when there is nothing to unlink", async () => {
      await seed();
      const result = await unlinkOwnWallet({ models: { User: models.User }, wallet: SESSION_WALLET });
      expect(result.code).toBe("NO_WALLET_LINKED");
      expect(result.httpStatus).toBe(409);
    });
  });

  describe("bindPrivyIdentity", () => {
    const privyService = {
      verifyIdentityToken: jest.fn().mockResolvedValue({
        did: DID,
        email: "migrado@hackchain.test",
        embeddedWallet: EMBEDDED,
      }),
    };

    function bind(overrides = {}) {
      return bindPrivyIdentity({
        models: { User: models.User },
        privyService,
        wallet: SESSION_WALLET,
        identityToken: "id-token",
        ...overrides,
      });
    }

    it("requires an identity token", async () => {
      await seed();
      const result = await bind({ identityToken: undefined });
      expect(result.code).toBe("IDENTITY_TOKEN_REQUIRED");
    });

    it("binds the DID without moving wallet_address", async () => {
      const user = await seed();
      const result = await bind();
      expect(result.ok).toBe(true);

      await user.reload();
      expect(user.privy_did).toBe(DID);
      expect(user.integrated_wallet_address).toBe(EMBEDDED);
      // The existing certificates live at this address on-chain, so it must not change.
      expect(user.wallet_address).toBe(SESSION_WALLET);
    });

    it("is idempotent when the same identity is bound twice", async () => {
      await seed();
      await bind();
      const second = await bind();
      expect(second.ok).toBe(true);
      expect(second.data.alreadyBound).toBe(true);
    });

    it("refuses to rebind an account to a different identity", async () => {
      await seed({ privy_did: "did:privy:other" });
      const result = await bind();
      expect(result.code).toBe("ALREADY_BOUND");
      expect(result.httpStatus).toBe(409);
    });

    it("refuses a DID already linked to another account", async () => {
      await seed();
      await seed({ wallet_address: OTHER_WALLET, privy_did: DID });
      const result = await bind();
      expect(result.code).toBe("DID_ALREADY_LINKED");
      expect(result.httpStatus).toBe(409);
    });
  });
});
