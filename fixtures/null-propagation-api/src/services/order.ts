/**
 * Order Processing Service
 * 
 * Coordinates order validation, inventory verification, pricing, and invoice generation.
 */

import { InventoryService } from './inventory';
import { PricingService } from './pricing';
import { OrderRequest, ProcessedOrder } from '../types';

export class OrderProcessingService {
  constructor(
    private inventoryService: InventoryService,
    private pricingService: PricingService
  ) {}

  /**
   * Process customer checkout order.
   * 
   * CRASH SITE:
   * Line 42 attempts to format total amount assuming valid numerical total.
   * When upstream connection pool timeout returns null -> inventory returns null
   * -> pricing returns undefined total -> this line throws TypeError.
   */
  async processOrder(request: OrderRequest): Promise<ProcessedOrder> {
    if (!request.items || request.items.length === 0) {
      throw new Error("Invalid order: items list cannot be empty");
    }

    // Fetch inventory
    const skus = request.items.map(item => item.sku);
    const inventoryMap = await this.inventoryService.getBatchStock(skus);

    // Calculate pricing
    const pricing = this.pricingService.calculatePrice(request.items, inventoryMap);

    const order: Partial<ProcessedOrder> = {
      orderId: request.orderId,
      customerId: request.customerId,
      items: request.items,
      pricing: pricing,
      status: 'CONFIRMED',
      processedAt: new Date().toISOString(),
    };

    // CRASH SITE (Line 42):
    // Attempts to call .toFixed(2) on order.pricing.total
    const formattedTotal = order.pricing.total.toFixed(2);
    order.formattedTotal = `$${formattedTotal}`;

    return order as ProcessedOrder;
  }
}
