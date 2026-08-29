/**
 * Data contracts and type definitions for null-propagation-api fixture.
 */

export interface DbConnection {
  id: string;
  query<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
  release(): void;
  isHealthy: boolean;
}

export interface PoolConfig {
  maxConnections: number;
  acquireTimeoutMs: number;
  simulateTimeout?: boolean;
}

export interface PricingTier {
  tier: string;
  discountRate: number;
  taxRate: number;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  stock: number;
  unitPrice: number;
  pricingTier: PricingTier | null;
}

export interface OrderItem {
  sku: string;
  quantity: number;
}

export interface OrderRequest {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  currency?: string;
}

export interface PricingSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

export interface ProcessedOrder {
  orderId: string;
  customerId: string;
  items: OrderItem[];
  pricing: PricingSummary;
  formattedTotal: string;
  status: 'CONFIRMED' | 'FAILED';
  processedAt: string;
}
