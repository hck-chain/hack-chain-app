const { localWallClockToUtcMs, PLATFORM_TIME_ZONE } = require("../localWallClockTime");

describe("localWallClockToUtcMs", () => {
  test("converts a Mexico City wall-clock time to the correct UTC instant (UTC-6)", () => {
    const ms = localWallClockToUtcMs("2026-08-24", "20:00");
    expect(new Date(ms).toISOString()).toBe("2026-08-25T02:00:00.000Z");
  });

  test("defaults to PLATFORM_TIME_ZONE when no timezone is passed", () => {
    const withDefault = localWallClockToUtcMs("2026-08-24", "20:00");
    const explicit = localWallClockToUtcMs("2026-08-24", "20:00", PLATFORM_TIME_ZONE);
    expect(withDefault).toBe(explicit);
  });

  test("does not shift when explicitly given UTC", () => {
    const ms = localWallClockToUtcMs("2026-08-24", "20:00", "UTC");
    expect(new Date(ms).toISOString()).toBe("2026-08-24T20:00:00.000Z");
  });

  test("handles midnight correctly", () => {
    const ms = localWallClockToUtcMs("2026-08-24", "00:00");
    expect(new Date(ms).toISOString()).toBe("2026-08-24T06:00:00.000Z");
  });

  test("rolls over to the next UTC day near midnight local time", () => {
    const ms = localWallClockToUtcMs("2026-08-24", "23:30");
    expect(new Date(ms).toISOString()).toBe("2026-08-25T05:30:00.000Z");
  });

  // Regression guard: this is the exact bug reported — a class agreed for
  // 20:00 was showing up 4 hours off. A naive `new Date(`${date}T${time}:00Z`)`
  // would have returned 20:00 UTC here; the correct instant is 02:00 UTC the
  // next day, six hours later.
  test("is NOT the same instant as naively treating the wall-clock time as UTC", () => {
    const naiveMs = new Date("2026-08-24T20:00:00Z").getTime();
    const correctMs = localWallClockToUtcMs("2026-08-24", "20:00");
    expect(correctMs).not.toBe(naiveMs);
    expect(correctMs - naiveMs).toBe(6 * 60 * 60 * 1000);
  });
});
