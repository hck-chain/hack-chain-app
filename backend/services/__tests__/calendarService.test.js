const { buildGoogleCalendarUrl, buildICS, buildICSBuffer } = require("../calendarService");

const BASE_PARAMS = {
  title: "Clase con Ana",
  requestedDate: "2026-08-24",
  startTime: "20:00",
  durationMinutes: 60,
};

describe("buildGoogleCalendarUrl", () => {
  test("encodes the event's start/end as floating local time (no trailing Z)", () => {
    const url = buildGoogleCalendarUrl(BASE_PARAMS);
    const dates = new URL(url).searchParams.get("dates");
    expect(dates).toBe("20260824T200000/20260824T210000");
  });

  // Regression guard: the bug this fixes — before, the "20:00" the parties
  // agreed on was emitted with a Z suffix, so a calendar client would
  // re-convert it through the viewer's own timezone and show the wrong hour.
  test("does not append Z to the start/end datetimes", () => {
    const url = buildGoogleCalendarUrl(BASE_PARAMS);
    const dates = new URL(url).searchParams.get("dates");
    expect(dates).not.toMatch(/Z/);
  });

  test("includes the title and a sensible default description", () => {
    const url = buildGoogleCalendarUrl(BASE_PARAMS);
    const params = new URL(url).searchParams;
    expect(params.get("text")).toBe(BASE_PARAMS.title);
    expect(params.get("details")).toContain("HackChain");
  });
});

describe("buildICS", () => {
  test("DTSTART/DTEND are floating local time (no Z), matching the agreed hour", () => {
    const ics = buildICS(BASE_PARAMS);
    expect(ics).toContain("DTSTART:20260824T200000\r\n");
    expect(ics).toContain("DTEND:20260824T210000\r\n");
  });

  test("DTSTAMP is genuinely UTC (has a Z) since it represents the real 'now'", () => {
    const ics = buildICS(BASE_PARAMS);
    const dtstampLine = ics.split("\r\n").find((l) => l.startsWith("DTSTAMP:"));
    expect(dtstampLine).toMatch(/^DTSTAMP:\d{8}T\d{6}Z$/);
  });

  test("escapes special characters in title/description", () => {
    const ics = buildICS({ ...BASE_PARAMS, title: "Clase; avanzada, Node.js", description: "Línea 1\nLínea 2" });
    expect(ics).toContain("SUMMARY:Clase\\; avanzada\\, Node.js");
    expect(ics).toContain("DESCRIPTION:Línea 1\\nLínea 2");
  });
});

describe("buildICSBuffer", () => {
  test("returns a Buffer with the same content as buildICS", () => {
    const buf = buildICSBuffer(BASE_PARAMS);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.toString("utf-8")).toBe(buildICS(BASE_PARAMS));
  });
});
