// backend/lib/__tests__/correlationContext.test.js

const { runWithCorrelationId, getCorrelationId } = require("../correlationContext");

describe("correlationContext", () => {
  test("getCorrelationId returns undefined outside of any run", () => {
    expect(getCorrelationId()).toBeUndefined();
  });

  test("runWithCorrelationId exposes the id to synchronous descendants", () => {
    runWithCorrelationId("req-abc", () => {
      expect(getCorrelationId()).toBe("req-abc");
    });
    // And leaves no leakage after the function returns.
    expect(getCorrelationId()).toBeUndefined();
  });

  test("id survives across awaited async boundaries", async () => {
    await runWithCorrelationId("req-xyz", async () => {
      await Promise.resolve();
      await new Promise((r) => setImmediate(r));
      expect(getCorrelationId()).toBe("req-xyz");
    });
  });

  test("nested runs shadow the outer id, then restore it", () => {
    runWithCorrelationId("outer", () => {
      expect(getCorrelationId()).toBe("outer");
      runWithCorrelationId("inner", () => {
        expect(getCorrelationId()).toBe("inner");
      });
      expect(getCorrelationId()).toBe("outer");
    });
  });

  test("rejects empty / non-string ids", () => {
    expect(() => runWithCorrelationId("", () => {})).toThrow(TypeError);
    expect(() => runWithCorrelationId(undefined, () => {})).toThrow(TypeError);
    expect(() => runWithCorrelationId(123, () => {})).toThrow(TypeError);
  });

  test("rejects a missing fn", () => {
    expect(() => runWithCorrelationId("ok")).toThrow(TypeError);
    expect(() => runWithCorrelationId("ok", "not-a-fn")).toThrow(TypeError);
  });

  test("returns the fn's return value", () => {
    const ret = runWithCorrelationId("x", () => 42);
    expect(ret).toBe(42);
  });
});
