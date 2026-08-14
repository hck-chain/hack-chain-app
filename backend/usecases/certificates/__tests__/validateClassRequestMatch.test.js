const SequelizePkg = require("sequelize");
const crypto = require("crypto");
const { validateClassRequestMatch } = require("../validateClassRequestMatch");

jest.setTimeout(15000);

const ISSUER = "0x" + "bb".repeat(20);
const OTHER_ISSUER = "0x" + "cc".repeat(20);
const STUDENT = "0x" + "aa".repeat(20);
const OTHER_STUDENT = "0x" + "dd".repeat(20);

describe("validateClassRequestMatch", () => {
  let sequelize, models, classId, namelessClassId, unpaidClassId;

  beforeAll(async () => {
    sequelize = new SequelizePkg.Sequelize("sqlite::memory:", { logging: false });
    const { DataTypes } = SequelizePkg;
    const User         = require("../../../models/users")(sequelize, DataTypes);
    const Issuer       = require("../../../models/issuers")(sequelize, DataTypes);
    const IssuerClass  = require("../../../models/issuerClasses")(sequelize, DataTypes);
    const ClassRequest = require("../../../models/classRequests")(sequelize, DataTypes);
    const Student      = require("../../../models/students")(sequelize, DataTypes);
    const Recruiter    = require("../../../models/recruiters")(sequelize, DataTypes);
    const Certificate  = require("../../../models/certificates")(sequelize, DataTypes);
    const UserSession  = require("../../../models/userSessions")(sequelize, DataTypes);

    models = { User, Issuer, IssuerClass, ClassRequest, Student, Recruiter, Certificate, UserSession, sequelize, Sequelize: SequelizePkg };
    Object.values(models).forEach((m) => m?.associate && m.associate(models));
    await sequelize.sync({ force: true });

    const nonce = () => crypto.randomBytes(16).toString("hex");
    await models.User.create({ wallet_address: ISSUER, role: "issuer", name: "Prof", nonce: nonce() });
    await models.Issuer.create({ wallet_address: ISSUER, organization_name: "HackAcademy" });
    await models.User.create({ wallet_address: STUDENT, role: "student", name: "Luis", nonce: nonce() });

    const cr = await models.ClassRequest.create({
      student_wallet_address: STUDENT, issuer_wallet_address: ISSUER,
      requested_date: "2026-07-20", start_time: "10:00", duration_minutes: 60,
      class_name: "Introduccion a Linux", status: "confirmed", payment_status: "paid",
    });
    classId = cr.id;

    const crNameless = await models.ClassRequest.create({
      student_wallet_address: STUDENT, issuer_wallet_address: ISSUER,
      requested_date: "2026-07-21", start_time: "10:00", duration_minutes: 60,
      class_name: null, status: "confirmed", payment_status: "paid",
    });
    namelessClassId = crNameless.id;

    const crUnpaid = await models.ClassRequest.create({
      student_wallet_address: STUDENT, issuer_wallet_address: ISSUER,
      requested_date: "2026-07-22", start_time: "10:00", duration_minutes: 60,
      class_name: "Introduccion a Docker", status: "confirmed", payment_status: "deposit_confirmed",
    });
    unpaidClassId = crUnpaid.id;
  });

  afterAll(() => sequelize.close());

  test("throws TypeError when required params are missing", async () => {
    await expect(validateClassRequestMatch({ issuerWallet: ISSUER })).rejects.toThrow(TypeError);
  });

  test("returns CLASS_REQUEST_MISMATCH (409) when the class_request_id does not exist", async () => {
    const result = await validateClassRequestMatch({
      models, classRequestId: 999999, issuerWallet: ISSUER, studentWallet: STUDENT, title: "x",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("CLASS_REQUEST_MISMATCH");
    expect(result.httpStatus).toBe(409);
  });

  test("rejects when the class belongs to another issuer", async () => {
    const result = await validateClassRequestMatch({
      models, classRequestId: classId, issuerWallet: OTHER_ISSUER, studentWallet: STUDENT, title: "Introduccion a Linux",
    });
    expect(result.code).toBe("CLASS_REQUEST_MISMATCH");
  });

  test("rejects when the student wallet does not match", async () => {
    const result = await validateClassRequestMatch({
      models, classRequestId: classId, issuerWallet: ISSUER, studentWallet: OTHER_STUDENT, title: "Introduccion a Linux",
    });
    expect(result.code).toBe("CLASS_REQUEST_MISMATCH");
  });

  test("rejects when the title does not match a non-null class_name", async () => {
    const result = await validateClassRequestMatch({
      models, classRequestId: classId, issuerWallet: ISSUER, studentWallet: STUDENT, title: "Otro título",
    });
    expect(result.code).toBe("CLASS_REQUEST_MISMATCH");
  });

  test("accepts any title when class_name is null", async () => {
    const result = await validateClassRequestMatch({
      models, classRequestId: namelessClassId, issuerWallet: ISSUER, studentWallet: STUDENT, title: "Cualquier título",
    });
    expect(result.ok).toBe(true);
  });

  test("accepts a fully matching class request", async () => {
    const result = await validateClassRequestMatch({
      models, classRequestId: classId, issuerWallet: ISSUER, studentWallet: STUDENT, title: "Introduccion a Linux",
    });
    expect(result.ok).toBe(true);
  });

  test("rejects with PAYMENT_NOT_COMPLETE (402) when payment_status isn't paid", async () => {
    const result = await validateClassRequestMatch({
      models, classRequestId: unpaidClassId, issuerWallet: ISSUER, studentWallet: STUDENT, title: "Introduccion a Docker",
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("PAYMENT_NOT_COMPLETE");
    expect(result.httpStatus).toBe(402);
  });
});
