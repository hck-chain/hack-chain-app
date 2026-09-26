const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { ethers } = require("ethers");
const { linkOwnWallet, buildLinkWalletMessage } = require("../linkOwnWallet");
const { unlinkOwnWallet } = require("../unlinkOwnWallet");
const { bindPrivyIdentity } = require("../bindPrivyIdentity");

jest.setTimeout(20000);

const SESSION_WALLET = "0x" + "11".repeat(20);
const OTHER_WALLET = "0x" + "33".repeat(20);
const EMBEDDED = "0x" + "44".repeat(20);
const DID = "did:privy:abc123";

// Real signatures on purpose: a mocked verifier that accepts anything is exactly what
// hid the missing account binding in the first version of this usecase.
const recoverSigner = (message, signature) => ethers.verifyMessage(message, signature);

const randomNonce = () => crypto.randomBytes(12).toString("hex");

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
  let sequelize, models, ownSigner;

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
    ownSigner = ethers.Wallet.createRandom();
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

  async function signed({
    signer = ownSigner,
    ownWallet = ownSigner.address,
    account = SESSION_WALLET,
    timestamp = new Date().toISOString(),
    nonce = randomNonce(),
    message,
  } = {}) {
    const text = message ?? buildLinkWalletMessage({ ownWallet, account, timestamp, nonce });
    return { message: text, signature: await signer.signMessage(text) };
  }

  function link(payload, overrides = {}) {
    return linkOwnWallet({
      models: { User: models.User, sequelize },
      recoverSigner,
      redis: makeRedis(),
      wallet: SESSION_WALLET,
      ownWalletAddress: ownSigner.address,
      ...payload,
      ...overrides,
    });
  }

  describe("linkOwnWallet", () => {
    it("throws a TypeError when dependencies are missing", async () => {
      await expect(linkOwnWallet({ wallet: SESSION_WALLET })).rejects.toThrow(TypeError);
    });

    it("links the wallet when the message is bound to this account", async () => {
      const user = await seed();
      const result = await link(await signed());

      expect(result.ok).toBe(true);
      expect(result.data.own_wallet_address).toBe(ownSigner.address.toLowerCase());
      await user.reload();
      expect(user.own_wallet_address).toBe(ownSigner.address.toLowerCase());
    });

    it("accepts checksummed addresses inside the message", async () => {
      await seed();
      const result = await link(await signed({ ownWallet: ethers.getAddress(ownSigner.address) }));
      expect(result.ok).toBe(true);
    });

    // The attack from the security review: the victim signs a link message on a phishing
    // site for the attacker's account; the attacker replays it from their own session.
    it("rejects a signature bound to a different account (phishing replay)", async () => {
      await seed(); // the attacker, holding the SESSION_WALLET session
      const victimAccount = "0x" + "99".repeat(20);

      const result = await link(await signed({ account: victimAccount }));

      expect(result.ok).toBe(false);
      expect(result.code).toBe("MESSAGE_ACCOUNT_MISMATCH");
      expect(result.httpStatus).toBe(401);
      expect(await models.User.count({ where: { own_wallet_address: ownSigner.address.toLowerCase() } })).toBe(0);
    });

    it("rejects the bare Timestamp/Nonce message a phishing site would ask for", async () => {
      await seed();
      const bare = `Timestamp: ${new Date().toISOString()}\nNonce: ${randomNonce()}`;
      const result = await link(await signed({ message: bare }));
      expect(result.code).toBe("INVALID_MESSAGE_FORMAT");
    });

    it("rejects an account-deletion signature reused for linking", async () => {
      await seed();
      const deletion = `Delete my HackChain account\nTimestamp: ${new Date().toISOString()}`;
      const result = await link(await signed({ message: deletion }));
      expect(result.code).toBe("INVALID_MESSAGE_FORMAT");
    });

    it("rejects a message with anything appended to the template", async () => {
      await seed();
      const valid = buildLinkWalletMessage({
        ownWallet: ownSigner.address,
        account: SESSION_WALLET,
        timestamp: new Date().toISOString(),
        nonce: randomNonce(),
      });
      const result = await link(await signed({ message: `${valid}\nExtra: 1` }));
      expect(result.code).toBe("INVALID_MESSAGE_FORMAT");
    });

    it("rejects a message naming a different wallet than the one being linked", async () => {
      await seed();
      const result = await link(await signed({ ownWallet: OTHER_WALLET }));
      expect(result.code).toBe("MESSAGE_WALLET_MISMATCH");
    });

    it("rejects a signature produced by a key other than the linked wallet", async () => {
      await seed();
      const impostor = ethers.Wallet.createRandom();
      const result = await link(await signed({ signer: impostor }));
      expect(result.code).toBe("INVALID_SIGNATURE");
      expect(result.httpStatus).toBe(401);
    });

    it("rejects a signature older than 5 minutes", async () => {
      await seed();
      const stale = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const result = await link(await signed({ timestamp: stale }));
      expect(result.code).toBe("SIGNATURE_EXPIRED");
    });

    it("rejects a post-dated message beyond the clock-skew allowance", async () => {
      await seed();
      const future = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const result = await link(await signed({ timestamp: future }));
      expect(result.code).toBe("SIGNATURE_EXPIRED");
    });

    it("tolerates a client clock slightly ahead of the server", async () => {
      await seed();
      const ahead = new Date(Date.now() + 30 * 1000).toISOString();
      const result = await link(await signed({ timestamp: ahead }));
      expect(result.ok).toBe(true);
    });

    it("rejects a malformed address", async () => {
      await seed();
      const result = await link(await signed(), { ownWalletAddress: "0x123" });
      expect(result.code).toBe("INVALID_WALLET_ADDRESS");
      expect(result.httpStatus).toBe(400);
    });

    it("requires message and signature", async () => {
      await seed();
      const payload = await signed();
      const result = await link({ ...payload, signature: undefined });
      expect(result.code).toBe("MISSING_SIGNATURE");
    });

    it("blocks a replayed signature", async () => {
      await seed();
      const redis = makeRedis();
      const payload = await signed();

      const first = await link(payload, { redis });
      expect(first.ok).toBe(true);

      const second = await link(payload, { redis });
      expect(second.code).toBe("NONCE_ALREADY_USED");
      expect(second.httpStatus).toBe(409);
    });

    it("refuses a wallet already used as another user's own wallet", async () => {
      await seed();
      await seed({ wallet_address: OTHER_WALLET, own_wallet_address: ownSigner.address.toLowerCase() });
      const result = await link(await signed());
      expect(result.code).toBe("WALLET_ALREADY_LINKED");
      expect(result.httpStatus).toBe(409);
    });

    it("refuses a wallet that already identifies another account", async () => {
      await seed();
      await seed({ wallet_address: ownSigner.address.toLowerCase() });
      const result = await link(await signed());
      expect(result.code).toBe("WALLET_ALREADY_LINKED");
    });

    it("lets a pre-Privy user declare their own identity wallet", async () => {
      const legacy = ethers.Wallet.createRandom();
      const legacyWallet = legacy.address.toLowerCase();
      const user = await seed({ wallet_address: legacyWallet });

      const payload = await signed({ signer: legacy, ownWallet: legacy.address, account: legacyWallet });
      const result = await link(payload, { wallet: legacyWallet, ownWalletAddress: legacy.address });

      expect(result.ok).toBe(true);
      await user.reload();
      expect(user.own_wallet_address).toBe(legacyWallet);
    });
  });

  describe("unlinkOwnWallet", () => {
    it("clears the wallet", async () => {
      const user = await seed({ own_wallet_address: OTHER_WALLET });
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

    it("refuses an embedded wallet already linked to another account", async () => {
      await seed();
      await seed({ wallet_address: OTHER_WALLET, integrated_wallet_address: EMBEDDED });
      const result = await bind();
      expect(result.code).toBe("EMBEDDED_WALLET_ALREADY_LINKED");
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
