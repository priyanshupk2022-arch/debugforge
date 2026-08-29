import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { incrementCounter, getCounter, resetCounter } from "../src/index.js";

describe("Concurrent Counter Race Condition Suite", () => {
  beforeEach(() => resetCounter());

  it("should accurately maintain total count across 10 concurrent increments", async () => {
    // 10 concurrent increments should yield count of 10
    await Promise.all([
      incrementCounter(),
      incrementCounter(),
      incrementCounter(),
      incrementCounter(),
      incrementCounter(),
      incrementCounter(),
      incrementCounter(),
      incrementCounter(),
      incrementCounter(),
      incrementCounter(),
    ]);

    assert.strictEqual(getCounter(), 10);
  });
});
