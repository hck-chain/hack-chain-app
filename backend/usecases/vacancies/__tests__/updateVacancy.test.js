const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../createVacancy");
const { updateVacancy } = require("../updateVacancy");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);
const OTHER_RECRUITER = "0x" + "bb".repeat(20);
const TALENT = "0x" + "cc".repeat(20);

function baseFields(overrides = {}) {
  return {
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
    ...overrides,
  };
}

describe("updateVacancy", () => {
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
    await models.User.create({ wallet_address: OTHER_RECRUITER, role: "recruiter", name: "Otro", nonce: nonce() });
    await models.Recruiter.create({ wallet_address: OTHER_RECRUITER, company_name: "Other Co" });
    await models.User.create({ wallet_address: TALENT, role: "student", name: "Tomás", nonce: nonce() });
    await models.Student.create({ wallet_address: TALENT });

    const created = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields() });
    vacancyId = created.data.vacancy.id;
  });

  test("throws TypeError when required args are missing", async () => {
    await expect(updateVacancy({ models, recruiterWallet: RECRUITER })).rejects.toThrow(TypeError);
  });

  test("updates the position", async () => {
    const result = await updateVacancy({ models, vacancyId, recruiterWallet: RECRUITER, position: "Ingeniero Senior" });
    expect(result.ok).toBe(true);
    expect(result.data.vacancy.position).toBe("Ingeniero Senior");
  });

  test("returns VACANCY_NOT_FOUND for another recruiter's vacancy (ownership via where, not 403)", async () => {
    const result = await updateVacancy({ models, vacancyId, recruiterWallet: OTHER_RECRUITER, position: "Hijack" });
    expect(result.code).toBe("VACANCY_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  test("returns VACANCY_NOT_EDITABLE once the vacancy is closed", async () => {
    await models.Vacancy.update({ status: "cerrada" }, { where: { id: vacancyId } });
    const result = await updateVacancy({ models, vacancyId, recruiterWallet: RECRUITER, position: "Nueva Posicion" });
    expect(result.code).toBe("VACANCY_NOT_EDITABLE");
  });

  // RF-06 — no se puede editar el salario si ya hay postulaciones.
  test("allows salary changes with zero applications", async () => {
    const result = await updateVacancy({ models, vacancyId, recruiterWallet: RECRUITER, salaryMin: 1500, salaryMax: 2500 });
    expect(result.ok).toBe(true);
    expect(Number(result.data.vacancy.salary_min)).toBe(1500);
  });

  test("blocks salary changes once there's at least one application", async () => {
    await models.VacancyApplication.create({ vacancy_id: vacancyId, student_wallet_address: TALENT, status: "enviada", submitted_at: new Date() });
    const result = await updateVacancy({ models, vacancyId, recruiterWallet: RECRUITER, salaryMin: 1500 });
    expect(result.code).toBe("SALARY_LOCKED");
    expect(result.httpStatus).toBe(409);
  });

  test("non-salary edits are still allowed once there's an application", async () => {
    await models.VacancyApplication.create({ vacancy_id: vacancyId, student_wallet_address: TALENT, status: "enviada", submitted_at: new Date() });
    const result = await updateVacancy({ models, vacancyId, recruiterWallet: RECRUITER, description: "y".repeat(60) });
    expect(result.ok).toBe(true);
  });

  test("requires country/city when switching modality away from remoto", async () => {
    const result = await updateVacancy({ models, vacancyId, recruiterWallet: RECRUITER, modality: "presencial" });
    expect(result.code).toBe("LOCATION_REQUIRED");
  });

  test("clears country/city when switching modality to remoto", async () => {
    await updateVacancy({ models, vacancyId, recruiterWallet: RECRUITER, modality: "presencial", country: "Mexico", city: "CDMX" });
    const result = await updateVacancy({ models, vacancyId, recruiterWallet: RECRUITER, modality: "remoto" });
    expect(result.ok).toBe(true);
    expect(result.data.vacancy.country).toBeNull();
    expect(result.data.vacancy.city).toBeNull();
  });
});
