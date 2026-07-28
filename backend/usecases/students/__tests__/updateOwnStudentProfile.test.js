const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { updateOwnStudentProfile } = require("../updateOwnStudentProfile");

jest.setTimeout(15000);

const STUDENT = "0x" + "aa".repeat(20);

describe("updateOwnStudentProfile", () => {
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
  });

  afterAll(() => sequelize.close());

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await models.User.create({
      wallet_address: STUDENT,
      role: "student",
      name: "Ana",
      email: "ana@example.com",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    await models.Student.create({ wallet_address: STUDENT, field_of_study: "Ciberseguridad" });
  });

  test("throws TypeError when models or wallet is missing", async () => {
    await expect(updateOwnStudentProfile({ wallet: STUDENT })).rejects.toThrow(TypeError);
  });

  test("returns INVALID_BIO when bio is not a string", async () => {
    const result = await updateOwnStudentProfile({ models, wallet: STUDENT, bio: 42 });
    expect(result.code).toBe("INVALID_BIO");
    expect(result.httpStatus).toBe(400);
  });

  test("returns BIO_TOO_LONG past 500 characters", async () => {
    const result = await updateOwnStudentProfile({ models, wallet: STUDENT, bio: "x".repeat(501) });
    expect(result.code).toBe("BIO_TOO_LONG");
  });

  test("returns INVALID_KNOWLEDGE_AREAS when not an array", async () => {
    const result = await updateOwnStudentProfile({ models, wallet: STUDENT, knowledgeAreas: "Rust" });
    expect(result.code).toBe("INVALID_KNOWLEDGE_AREAS");
  });

  test("returns TOO_MANY_KNOWLEDGE_AREAS past 5 entries", async () => {
    const result = await updateOwnStudentProfile({
      models,
      wallet: STUDENT,
      knowledgeAreas: ["a", "b", "c", "d", "e", "f"],
    });
    expect(result.code).toBe("TOO_MANY_KNOWLEDGE_AREAS");
  });

  test("returns INVALID_KNOWLEDGE_AREA for a non-string or overlong entry", async () => {
    const result = await updateOwnStudentProfile({ models, wallet: STUDENT, knowledgeAreas: ["ok", "x".repeat(101)] });
    expect(result.code).toBe("INVALID_KNOWLEDGE_AREA");
  });

  test("returns INVALID_FIELD_OF_STUDY past 255 characters", async () => {
    const result = await updateOwnStudentProfile({ models, wallet: STUDENT, fieldOfStudy: "x".repeat(256) });
    expect(result.code).toBe("INVALID_FIELD_OF_STUDY");
  });

  test("rejects a non-https social link", async () => {
    const result = await updateOwnStudentProfile({ models, wallet: STUDENT, githubUrl: "http://github.com/ana" });
    expect(result.code).toBe("INVALID_GITHUB_URL");
    expect(result.message).toBe("github_url must be a valid https:// URL");
  });

  test("reports the right code per social field", async () => {
    const linkedin = await updateOwnStudentProfile({ models, wallet: STUDENT, linkedinUrl: "not-a-url" });
    expect(linkedin.code).toBe("INVALID_LINKEDIN_URL");
    const twitter = await updateOwnStudentProfile({ models, wallet: STUDENT, twitterUrl: "not-a-url" });
    expect(twitter.code).toBe("INVALID_TWITTER_URL");
    const instagram = await updateOwnStudentProfile({ models, wallet: STUDENT, instagramUrl: "not-a-url" });
    expect(instagram.code).toBe("INVALID_INSTAGRAM_URL");
  });

  test("returns STUDENT_NOT_FOUND for an unknown wallet", async () => {
    const result = await updateOwnStudentProfile({ models, wallet: "0x" + "ff".repeat(20), bio: "hi" });
    expect(result.code).toBe("STUDENT_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  test("updates every writable field and trims strings", async () => {
    const result = await updateOwnStudentProfile({
      models,
      wallet: STUDENT,
      bio: "  Talento en formacion  ",
      knowledgeAreas: ["Rust", "Penetration Testing"],
      fieldOfStudy: "  Ingenieria  ",
      githubUrl: "https://github.com/ana",
      linkedinUrl: "https://linkedin.com/in/ana",
      twitterUrl: "https://x.com/ana",
      instagramUrl: "https://instagram.com/ana",
    });

    expect(result.ok).toBe(true);
    expect(result.data).toEqual({
      message: "Profile updated",
      student: {
        wallet_address: STUDENT,
        field_of_study: "Ingenieria",
        photo_url: null,
        bio: "Talento en formacion",
        knowledge_areas: ["Rust", "Penetration Testing"],
        github_url: "https://github.com/ana",
        linkedin_url: "https://linkedin.com/in/ana",
        twitter_url: "https://x.com/ana",
        instagram_url: "https://instagram.com/ana",
      },
    });
  });

  test("leaves untouched fields alone on a partial update", async () => {
    await updateOwnStudentProfile({ models, wallet: STUDENT, bio: "primera" });
    await updateOwnStudentProfile({ models, wallet: STUDENT, githubUrl: "https://github.com/ana" });

    const student = await models.Student.findOne({ where: { wallet_address: STUDENT } });
    expect(student.bio).toBe("primera");
    expect(student.field_of_study).toBe("Ciberseguridad");
  });

  test("accepts null to clear a social link and the bio", async () => {
    await updateOwnStudentProfile({ models, wallet: STUDENT, githubUrl: "https://github.com/ana", bio: "algo" });
    const result = await updateOwnStudentProfile({ models, wallet: STUDENT, githubUrl: null, bio: null });

    expect(result.ok).toBe(true);
    expect(result.data.student.github_url).toBeNull();
    expect(result.data.student.bio).toBeNull();
  });

  test("never writes to the User table", async () => {
    await updateOwnStudentProfile({ models, wallet: STUDENT, bio: "hola", name: "Hacker", email: "evil@example.com" });

    const user = await models.User.findOne({ where: { wallet_address: STUDENT } });
    expect(user.name).toBe("Ana");
    expect(user.email).toBe("ana@example.com");
  });
});
