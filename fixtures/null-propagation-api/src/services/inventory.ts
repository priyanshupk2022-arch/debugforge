/**
 * Inventory Service
 * 
 * Verifies stock availability and loads SKU details from repository.
 */

import { ConnectionPool } from '../db/pool';
import { InventoryItem } from '../types';

const MOCK_CATALOG: Record<string, InventoryItem> = {
  'SKU-LAPTOP-01': {
    id: 'item_101',
    sku: 'SKU-LAPTOP-01',
    name: 'Pro Laptop 16-inch',
    stock: 25,
    unitPrice: 1299.99,
    pricingTier: { tier: 'ENTERPRISE', discountRate: 0.10, taxRate: 0.08 }
  },
  'SKU-MOUSE-02': {
    id: 'item_102',
    sku: 'SKU-MOUSE-02',
    name: 'Wireless Precision Mouse',
    stock: 100,
    unitPrice: 49.99,
    pricingTier: { tier: 'RETAIL', discountRate: 0.05, taxRate: 0.08 }
  },
  'SKU-KEYBOARD-03': {
    id: 'item_103',
    sku: 'SKU-KEYBOARD-03',
    name: 'Mechanical RGB Keyboard',
    stock: 50,
    unitPrice: 129.50,
    pricingTier: { tier: 'RETAIL', discountRate: 0.05, taxRate: 0.08 }
  }
};

export class InventoryService {
  constructor(private pool: ConnectionPool) {}

  /**
   * PROPAGATION STEP 1:
   * Acquires DB connection. When pool returns null, this method silently
   * returns null instead of flagging a connection failure.
   */
  async checkStock(sku: string): Promise<InventoryItem | null> {
    const conn = await this.pool.acquireConnection();

    if (!conn) {
      // PROPAGATION STEP 1: Silent null propagation from pool to inventory service
      return null;
    }

    try {
      // Query catalog
      const item = MOCK_CATALOG[sku] || null;
      return item;
    } finally {
      conn.release();
    }
  }

  async getBatchStock(skus: string[]): Promise<Map<string, InventoryItem | null>> {
    const map = new Map<string, InventoryItem | null>();
    for (const sku of skus) {
      const item = await this.checkStock(sku);
      map.set(sku, item);
    }
    return map;
  }
}
