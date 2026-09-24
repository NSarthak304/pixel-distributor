import { describe, it, expect } from 'vitest';
import { InventoryTransactionType } from '../../shared/types/index.js';

interface StockLedgerEntry {
  type: InventoryTransactionType;
  quantity: number;
}

/**
 * Pure calculator evaluating the invariant inventory equation.
 */
export function calculateStockBalance(
  openingStock: number,
  movements: StockLedgerEntry[]
): { currentStock: number; error?: string } {
  let balance = openingStock;

  for (const mov of movements) {
    if (mov.quantity <= 0) {
      return { currentStock: balance, error: 'Movement quantity must be positive' };
    }

    switch (mov.type) {
      case 'STOCK_IN':
      case 'TRANSFER_IN':
      case 'RETURN':
        balance += mov.quantity;
        break;

      case 'STOCK_OUT':
      case 'TRANSFER_OUT':
      case 'SALE':
      case 'DAMAGED':
        if (balance - mov.quantity < 0) {
          return {
            currentStock: balance,
            error: `Negative stock prevented: attempted to deduct ${mov.quantity} from balance ${balance}`,
          };
        }
        balance -= mov.quantity;
        break;

      case 'ADJUSTMENT':
        // Delta adjustment can be positive or negative
        balance += mov.quantity;
        break;
    }
  }

  return { currentStock: balance };
}

describe('Transaction-Based Inventory Invariant Unit Tests', () => {
  it('correctly calculates stock balance through realistic warehouse movements', () => {
    const openingStock = 100;
    const ledger: StockLedgerEntry[] = [
      { type: 'STOCK_IN', quantity: 50 }, // +50 -> 150
      { type: 'TRANSFER_OUT', quantity: 20 }, // -20 -> 130
      { type: 'SALE', quantity: 30 }, // -30 -> 100
      { type: 'RETURN', quantity: 5 }, // +5 -> 105
      { type: 'DAMAGED', quantity: 2 }, // -2 -> 103
    ];

    const result = calculateStockBalance(openingStock, ledger);
    expect(result.error).toBeUndefined();
    expect(result.currentStock).toBe(103);
  });

  it('prevents negative stock balances atomically', () => {
    const openingStock = 10;
    const ledger: StockLedgerEntry[] = [
      { type: 'SALE', quantity: 8 }, // 10 - 8 = 2
      { type: 'TRANSFER_OUT', quantity: 5 }, // 2 - 5 = -3 (Invalid!)
    ];

    const result = calculateStockBalance(openingStock, ledger);
    expect(result.error).toBeDefined();
    expect(result.error).toContain('Negative stock prevented');
    expect(result.currentStock).toBe(2);
  });
});
