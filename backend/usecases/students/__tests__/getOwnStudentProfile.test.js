const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { getOwnStudentProfile } = require("../getOwnStudentProfile");

jest.setTimeout(15000);

const STUDENT = "0x" + "aa".repeat(20);

describe("getOwnStudentProfile", () => {
  let sequelize, models;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", {
      logging: false,
      pool: { max: 1, min: 1, idle: Infinity, evict: false },
    });
    await sequelize.query("PRAGMA foreign_keys = OFF");

    const { DataTypes } = SequelizePkg;
    const User = require("../../../models/users")(sequelize, DataTypes);
    const Issuer = require("../../../models/issuers")(sequelize, DataTypes);
    const Student = require("../../../models/students")(sequelize, DataTypes);
    // SQLite requires UNIQUE on any column referenced by a FK; the production
    // Student model doesn't declare it (Postgres is more permissive).
    Student.rawAttributes.wallet_address.unique = true;
    const Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Issuer, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    await models.User.create({
      wallet_address: STUDENT,
      role: "student",
      name: "Ana",
      lastname: "Perez",
      email: "ana@example.com",
      email_verified: true,
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    await models.Student.create({ wallet_address: STUDENT, field_of_study: "Ciberseguridad" });
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when models or wallet is missing", async () => {
    await expect(getOwnStudentProfile({ wallet: STUDENT })).rejects.toThrow(TypeError);
  });

  test("returns STUDENT_NOT_FOUND for an unknown wallet", async () => {
    const result = await getOwnStudentProfile({ models, wallet: "0x" + "ff".repeat(20) });
    expect(result.code).toBe("STUDENT_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  test("returns the full own profile including email", async () => {
    const result = await getOwnStudentProfile({ models, wallet: STUDENT });
    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      wallet_address: STUDENT,
      field_of_study: "Ciberseguridad",
      photo_url: null,
      bio: null,
      knowledge_areas: [],
      github_url: null,
      linkedin_url: null,
      twitter_url: null,
      instagram_url: null,
      share_count: 0,
      name: "Ana",
      lastname: "Perez",
      email: "ana@example.com",
      email_verified: true,
    });
  });

  test("accepts an uppercase wallet and normalizes it", async () => {
    const result = await getOwnStudentProfile({ models, wallet: STUDENT.toUpperCase().replace("0X", "0x") });
    expect(result.ok).toBe(true);
    expect(result.data.wallet_address).toBe(STUDENT);
  });
});
