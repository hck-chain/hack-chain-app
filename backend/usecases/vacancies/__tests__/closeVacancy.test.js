const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../createVacancy");
const { closeVacancy } = require("../closeVacancy");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);
const TALENT = "0x" + "cc".repeat(20);

describe("closeVacancy", () => {
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
    await models.User.create({ wallet_address: TALENT, role: "student", name: "Tomás", nonce: nonce() });
    await models.Student.create({ wallet_address: TALENT });

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

  test("closes an open vacancy and sets closed_at", async () => {
    const result = await closeVacancy({ models, vacancyId, recruiterWallet: RECRUITER });
    expect(result.ok).toBe(true);
    expect(result.data.vacancy.status).toBe("cerrada");
    expect(result.data.vacancy.closed_at).not.toBeNull();
  });

  // §4.1 — Abierta ────► Cerrada (no se reabre).
  test("a closed vacancy can't be closed again", async () => {
    await closeVacancy({ models, vacancyId, recruiterWallet: RECRUITER });
    const result = await closeVacancy({ models, vacancyId, recruiterWallet: RECRUITER });
    expect(result.code).toBe("VACANCY_ALREADY_CLOSED");
    expect(result.httpStatus).toBe(409);
  });

  // RF-07, RN-08 — unanswered applications become cerrada_sin_respuesta.
  test("closes pending (enviada/vista) applications as cerrada_sin_respuesta", async () => {
    await models.VacancyApplication.create({ vacancy_id: vacancyId, student_wallet_address: TALENT, status: "enviada", submitted_at: new Date() });

    const result = await closeVacancy({ models, vacancyId, recruiterWallet: RECRUITER });
    expect(result.ok).toBe(true);
    expect(result.data.notified_applications).toHaveLength(1);

    const application = await models.VacancyApplication.findOne({ where: { vacancy_id: vacancyId } });
    expect(application.status).toBe("cerrada_sin_respuesta");
    expect(application.status_changed_by).toBe("system");
  });

  test("doesn't touch applications already contactado or descartada", async () => {
    const app = await models.VacancyApplication.create({ vacancy_id: vacancyId, student_wallet_address: TALENT, status: "contactado", submitted_at: new Date() });

    const result = await closeVacancy({ models, vacancyId, recruiterWallet: RECRUITER });
    expect(result.data.notified_applications).toHaveLength(0);

    await app.reload();
    expect(app.status).toBe("contactado");
  });

  test("returns VACANCY_NOT_FOUND for a mismatched owner", async () => {
    const result = await closeVacancy({ models, vacancyId, recruiterWallet: "0x" + "ff".repeat(20) });
    expect(result.code).toBe("VACANCY_NOT_FOUND");
  });
});
