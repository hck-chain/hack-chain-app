// backend/harjoot/client/__tests__/mockClient.test.js
//
// Verifies the mock client behaves as a drop-in substitute for the real one:
// well-formed default responses, call tracking, and override helpers.

const { createMockClient } = require("../mockClient");
const { HarjootError } = require("../errors");

describe("mockClient — default responses", () => {
  let client;
  beforeEach(() => {
    client = createMockClient();
  });

  test("getPartnerInfo returns a partner object with hackchain slug and modes", async () => {
    const result = await client.getPartnerInfo();
    expect(result.partner).toMatchObject({ slug: "hackchain", active: true });
    expect(result.modes).toEqual(expect.arrayContaining(["hash_only"]));
  });

  test.each([
    ["student", "talent"],
    ["issuer", "educator"],
    ["recruiter", "recruiter"],
  ])("activateAccess(%s) returns an active membership with segment %s", async (role, segment) => {
    const result = await client.activateAccess(role, { id: 1, wallet_address: "0x" }, {});
    expect(result.success).toBe(true);
    expect(result.membership.active).toBe(true);
    expect(result.membership.segment).toBe(segment);
    expect(new Date(result.membership.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  test("checkAccess returns active + expires_at in the future", async () => {
    const result = await client.checkAccess("0xWALLET", "student");
    expect(result.active).toBe(true);
    expect(new Date(result.expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  test("uploadCertificate echoes the document hash and produces verification URLs", async () => {
    const payload = {
      certificate: { id: "CERT-7", certificate_hash: "a".repeat(64) },
      document: { hash: "b".repeat(64) },
    };
    const result = await client.uploadCertificate(payload);

    expect(result.success).toBe(true);
    expect(result.certificate.partnerCertificateId).toBe("CERT-7");
    expect(result.certificate.document.hash).toBe("b".repeat(64));
    expect(result.certificate.verificationId).toMatch(/^HJ-P-MOCK-/);
    expect(result.certificate.verification.url).toContain(result.certificate.verificationId);
    expect(result.certificate.verification.qrCodeUrl).toContain(result.certificate.verificationId);
  });

  test("uploadCertificate falls back to certificate_hash when document.hash is absent", async () => {
    const payload = { certificate: { id: "X", certificate_hash: "c".repeat(64) } };
    const result = await client.uploadCertificate(payload);
    expect(result.certificate.document.hash).toBe("c".repeat(64));
  });

  test("notifyPayment resolves with success (unlike the real client which throws)", async () => {
    const result = await client.notifyPayment(["HJ-1"], "0xTX");
    expect(result.success).toBe(true);
  });
});

describe("mockClient — call tracking", () => {
  test("records every invocation with method name and args", async () => {
    const client = createMockClient();
    await client.getPartnerInfo();
    await client.checkAccess("0x", "student");
    await client.activateAccess("issuer", { id: 1, wallet_address: "0x" }, { organization_name: "Acme U" });

    expect(client.__calls).toHaveLength(3);
    expect(client.__calls[0]).toEqual({ method: "getPartnerInfo", args: [] });
    expect(client.__calls[1]).toEqual({ method: "checkAccess", args: ["0x", "student"] });
    expect(client.__calls[2].method).toBe("activateAccess");
    expect(client.__calls[2].args[0]).toBe("issuer");
  });

  test("__reset clears calls and pending overrides", async () => {
    const client = createMockClient();
    await client.getPartnerInfo();
    client.__setNextResponse("checkAccess", { active: false });
    client.__setNextError("uploadCertificate", new HarjootError("boom"));

    client.__reset();

    expect(client.__calls).toHaveLength(0);
    // After reset, defaults apply again — no error and no override.
    const accessResult = await client.checkAccess("0x", "student");
    expect(accessResult.active).toBe(true);
  });
});

describe("mockClient — override helpers", () => {
  let client;
  beforeEach(() => {
    client = createMockClient();
  });

  test("__setNextResponse overrides the very next call (one-shot)", async () => {
    client.__setNextResponse("getPartnerInfo", { partner: { slug: "override", active: false } });

    const first = await client.getPartnerInfo();
    expect(first.partner.slug).toBe("override");
    expect(first.partner.active).toBe(false);

    // Second call falls back to default.
    const second = await client.getPartnerInfo();
    expect(second.partner.slug).toBe("hackchain");
  });

  test("__setNextError makes the next call reject (one-shot)", async () => {
    const boom = new HarjootError("upstream went down");
    client.__setNextError("checkAccess", boom);

    await expect(client.checkAccess("0x", "student")).rejects.toBe(boom);
    // Subsequent calls succeed with default response.
    await expect(client.checkAccess("0x", "student")).resolves.toMatchObject({ active: true });
  });

  test("__setNextResponse with unknown method throws TypeError", () => {
    expect(() => client.__setNextResponse("notAMethod", {})).toThrow(TypeError);
  });

  test("__setNextError with unknown method throws TypeError", () => {
    expect(() => client.__setNextError("notAMethod", new Error())).toThrow(TypeError);
  });

  test("error takes precedence over response when both are queued for the same method", async () => {
    client.__setNextResponse("getPartnerInfo", { partner: { slug: "x" } });
    client.__setNextError("getPartnerInfo", new HarjootError("force"));

    await expect(client.getPartnerInfo()).rejects.toThrow("force");
    // The next call still has the response queued — error was the one consumed.
    await expect(client.getPartnerInfo()).resolves.toMatchObject({ partner: { slug: "x" } });
  });
});

describe("mockClient — public surface matches httpClient", () => {
  test("exposes the same five methods as the real client", () => {
    const client = createMockClient();
    expect(typeof client.getPartnerInfo).toBe("function");
    expect(typeof client.activateAccess).toBe("function");
    expect(typeof client.checkAccess).toBe("function");
    expect(typeof client.uploadCertificate).toBe("function");
    expect(typeof client.notifyPayment).toBe("function");
  });
});
