const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { createVacancy } = require("../../vacancies/createVacancy");
const { createApplication } = require("../createApplication");
const { listApplicationsForVacancy } = require("../listApplicationsForVacancy");
const { listApplicationsForTalent } = require("../listApplicationsForTalent");

jest.setTimeout(15000);

const RECRUITER = "0x" + "aa".repeat(20);
const OTHER_RECRUITER = "0x" + "ee".repeat(20);
const ISSUER = "0x" + "bb".repeat(20);
const TALENT_1 = "0x" + "c1".repeat(20);
const TALENT_2 = "0x" + "c2".repeat(20);

describe("listApplicationsForVacancy / listApplicationsForTalent", () => {
  let sequelize, models, vacancyId;

  beforeAll(async () => {
    process.env.VITE_CONTRACT_ADDRESS ||= "0x000000000000000000000000000000000000ce";
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
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
    await models.User.create({ wallet_address: TALENT_1, role: "student", name: "Tomás", lastname: "Uno", nonce: nonce() });
    await models.Student.create({ wallet_address: TALENT_1 });
    await models.User.create({ wallet_address: TALENT_2, role: "student", name: "Tamara", lastname: "Dos", nonce: nonce() });
    await models.Student.create({ wallet_address: TALENT_2 });
    await models.Certificate.create({
      issuer_wallet_address: ISSUER,
      student_wallet_address: TALENT_1,
      title: "Pentesting 101",
      certificate_hash: "hash-1",
      token_id: "1",
      issue_date: "2026-01-01",
      status: "issued",
    });

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
    vacancyId = vacancy.data.vacancy.id;
  });

  test("returns VACANCY_NOT_FOUND for a non-owning recruiter", async () => {
    const result = await listApplicationsForVacancy({ models, vacancyId, recruiterWallet: OTHER_RECRUITER });
    expect(result.code).toBe("VACANCY_NOT_FOUND");
    expect(result.httpStatus).toBe(404);
  });

  // RF-23 — ordenada por fecha, de la más reciente a la más antigua.
  test("orders applicants by submitted_at descending", async () => {
    await createApplication({ models, vacancyId, studentWallet: TALENT_1 });
    await new Promise((r) => setTimeout(r, 5));
    await createApplication({ models, vacancyId, studentWallet: TALENT_2 });

    const result = await listApplicationsForVacancy({ models, vacancyId, recruiterWallet: RECRUITER });
    expect(result.data.applications.map((a) => a.student_wallet_address)).toEqual([TALENT_2, TALENT_1]);
  });

  // RF-25 — cada certificado enlaza a su comprobación en cadena.
  test("includes a chain verification link per shared certificate", async () => {
    await createApplication({ models, vacancyId, studentWallet: TALENT_1, sharedCertificates: ["1"] });

    const result = await listApplicationsForVacancy({ models, vacancyId, recruiterWallet: RECRUITER });
    const shared = result.data.applications[0].shared_certificates[0];
    expect(shared.token_id).toBe("1");
    expect(shared.title).toBe("Pentesting 101");
    expect(shared.chain_verification_url).toContain("/1");
  });

  // Criterio de aceptación 8 del PDF: comparte 2 de 4, el reclutador ve exactamente esos 2.
  test("the recruiter sees exactly the certificates the talent chose to share", async () => {
    for (const id of ["2", "3", "4"]) {
      await models.Certificate.create({
        issuer_wallet_address: ISSUER,
        student_wallet_address: TALENT_1,
        title: `Curso ${id}`,
        certificate_hash: `hash-${id}`,
        token_id: id,
        issue_date: "2026-01-01",
        status: "issued",
      });
    }
    await createApplication({ models, vacancyId, studentWallet: TALENT_1, sharedCertificates: ["1", "3"] });

    const result = await listApplicationsForVacancy({ models, vacancyId, recruiterWallet: RECRUITER });
    const sharedIds = result.data.applications[0].shared_certificates.map((c) => c.token_id);
    expect(sharedIds.sort()).toEqual(["1", "3"]);
  });

  test("listApplicationsForTalent returns the talent's own status", async () => {
    await createApplication({ models, vacancyId, studentWallet: TALENT_1 });
    const result = await listApplicationsForTalent({ models, studentWallet: TALENT_1 });
    expect(result.data.applications).toHaveLength(1);
    expect(result.data.applications[0].status).toBe("enviada");
    expect(result.data.applications[0].vacancy.position).toBe("Ingeniero de Software");
  });
});
