process.env.RESEND_API_KEY ||= "test-resend-key";
process.env.FRONTEND_URL  ||= "https://test.hackchain.app";

const mockNotifyCertificateAutoConfirmed = jest.fn().mockResolvedValue(undefined);

jest.mock("../../services/emailService", () => ({
  notifyCertificateAutoConfirmed: mockNotifyCertificateAutoConfirmed,
}));

jest.mock("node-cron", () => ({ schedule: jest.fn() }));

const { autoConfirmCertificatesOnce } = require("../certificateConfirmationWorker");

function makeCertificate({ id = 1, title = "Curso X", studentWallet = "0xstudent" } = {}) {
  return { id, title, student_wallet_address: studentWallet };
}

function makeModels({ candidates = [], studentUser = null } = {}) {
  const mockFindAll  = jest.fn().mockResolvedValue(candidates);
  const mockUpdate   = jest.fn().mockResolvedValue([1]);
  const mockFindOne  = jest.fn().mockResolvedValue(studentUser);

  return {
    Sequelize: { Op: { lte: Symbol("lte") } },
    Certificate: { findAll: mockFindAll, update: mockUpdate },
    User: { findOne: mockFindOne },
    _mocks: { mockFindAll, mockUpdate, mockFindOne },
  };
}

beforeEach(() => {
  mockNotifyCertificateAutoConfirmed.mockClear();
});

describe("autoConfirmCertificatesOnce — no candidates", () => {
  test("does nothing when findAll returns empty array", async () => {
    const models = makeModels({ candidates: [] });
    await autoConfirmCertificatesOnce(models);
    expect(models._mocks.mockUpdate).not.toHaveBeenCalled();
    expect(mockNotifyCertificateAutoConfirmed).not.toHaveBeenCalled();
  });
});

describe("autoConfirmCertificatesOnce — DB update", () => {
  test("sets status=confirmed and clears confirmation_deadline", async () => {
    const cert = makeCertificate({ id: 42 });
    const models = makeModels({ candidates: [cert], studentUser: { email: "s@test.com", name: "Ana" } });

    await autoConfirmCertificatesOnce(models);

    expect(models._mocks.mockUpdate).toHaveBeenCalledWith(
      { status: "confirmed", confirmation_deadline: null },
      { where: { id: 42 } }
    );
  });
});

describe("autoConfirmCertificatesOnce — email notification", () => {
  test("sends email when the student has an email address", async () => {
    const cert = makeCertificate();
    const models = makeModels({ candidates: [cert], studentUser: { email: "s@test.com", name: "Ana", lastname: "López" } });

    await autoConfirmCertificatesOnce(models);
    await new Promise((r) => setImmediate(r));

    expect(mockNotifyCertificateAutoConfirmed).toHaveBeenCalledWith(
      expect.objectContaining({ to: "s@test.com", studentName: "Ana López" })
    );
  });

  test("skips email when the student has no email on file", async () => {
    const cert = makeCertificate();
    const models = makeModels({ candidates: [cert], studentUser: { email: null } });

    await autoConfirmCertificatesOnce(models);
    await new Promise((r) => setImmediate(r));

    expect(mockNotifyCertificateAutoConfirmed).not.toHaveBeenCalled();
  });
});

describe("autoConfirmCertificatesOnce — multiple candidates", () => {
  test("processes every candidate returned", async () => {
    const certs = [makeCertificate({ id: 1 }), makeCertificate({ id: 2 }), makeCertificate({ id: 3 })];
    const models = makeModels({ candidates: certs, studentUser: { email: "s@test.com" } });

    await autoConfirmCertificatesOnce(models);

    expect(models._mocks.mockUpdate).toHaveBeenCalledTimes(3);
  });
});
