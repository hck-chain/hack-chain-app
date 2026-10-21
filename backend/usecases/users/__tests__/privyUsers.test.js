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
    const privyService = { verifyIdentityToken: jest.fn() };

    function identity(overrides = {}) {
      privyService.verifyIdentityToken.mockResolvedValue({
        did: DID,
        email: "migrado@hackchain.test",
        embeddedWallet: EMBEDDED,
        ...overrides,
      });
    }

    function bind(overrides = {}) {
      return bindPrivyIdentity({
        models: { User: models.User, sequelize },
        privyService,
        wallet: SESSION_WALLET,
        identityToken: "id-token",
        ...overrides,
      });
    }

    beforeEach(() => identity());
    afterEach(() => jest.restoreAllMocks());

    it("throws a TypeError when the transaction handle is missing", async () => {
      await seed();
      await expect(bind({ models: { User: models.User } })).rejects.toThrow(TypeError);
    });

    it("requires an identity token", async () => {
      await seed();
      const result = await bind({ identityToken: undefined });
      expect(result.code).toBe("IDENTITY_TOKEN_REQUIRED");
    });

    it("rejects an invalid Privy token", async () => {
      await seed();
      privyService.verifyIdentityToken.mockResolvedValue(null);
      const result = await bind();
      expect(result.code).toBe("INVALID_PRIVY_TOKEN");
      expect(result.httpStatus).toBe(401);
    });

    it("binds the DID without moving wallet_address", async () => {
      const user = await seed();
      const result = await bind();
      expect(result.ok).toBe(true);
      expect(result.data.alreadyBound).toBe(false);

      await user.reload();
      expect(user.privy_did).toBe(DID);
      expect(user.integrated_wallet_address).toBe(EMBEDDED);
      // The existing certificates live at this address on-chain, so it must not change.
      expect(user.wallet_address).toBe(SESSION_WALLET);
    });

    describe("retries complete what a previous call left pending", () => {
      it("saves the identity at once and completes the embedded wallet on a later retry", async () => {
        const user = await seed();

        identity({ embeddedWallet: null });
        const first = await bind();
        expect(first.ok).toBe(true);
        expect(first.data.integrated_wallet_address).toBeNull();
        await user.reload();
        expect(user.privy_did).toBe(DID);
        expect(user.integrated_wallet_address).toBeNull();

        identity({ embeddedWallet: EMBEDDED });
        const retry = await bind();
        expect(retry.ok).toBe(true);
        expect(retry.data.alreadyBound).toBe(true);
        expect(retry.data.integrated_wallet_address).toBe(EMBEDDED);
        await user.reload();
        expect(user.integrated_wallet_address).toBe(EMBEDDED);
      });

      it("keeps waiting while the wallet still has not arrived", async () => {
        await seed({ privy_did: DID });
        identity({ embeddedWallet: null });
        const result = await bind();
        expect(result.ok).toBe(true);
        expect(result.data.integrated_wallet_address).toBeNull();
      });

      it("refuses to complete the wallet when another account already has it", async () => {
        const user = await seed({ privy_did: DID });
        await seed({ wallet_address: OTHER_WALLET, integrated_wallet_address: EMBEDDED });

        const result = await bind();
        expect(result.code).toBe("EMBEDDED_WALLET_ALREADY_LINKED");
        expect(result.httpStatus).toBe(409);
        await user.reload();
        expect(user.integrated_wallet_address).toBeNull();
      });

      it("completes an email that is still empty", async () => {
        const user = await seed({ privy_did: DID, integrated_wallet_address: EMBEDDED, email: null });
        const result = await bind();
        expect(result.ok).toBe(true);
        expect(result.data.alreadyBound).toBe(true);
        await user.reload();
        expect(user.email).toBe("migrado@hackchain.test");
      });

      it("is harmless when nothing is pending", async () => {
        const user = await seed({ privy_did: DID, integrated_wallet_address: EMBEDDED });
        const before = user.email;

        const update = jest.spyOn(models.User.prototype, "update");
        const result = await bind();

        expect(result.ok).toBe(true);
        expect(result.data.alreadyBound).toBe(true);
        expect(update).not.toHaveBeenCalled();
        await user.reload();
        expect(user.email).toBe(before);
      });
    });

    describe("email", () => {
      it("fills an empty email and marks it verified", async () => {
        const user = await seed({ email: null });
        const result = await bind();
        expect(result.ok).toBe(true);
        expect(result.data.email).toBe("migrado@hackchain.test");

        await user.reload();
        expect(user.email).toBe("migrado@hackchain.test");
        expect(user.email_verified).toBe(true);
      });

      it("keeps an email the profile already has", async () => {
        const user = await seed({ email: "propio@hackchain.test", email_verified: false });
        const result = await bind();
        expect(result.ok).toBe(true);
        expect(result.data.email).toBe("propio@hackchain.test");

        await user.reload();
        expect(user.email).toBe("propio@hackchain.test");
        expect(user.email_verified).toBe(false);
      });

      it("rejects when neither the profile nor Privy have an email, writing nothing", async () => {
        const user = await seed({ email: null });
        identity({ email: null });
        const result = await bind();
        expect(result.code).toBe("EMAIL_REQUIRED");
        expect(result.httpStatus).toBe(400);

        await user.reload();
        expect(user.privy_did).toBeNull();
      });

      it("still links when Privy has no email but the profile already has one", async () => {
        await seed();
        identity({ email: null });
        const result = await bind();
        expect(result.ok).toBe(true);
      });

      describe("when another account already holds it", () => {
        it("takes it from an unverified account without a Privy identity", async () => {
          const user = await seed({ email: null });
          const holder = await seed({
            wallet_address: OTHER_WALLET,
            email: "migrado@hackchain.test",
            email_verified: false,
            verification_token: "stale",
            verification_token_expires_at: new Date(Date.now() + 60000),
          });
          jest.spyOn(console, "warn").mockImplementation(() => {});

          const result = await bind();
          expect(result.ok).toBe(true);

          await user.reload();
          await holder.reload();
          expect(user.email).toBe("migrado@hackchain.test");
          expect(user.email_verified).toBe(true);
          expect(holder.email).toBeNull();
          expect(holder.verification_token).toBeNull();
          expect(holder.verification_token_expires_at).toBeNull();
          expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("taken from unverified"));
        });

        it("matches the email ignoring case and surrounding spaces", async () => {
          const user = await seed({ email: null });
          const holder = await seed({ wallet_address: OTHER_WALLET, email: "migrado@hackchain.test", email_verified: false });
          jest.spyOn(console, "warn").mockImplementation(() => {});
          identity({ email: "  Migrado@HackChain.TEST " });

          expect((await bind()).ok).toBe(true);
          await holder.reload();
          await user.reload();
          expect(holder.email).toBeNull();
          expect(user.email).toBe("migrado@hackchain.test");
        });

        it("does not take it from a verified account", async () => {
          const user = await seed({ email: null });
          const holder = await seed({ wallet_address: OTHER_WALLET, email: "migrado@hackchain.test", email_verified: true });

          const result = await bind();
          expect(result.code).toBe("EMAIL_ALREADY_IN_USE");
          expect(result.httpStatus).toBe(409);

          await user.reload();
          await holder.reload();
          expect(holder.email).toBe("migrado@hackchain.test");
          expect(user.email).toBeNull();
          expect(user.privy_did).toBeNull();
        });

        it("does not take it from an account that already has a Privy identity", async () => {
          await seed({ email: null });
          const holder = await seed({
            wallet_address: OTHER_WALLET,
            email: "migrado@hackchain.test",
            email_verified: false,
            privy_did: "did:privy:other",
          });

          const result = await bind();
          expect(result.code).toBe("EMAIL_ALREADY_IN_USE");
          await holder.reload();
          expect(holder.email).toBe("migrado@hackchain.test");
        });

        it("takes nothing if the other account got verified between the check and the write", async () => {
          const user = await seed({ email: null });
          const holder = await seed({ wallet_address: OTHER_WALLET, email: "migrado@hackchain.test", email_verified: false });
          // The conditional update matches no row, as if the account had been verified meanwhile.
          jest.spyOn(models.User, "update").mockResolvedValue([0]);

          const result = await bind();
          expect(result.code).toBe("EMAIL_ALREADY_IN_USE");
          expect(result.httpStatus).toBe(409);

          jest.restoreAllMocks();
          await holder.reload();
          await user.reload();
          expect(holder.email).toBe("migrado@hackchain.test");
          expect(user.email).toBeNull();
          expect(user.privy_did).toBeNull();
        });

        it("never leaves the other account without its email if the write fails halfway", async () => {
          const user = await seed({ email: null });
          const holder = await seed({ wallet_address: OTHER_WALLET, email: "migrado@hackchain.test", email_verified: false });

          const original = models.User.prototype.update;
          let calls = 0;
          const spy = jest.spyOn(models.User.prototype, "update").mockImplementation(function (...args) {
            calls += 1;
            if (calls === 1) throw new Error("boom");
            return original.apply(this, args);
          });

          await expect(bind()).rejects.toThrow("boom");
          spy.mockRestore();

          await holder.reload();
          await user.reload();
          expect(holder.email).toBe("migrado@hackchain.test");
          expect(user.email).toBeNull();
        });
      });
    });

    it("answers 409 instead of failing when a unique index is hit by a concurrent write", async () => {
      await seed();
      jest.spyOn(models.User.prototype, "update").mockImplementation(() => {
        throw Object.assign(new Error("duplicate"), { name: "SequelizeUniqueConstraintError" });
      });

      const result = await bind();
      expect(result.code).toBe("IDENTITY_CONFLICT");
      expect(result.httpStatus).toBe(409);
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
