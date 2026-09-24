/**
 * Pixel Distributor - Order Management & Credit Verification Service
 *
 * Implements Specification Section 12:
 * Order lifecycle management and credit line verification.
 */

import {
  Order,
  OrderStatus,
  CreateOrderInput,
  Dealer,
} from '@pixel/shared';

export class OrderService {
  /**
   * Verifies credit limit and generates order in PENDING status.
   */
  public static createOrder(
    input: CreateOrderInput,
    dealer: Dealer,
    actorId: string
  ): { order: Order; updatedDealerBalance: number } {
    // 1. Credit Limit Verification
    const availableCredit = dealer.creditLimit - dealer.outstandingBalance;
    if (input.grandTotal > availableCredit) {
      throw new Error(
        `Order exceeds available credit limit. Total: ₹${input.grandTotal.toLocaleString()}, Available: ₹${availableCredit.toLocaleString()}`
      );
    }

    const now = new Date().toISOString();
    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const order: Order = {
      orderId,
      dealerId: input.dealerId,
      customerId: input.customerId,
      customerName: input.customerName,
      items: input.items,
      subtotal: input.subtotal,
      discountTotal: input.discountTotal || 0,
      taxTotal: input.taxTotal || 0,
      grandTotal: input.grandTotal,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      shippingAddress: input.shippingAddress,
      notes: input.notes,
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
    };

    const updatedDealerBalance = dealer.outstandingBalance + input.grandTotal;

    return { order, updatedDealerBalance };
  }

  /**
   * Validates legal state transitions across the order lifecycle.
   */
  public static isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      DRAFT: ['PENDING', 'CANCELLED'],
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['DISPATCHED', 'CANCELLED'],
      DISPATCHED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    return transitions[from]?.includes(to) ?? false;
  }
}
