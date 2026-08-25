const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../createVacancy");
const { closeVacancy } = require("../closeVacancy");
const { getVacancyBySlug } = require("../getVacancyBySlug");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);

describe("getVacancyBySlug", () => {
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
    Student.rawAttributes.wallet_address.unique = true;
    const Recruiter = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession = require("../../../models/userSessions")(sequelize, DataTypes);
    const Vacancy = require("../../../models/vacancies")(sequelize, DataTypes);
    const VacancyApplication = require("../../../models/vacancyApplications")(sequelize, DataTypes);

    models = { User, Issuer, Student, Recruiter, Certificate, UserSession, Vacancy, VacancyApplication, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
  });

  afterAll(() => sequelize.close());

  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await models.User.create({ wallet_address: RECRUITER, role: "recruiter", name: "Rita", nonce: crypto.randomBytes(16).toString("hex") });
    await models.Recruiter.create({ wallet_address: RECRUITER, company_name: "Acme Corp" });
  });

  async function makeVacancy() {
    const created = await createVacancy({
      models,
      recruiterWallet: RECRUITER,
      position: "Ingeniero de Software",
      company: "Acme Corp",
      area: "backend",
      modality: "remoto",
      salaryMin: 1000,
      salaryMax: 2000,
      salaryCurrency: "USD",
      salaryPeriod: "mes",
      description: "x".repeat(60),
      requirements: ["Node.js"],
    });
    return created.data.vacancy;
  }

  test("returns the vacancy by slug", async () => {
    const vacancy = await makeVacancy();
    const result = await getVacancyBySlug({ models, slug: vacancy.slug });
    expect(result.ok).toBe(true);
    expect(result.data.vacancy.slug).toBe(vacancy.slug);
  });

  test("returns VACANCY_NOT_FOUND for an unknown slug", async () => {
    const result = await getVacancyBySlug({ models, slug: "no-existe" });
    expect(result.code).toBe("VACANCY_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  // RF-13 — vacante cerrada se ve en modo lectura, no desaparece.
  test("still returns a closed vacancy (read-only mode)", async () => {
    const vacancy = await makeVacancy();
    await closeVacancy({ models, vacancyId: vacancy.id, recruiterWallet: RECRUITER });

    const result = await getVacancyBySlug({ models, slug: vacancy.slug });
    expect(result.ok).toBe(true);
    expect(result.data.vacancy.status).toBe("cerrada");
  });

  // RF-14 — texto exacto del aviso.
  test("includes the exact unverified-company notice text", async () => {
    const vacancy = await makeVacancy();
    const result = await getVacancyBySlug({ models, slug: vacancy.slug });
    expect(result.data.unverified_company_notice).toBe(
      "HackChain no comprueba la identidad de las empresas. Nunca envíes dinero ni datos bancarios para postularte."
    );
  });

  // RF-10, RF-27, RN-06 — never the applicant count on the public detail.
  test("never includes the applicant count", async () => {
    const vacancy = await makeVacancy();
    const result = await getVacancyBySlug({ models, slug: vacancy.slug });
    expect(JSON.stringify(result.data)).not.toMatch(/applications_count|unreviewed_count/);
  });
});
