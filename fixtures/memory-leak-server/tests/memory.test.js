import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { handleIncomingRequest, getCacheSize, clearStore } from "../src/index.js";

describe("Unbounded Memory Growth & Eviction Suite", () => {
  beforeEach(() => clearStore());

  it("should cap cache capacity under high request volume (max 50)", () => {
    // Process 200 incoming requests
    for (let i = 0; i < 200; i++) {
      handleIncomingRequest(`req_${i}`);
    }

    // Cache should be bounded to at most 50 entries
    assert.ok(getCacheSize() <= 50, `Cache size ${getCacheSize()} exceeded bounded limit of 50`);
  });
});
