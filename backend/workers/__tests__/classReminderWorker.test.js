// backend/workers/__tests__/classReminderWorker.test.js
//
// Tests for sendRemindersOnce — the core logic of the class reminder worker.
// We mock models and emailService; node-cron is never touched.

process.env.RESEND_API_KEY ||= "test-resend-key";
process.env.FRONTEND_URL  ||= "https://test.hackchain.app";

const mockNotifyClassReminder = jest.fn().mockResolvedValue(undefined);

jest.mock("../../services/emailService", () => ({
  notifyClassReminder: mockNotifyClassReminder,
}));

// node-cron doesn't need to run in tests
jest.mock("node-cron", () => ({ schedule: jest.fn() }));

const { sendRemindersOnce } = require("../classReminderWorker");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLATFORM_TIME_ZONE = "America/Mexico_City";

function makeDate(offsetHours) {
  return new Date(Date.now() + offsetHours * 60 * 60 * 1000);
}

// requested_date/start_time are stored as the agreed LOCAL wall-clock time
// (see localWallClockTime.js) — build fixtures from the platform's timezone,
// not raw UTC getters, or the worker's real-instant math won't match offsetHours.
function isoDate(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: PLATFORM_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

function isoTime(d) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: PLATFORM_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(d);
}

function makeRequest({
  id = 1,
  offsetHours = 24,
  studentEmail = "student@test.com",
  studentName = "Ana",
  studentLastname = "López",
  issuerWallet = "0xabc",
  className = "Hacking 101",
  durationMinutes = 60,
} = {}) {
  const classAt = makeDate(offsetHours);
  return {
    id,
    requested_date: isoDate(classAt),
    start_time: isoTime(classAt),
    duration_minutes: durationMinutes,
    class_name: className,
    issuer_wallet_address: issuerWallet,
    student: studentEmail
      ? { email: studentEmail, name: studentName, lastname: studentLastname }
      : { email: null, name: null, lastname: null },
  };
}

function makeModels({ candidates = [], educatorUser = null } = {}) {
  const mockFindAll = jest.fn().mockResolvedValue(candidates);
  const mockUpdate  = jest.fn().mockResolvedValue([1]);
  const mockFindOne = jest.fn().mockResolvedValue(educatorUser);

  return {
    Sequelize: { Op: { between: Symbol("between") } },
    ClassRequest: { findAll: mockFindAll, update: mockUpdate },
    User: { findOne: mockFindOne },
    _mocks: { mockFindAll, mockUpdate, mockFindOne },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  mockNotifyClassReminder.mockClear();
});

describe("sendRemindersOnce — no candidates", () => {
  test("does nothing when findAll returns empty array", async () => {
    const models = makeModels({ candidates: [] });
    await sendRemindersOnce(models);
    expect(models._mocks.mockUpdate).not.toHaveBeenCalled();
    expect(mockNotifyClassReminder).not.toHaveBeenCalled();
  });
});

describe("sendRemindersOnce — time window filtering", () => {
  test("skips a class that is only 1h away (too soon)", async () => {
    const request = makeRequest({ offsetHours: 1 });
    const models  = makeModels({ candidates: [request] });
    await sendRemindersOnce(models);
    expect(mockNotifyClassReminder).not.toHaveBeenCalled();
  });

  test("skips a class that is 30h away (too far)", async () => {
    const request = makeRequest({ offsetHours: 30 });
    const models  = makeModels({ candidates: [request] });
    await sendRemindersOnce(models);
    expect(mockNotifyClassReminder).not.toHaveBeenCalled();
  });

  test("sends reminders for a class exactly 24h away", async () => {
    const request = makeRequest({ offsetHours: 24 });
    const educator = { email: "edu@test.com", name: "Carlos" };
    const models   = makeModels({ candidates: [request], educatorUser: educator });
    await sendRemindersOnce(models);
    expect(mockNotifyClassReminder).toHaveBeenCalled();
  });
});

describe("sendRemindersOnce — reminder_sent flag", () => {
  test("marks reminder_sent=true BEFORE calling notifyClassReminder", async () => {
    const callOrder = [];

    const request = makeRequest({ id: 42, offsetHours: 24 });
    const models  = makeModels({
      candidates: [request],
      educatorUser: { email: "edu@test.com", name: "Carlos" },
    });

    models._mocks.mockUpdate.mockImplementation(async () => {
      callOrder.push("update");
      return [1];
    });
    mockNotifyClassReminder.mockImplementation(async () => {
      callOrder.push("email");
    });

    await sendRemindersOnce(models);

    expect(callOrder[0]).toBe("update");
    expect(callOrder).toContain("email");
  });

  test("passes { reminder_sent: true } and the correct id to update", async () => {
    const request = makeRequest({ id: 99, offsetHours: 24 });
    const models  = makeModels({
      candidates: [request],
      educatorUser: { email: "edu@test.com", name: "X" },
    });

    await sendRemindersOnce(models);

    expect(models._mocks.mockUpdate).toHaveBeenCalledWith(
      { reminder_sent: true },
      { where: { id: 99 } }
    );
  });
});

