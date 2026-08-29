/**
 * Pricing Service
 * 
 * Computes pricing, volume discounts, taxes, and order totals.
 */

import { InventoryItem, OrderItem, PricingSummary } from '../types';

export class PricingService {
  /**
   * PROPAGATION STEP 2:
   * Computes order pricing from inventory items.
   * If inventory returns null items (due to upstream connection pool timeout),
   * pricing calculation leaves total undefined or malformed.
   */
  calculatePrice(items: OrderItem[], inventoryMap: Map<string, InventoryItem | null>): PricingSummary {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let hasValidItems = false;

    for (const orderItem of items) {
      const item = inventoryMap.get(orderItem.sku);

      if (!item) {
        // PROPAGATION STEP 2: Fails to handle null item correctly
        // Instead of throwing an item unavailable exception, it continues
        continue;
      }

      hasValidItems = true;
      const itemSubtotal = item.unitPrice * orderItem.quantity;
      const discountRate = item.pricingTier?.discountRate ?? 0;
      const taxRate = item.pricingTier?.taxRate ?? 0;

      const itemDiscount = itemSubtotal * discountRate;
      const itemTax = (itemSubtotal - itemDiscount) * taxRate;

      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;
      totalTax += itemTax;
    }

    if (!hasValidItems) {
      // PROPAGATION STEP 2: Missing total in pricing summary
      return {
        subtotal: 0,
        discountAmount: 0,
        taxAmount: 0,
        total: undefined as unknown as number, // Leaves total undefined
      };
    }

    const total = subtotal - totalDiscount + totalTax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(totalDiscount * 100) / 100,
      taxAmount: Math.round(totalTax * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }
}
