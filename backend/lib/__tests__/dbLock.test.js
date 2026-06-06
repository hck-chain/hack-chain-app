// backend/lib/__tests__/dbLock.test.js
//
// Postgres advisory-lock helper. We don't spin up a real Postgres for
// these tests; instead we use a sequelize-shaped double that records
// the SQL queries and returns canned results.

const {
  withPgAdvisoryLock,
  LOCK_KEYS,
  __getDialect,
} = require("../dbLock");

function makeFakeSequelize({ dialect = "postgres", tryAcquireResult = true, queryError = null } = {}) {
  const calls = [];
  const sequelize = {
    getDialect: () => dialect,
    query: jest.fn().mockImplementation(async (sql, opts) => {
      calls.push({ sql, opts });
      if (queryError) throw queryError;
      if (sql.includes("pg_try_advisory_lock")) {
        return [[{ acquired: tryAcquireResult }], {}];
      }
      if (sql.includes("pg_advisory_unlock")) {
        return [[{ pg_advisory_unlock: true }], {}];
      }
      return [[], {}];
    }),
  };
  return { sequelize, calls };
}

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => jest.restoreAllMocks());

describe("LOCK_KEYS", () => {
  test("exposes TREASURY_FORWARDER as a bigint", () => {
    expect(typeof LOCK_KEYS.TREASURY_FORWARDER).toBe("bigint");
  });

  test("is frozen so two callers cannot collide by mutation", () => {
    expect(Object.isFrozen(LOCK_KEYS)).toBe(true);
  });
});

describe("__getDialect", () => {
  test("reads from sequelize.getDialect() when available", () => {
    expect(__getDialect({ getDialect: () => "postgres" })).toBe("postgres");
  });
  test("falls back to options.dialect for older Sequelize", () => {
    expect(__getDialect({ options: { dialect: "sqlite" } })).toBe("sqlite");
  });
  test("returns null for missing sequelize", () => {
    expect(__getDialect(null)).toBeNull();
  });
});

describe("withPgAdvisoryLock — Postgres dialect", () => {
  test("acquires lock, runs fn, releases lock — returns fn's value", async () => {
    const { sequelize, calls } = makeFakeSequelize({ tryAcquireResult: true });
    const fn = jest.fn().mockResolvedValue("ok-result");

    const result = await withPgAdvisoryLock(
      sequelize, LOCK_KEYS.TREASURY_FORWARDER, fn,
    );

    expect(result).toBe("ok-result");
    expect(fn).toHaveBeenCalledTimes(1);
    expect(calls.length).toBe(2);
    expect(calls[0].sql).toMatch(/pg_try_advisory_lock/);
    expect(calls[1].sql).toMatch(/pg_advisory_unlock/);
  });

  test("releases the lock even when fn throws", async () => {
    const { sequelize, calls } = makeFakeSequelize({ tryAcquireResult: true });
    const fn = jest.fn().mockRejectedValue(new Error("boom"));

    await expect(
      withPgAdvisoryLock(sequelize, LOCK_KEYS.TREASURY_FORWARDER, fn),
    ).rejects.toThrow("boom");

    expect(calls[calls.length - 1].sql).toMatch(/pg_advisory_unlock/);
  });

  test("skipped when pg_try_advisory_lock returns false (another instance holds it)", async () => {
    const { sequelize, calls } = makeFakeSequelize({ tryAcquireResult: false });
    const fn = jest.fn();
    const onSkip = jest.fn();

    const result = await withPgAdvisoryLock(
      sequelize, LOCK_KEYS.TREASURY_FORWARDER, fn, { onSkip },
    );

    expect(result).toEqual({ skipped: true });
    expect(fn).not.toHaveBeenCalled();
    expect(onSkip).toHaveBeenCalledTimes(1);
    // No unlock call when we never acquired.
    expect(calls.some((c) => c.sql.includes("pg_advisory_unlock"))).toBe(false);
  });

  test("fail-closed: if tryAdvisoryLock throws, fn is NOT run and onSkip fires", async () => {
    const { sequelize } = makeFakeSequelize({
      queryError: new Error("connection lost"),
    });
    const fn = jest.fn();
    const onSkip = jest.fn();

    const result = await withPgAdvisoryLock(
      sequelize, LOCK_KEYS.TREASURY_FORWARDER, fn, { onSkip },
    );

    expect(result).toEqual({ skipped: true });
    expect(fn).not.toHaveBeenCalled();
    expect(onSkip).toHaveBeenCalledTimes(1);
  });
});

describe("withPgAdvisoryLock — non-Postgres dialect (SQLite tests)", () => {
  test("runs fn directly without attempting any lock SQL", async () => {
    const { sequelize, calls } = makeFakeSequelize({ dialect: "sqlite" });
    const fn = jest.fn().mockResolvedValue(42);

    const result = await withPgAdvisoryLock(
      sequelize, LOCK_KEYS.TREASURY_FORWARDER, fn,
    );

    expect(result).toBe(42);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(calls.length).toBe(0); // no SQL issued
  });

  test("works for mysql / mariadb too (any non-postgres)", async () => {
    const { sequelize } = makeFakeSequelize({ dialect: "mysql" });
    const fn = jest.fn().mockResolvedValue("ok");
    await expect(
      withPgAdvisoryLock(sequelize, LOCK_KEYS.TREASURY_FORWARDER, fn),
    ).resolves.toBe("ok");
  });
});

describe("withPgAdvisoryLock — programmer-error guards", () => {
  test("throws TypeError when sequelize is missing", async () => {
    await expect(
      withPgAdvisoryLock(null, LOCK_KEYS.TREASURY_FORWARDER, () => {}),
    ).rejects.toThrow(TypeError);
  });
  test("throws TypeError when fn is not a function", async () => {
    const { sequelize } = makeFakeSequelize();
    await expect(
      withPgAdvisoryLock(sequelize, LOCK_KEYS.TREASURY_FORWARDER, "not-a-fn"),
    ).rejects.toThrow(TypeError);
  });
  test("throws TypeError when key is not bigint", async () => {
    const { sequelize } = makeFakeSequelize();
    await expect(
      withPgAdvisoryLock(sequelize, 42, () => {}),
    ).rejects.toThrow(TypeError);
  });
});