describe("sendRemindersOnce — email recipients", () => {
  test("sends to both student and educator when both have emails", async () => {
    const request  = makeRequest({ offsetHours: 24 });
    const educator = { email: "edu@test.com", name: "Carlos" };
    const models   = makeModels({ candidates: [request], educatorUser: educator });

    await sendRemindersOnce(models);

    expect(mockNotifyClassReminder).toHaveBeenCalledTimes(2);
    const recipients = mockNotifyClassReminder.mock.calls.map(c => c[0].to);
    expect(recipients).toContain("student@test.com");
    expect(recipients).toContain("edu@test.com");
  });

  test("sends only to educator when student email is null", async () => {
    const request  = makeRequest({ offsetHours: 24, studentEmail: null });
    const educator = { email: "edu@test.com", name: "Carlos" };
    const models   = makeModels({ candidates: [request], educatorUser: educator });

    await sendRemindersOnce(models);

    expect(mockNotifyClassReminder).toHaveBeenCalledTimes(1);
    expect(mockNotifyClassReminder.mock.calls[0][0].to).toBe("edu@test.com");
  });

  test("sends only to student when educator email is null", async () => {
    const request  = makeRequest({ offsetHours: 24 });
    const educator = { email: null, name: null };
    const models   = makeModels({ candidates: [request], educatorUser: educator });

    await sendRemindersOnce(models);

    expect(mockNotifyClassReminder).toHaveBeenCalledTimes(1);
    expect(mockNotifyClassReminder.mock.calls[0][0].to).toBe("student@test.com");
  });

  test("sends nothing when both emails are null", async () => {
    const request  = makeRequest({ offsetHours: 24, studentEmail: null });
    const educator = { email: null, name: null };
    const models   = makeModels({ candidates: [request], educatorUser: educator });

    await sendRemindersOnce(models);

    expect(mockNotifyClassReminder).not.toHaveBeenCalled();
    // update still called (mark sent before attempting emails)
    expect(models._mocks.mockUpdate).toHaveBeenCalledTimes(1);
  });
});

describe("sendRemindersOnce — email args", () => {
  test("student call uses role=student and counterpartName from educator", async () => {
    const request  = makeRequest({ offsetHours: 24, className: "Red Team Basics" });
    const educator = { email: "edu@test.com", name: "Carlos" };
    const models   = makeModels({ candidates: [request], educatorUser: educator });

    await sendRemindersOnce(models);

    const studentCall = mockNotifyClassReminder.mock.calls.find(
      c => c[0].to === "student@test.com"
    );
    expect(studentCall[0].role).toBe("student");
    expect(studentCall[0].counterpartName).toBe("Carlos");
    expect(studentCall[0].className).toBe("Red Team Basics");
  });

  test("educator call uses role=educator and counterpartName from student", async () => {
    const request  = makeRequest({ offsetHours: 24, studentName: "Ana", studentLastname: "López" });
    const educator = { email: "edu@test.com", name: "Carlos" };
    const models   = makeModels({ candidates: [request], educatorUser: educator });

    await sendRemindersOnce(models);

    const eduCall = mockNotifyClassReminder.mock.calls.find(c => c[0].to === "edu@test.com");
    expect(eduCall[0].role).toBe("educator");
    expect(eduCall[0].counterpartName).toBe("Ana López");
  });
});

describe("sendRemindersOnce — resilience", () => {
  test("does not throw when notifyClassReminder rejects", async () => {
    mockNotifyClassReminder.mockRejectedValueOnce(new Error("Resend down"));

    const request  = makeRequest({ offsetHours: 24, studentEmail: null });
    const educator = { email: "edu@test.com", name: "Carlos" };
    const models   = makeModels({ candidates: [request], educatorUser: educator });

    await expect(sendRemindersOnce(models)).resolves.not.toThrow();
  });

  test("processes all candidates even if one email fails", async () => {
    mockNotifyClassReminder
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue(undefined);

    const r1 = makeRequest({ id: 1, offsetHours: 24, studentEmail: null });
    const r2 = makeRequest({ id: 2, offsetHours: 24, studentEmail: null });
    const educator = { email: "edu@test.com", name: "Carlos" };
    const models = makeModels({ candidates: [r1, r2], educatorUser: educator });

    await sendRemindersOnce(models);

    // Both requests should have been marked
    expect(models._mocks.mockUpdate).toHaveBeenCalledTimes(2);
  });
});
