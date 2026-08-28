const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../../vacancies/createVacancy");
const { createApplication } = require("../createApplication");
const { markApplicationViewed } = require("../markApplicationViewed");
const { getApplicationDetail } = require("../getApplicationDetail");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);
const OTHER_RECRUITER = "0x" + "ee".repeat(20);
const TALENT = "0x" + "cc".repeat(20);

describe("markApplicationViewed / getApplicationDetail", () => {
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

  // RF-24 — al abrirlo por primera vez, pasa a Vista.
  test("transitions enviada to vista on first view", async () => {
    const result = await markApplicationViewed({ models, applicationId, recruiterWallet: RECRUITER });
    expect(result.ok).toBe(true);
    expect(result.data.application.status).toBe("vista");
    expect(result.data.application.viewed_at).not.toBeNull();
    expect(result.data.transitioned_to_viewed).toBe(true);
  });

  test("is idempotent — a second view doesn't re-transition or overwrite viewed_at", async () => {
    const first = await markApplicationViewed({ models, applicationId, recruiterWallet: RECRUITER });
    const second = await markApplicationViewed({ models, applicationId, recruiterWallet: RECRUITER });
    expect(second.data.transitioned_to_viewed).toBe(false);
    expect(second.data.application.viewed_at).toEqual(first.data.application.viewed_at);
  });

  test("returns APPLICATION_NOT_FOUND for a recruiter who doesn't own the vacancy", async () => {
    const result = await markApplicationViewed({ models, applicationId, recruiterWallet: OTHER_RECRUITER });
    expect(result.code).toBe("APPLICATION_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  test("getApplicationDetail also transitions to vista", async () => {
    const result = await getApplicationDetail({ models, applicationId, recruiterWallet: RECRUITER });
    expect(result.data.application.status).toBe("vista");
  });
});
