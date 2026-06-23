// backend/services/__tests__/emailService.admin-notify.test.js
//
// Unit tests for notifyAdminNewEducator and notifyAdminEducatorReapply.
// Mocks the resend SDK so no real emails are sent.

const mockSend = jest.fn().mockResolvedValue({ id: "mock-id" });

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

process.env.RESEND_API_KEY ||= "test-resend-key";
process.env.RESEND_FROM   ||= "noreply@test.hackchain.app";

const { notifyAdminNewEducator, notifyAdminEducatorReapply } = require("../emailService");

const SINGLE  = ["admin@hackchain.app"];
const MULTI   = ["admin1@hackchain.app", "admin2@hackchain.app"];
const PAYLOAD = {
  name: "Ana García",
  email: "ana@university.edu",
  wallet: "0x" + "aa".repeat(20),
  organization: "HackAcademy",
};

beforeEach(() => {
  mockSend.mockClear();
});

// ---------------------------------------------------------------------------
// notifyAdminNewEducator
// ---------------------------------------------------------------------------

describe("notifyAdminNewEducator", () => {
  test("does nothing when to is an empty array", async () => {
    await notifyAdminNewEducator({ to: [], ...PAYLOAD });
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("does nothing when to is undefined", async () => {
    await notifyAdminNewEducator({ to: undefined, ...PAYLOAD });
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("does nothing when to is null", async () => {
    await notifyAdminNewEducator({ to: null, ...PAYLOAD });
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("calls resend.emails.send exactly once for a single recipient", async () => {
    await notifyAdminNewEducator({ to: SINGLE, ...PAYLOAD });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("passes the full to array for multiple admins", async () => {
    await notifyAdminNewEducator({ to: MULTI, ...PAYLOAD });
    const { to } = mockSend.mock.calls[0][0];
    expect(to).toEqual(MULTI);
  });

  test("subject includes the educator display name", async () => {
    await notifyAdminNewEducator({ to: SINGLE, ...PAYLOAD });
    const { subject } = mockSend.mock.calls[0][0];
    expect(subject).toMatch(/Ana García/);
  });

  test("subject falls back to organization when name is null", async () => {
    await notifyAdminNewEducator({ to: SINGLE, ...PAYLOAD, name: null });
    const { subject } = mockSend.mock.calls[0][0];
    expect(subject).toMatch(/HackAcademy/);
  });

  test("subject falls back to wallet when both name and org are null", async () => {
    await notifyAdminNewEducator({ to: SINGLE, ...PAYLOAD, name: null, organization: null });
    const { subject } = mockSend.mock.calls[0][0];
    expect(subject).toMatch(/0x/);
  });

  test("email body contains the educator wallet address", async () => {
    await notifyAdminNewEducator({ to: SINGLE, ...PAYLOAD });
    const { text } = mockSend.mock.calls[0][0];
    expect(text).toContain(PAYLOAD.wallet);
  });

  test("email body contains the educator email", async () => {
    await notifyAdminNewEducator({ to: SINGLE, ...PAYLOAD });
    const { text } = mockSend.mock.calls[0][0];
    expect(text).toContain(PAYLOAD.email);
  });
});

// ---------------------------------------------------------------------------
// notifyAdminEducatorReapply
// ---------------------------------------------------------------------------

describe("notifyAdminEducatorReapply", () => {
  test("does nothing when to is an empty array", async () => {
    await notifyAdminEducatorReapply({ to: [], ...PAYLOAD });
    expect(mockSend).not.toHaveBeenCalled();
  });

  test("calls resend.emails.send exactly once for a single recipient", async () => {
    await notifyAdminEducatorReapply({ to: SINGLE, ...PAYLOAD });
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("passes the full to array for multiple admins", async () => {
    await notifyAdminEducatorReapply({ to: MULTI, ...PAYLOAD });
    const { to } = mockSend.mock.calls[0][0];
    expect(to).toEqual(MULTI);
  });

  test("subject is distinct from notifyAdminNewEducator (re-apply label)", async () => {
    await notifyAdminEducatorReapply({ to: SINGLE, ...PAYLOAD });
    const { subject } = mockSend.mock.calls[0][0];
    // Must signal re-apply, not new registration
    expect(subject).toMatch(/re-?solic|reappl/i);
  });

  test("email body contains wallet address", async () => {
    await notifyAdminEducatorReapply({ to: SINGLE, ...PAYLOAD });
    const { text } = mockSend.mock.calls[0][0];
    expect(text).toContain(PAYLOAD.wallet);
  });
});

// ---------------------------------------------------------------------------
// Both functions use the same resend FROM address
// ---------------------------------------------------------------------------

test("notifyAdminNewEducator uses the configured FROM address", async () => {
  await notifyAdminNewEducator({ to: SINGLE, ...PAYLOAD });
  expect(mockSend.mock.calls[0][0].from).toBe("noreply@test.hackchain.app");
});
