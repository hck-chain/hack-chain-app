const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { authenticateWithPrivy } = require("../authenticateWithPrivy");
const { completeRegistration } = require("../completeRegistration");

jest.setTimeout(15000);

const DID = "did:privy:abc123";
const EMBEDDED = "0x" + "ab".repeat(20);
const EXISTING_WALLET = "0x" + "cd".repeat(20);

function makePrivyService(overrides = {}) {
  return {
    verifyAccessToken: jest.fn().mockResolvedValue({ did: DID }),
    verifyIdentityToken: jest.fn().mockResolvedValue({
      did: DID,
      email: "talento@hackchain.test",
      embeddedWallet: EMBEDDED,
    }),
    ...overrides,
  };
}

describe("Privy auth usecases", () => {
  let sequelize, models, signRegistrationToken, authorizeIssuer;

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
    signRegistrationToken = jest.fn().mockReturnValue("reg-token");
    authorizeIssuer = jest.fn().mockResolvedValue(undefined);
  });

  afterAll(async () => {
    await sequelize.close();
  });

  async function seedUser(attrs = {}) {
    return models.User.create({
      wallet_address: EXISTING_WALLET,
      role: "student",
      email: "existente@hackchain.test",
      nonce: crypto.randomBytes(16).toString("hex"),
      is_active: true,
      ...attrs,
    });
  }

  describe("authenticateWithPrivy", () => {
    it("throws a TypeError when dependencies are missing", async () => {
      await expect(authenticateWithPrivy({ accessToken: "t" })).rejects.toThrow(TypeError);
    });

    it("returns 400 when no access token is supplied", async () => {
      const result = await authenticateWithPrivy({
        models,
        privyService: makePrivyService(),
        signRegistrationToken,
        accessToken: undefined,
      });
      expect(result.ok).toBe(false);
      expect(result.code).toBe("ACCESS_TOKEN_REQUIRED");
      expect(result.httpStatus).toBe(400);
    });

    it("returns 401 when Privy rejects the token", async () => {
      const result = await authenticateWithPrivy({
        models,
        privyService: makePrivyService({ verifyAccessToken: jest.fn().mockResolvedValue(null) }),
        signRegistrationToken,
        accessToken: "bad",
      });
      expect(result.ok).toBe(false);
      expect(result.httpStatus).toBe(401);
    });

    it("asks for registration when the DID has no profile yet", async () => {
      const result = await authenticateWithPrivy({
        models,
        privyService: makePrivyService(),
        signRegistrationToken,
        accessToken: "good",
      });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe("registration_required");
      expect(result.data.registration_token).toBe("reg-token");
      expect(signRegistrationToken).toHaveBeenCalledWith(DID);
    });

    it("authenticates an existing user by privy_did", async () => {
      await seedUser({ privy_did: DID });
      const result = await authenticateWithPrivy({
        models,
        privyService: makePrivyService(),
        signRegistrationToken,
        accessToken: "good",
      });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe("authenticated");
      expect(result.data.user.wallet_address).toBe(EXISTING_WALLET);
    });

    it("refuses a disabled account", async () => {
      await seedUser({ privy_did: DID, is_active: false });
      const result = await authenticateWithPrivy({
        models,
        privyService: makePrivyService(),
        signRegistrationToken,
        accessToken: "good",
      });
      expect(result.ok).toBe(false);
      expect(result.httpStatus).toBe(403);
    });
  });

  describe("completeRegistration", () => {
    function run(overrides = {}) {
      return completeRegistration({
        models,
        privyService: makePrivyService(),
        authorizeIssuer,
        did: DID,
        identityToken: "id-token",
        role: "student",
        fields: { name: "Ana", lastname: "Pérez" },
        ...overrides,
      });
    }

    it("rejects an unknown role", async () => {
      const result = await run({ role: "admin" });
      expect(result.code).toBe("INVALID_ROLE");
      expect(result.httpStatus).toBe(400);
    });

    it("rejects missing role fields", async () => {
      const result = await run({ fields: { name: "Ana" } });
      expect(result.code).toBe("MISSING_ROLE_FIELDS");
      expect(result.message).toContain("lastname");
    });

    it("rejects an identity token belonging to a different DID", async () => {
      const result = await run({
        privyService: makePrivyService({
          verifyIdentityToken: jest.fn().mockResolvedValue({
            did: "did:privy:someone-else",
            email: "otro@hackchain.test",
            embeddedWallet: EMBEDDED,
          }),
        }),
      });
      expect(result.code).toBe("TOKEN_MISMATCH");
      expect(result.httpStatus).toBe(401);
    });

    it("returns 503 while the embedded wallet is not provisioned", async () => {
      const result = await run({
        privyService: makePrivyService({
          verifyIdentityToken: jest.fn().mockResolvedValue({
            did: DID,
            email: "talento@hackchain.test",
            embeddedWallet: null,
          }),
        }),
      });
      expect(result.code).toBe("WALLET_NOT_READY");
      expect(result.httpStatus).toBe(503);
    });

    it("creates the user and the student profile", async () => {
      const result = await run();
      expect(result.ok).toBe(true);
      expect(result.data.alreadyRegistered).toBe(false);

      const user = await models.User.findOne({ where: { privy_did: DID } });
      expect(user.wallet_address).toBe(EMBEDDED);
      // The embedded wallet is both the identity key and the certificate wallet for new users.
      expect(user.integrated_wallet_address).toBe(EMBEDDED);
      expect(user.own_wallet_address).toBeNull();
      expect(user.email_verified).toBe(true);
      expect(user.nonce).toHaveLength(32);

      const student = await models.Student.findOne({ where: { wallet_address: EMBEDDED } });
      expect(student).not.toBeNull();
    });

    it("authorizes an issuer on-chain and marks it pending approval", async () => {
      const result = await run({
        role: "issuer",
        fields: { organization_name: "Academia Cripto" },
      });
      expect(result.ok).toBe(true);
      expect(authorizeIssuer).toHaveBeenCalledWith(EMBEDDED);

      const user = await models.User.findOne({ where: { privy_did: DID } });
      expect(user.educator_approval_status).toBe("pending_approval");
    });

    it("rolls back the whole registration when the on-chain call fails", async () => {
      authorizeIssuer.mockRejectedValue(new Error("rpc down"));
      const result = await run({
        role: "issuer",
        fields: { organization_name: "Academia Cripto" },
      });

      expect(result.ok).toBe(false);
      expect(result.httpStatus).toBe(500);
      expect(await models.User.count()).toBe(0);
      expect(await models.Issuer.count()).toBe(0);
    });

    it("is idempotent: a retry returns the existing row instead of failing", async () => {
      await run();
      const second = await run();
      expect(second.ok).toBe(true);
      expect(second.data.alreadyRegistered).toBe(true);
      expect(await models.User.count()).toBe(1);
    });

    it("reports which method to use when the email already has an account", async () => {
      await seedUser({ email: "talento@hackchain.test" });
      const result = await run();
      expect(result.code).toBe("ACCOUNT_EXISTS");
      expect(result.httpStatus).toBe(409);
      expect(result.data.login_method).toBe("wallet");
    });
  });
});
