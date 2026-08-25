const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../../vacancies/createVacancy");
const { createApplication } = require("../createApplication");
const { updateApplicationStatus } = require("../updateApplicationStatus");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);
const OTHER_RECRUITER = "0x" + "ee".repeat(20);
const TALENT = "0x" + "cc".repeat(20);

describe("updateApplicationStatus", () => {
  let sequelize, models, applicationId;

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

    const vacancy = await createVacancy({
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
    const application = await createApplication({ models, vacancyId: vacancy.data.vacancy.id, studentWallet: TALENT });
    applicationId = application.data.application.id;
  });

  test("rejects an invalid status value", async () => {
    const result = await updateApplicationStatus({ models, applicationId, recruiterWallet: RECRUITER, status: "aprobada" });
    expect(result.code).toBe("INVALID_STATUS");
    expect(result.httpStatus).toBe(400);
  });

  // RF-26 — Contactar / Descartar.
  test("moves to contactado and stamps author and date (RNF-06)", async () => {
    const result = await updateApplicationStatus({ models, applicationId, recruiterWallet: RECRUITER, status: "contactado" });
    expect(result.ok).toBe(true);
    expect(result.data.application.status).toBe("contactado");
    expect(result.data.application.status_changed_at).not.toBeNull();

    const stored = await models.VacancyApplication.findByPk(applicationId);
    expect(stored.status_changed_by).toBe(RECRUITER.toLowerCase());
  });

  test("moves to descartada", async () => {
    const result = await updateApplicationStatus({ models, applicationId, recruiterWallet: RECRUITER, status: "descartada" });
    expect(result.data.application.status).toBe("descartada");
  });

  test("returns APPLICATION_NOT_FOUND for a non-owning recruiter", async () => {
    const result = await updateApplicationStatus({ models, applicationId, recruiterWallet: OTHER_RECRUITER, status: "contactado" });
    expect(result.code).toBe("APPLICATION_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  // RN-08 — toda postulación termina en Contactado, Descartada o Cerrada sin respuesta.
  test("can't change the status of an application whose vacancy already closed it", async () => {
    await models.VacancyApplication.update({ status: "cerrada_sin_respuesta" }, { where: { id: applicationId } });
    const result = await updateApplicationStatus({ models, applicationId, recruiterWallet: RECRUITER, status: "contactado" });
    expect(result.code).toBe("APPLICATION_CLOSED");
  });
});
