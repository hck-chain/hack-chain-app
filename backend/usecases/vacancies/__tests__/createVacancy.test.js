const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../createVacancy");
const { MAX_OPEN_VACANCIES_PER_RECRUITER } = require("../constants");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);

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
    requirements: ["Node.js", "PostgreSQL"],
    ...overrides,
  };
}

describe("createVacancy", () => {
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
    await models.User.create({
      wallet_address: RECRUITER,
      role: "recruiter",
      name: "Rita",
      email: "rita@example.com",
      nonce: crypto.randomBytes(16).toString("hex"),
    });
    await models.Recruiter.create({ wallet_address: RECRUITER, company_name: "Acme Corp" });
  });

  test("throws TypeError when models or recruiterWallet is missing", async () => {
    await expect(createVacancy({ recruiterWallet: RECRUITER })).rejects.toThrow(TypeError);
  });

  test("creates a vacancy with a slug derived from position+company", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields() });
    expect(result.ok).toBe(true);
    expect(result.data.vacancy.slug).toBe("ingeniero-de-software-acme-corp");
    expect(result.data.vacancy.status).toBe("abierta");
  });

  test("appends an incremental suffix on slug collision", async () => {
    await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields() });
    const second = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields() });
    expect(second.data.vacancy.slug).toBe("ingeniero-de-software-acme-corp-2");
  });

  // RN-01 — sin salario no hay publicación.
  test("returns SALARY_REQUIRED when salary is missing", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ salaryMin: undefined, salaryMax: undefined }) });
    expect(result.code).toBe("SALARY_REQUIRED");
    expect(result.httpStatus).toBe(400);
  });

  test("returns INVALID_SALARY_RANGE when max is less than min", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ salaryMin: 2000, salaryMax: 1000 }) });
    expect(result.code).toBe("INVALID_SALARY_RANGE");
  });

  test("accepts an ISO 4217 local currency in addition to the fixed set", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ salaryCurrency: "MXN" }) });
    expect(result.ok).toBe(true);
  });

  test("rejects an invalid currency", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ salaryCurrency: "not-a-currency" }) });
    expect(result.code).toBe("INVALID_CURRENCY");
  });

  test("rejects an area outside the closed enum list", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ area: "marketing" }) });
    expect(result.code).toBe("INVALID_AREA");
  });

  // RF-04 / RN-02 — 7 a 90 días, default 30.
  test("defaults closing_date to 30 days from today when omitted", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields() });
    const expected = new Date();
    expected.setUTCDate(expected.getUTCDate() + 30);
    expect(result.data.vacancy.closing_date).toBe(expected.toISOString().slice(0, 10));
  });

  test("rejects a closing_date under 7 days away", async () => {
    const soon = new Date();
    soon.setUTCDate(soon.getUTCDate() + 3);
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ closingDate: soon.toISOString().slice(0, 10) }) });
    expect(result.code).toBe("INVALID_CLOSING_DATE");
  });

  test("rejects a closing_date over 90 days away", async () => {
    const far = new Date();
    far.setUTCDate(far.getUTCDate() + 91);
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ closingDate: far.toISOString().slice(0, 10) }) });
    expect(result.code).toBe("INVALID_CLOSING_DATE");
  });

  test("accepts a closing_date exactly 90 days away", async () => {
    const far = new Date();
    far.setUTCDate(far.getUTCDate() + 90);
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ closingDate: far.toISOString().slice(0, 10) }) });
    expect(result.ok).toBe(true);
  });

  // §3.1 — pais/ciudad obligatorios si no es remoto.
  test("requires country and city when modality is not remoto", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ modality: "presencial" }) });
    expect(result.code).toBe("LOCATION_REQUIRED");
  });

  test("accepts presencial with country and city set", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ modality: "presencial", country: "Mexico", city: "CDMX" }) });
    expect(result.ok).toBe(true);
    expect(result.data.vacancy.country).toBe("Mexico");
  });

  // RF-03 — 1 a 10 líneas de texto libre.
  test("rejects an empty requirements array", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ requirements: [] }) });
    expect(result.code).toBe("INVALID_REQUIREMENTS");
  });

  test("rejects more than 10 requirements", async () => {
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ requirements: Array(11).fill("x") }) });
    expect(result.code).toBe("INVALID_REQUIREMENTS");
  });

  // RN-03 — máximo 5 vacantes abiertas por reclutador.
  test(`blocks the ${MAX_OPEN_VACANCIES_PER_RECRUITER + 1}th open vacancy`, async () => {
    for (let i = 0; i < MAX_OPEN_VACANCIES_PER_RECRUITER; i++) {
      const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ position: `Puesto ${i}` }) });
      expect(result.ok).toBe(true);
    }
    const sixth = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ position: "Puesto extra" }) });
    expect(sixth.code).toBe("VACANCY_LIMIT_REACHED");
    expect(sixth.httpStatus).toBe(409);
  });

  test("a closed vacancy doesn't count toward the 5-open limit", async () => {
    let firstId;
    for (let i = 0; i < MAX_OPEN_VACANCIES_PER_RECRUITER; i++) {
      const created = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ position: `Puesto ${i}` }) });
      if (i === 0) firstId = created.data.vacancy.id;
    }
    // Sequelize's `limit` option on bulk update isn't portable across dialects
    // (MySQL-only) — close exactly one row by primary key instead.
    await models.Vacancy.update({ status: "cerrada" }, { where: { id: firstId } });
    const result = await createVacancy({ models, recruiterWallet: RECRUITER, ...baseFields({ position: "Puesto nuevo" }) });
    expect(result.ok).toBe(true);
  });
});
