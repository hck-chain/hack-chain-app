const mockSend = jest.fn().mockResolvedValue({ id: "mock-id" });

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

process.env.RESEND_API_KEY ||= "test-key";
process.env.RESEND_FROM ||= "test@hackchain.app";
process.env.FRONTEND_URL ||= "https://test.hackchain.app";

const {
  notifyTalentClassRequestUpdate,
} = require("../emailService");

beforeEach(() => {
  mockSend.mockClear();
});

const args = {
  to: "student@example.com",
  studentName: "Luis Soto",
  educatorName: "Hack Academy",
  className: "React Avanzado",
  requestedDate: "2026-08-15",
  startTime: "18:00",
  durationMinutes: 90,
  requestId: "12345",
};
// ---------------------------------------------------------------------------
// notifyTalentClassRequestUpdate
// Confirmed
// ---------------------------------------------------------------------------


describe("notifyTalentClassRequestUpdate - confirmed", () => {

  test("sends email once", async () => {

    await notifyTalentClassRequestUpdate({
      ...args,
      status: "confirmed",
    });

    expect(mockSend).toHaveBeenCalledTimes(1);

  });

  test("uses confirmed subject", async () => {

    await notifyTalentClassRequestUpdate({
      ...args,
      status: "confirmed",
    });

    expect(
      mockSend.mock.calls[0][0].subject
    ).toContain("confirmada");

  });

  test("contains google calendar button", async () => {

    await notifyTalentClassRequestUpdate({
      ...args,
      status: "confirmed",
    });

    expect(
      mockSend.mock.calls[0][0].html
    ).toContain("calendar.google.com");

  });

  test("includes .ics attachment", async () => {

    await notifyTalentClassRequestUpdate({
      ...args,
      status: "confirmed",
    });

    expect(
      mockSend.mock.calls[0][0].attachments
    ).toHaveLength(1);

  });

});
// ---------------------------------------------------------------------------
// Canceled
// ---------------------------------------------------------------------------

describe("notifyTalentClassRequestUpdate - canceled", () => {

  test("contains cancellation reason", async () => {

    await notifyTalentClassRequestUpdate({

      ...args,

      status: "canceled",

      cancellationReason:
        "El educador no estará disponible",

    });

    expect(
      mockSend.mock.calls[0][0].html
    ).toContain(
      "El educador no estará disponible"
    );

  });

  test("does not include attachments", async () => {

    await notifyTalentClassRequestUpdate({

      ...args,

      status: "canceled",

    });

    expect(
      mockSend.mock.calls[0][0].attachments
    ).toBeUndefined();

  });

});

// ---------------------------------------------------------------------------
// Completed
// ---------------------------------------------------------------------------
describe("notifyTalentClassRequestUpdate - completed", () => {

  test("uses completed subject", async () => {

    await notifyTalentClassRequestUpdate({

      ...args,

      status: "completed",

    });

    expect(
      mockSend.mock.calls[0][0].subject
    ).toContain("completada");

  });

});
// ---------------------------------------------------------------------------
// Expired
// ---------------------------------------------------------------------------
describe("notifyTalentClassRequestUpdate - expired", () => {

  test("uses expired subject", async () => {

    await notifyTalentClassRequestUpdate({

      ...args,

      status: "expired",

    });

    expect(
      mockSend.mock.calls[0][0].subject
    ).toContain("venció");

  });

});

describe("edge cases", () => {

  test("works without class name", async () => {

    await expect(

      notifyTalentClassRequestUpdate({

        ...args,

        className: null,

        status: "confirmed",

      })

    ).resolves.not.toThrow();

  });

  test("works without educator name", async () => {

    await expect(

      notifyTalentClassRequestUpdate({

        ...args,

        educatorName: null,

        status: "confirmed",

      })

    ).resolves.not.toThrow();

  });

});

test("confirmed uses green accent", async () => {
  await notifyTalentClassRequestUpdate({
    ...args,
    status: "confirmed",
  });

  const { html } = mockSend.mock.calls[0][0];

  expect(html).toContain("#059669");
});