const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../createVacancy");
const { listOwnVacancies } = require("../listOwnVacancies");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);
const TALENT_1 = "0x" + "c1".repeat(20);
const TALENT_2 = "0x" + "c2".repeat(20);

describe("listOwnVacancies", () => {
  let sequelize, models, vacancyId;

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
    const nonce = () => crypto.randomBytes(16).toString("hex");
    await models.User.create({ wallet_address: RECRUITER, role: "recruiter", name: "Rita", nonce: nonce() });
    await models.Recruiter.create({ wallet_address: RECRUITER, company_name: "Acme Corp" });
    await models.User.create({ wallet_address: TALENT_1, role: "student", name: "T1", nonce: nonce() });
    await models.Student.create({ wallet_address: TALENT_1 });
    await models.User.create({ wallet_address: TALENT_2, role: "student", name: "T2", nonce: nonce() });
    await models.Student.create({ wallet_address: TALENT_2 });

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
    vacancyId = created.data.vacancy.id;
  });

  test("throws TypeError when recruiterWallet is missing", async () => {
    await expect(listOwnVacancies({ models })).rejects.toThrow(TypeError);
  });

  test("returns a vacancy with zero counts when it has no applications", async () => {
    const result = await listOwnVacancies({ models, recruiterWallet: RECRUITER });
    expect(result.data.vacancies).toHaveLength(1);
    expect(result.data.vacancies[0].applications_count).toBe(0);
    expect(result.data.vacancies[0].unreviewed_count).toBe(0);
  });

  // RF-22 — número de postulaciones y cuántas sin revisar.
  test("counts total and unreviewed (enviada) applications", async () => {
    await models.VacancyApplication.create({ vacancy_id: vacancyId, student_wallet_address: TALENT_1, status: "enviada", submitted_at: new Date() });
    await models.VacancyApplication.create({ vacancy_id: vacancyId, student_wallet_address: TALENT_2, status: "vista", submitted_at: new Date() });

    const result = await listOwnVacancies({ models, recruiterWallet: RECRUITER });
    expect(result.data.vacancies[0].applications_count).toBe(2);
    expect(result.data.vacancies[0].unreviewed_count).toBe(1);
  });

  test("only returns the requesting recruiter's own vacancies", async () => {
    const result = await listOwnVacancies({ models, recruiterWallet: "0x" + "ff".repeat(20) });
    expect(result.data.vacancies).toHaveLength(0);
  });
});
