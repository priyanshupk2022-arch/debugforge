/**
 * Null Propagation API - Fixture Entry Point
 */

import { ConnectionPool } from './db/pool';
import { InventoryService } from './services/inventory';
import { PricingService } from './services/pricing';
import { OrderProcessingService } from './services/order';
import { PoolConfig } from './types';

export * from './types';
export * from './db/pool';
export * from './services/inventory';
export * from './services/pricing';
export * from './services/order';

export interface OrderAppInstance {
  pool: ConnectionPool;
  inventoryService: InventoryService;
  pricingService: PricingService;
  orderService: OrderProcessingService;
}

export function createOrderApp(poolConfig?: Partial<PoolConfig>): OrderAppInstance {
  const pool = new ConnectionPool({
    maxConnections: poolConfig?.maxConnections ?? 5,
    acquireTimeoutMs: poolConfig?.acquireTimeoutMs ?? 500,
    simulateTimeout: poolConfig?.simulateTimeout ?? false,
  });

  const inventoryService = new InventoryService(pool);
  const pricingService = new PricingService();
  const orderService = new OrderProcessingService(inventoryService, pricingService);

  return {
    pool,
    inventoryService,
    pricingService,
    orderService,
  };
}

// Default CLI runner if executed directly
if (require.main === module) {
  console.log("Starting Null Propagation API fixture...");
  const app = createOrderApp({ simulateTimeout: false });
  app.orderService.processOrder({
    orderId: 'ORD-DEMO-001',
    customerId: 'CUST-8821',
    items: [{ sku: 'SKU-LAPTOP-01', quantity: 1 }],
  }).then(order => {
    console.log("Order processed successfully:", JSON.stringify(order, null, 2));
  }).catch(err => {
    console.error("Order processing failed:", err);
  });
}
