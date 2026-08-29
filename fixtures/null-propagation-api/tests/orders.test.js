import { describe, it } from "node:test";
import assert from "node:assert";
import { orderService } from "../src/services/order-service.js";

describe("Payment & Order Microservice Test Suite", () => {
  it("should successfully process order for active user under load", async () => {
    const order = await orderService.processOrder("usr_101", 250);
    assert.strictEqual(order.status, "processed");
    assert.strictEqual(order.userId, "usr_101");
  });
});
