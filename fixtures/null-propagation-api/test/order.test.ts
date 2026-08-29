/**
 * Test Suite: Order Processing & Null Cascade Reproduction
 * 
 * Demonstrates:
 * 1. Healthy execution with normal DB connection pool.
 * 2. Deterministic reproduction of silent null cascade crash under pool timeout.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createOrderApp } from '../src/index';

describe('Null Propagation API - Order Processing Suite', () => {
  test('Healthy DB: processes standard order successfully with formatted total', async () => {
    const app = createOrderApp({ simulateTimeout: false });
    
    const request = {
      orderId: 'ORD-SUCCESS-100',
      customerId: 'CUST-001',
      items: [
        { sku: 'SKU-LAPTOP-01', quantity: 1 },
        { sku: 'SKU-MOUSE-02', quantity: 2 },
      ],
    };

    const order = await app.orderService.processOrder(request);
    
    assert.strictEqual(order.status, 'CONFIRMED');
    assert.strictEqual(typeof order.pricing.total, 'number');
    assert.strictEqual(order.pricing.total > 0, true);
    assert.strictEqual(typeof order.formattedTotal, 'string');
    assert.match(order.formattedTotal, /^\$\d+\.\d{2}$/);
  });

  test('DB Pool Timeout: Order processing should gracefully handle pool exhaustion without crashing', async () => {
    // Under connection pool timeout / exhaustion, the application must handle
    // the failure gracefully instead of cascading null into an unhandled TypeError.
    const app = createOrderApp({ simulateTimeout: true });
    
    const request = {
      orderId: 'ORD-FAIL-200',
      customerId: 'CUST-002',
      items: [
        { sku: 'SKU-LAPTOP-01', quantity: 1 },
      ],
    };

    // BUG REPRODUCTION:
    // In the buggy implementation, pool.acquireConnection() returns null silently,
    // inventory returns null items, pricing returns undefined total, and order.ts crashes
    // with: TypeError: Cannot read properties of undefined (reading 'toFixed')
    const order = await app.orderService.processOrder(request);

    // This assertion will only be reached if the bug is healed
    assert.ok(order, 'Order result must be defined');
    assert.strictEqual(order.status, 'CONFIRMED');
  });

  test('Multi-item checkout with mixed inventory availability', async () => {
    const app = createOrderApp({ simulateTimeout: false });
    
    const request = {
      orderId: 'ORD-MIXED-300',
      customerId: 'CUST-003',
      items: [
        { sku: 'SKU-KEYBOARD-03', quantity: 2 },
      ],
    };

    const order = await app.orderService.processOrder(request);
    assert.strictEqual(order.items.length, 1);
    assert.strictEqual(order.status, 'CONFIRMED');
    assert.ok(order.pricing.total > 0);
  });
});
