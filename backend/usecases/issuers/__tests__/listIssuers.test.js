const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { listIssuers } = require("../listIssuers");

jest.setTimeout(15000);

describe("listIssuers", () => {
  let sequelize, models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const { DataTypes } = SequelizePkg;
    const User = require("../../../models/users")(sequelize, DataTypes);
    const Student = require("../../../models/students")(sequelize, DataTypes);
    const Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    const Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Student, Issuer, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");

    const approved = async (wallet, name, org, areas, certs) => {
      await User.create({ wallet_address: wallet, role: "issuer", name, nonce: nonce(), educator_approval_status: "approved" });
      await Issuer.create({ wallet_address: wallet, organization_name: org, knowledge_areas: areas, certificates_issued: certs });
    };

    await approved("0x" + "11".repeat(20), "Ana", "PentestAcademy", ["pentest"], 10);
    await approved("0x" + "22".repeat(20), "Bob", "WebSecOrg", ["web security"], 5);

    // Pending educator — must never appear in public discovery.
    await User.create({ wallet_address: "0x" + "33".repeat(20), role: "issuer", name: "Carl", nonce: nonce(), educator_approval_status: "pending_approval" });
    await Issuer.create({ wallet_address: "0x" + "33".repeat(20), organization_name: "NotYetApproved" });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models is missing", async () => {
    await expect(listIssuers({})).rejects.toThrow(TypeError);
  });

  test("only lists approved educators, ordered by certificates_issued desc", async () => {
    const result = await listIssuers({ models });
    expect(result.ok).toBe(true);
    expect(result.data.educators.map((e) => e.organization_name)).toEqual(["PentestAcademy", "WebSecOrg"]);
    expect(result.data.pagination).toEqual({ total: 2, page: 1, limit: 20, pages: 1 });
  });

  test("filters by area across knowledge_areas and organization_name", async () => {
    const result = await listIssuers({ models, area: "web security" });
    expect(result.data.educators).toHaveLength(1);
    expect(result.data.educators[0].organization_name).toBe("WebSecOrg");
  });

  test("clamps limit to 50 and page to a minimum of 1", async () => {
    const result = await listIssuers({ models, page: -5, limit: 9999 });
    expect(result.data.pagination.page).toBe(1);
    expect(result.data.pagination.limit).toBe(50);
  });
});
