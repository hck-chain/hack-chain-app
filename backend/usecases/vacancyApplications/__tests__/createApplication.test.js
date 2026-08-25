const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../../vacancies/createVacancy");
const { closeVacancy } = require("../../vacancies/closeVacancy");
const { createApplication } = require("../createApplication");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);
const ISSUER = "0x" + "bb".repeat(20);
const TALENT = "0x" + "cc".repeat(20);

describe("createApplication", () => {
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
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
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

  async function makeCertificate(tokenId, overrides = {}) {
    return models.Certificate.create({
      issuer_wallet_address: ISSUER,
      student_wallet_address: TALENT,
      title: "Curso",
      certificate_hash: `hash-${tokenId}`,
      token_id: tokenId,
      issue_date: "2026-01-01",
      status: "issued",
      is_revoked: false,
      ...overrides,
    });
  }

  test("throws TypeError when required args are missing", async () => {
    await expect(createApplication({ models, studentWallet: TALENT })).rejects.toThrow(TypeError);
  });

  // RF-15/RF-16 — se postula, puede no compartir ningún certificado.
  test("applies without sharing any certificate", async () => {
    const result = await createApplication({ models, vacancyId, studentWallet: TALENT });
    expect(result.ok).toBe(true);
    expect(result.data.application.shared_certificates).toEqual([]);
    expect(result.data.application.status).toBe("enviada");
  });

  test("returns VACANCY_NOT_FOUND for an unknown vacancy", async () => {
    const result = await createApplication({ models, vacancyId: "00000000-0000-0000-0000-000000000000", studentWallet: TALENT });
    expect(result.code).toBe("VACANCY_NOT_FOUND");
  });

  test("returns VACANCY_CLOSED when the vacancy is no longer open", async () => {
    await closeVacancy({ models, vacancyId, recruiterWallet: RECRUITER });
    const result = await createApplication({ models, vacancyId, studentWallet: TALENT });
    expect(result.code).toBe("VACANCY_CLOSED");
    expect(result.httpStatus).toBe(409);
  });

  // RF-19 — una sola postulación por vacante.
  test("blocks a second application to the same vacancy", async () => {
    await createApplication({ models, vacancyId, studentWallet: TALENT });
    const result = await createApplication({ models, vacancyId, studentWallet: TALENT });
    expect(result.code).toBe("ALREADY_APPLIED");
    expect(result.httpStatus).toBe(409);
  });

  test("rejects a message over 500 characters", async () => {
    const result = await createApplication({ models, vacancyId, studentWallet: TALENT, message: "x".repeat(501) });
    expect(result.code).toBe("MESSAGE_TOO_LONG");
  });

  // RF-16/RF-17 — el talento elige certificados propios; el reclutador solo ve esos.
  test("shares a subset of the talent's own certificates", async () => {
    await makeCertificate("1");
    await makeCertificate("2");
    await makeCertificate("3");
    await makeCertificate("4");

    const result = await createApplication({ models, vacancyId, studentWallet: TALENT, sharedCertificates: ["1", "3"] });
    expect(result.ok).toBe(true);
    expect(result.data.application.shared_certificates).toEqual(["1", "3"]);
  });

  // RN-07 — solo certificados propios, no revocados, emitidos.
  test("rejects a certificate that belongs to another talent", async () => {
    const otherTalent = "0x" + "dd".repeat(20);
    await models.User.create({ wallet_address: otherTalent, role: "student", name: "Otro", nonce: crypto.randomBytes(16).toString("hex") });
    await models.Student.create({ wallet_address: otherTalent });
    await models.Certificate.create({
      issuer_wallet_address: ISSUER,
      student_wallet_address: otherTalent,
      title: "Curso ajeno",
      certificate_hash: "hash-other",
      token_id: "99",
      issue_date: "2026-01-01",
      status: "issued",
    });

    const result = await createApplication({ models, vacancyId, studentWallet: TALENT, sharedCertificates: ["99"] });
    expect(result.code).toBe("INVALID_SHARED_CERTIFICATES");
  });

  test("rejects a revoked certificate", async () => {
    await makeCertificate("5", { is_revoked: true });
    const result = await createApplication({ models, vacancyId, studentWallet: TALENT, sharedCertificates: ["5"] });
    expect(result.code).toBe("INVALID_SHARED_CERTIFICATES");
  });

  test("rejects a still-pending (unminted) certificate", async () => {
    await makeCertificate("6", { status: "pending", certificate_hash: null });
    const result = await createApplication({ models, vacancyId, studentWallet: TALENT, sharedCertificates: ["6"] });
    expect(result.code).toBe("INVALID_SHARED_CERTIFICATES");
  });
});
