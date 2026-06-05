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
    expect(result).toEqual({ processed: 0, mode: null });
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
  function emptyModels() {
    return {
      TreasuryTransfer: { findAll: jest.fn().mockResolvedValue([]) },
      Payment: {},
      Certificate: {},
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
