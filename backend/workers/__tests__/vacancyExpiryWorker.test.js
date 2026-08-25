// backend/workers/__tests__/vacancyExpiryWorker.test.js
//
// Tests for closeExpiredVacanciesOnce — the core logic of the vacancy expiry worker.

process.env.RESEND_API_KEY ||= "test-resend-key";
process.env.FRONTEND_URL  ||= "https://test.hackchain.app";

const mockNotify = jest.fn().mockResolvedValue(undefined);

jest.mock("../../services/emailService", () => ({
  notifyTalentVacancyApplicationUpdate: mockNotify,
}));

jest.mock("node-cron", () => ({ schedule: jest.fn() }));

const { closeExpiredVacanciesOnce } = require("../vacancyExpiryWorker");

function makeVacancy({ id = 1, offsetDays = -1, position = "Ingeniero", company = "Acme" } = {}) {
  const closing = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  return {
    id,
    position,
    company,
    status: "abierta",
    closing_date: closing.toISOString().slice(0, 10),
    update: jest.fn().mockResolvedValue(undefined),
  };
}

function makeModels({ vacancies = [], affectedApplications = [], studentUser = null } = {}) {
  const mockVacancyFindAll = jest.fn().mockResolvedValue(vacancies);
  const mockAppUpdate = jest.fn().mockResolvedValue([affectedApplications.length]);
  const mockAppFindAll = jest.fn().mockResolvedValue(affectedApplications);
  const mockUserFindOne = jest.fn().mockResolvedValue(studentUser);

  return {
    Sequelize: { Op: { lte: Symbol("lte"), in: Symbol("in") } },
    Vacancy: { findAll: mockVacancyFindAll },
    VacancyApplication: { update: mockAppUpdate, findAll: mockAppFindAll },
    User: { findOne: mockUserFindOne },
    _mocks: { mockVacancyFindAll, mockAppUpdate, mockAppFindAll, mockUserFindOne },
  };
}

beforeEach(() => {
  mockNotify.mockClear();
});

describe("closeExpiredVacanciesOnce — no candidates", () => {
  test("does nothing when findAll returns empty array", async () => {
    const models = makeModels({ vacancies: [] });
    await closeExpiredVacanciesOnce(models);
    expect(models._mocks.mockAppUpdate).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });
});

// RF-07, RN-02 — cierra sola al llegar la fecha.
describe("closeExpiredVacanciesOnce — closing", () => {
  test("closes each expired vacancy via its own update()", async () => {
    const vacancy = makeVacancy({ id: 7 });
    const models = makeModels({ vacancies: [vacancy] });

    await closeExpiredVacanciesOnce(models);

    expect(vacancy.update).toHaveBeenCalledWith(expect.objectContaining({ status: "cerrada" }));
  });

  // RF-07, RN-08 — postulaciones sin respuesta pasan a "Cerrada sin respuesta".
  test("marks unanswered applications as cerrada_sin_respuesta", async () => {
    const vacancy = makeVacancy();
    const models = makeModels({ vacancies: [vacancy] });

    await closeExpiredVacanciesOnce(models);

    expect(models._mocks.mockAppUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "cerrada_sin_respuesta", status_changed_by: "system" }),
      expect.objectContaining({ where: expect.objectContaining({ vacancy_id: vacancy.id }) })
    );
  });
});

// RF-21 — el talento recibe notificación en el cierre sin respuesta.
describe("closeExpiredVacanciesOnce — email notification", () => {
  test("notifies each affected talent with an email", async () => {
    const vacancy = makeVacancy();
    const models = makeModels({
      vacancies: [vacancy],
      affectedApplications: [{ id: 1, student_wallet_address: "0x" + "cc".repeat(20) }],
      studentUser: { email: "student@test.com", name: "Ana" },
    });

    await closeExpiredVacanciesOnce(models);
    await new Promise((r) => setImmediate(r));

    expect(mockNotify).toHaveBeenCalledTimes(1);
    const call = mockNotify.mock.calls[0][0];
    expect(call.to).toBe("student@test.com");
    expect(call.status).toBe("cerrada_sin_respuesta");
  });

  test("does NOT send email when the talent has no email on file", async () => {
    const vacancy = makeVacancy();
    const models = makeModels({
      vacancies: [vacancy],
      affectedApplications: [{ id: 1, student_wallet_address: "0x" + "cc".repeat(20) }],
      studentUser: null,
    });

    await closeExpiredVacanciesOnce(models);
    await new Promise((r) => setImmediate(r));

    expect(mockNotify).not.toHaveBeenCalled();
  });

  test("still closes the vacancy even when the email send rejects", async () => {
    mockNotify.mockRejectedValueOnce(new Error("email down"));
    const vacancy = makeVacancy();
    const models = makeModels({
      vacancies: [vacancy],
      affectedApplications: [{ id: 1, student_wallet_address: "0x" + "cc".repeat(20) }],
      studentUser: { email: "student@test.com", name: "Ana" },
    });

    await expect(closeExpiredVacanciesOnce(models)).resolves.not.toThrow();
    expect(vacancy.update).toHaveBeenCalled();
  });
});
