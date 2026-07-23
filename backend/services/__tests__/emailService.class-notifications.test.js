// backend/services/__tests__/emailService.class-notifications.test.js
//
// Unit tests for notifyClassReminder and notifyTalentCertificateIssued.
// Mocks Resend so no real emails are sent.

const mockSend = jest.fn().mockResolvedValue({ id: "mock-id" });

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: mockSend },
  })),
}));

process.env.RESEND_API_KEY  ||= "test-resend-key";
process.env.RESEND_FROM     ||= "noreply@test.hackchain.app";
process.env.FRONTEND_URL    ||= "https://test.hackchain.app";

const { notifyClassReminder, notifyTalentCertificateIssued } = require("../emailService");

const RECIPIENT = "talent@example.com";
const BASE_CLASS = {
  className:       "Ethical Hacking 101",
  requestedDate:   "2026-07-01",
  startTime:       "10:00",
  durationMinutes: 60,
};

beforeEach(() => {
  mockSend.mockClear();
});

// ---------------------------------------------------------------------------
// notifyClassReminder
// ---------------------------------------------------------------------------

describe("notifyClassReminder — student role", () => {
  const args = {
    to:              RECIPIENT,
    recipientName:   "Ana López",
    counterpartName: "HackAcademy",
    role:            "student",
    ...BASE_CLASS,
  };

  test("calls resend.emails.send exactly once", async () => {
    await notifyClassReminder(args);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient address", async () => {
    await notifyClassReminder(args);
    expect(mockSend.mock.calls[0][0].to).toBe(RECIPIENT);
  });

  test("subject mentions tomorrow / recordatorio", async () => {
    await notifyClassReminder(args);
    const { subject } = mockSend.mock.calls[0][0];
    expect(subject).toMatch(/recordatorio|mañana/i);
  });

  test("text body contains class date", async () => {
    await notifyClassReminder(args);
    expect(mockSend.mock.calls[0][0].text).toContain("2026-07-01");
  });

  test("text body contains start time", async () => {
    await notifyClassReminder(args);
    expect(mockSend.mock.calls[0][0].text).toContain("10:00");
  });

  test("text body contains class name", async () => {
    await notifyClassReminder(args);
    expect(mockSend.mock.calls[0][0].text).toContain("Ethical Hacking 101");
  });

  test("text body contains counterpart (educator) name", async () => {
    await notifyClassReminder(args);
    expect(mockSend.mock.calls[0][0].text).toContain("HackAcademy");
  });

  test("html body contains Google Calendar link", async () => {
    await notifyClassReminder(args);
    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain("calendar.google.com");
  });
});

describe("notifyClassReminder — educator role", () => {
  const args = {
    to:              "educator@example.com",
    recipientName:   "Carlos Pérez",
    counterpartName: "Ana López",
    role:            "educator",
    ...BASE_CLASS,
  };

  test("calls resend.emails.send exactly once", async () => {
    await notifyClassReminder(args);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("subject is the same reminder copy regardless of role", async () => {
    await notifyClassReminder(args);
    const { subject } = mockSend.mock.calls[0][0];
    expect(subject).toMatch(/recordatorio|mañana/i);
  });

  test("html labels counterpart as Estudiante for educator role", async () => {
    await notifyClassReminder(args);
    const { html } = mockSend.mock.calls[0][0];
    expect(html).toMatch(/Estudiante/i);
  });
});

describe("notifyClassReminder — null values", () => {
  test("handles null className without throwing", async () => {
    await expect(
      notifyClassReminder({
        to:              RECIPIENT,
        recipientName:   null,
        counterpartName: null,
        role:            "student",
        className:       null,
        requestedDate:   "2026-07-01",
        startTime:       "09:00",
        durationMinutes: 30,
      })
    ).resolves.not.toThrow();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// notifyTalentCertificateIssued
// ---------------------------------------------------------------------------

describe("notifyTalentCertificateIssued", () => {
  const args = {
    to:               RECIPIENT,
    studentName:      "Ana López",
    educatorName:     "HackAcademy",
    certificateTitle: "Ethical Hacking Fundamentals",
    dashboardUrl:     "https://test.hackchain.app/dashboard/talent",
  };

  test("calls resend.emails.send exactly once", async () => {
    await notifyTalentCertificateIssued(args);
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient address", async () => {
    await notifyTalentCertificateIssued(args);
    expect(mockSend.mock.calls[0][0].to).toBe(RECIPIENT);
  });

  test("subject contains the certificate title", async () => {
    await notifyTalentCertificateIssued(args);
    const { subject } = mockSend.mock.calls[0][0];
    expect(subject).toContain("Ethical Hacking Fundamentals");
  });

  test("text body contains educator name", async () => {
    await notifyTalentCertificateIssued(args);
    expect(mockSend.mock.calls[0][0].text).toContain("HackAcademy");
  });

  test("text body contains dashboard link", async () => {
    await notifyTalentCertificateIssued(args);
    expect(mockSend.mock.calls[0][0].text).toContain("https://test.hackchain.app/dashboard/talent");
  });

  test("html body contains certificate title", async () => {
    await notifyTalentCertificateIssued(args);
    const { html } = mockSend.mock.calls[0][0];
    expect(html).toContain("Ethical Hacking Fundamentals");
  });

  test("handles null certificateTitle without throwing", async () => {
    await expect(
      notifyTalentCertificateIssued({ ...args, certificateTitle: null })
    ).resolves.not.toThrow();
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("handles null educatorName without throwing", async () => {
    await expect(
      notifyTalentCertificateIssued({ ...args, educatorName: null })
    ).resolves.not.toThrow();
  });

  test("html escapes malicious input in certificateTitle", async () => {
    await notifyTalentCertificateIssued({
      ...args,
      certificateTitle: '<script>alert("xss")</script>',
    });
    const { html } = mockSend.mock.calls[0][0];
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

test("html escapes malicious input in educatorName", async () => {
  await notifyTalentCertificateIssued({
    ...args,
    educatorName: '<img src=x onerror=alert(1)>',
  });

  const { html } = mockSend.mock.calls[0][0];

  expect(html).not.toContain('<img src=x onerror=alert(1)>');
  expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
});
});
