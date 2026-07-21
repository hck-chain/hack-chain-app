// backend/services/__tests__/emailService.educator-approved.test.js

const mockSend = jest.fn().mockResolvedValue({ id: "mock-id" });

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

process.env.RESEND_API_KEY ||= "test-resend-key";
process.env.RESEND_FROM ||= "HackChain <noreply@hackchain.app>";
process.env.FRONTEND_URL ||= "https://test.hackchain.app";

const { 
  notifyEducatorApproved,
  notifyEducatorRejected,
  sendInvite,
  notifyEducatorClaimed,
  notifyAdminNewEducator,
  notifyAdminEducatorReapply,
  notifyEducatorClassRequest,
  notifyEducatorClassConfirmed,
  notifyEducatorClassCancelled,
  notifyClassReminder,
  notifyTalentCertificateIssued
 } = require("../emailService");

beforeEach(() => {
  mockSend.mockClear();
});

describe("notifyEducatorApproved", () => {
  const args = {
    to: "educator@example.com",
    name: "Luis Soto",
  };

  test("calls resend.emails.send exactly once", async () => {
    await notifyEducatorApproved(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses the correct recipient", async () => {
    await notifyEducatorApproved(args);

    expect(mockSend.mock.calls[0][0].to).toBe(args.to);
  });

  test("uses the correct subject", async () => {
    await notifyEducatorApproved(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("aprobada");
  });

  test("contains the headline", async () => {
    await notifyEducatorApproved(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("¡Cuenta aprobada!");
  });

  test("contains the dashboard button", async () => {
    await notifyEducatorApproved(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Ir al dashboard");
  });

  test("contains the dashboard url", async () => {
    await notifyEducatorApproved(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain(
      "https://test.hackchain.app/educator/dashboard"
    );
  });

  test("contains recipient email", async () => {
    await notifyEducatorApproved(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("educator@example.com");
  });

  test("contains the educator name", async () => {
    await notifyEducatorApproved(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Luis Soto");
  });

  test("handles null name without throwing", async () => {
    await expect(
      notifyEducatorApproved({
        to: "educator@example.com",
        name: null,
      })
    ).resolves.not.toThrow();

    expect(mockSend).toHaveBeenCalledTimes(1);
  });
});
  // ---------------------------------------------------------------------------
// notifyEducatorRejected
// ---------------------------------------------------------------------------


describe("notifyEducatorRejected", () => {
  const args = {
    to: "educator@example.com",
    name: "Luis Soto",
    reason: "No se pudo verificar la información proporcionada.",
  };

  beforeEach(() => {
    mockSend.mockClear();
  });

  test("calls resend.emails.send once", async () => {
    await notifyEducatorRejected(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient", async () => {
    await notifyEducatorRejected(args);

    expect(mockSend.mock.calls[0][0].to).toBe(args.to);
  });

  test("subject is correct", async () => {
    await notifyEducatorRejected(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("Tu solicitud de educador en HackChain fue revisada");
  });

  test("html contains rejection reason", async () => {
    await notifyEducatorRejected(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain(args.reason);
  });

  test("does not include CTA button", async () => {
    await notifyEducatorRejected(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).not.toContain("Ir al dashboard");
  });
});

// ---------------------------------------------------------------------------
// sendInvite
// ---------------------------------------------------------------------------


describe("sendInvite", () => {

  const args = {
    to: "talent@example.com",
    walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
    educatorName: "HackChain Academy",
    message: "Nos gustaría emitirte tu certificado.",
  };

  beforeEach(() => {
    mockSend.mockClear();
  });

  test("calls resend.emails.send once", async () => {
    await sendInvite(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient", async () => {
    await sendInvite(args);

    expect(mockSend.mock.calls[0][0].to).toBe(args.to);
  });

  test("subject contains educator name", async () => {
    await sendInvite(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("HackChain Academy");
  });

  test("html contains wallet", async () => {
    await sendInvite(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("0x1234");
  });

  test("html contains educator message", async () => {
    await sendInvite(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Nos gustaría emitirte");
  });

  test("html contains register button", async () => {
    await sendInvite(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Crear mi cuenta");
  });

  test("html contains register url", async () => {
    await sendInvite(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("/register?wallet=");
  });

  test("works without educator message", async () => {

  await sendInvite({
    ...args,
    message: null,
  });

  const { html } = mockSend.mock.calls[0][0];

  expect(html).not.toContain("blockquote");
});

test("uses default educator name", async () => {

  await sendInvite({
    ...args,
    educatorName: null,
  });

  const { html } = mockSend.mock.calls[0][0];

  expect(html).toContain("Un educador");
});

});

  // ---------------------------------------------------------------------------
// notifyEducatorRejected
// ---------------------------------------------------------------------------


describe("notifyEducatorClaimed", () => {

  const args = {
    to: "educator@example.com",
    educatorName: "Luis Soto",
    studentWallet: "0x1234567890abcdef1234567890abcdef12345678",
    studentName: "Juan Pérez",
  };

  beforeEach(() => {
    mockSend.mockClear();
  });

  test("calls resend.emails.send once", async () => {
    await notifyEducatorClaimed(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient", async () => {
    await notifyEducatorClaimed(args);

    expect(mockSend.mock.calls[0][0].to).toBe(args.to);
  });

  test("subject is correct", async () => {
    await notifyEducatorClaimed(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("se registró");
  });

  test("html contains student name", async () => {
    await notifyEducatorClaimed(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Juan Pérez");
  });

  test("html contains shortened wallet", async () => {
    await notifyEducatorClaimed(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("0x1234");
  });

  test("html contains dashboard button", async () => {
    await notifyEducatorClaimed(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Ir al Dashboard");
  });

  test("html contains dashboard url", async () => {
    await notifyEducatorClaimed(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("/educator-dashboard");
  });

});

// ---------------------------------------------------------------------------
// notifyAdminNewEducator
// ---------------------------------------------------------------------------

describe("notifyAdminNewEducator", () => {

  const args = {
    to: "admin@example.com",
    name: "Luis Soto",
    email: "luis@example.com",
    wallet: "0x1234567890abcdef1234567890abcdef12345678",
    organization: "HackChain Academy",
  };

  beforeEach(() => {
    mockSend.mockClear();
  });

  test("calls resend.emails.send once", async () => {
    await notifyAdminNewEducator(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient", async () => {
    await notifyAdminNewEducator(args);

    expect(mockSend.mock.calls[0][0].to).toBe(args.to);
  });

  test("subject contains educator name", async () => {
    await notifyAdminNewEducator(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("Luis Soto");
  });

  test("html contains organization", async () => {
    await notifyAdminNewEducator(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("HackChain Academy");
  });

  test("html contains email", async () => {
    await notifyAdminNewEducator(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("luis@example.com");
  });

  test("html contains wallet", async () => {
    await notifyAdminNewEducator(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain(args.wallet);
  });

  test("html contains admin url", async () => {
    await notifyAdminNewEducator(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("/admin");
  });

  test("works without organization", async () => {
  await expect(
    notifyAdminNewEducator({
      ...args,
      organization: null,
    })
  ).resolves.not.toThrow();
});

test("works without name", async () => {
  await expect(
    notifyAdminNewEducator({
      ...args,
      name: null,
    })
  ).resolves.not.toThrow();
});

test("works without email", async () => {
  await expect(
    notifyAdminNewEducator({
      ...args,
      email: null,
    })
  ).resolves.not.toThrow();
});

test("does not send when recipient is empty", async () => {
  await notifyAdminNewEducator({
    ...args,
    to: [],
  });

  expect(mockSend).not.toHaveBeenCalled();
});

});

// ---------------------------------------------------------------------------
// notifyAdminEducatorReapply
// ---------------------------------------------------------------------------


describe("notifyAdminEducatorReapply", () => {

  const args = {
    to: "admin@example.com",
    name: "Luis Soto",
    email: "luis@example.com",
    wallet: "0x1234567890abcdef1234567890abcdef12345678",
    organization: "HackChain Academy",
  };

  beforeEach(() => {
    mockSend.mockClear();
  });

  test("calls resend.emails.send once", async () => {
    await notifyAdminEducatorReapply(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient", async () => {
    await notifyAdminEducatorReapply(args);

    expect(mockSend.mock.calls[0][0].to).toBe(args.to);
  });

  test("subject contains educator name", async () => {
    await notifyAdminEducatorReapply(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("Luis Soto");
  });

  test("html contains organization", async () => {
    await notifyAdminEducatorReapply(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("HackChain Academy");
  });

  test("html contains email", async () => {
    await notifyAdminEducatorReapply(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("luis@example.com");
  });

  test("html contains wallet", async () => {
    await notifyAdminEducatorReapply(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain(args.wallet);
  });

  test("html contains admin url", async () => {
    await notifyAdminEducatorReapply(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("/admin");
  });

  test("works without organization", async () => {
  await expect(
    notifyAdminEducatorReapply({
      ...args,
      organization: null,
    })
  ).resolves.not.toThrow();
});

test("works without name", async () => {
  await expect(
    notifyAdminEducatorReapply({
      ...args,
      name: null,
    })
  ).resolves.not.toThrow();
});

test("works without email", async () => {
  await expect(
    notifyAdminEducatorReapply({
      ...args,
      email: null,
    })
  ).resolves.not.toThrow();
});

test("does not send when recipient is empty", async () => {
  await notifyAdminEducatorReapply({
    ...args,
    to: [],
  });

  expect(mockSend).not.toHaveBeenCalled();
});

});
// ---------------------------------------------------------------------------
// notifyEducatorClassRequest
// ---------------------------------------------------------------------------


describe("notifyEducatorClassRequest", () => {

  const args = {
    to: "educator@example.com",
    educatorName: "Luis Soto",
    studentName: "Juan Pérez",
    requestedDate: "2026-08-12",
    startTime: "18:00",
    durationMinutes: 90,
    className: "React Avanzado",
  };

  beforeEach(() => {
    mockSend.mockClear();
  });

  test("calls resend.emails.send once", async () => {
    await notifyEducatorClassRequest(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient", async () => {
    await notifyEducatorClassRequest(args);

    expect(mockSend.mock.calls[0][0].to).toBe(args.to);
  });

  test("subject contains student name", async () => {
    await notifyEducatorClassRequest(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("Juan Pérez");
  });

  test("html contains class name", async () => {
    await notifyEducatorClassRequest(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("React Avanzado");
  });

  test("html contains requested date", async () => {
    await notifyEducatorClassRequest(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("2026-08-12");
  });

  test("html contains start time", async () => {
    await notifyEducatorClassRequest(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("18:00");
  });

  test("html contains duration", async () => {
    await notifyEducatorClassRequest(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("90");
  });

  test("html contains dashboard url", async () => {
    await notifyEducatorClassRequest(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("/educator/dashboard");
  });

  test("works without class name", async () => {
  await expect(
    notifyEducatorClassRequest({
      ...args,
      className: null,
    })
  ).resolves.not.toThrow();
});

test("works without educator name", async () => {
  await expect(
    notifyEducatorClassRequest({
      ...args,
      educatorName: null,
    })
  ).resolves.not.toThrow();
});

test("works without student name", async () => {
  await expect(
    notifyEducatorClassRequest({
      ...args,
      studentName: null,
    })
  ).resolves.not.toThrow();
});

});



// ---------------------------------------------------------------------------
// notifyEducatorClassConfirmed
// ---------------------------------------------------------------------------
describe("notifyEducatorClassConfirmed", () => {
  const args = {
    to: "educator@example.com",
    educatorName: "Carlos Pérez",
    studentName: "Ana López",
    className: "React Avanzado",
    requestedDate: "2026-08-15",
    startTime: "18:00",
    durationMinutes: 90,
    requestId: "req-123",
  };

  beforeEach(() => {
    mockSend.mockClear();
  });

  test("calls resend.emails.send exactly once", async () => {
    await notifyEducatorClassConfirmed(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses the correct recipient", async () => {
    await notifyEducatorClassConfirmed(args);

    expect(mockSend.mock.calls[0][0].to).toBe(
      "educator@example.com"
    );
  });

  test("subject contains class name", async () => {
    await notifyEducatorClassConfirmed(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("React Avanzado");
  });

  test("text contains student name", async () => {
    await notifyEducatorClassConfirmed(args);

    expect(mockSend.mock.calls[0][0].text)
      .toContain("Ana López");
  });

  test("html contains class information", async () => {
    await notifyEducatorClassConfirmed(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("React Avanzado");
    expect(html).toContain("Ana López");
    expect(html).toContain("2026-08-15");
    expect(html).toContain("18:00");
    expect(html).toContain("90 min");
  });

  test("html contains Google Calendar button", async () => {
    await notifyEducatorClassConfirmed(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("calendar.google.com");
  });

  test("includes .ics attachment", async () => {
    await notifyEducatorClassConfirmed(args);

    const payload = mockSend.mock.calls[0][0];

    expect(payload.attachments).toHaveLength(1);

    expect(payload.attachments[0].filename)
      .toBe("clase-hackchain.ics");

    expect(payload.attachments[0].contentType)
      .toContain("text/calendar");
  });

  test("dashboard link exists in html", async () => {
    await notifyEducatorClassConfirmed(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain(
      "https://test.hackchain.app/educator/dashboard"
    );
  });

  test("works without className", async () => {
    await expect(
      notifyEducatorClassConfirmed({
        ...args,
        className: null,
      })
    ).resolves.not.toThrow();
  });

  test("works without studentName", async () => {
    await expect(
      notifyEducatorClassConfirmed({
        ...args,
        studentName: null,
      })
    ).resolves.not.toThrow();
  });

  test("uses default duration when durationMinutes is null", async () => {
    await notifyEducatorClassConfirmed({
      ...args,
      durationMinutes: null,
    });

    expect(mockSend.mock.calls[0][0].text)
      .toContain("60 min");
  });

  test("creates calendar attachment", async () => {
  await notifyEducatorClassConfirmed(args);

  const attachment =
    mockSend.mock.calls[0][0].attachments[0];

  expect(Buffer.isBuffer(attachment.content)).toBe(true);
  });

test("html contains Google Calendar URL", async () => {
  await notifyEducatorClassConfirmed(args);

  const { html } = mockSend.mock.calls[0][0];

  expect(html).toMatch(/calendar\.google\.com/);
  });
});

// ---------------------------------------------------------------------------
// notifyEducatorClassCanceled
// ---------------------------------------------------------------------------

describe("notifyEducatorClassCancelled", () => {
  const args = {
    to: "educator@example.com",
    educatorName: "Carlos Pérez",
    studentName: "Ana López",
    className: "React Avanzado",
    requestedDate: "2026-08-20",
    startTime: "18:00",
    durationMinutes: 90,
    cancellationReason: "No podré asistir",
  };

  beforeEach(() => {
    mockSend.mockClear();
  });

  test("calls resend.emails.send exactly once", async () => {
    await notifyEducatorClassCancelled(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses the correct recipient", async () => {
    await notifyEducatorClassCancelled(args);

    expect(mockSend.mock.calls[0][0].to)
      .toBe("educator@example.com");
  });

  test("subject contains student name", async () => {
    await notifyEducatorClassCancelled(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("Ana López");
  });

  test("text contains cancellation reason", async () => {
    await notifyEducatorClassCancelled(args);

    expect(mockSend.mock.calls[0][0].text)
      .toContain("No podré asistir");
  });

  test("html contains class information", async () => {
    await notifyEducatorClassCancelled(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("React Avanzado");
    expect(html).toContain("Ana López");
    expect(html).toContain("2026-08-20");
    expect(html).toContain("18:00");
    expect(html).toContain("90 min");
  });

  test("html contains cancellation reason", async () => {
    await notifyEducatorClassCancelled(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("No podré asistir");
  });

  test("contains educator dashboard link", async () => {
    await notifyEducatorClassCancelled(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain(
      "https://test.hackchain.app/educator/dashboard"
    );
  });

  test("works without className", async () => {
    await expect(
      notifyEducatorClassCancelled({
        ...args,
        className: null,
      })
    ).resolves.not.toThrow();
  });

  test("works without cancellationReason", async () => {
    await expect(
      notifyEducatorClassCancelled({
        ...args,
        cancellationReason: null,
      })
    ).resolves.not.toThrow();
  });

  test("does not render reason when cancellationReason is null", async () => {
    await notifyEducatorClassCancelled({
      ...args,
      cancellationReason: null,
    });

    const { html } = mockSend.mock.calls[0][0];

    expect(html).not.toContain("Motivo");
  });
});

// ---------------------------------------------------------------------------
// notifyClassReminder
// ---------------------------------------------------------------------------

describe("notifyClassReminder", () => {
  const studentArgs = {
    to: "student@example.com",
    recipientName: "Ana López",
    counterpartName: "Carlos Pérez",
    role: "student",
    className: "React Avanzado",
    requestedDate: "2026-08-25",
    startTime: "18:00",
    durationMinutes: 90,
  };

  const educatorArgs = {
    ...studentArgs,
    to: "educator@example.com",
    recipientName: "Carlos Pérez",
    counterpartName: "Ana López",
    role: "educator",
  };

  beforeEach(() => {
    mockSend.mockClear();
  });

  test("calls resend.emails.send exactly once", async () => {
    await notifyClassReminder(studentArgs);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient", async () => {
    await notifyClassReminder(studentArgs);

    expect(mockSend.mock.calls[0][0].to)
      .toBe("student@example.com");
  });

  test("subject mentions reminder", async () => {
    await notifyClassReminder(studentArgs);

    expect(mockSend.mock.calls[0][0].subject)
      .toMatch(/Recordatorio/i);
  });

  test("html contains class information", async () => {
    await notifyClassReminder(studentArgs);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("React Avanzado");
    expect(html).toContain("Ana López");
    expect(html).toContain("Carlos Pérez");
    expect(html).toContain("2026-08-25");
    expect(html).toContain("18:00");
    expect(html).toContain("90 min");
  });

  test("html contains Google Calendar button", async () => {
    await notifyClassReminder(studentArgs);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Abrir Google Calendar");
    expect(html).toContain("calendar.google.com");
  });

  test("student version uses talent dashboard", async () => {
    await notifyClassReminder(studentArgs);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain(
      "https://test.hackchain.app/dashboard/talent/classes"
    );
  });

  test("educator version uses educator dashboard", async () => {
    await notifyClassReminder(educatorArgs);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain(
      "https://test.hackchain.app/educator/dashboard"
    );
  });

  test("educator version labels counterpart as Estudiante", async () => {
    await notifyClassReminder(educatorArgs);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Estudiante");
  });

  test("student version labels counterpart as Educador", async () => {
    await notifyClassReminder(studentArgs);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Educador");
  });

  test("works without className", async () => {
    await expect(
      notifyClassReminder({
        ...studentArgs,
        className: null,
      })
    ).resolves.not.toThrow();
  });

  test("works without counterpartName", async () => {
    await expect(
      notifyClassReminder({
        ...studentArgs,
        counterpartName: null,
      })
    ).resolves.not.toThrow();
  });

  test("text contains reminder information", async () => {
    await notifyClassReminder(studentArgs);

    const { text } = mockSend.mock.calls[0][0];

    expect(text).toContain("mañana");
    expect(text).toContain("React Avanzado");
    expect(text).toContain("18:00");
    expect(text).toContain("90");
  });

  test("google calendar url is generated", async () => {
  await notifyClassReminder(studentArgs);

  const { html } = mockSend.mock.calls[0][0];

  expect(html).toContain("https://calendar.google.com");
});
});

// ---------------------------------------------------------------------------
// notifyTalentCertificateIssued
// ---------------------------------------------------------------------------

describe("notifyTalentCertificateIssued", () => {
  const args = {
    to: "student@example.com",
    studentName: "Luis Soto",
    educatorName: "HackAcademy",
    certificateTitle: "React Professional",
    dashboardUrl: "https://test.hackchain.app/dashboard/talent",
  };

  test("calls resend.emails.send once", async () => {
    await notifyTalentCertificateIssued(args);

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("uses correct recipient", async () => {
    await notifyTalentCertificateIssued(args);

    expect(mockSend.mock.calls[0][0].to).toBe(
      "student@example.com"
    );
  });

  test("subject contains certificate title", async () => {
    await notifyTalentCertificateIssued(args);

    expect(mockSend.mock.calls[0][0].subject)
      .toContain("React Professional");
  });

  test("text contains educator name", async () => {
    await notifyTalentCertificateIssued(args);

    expect(mockSend.mock.calls[0][0].text)
      .toContain("HackAcademy");
  });

  test("text contains dashboard url", async () => {
    await notifyTalentCertificateIssued(args);

    expect(mockSend.mock.calls[0][0].text)
      .toContain("https://test.hackchain.app/dashboard/talent");
  });

  test("html contains certificate title", async () => {
    await notifyTalentCertificateIssued(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("React Professional");
  });

  test("html contains CTA label", async () => {
    await notifyTalentCertificateIssued(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("Ver mi certificado");
  });

  test("html contains dashboard link", async () => {
    await notifyTalentCertificateIssued(args);

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain(
      "https://test.hackchain.app/dashboard/talent"
    );
  });

  test("handles null certificateTitle", async () => {
    await expect(
      notifyTalentCertificateIssued({
        ...args,
        certificateTitle: null,
      })
    ).resolves.not.toThrow();

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("handles null educatorName", async () => {
    await expect(
      notifyTalentCertificateIssued({
        ...args,
        educatorName: null,
      })
    ).resolves.not.toThrow();

    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  test("escapes malicious certificateTitle", async () => {
    await notifyTalentCertificateIssued({
      ...args,
      certificateTitle: '<script>alert("x")</script>',
    });

    const { html } = mockSend.mock.calls[0][0];

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("escapes malicious educatorName", async () => {
    await notifyTalentCertificateIssued({
      ...args,
      educatorName: '<img src=x onerror=alert(1)>',
    });

    const { html } = mockSend.mock.calls[0][0];

    expect(html).toContain("&lt;img");
    expect(html).not.toContain('<img src=x onerror=alert(1)>');
  });

});