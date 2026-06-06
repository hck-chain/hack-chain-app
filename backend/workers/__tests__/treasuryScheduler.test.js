// backend/workers/__tests__/treasuryScheduler.test.js
//
// Two surfaces under test:
//   runTreasuryForwarderOnce — pure invocation, dep wiring, soft-fail on
//     a misconfigured strategy or a worker exception.
//   scheduleTreasuryForwarder — cron registration with default expression,
//     in-process lock that drops overlapping ticks, no work-loop crash
//     when the tick rejects.

const {
  runTreasuryForwarderOnce,
  scheduleTreasuryForwarder,
  __DEFAULT_CRON_EXPRESSION,
} = require("../treasuryForwarder");
const { getCorrelationId } = require("../../lib/correlationContext");

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => jest.restoreAllMocks());

// ---------------------------------------------------------------------------
// runTreasuryForwarderOnce — pure tick
// ---------------------------------------------------------------------------

describe("runTreasuryForwarderOnce", () => {
  // Minimal DB stand-in: only the surface processTreasuryQueue actually
  // touches when the queue is empty (findAll returns []).
  function makeEmptyModels() {
    return {
      TreasuryTransfer: { findAll: jest.fn().mockResolvedValue([]) },
      Payment: {},
      Certificate: {},
    };
  }

  test("happy path: routes selectStrategy + models + harjootClient into the worker; empty queue -> processed=0", async () => {
    const models = makeEmptyModels();
    const strategy = { convert: jest.fn() };
    const selectStrategy = jest.fn().mockReturnValue({ mode: "manual", strategy });
    const harjootClient = { notifyPayment: jest.fn() };

    const result = await runTreasuryForwarderOnce({
      models, selectStrategy, harjootClient,
    });

    expect(selectStrategy).toHaveBeenCalledTimes(1);
    expect(models.TreasuryTransfer.findAll).toHaveBeenCalledTimes(1);
    // Empty queue -> strategy.convert never invoked.
    expect(strategy.convert).not.toHaveBeenCalled();
    expect(result).toMatchObject({ processed: 0, mode: null });
    // 9a adds correlation_id propagation; just sanity-check it's a string.
    expect(typeof result.correlationId).toBe("string");
  });

  test("strategy factory throws (unknown mode) -> soft fail, no crash", async () => {
    const result = await runTreasuryForwarderOnce({
      models: makeEmptyModels(),
      harjootClient: { notifyPayment: jest.fn() },
      selectStrategy: () => { throw new Error("Unknown TREASURY_CONVERSION_MODE=manaul"); },
    });

    expect(result.failed).toBe(true);
    expect(result.error).toMatch(/Unknown TREASURY_CONVERSION_MODE/);
  });

  test("processTreasuryQueue dep TypeError -> soft fail (logged, not rethrown)", async () => {
    // Force the worker to throw TypeError by handing it a malformed
    // strategy object.
    const result = await runTreasuryForwarderOnce({
      models: makeEmptyModels(),
      harjootClient: { notifyPayment: jest.fn() },
      // Strategy without convert() — processTreasuryQueue assertDeps throws TypeError.
      selectStrategy: () => ({ mode: "manual", strategy: {} }),
    });

    expect(result.failed).toBe(true);
    expect(result.error).toMatch(/convert/);
  });

  test("generates a cron-<uuid> correlation id and makes it readable from getCorrelationId during the tick", async () => {
    let observedDuringTick;
    const models = {
      TreasuryTransfer: {
        findAll: jest.fn().mockImplementation(async () => {
          observedDuringTick = getCorrelationId();
          return [];
        }),
      },
      Payment: {}, Certificate: {},
      sequelize: { getDialect: () => "sqlite" },
    };
    const result = await runTreasuryForwarderOnce({
      models,
      selectStrategy: () => ({ mode: "manual", strategy: { convert: jest.fn() } }),
      harjootClient: { notifyPayment: jest.fn() },
    });
    expect(observedDuringTick).toMatch(/^cron-[0-9a-f-]{36}$/);
    expect(result.correlationId).toBe(observedDuringTick);
    // Context is cleared after the tick ends.
    expect(getCorrelationId()).toBeUndefined();
  });

  test("honors an explicit options.correlationId for ops-triggered runs", async () => {
    let observed;
    const models = {
      TreasuryTransfer: {
        findAll: jest.fn().mockImplementation(async () => {
          observed = getCorrelationId();
          return [];
        }),
      },
      Payment: {}, Certificate: {},
      sequelize: { getDialect: () => "sqlite" },
    };
    const result = await runTreasuryForwarderOnce({
      models,
      correlationId: "ops-manual-drain-2026-06-05",
      selectStrategy: () => ({ mode: "manual", strategy: { convert: jest.fn() } }),
      harjootClient: { notifyPayment: jest.fn() },
    });
    expect(observed).toBe("ops-manual-drain-2026-06-05");
    expect(result.correlationId).toBe("ops-manual-drain-2026-06-05");
  });

  test("forwards usdtTransfer + harjootWallet + batchSize to processTreasuryQueue", async () => {
    // Use a non-empty queue so the strategy actually runs, then assert
    // on the params the worker received via spies.
    const fakeRow = {
      id: 1,
      Payment: { amount_hack: "6900", Certificate: { harjoot_verification_id: "ver_z" } },
    };
    const models = {
      TreasuryTransfer: {
        findAll: jest.fn().mockResolvedValue([fakeRow]),
        update: jest.fn().mockResolvedValue([1]),
      },
      Payment: {},
      Certificate: {},
    };
    const strategy = {
      convert: jest.fn().mockResolvedValue({
        mode: "swap", usdtAmount: 200000n, txHash: "0xSWAP",
      }),
    };
    const usdtTransfer = jest.fn().mockResolvedValue({ txHash: "0xUSDT" });
    const harjootClient = { notifyPayment: jest.fn().mockResolvedValue({ ok: true }) };

    const result = await runTreasuryForwarderOnce({
      models,
      selectStrategy: () => ({ mode: "swap", strategy }),
      harjootClient,
      usdtTransfer,
      harjootWallet: "0x4444444444444444444444444444444444444444",
      batchSize: 25,
    });

    expect(models.TreasuryTransfer.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 25 }),
    );
    expect(usdtTransfer).toHaveBeenCalledWith({
      usdtAmount: 200000n,
      recipient: "0x4444444444444444444444444444444444444444",
    });
    expect(result.usdtTxHash).toBe("0xUSDT");
    expect(result.notifiedCount).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// scheduleTreasuryForwarder — cron wiring + lock
// ---------------------------------------------------------------------------

describe("scheduleTreasuryForwarder", () => {
  // Fake cron mirrors node-cron's schedule(expr, fn) -> { stop } surface.
  function makeFakeCron() {
    const ticks = [];
    const fakeTask = { stop: jest.fn() };
    const schedule = jest.fn().mockImplementation((expr, fn) => {
      ticks.push({ expr, fn });
      return fakeTask;
    });
    return { schedule, ticks, fakeTask };
  }

  // Empty-queue models so the underlying tick is cheap.
  // Includes a fake sequelize so the withPgAdvisoryLock wrap sees a non-
  // postgres dialect and no-ops the lock.
  function emptyModels() {
    return {
      TreasuryTransfer: { findAll: jest.fn().mockResolvedValue([]) },
      Payment: {},
      Certificate: {},
      sequelize: { getDialect: () => "sqlite" },
    };
  }

  test("registers a cron with the default expression and returns the task", () => {
    const cron = makeFakeCron();
    const task = scheduleTreasuryForwarder({
      cron, models: emptyModels(),
      selectStrategy: () => ({ mode: "manual", strategy: { convert: jest.fn() } }),
      harjootClient: { notifyPayment: jest.fn() },
    });

    expect(cron.schedule).toHaveBeenCalledTimes(1);
    expect(cron.schedule.mock.calls[0][0]).toBe(__DEFAULT_CRON_EXPRESSION);
    expect(__DEFAULT_CRON_EXPRESSION).toBe("*/10 * * * *");
    expect(task).toBe(cron.fakeTask);
  });

  test("honors a custom cronExpression", () => {
    const cron = makeFakeCron();
    scheduleTreasuryForwarder({
      cron, cronExpression: "*/5 * * * *",
      models: emptyModels(),
      selectStrategy: () => ({ mode: "manual", strategy: { convert: jest.fn() } }),
      harjootClient: { notifyPayment: jest.fn() },
    });
    expect(cron.schedule.mock.calls[0][0]).toBe("*/5 * * * *");
  });

  test("tick wraps runTreasuryForwarderOnce; first tick runs to completion", async () => {
    const cron = makeFakeCron();
    const models = emptyModels();
    scheduleTreasuryForwarder({
      cron, models,
      selectStrategy: () => ({ mode: "manual", strategy: { convert: jest.fn() } }),
      harjootClient: { notifyPayment: jest.fn() },
    });

    // Invoke the registered tick directly.
    await cron.ticks[0].fn();
    expect(models.TreasuryTransfer.findAll).toHaveBeenCalledTimes(1);
  });

  test("in-process lock drops overlapping ticks", async () => {
    const cron = makeFakeCron();

    // Block the queue read until we release it manually.
    let release;
    const blocking = new Promise((r) => { release = r; });
    const models = {
      TreasuryTransfer: {
        findAll: jest.fn().mockImplementation(() => blocking.then(() => [])),
      },
      Payment: {}, Certificate: {},
      sequelize: { getDialect: () => "sqlite" },
    };

    scheduleTreasuryForwarder({
      cron, models,
      selectStrategy: () => ({ mode: "manual", strategy: { convert: jest.fn() } }),
      harjootClient: { notifyPayment: jest.fn() },
    });

    const tick = cron.ticks[0].fn;
    // Tick #1 starts and is blocked on the queue read.
    const t1 = tick();
    // Tick #2 fires while #1 is still in-flight -> must short-circuit.
    const t2 = tick();
    await t2; // resolves immediately because of the lock

    expect(models.TreasuryTransfer.findAll).toHaveBeenCalledTimes(1);
    // Release tick #1.
    release();
    await t1;
    expect(models.TreasuryTransfer.findAll).toHaveBeenCalledTimes(1);

    // Subsequent tick after #1 finished can run normally again.
    await tick();
    expect(models.TreasuryTransfer.findAll).toHaveBeenCalledTimes(2);
  });

  test("postgres dialect: tick issues pg_try_advisory_lock + pg_advisory_unlock around the work", async () => {
    const cron = makeFakeCron();
    const sqlCalls = [];
    const sequelize = {
      getDialect: () => "postgres",
      query: jest.fn().mockImplementation(async (sql) => {
        sqlCalls.push(sql);
        if (sql.includes("pg_try_advisory_lock")) return [[{ acquired: true }], {}];
        if (sql.includes("pg_advisory_unlock"))    return [[{ pg_advisory_unlock: true }], {}];
        return [[], {}];
      }),
    };
    const models = {
      TreasuryTransfer: { findAll: jest.fn().mockResolvedValue([]) },
      Payment: {}, Certificate: {},
      sequelize,
    };
    scheduleTreasuryForwarder({
      cron, models,
      selectStrategy: () => ({ mode: "manual", strategy: { convert: jest.fn() } }),
      harjootClient: { notifyPayment: jest.fn() },
    });

    await cron.ticks[0].fn();

    expect(sqlCalls.some((s) => s.includes("pg_try_advisory_lock"))).toBe(true);
    expect(sqlCalls.some((s) => s.includes("pg_advisory_unlock"))).toBe(true);
    expect(models.TreasuryTransfer.findAll).toHaveBeenCalledTimes(1);
  });

  test("postgres dialect: when another instance holds the lock, the tick skips the work", async () => {
    const cron = makeFakeCron();
    const sequelize = {
      getDialect: () => "postgres",
      query: jest.fn().mockImplementation(async (sql) => {
        if (sql.includes("pg_try_advisory_lock")) return [[{ acquired: false }], {}];
        return [[], {}];
      }),
    };
    const models = {
      TreasuryTransfer: { findAll: jest.fn().mockResolvedValue([]) },
      Payment: {}, Certificate: {},
      sequelize,
    };
    scheduleTreasuryForwarder({
      cron, models,
      selectStrategy: () => ({ mode: "manual", strategy: { convert: jest.fn() } }),
      harjootClient: { notifyPayment: jest.fn() },
    });

    await cron.ticks[0].fn();
    // Work NOT executed because the advisory lock was already held.
    expect(models.TreasuryTransfer.findAll).not.toHaveBeenCalled();
  });

  test("tick swallows runTreasuryForwarderOnce rejection so the cron loop survives", async () => {
    const cron = makeFakeCron();
    // selectStrategy that throws on each call -> runOnce catches + soft-fails.
    let callCount = 0;
    scheduleTreasuryForwarder({
      cron,
      models: emptyModels(),
      selectStrategy: () => { callCount += 1; throw new Error("bad config"); },
      harjootClient: { notifyPayment: jest.fn() },
    });

    const tick = cron.ticks[0].fn;
    // Multiple ticks back-to-back should not throw.
    await expect(tick()).resolves.toBeUndefined();
    await expect(tick()).resolves.toBeUndefined();
    expect(callCount).toBe(2);
  });
});
