// backend/workers/__tests__/classExpiryWorker.test.js
//
// Tests for expirePendingRequestsOnce — the core logic of the class expiry worker.

process.env.RESEND_API_KEY ||= "test-resend-key";
process.env.FRONTEND_URL  ||= "https://test.hackchain.app";

const mockNotifyTalentClassRequestUpdate = jest.fn().mockResolvedValue(undefined);

jest.mock("../../services/emailService", () => ({
  notifyTalentClassRequestUpdate: mockNotifyTalentClassRequestUpdate,
}));

jest.mock("node-cron", () => ({ schedule: jest.fn() }));

const { expirePendingRequestsOnce } = require("../classExpiryWorker");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLATFORM_TIME_ZONE = "America/Mexico_City";

function pastDate(offsetHours = -2) {
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
  offsetHours = -2,
  studentEmail = "student@test.com",
  studentName = "Ana",
  studentLastname = "López",
  issuerWallet = "0xabc",
  className = "Hacking 101",
  durationMinutes = 60,
} = {}) {
  const classAt = pastDate(offsetHours);
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
    Sequelize: { Op: { lte: Symbol("lte") } },
    ClassRequest: { findAll: mockFindAll, update: mockUpdate },
    User: { findOne: mockFindOne },
    _mocks: { mockFindAll, mockUpdate, mockFindOne },
  };
}

beforeEach(() => {
  mockNotifyTalentClassRequestUpdate.mockClear();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("expirePendingRequestsOnce — no candidates", () => {
  test("does nothing when findAll returns empty array", async () => {
    const models = makeModels({ candidates: [] });
    await expirePendingRequestsOnce(models);
    expect(models._mocks.mockUpdate).not.toHaveBeenCalled();
    expect(mockNotifyTalentClassRequestUpdate).not.toHaveBeenCalled();
  });
});

describe("expirePendingRequestsOnce — time filtering", () => {
  test("skips a class that starts 1h in the future", async () => {
    const request = makeRequest({ offsetHours: 1 });
    const models  = makeModels({ candidates: [request] });
    await expirePendingRequestsOnce(models);
    expect(models._mocks.mockUpdate).not.toHaveBeenCalled();
  });

  test("expires a class that was 2h ago", async () => {
    const request = makeRequest({ offsetHours: -2 });
    const models  = makeModels({ candidates: [request], educatorUser: { name: "Carlos" } });
    await expirePendingRequestsOnce(models);
    expect(models._mocks.mockUpdate).toHaveBeenCalledTimes(1);
  });
});

describe("expirePendingRequestsOnce — DB update", () => {
  test("sets status=cancelled and the system cancellation_reason", async () => {
    const request = makeRequest({ id: 42, offsetHours: -3 });
    const models  = makeModels({ candidates: [request], educatorUser: { name: "Carlos" } });

    await expirePendingRequestsOnce(models);

    expect(models._mocks.mockUpdate).toHaveBeenCalledWith(
      {
        status: "cancelled",
        cancellation_reason: expect.stringMatching(/Sistema.*vencida/i),
      },
      { where: { id: 42 } }
    );
  });
});

describe("expirePendingRequestsOnce — email notification", () => {
  test("sends email to student when they have an email address", async () => {
    const request = makeRequest({ offsetHours: -2 });
    const models  = makeModels({ candidates: [request], educatorUser: { name: "Carlos" } });

    await expirePendingRequestsOnce(models);

    // Fire-and-forget — wait a tick for the microtask to run
    await new Promise(r => setImmediate(r));

    expect(mockNotifyTalentClassRequestUpdate).toHaveBeenCalledTimes(1);
    const call = mockNotifyTalentClassRequestUpdate.mock.calls[0][0];
    expect(call.to).toBe("student@test.com");
    expect(call.status).toBe("expired");
  });

  test("does NOT send email when student email is null", async () => {
    const request = makeRequest({ offsetHours: -2, studentEmail: null });
    const models  = makeModels({ candidates: [request], educatorUser: { name: "Carlos" } });

    await expirePendingRequestsOnce(models);
    await new Promise(r => setImmediate(r));

    expect(mockNotifyTalentClassRequestUpdate).not.toHaveBeenCalled();
  });

  test("still updates DB even when student email is missing", async () => {
    const request = makeRequest({ offsetHours: -2, studentEmail: null });
    const models  = makeModels({ candidates: [request], educatorUser: null });

    await expirePendingRequestsOnce(models);

    expect(models._mocks.mockUpdate).toHaveBeenCalledTimes(1);
  });

  test("passes status=expired so the correct email copy is used", async () => {
    const request = makeRequest({ offsetHours: -5 });
    const models  = makeModels({ candidates: [request], educatorUser: { name: "Edu" } });

    await expirePendingRequestsOnce(models);
    await new Promise(r => setImmediate(r));

    const call = mockNotifyTalentClassRequestUpdate.mock.calls[0][0];
    expect(call.status).toBe("expired");
    expect(call.cancellationReason).toBeNull();
  });
});

describe("expirePendingRequestsOnce — resilience", () => {
  test("does not throw when email call rejects", async () => {
    mockNotifyTalentClassRequestUpdate.mockRejectedValueOnce(new Error("email down"));

    const request = makeRequest({ offsetHours: -2 });
    const models  = makeModels({ candidates: [request], educatorUser: { name: "X" } });

    await expect(expirePendingRequestsOnce(models)).resolves.not.toThrow();
  });

  test("processes all expired requests even if one email fails", async () => {
    mockNotifyTalentClassRequestUpdate
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue(undefined);

    const r1 = makeRequest({ id: 1, offsetHours: -2 });
    const r2 = makeRequest({ id: 2, offsetHours: -4 });
    const models = makeModels({
      candidates: [r1, r2],
      educatorUser: { name: "Carlos" },
    });

    await expirePendingRequestsOnce(models);

    expect(models._mocks.mockUpdate).toHaveBeenCalledTimes(2);
  });
});
