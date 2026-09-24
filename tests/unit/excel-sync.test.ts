import { describe, it, expect } from 'vitest';
import { ExcelSyncEngine } from '../../scripts/excel-sync.js';
import { globalStore } from '../../backend/src/store/memory-store.js';

describe('Plan A Excel Bi-Directional Synchronization Suite', () => {
  it('executes push sync and parses workbook records into central store', () => {
    const pushResult = ExcelSyncEngine.push();
    expect(pushResult.dealersSynced).toBeGreaterThan(0);
    expect(pushResult.productsSynced).toBeGreaterThan(0);
    expect(pushResult.errors.length).toBe(0);

    // Verify dealer exists in store
    expect(globalStore.dealers.has('DLR-1001')).toBe(true);
    // Verify product exists in store
    expect(Array.from(globalStore.products.values()).some((p) => p.sku === 'PX-ULTRA-256')).toBe(true);
  });

  it('executes pull sync and writes database entities back to workbook without errors', () => {
    const pullResult = ExcelSyncEngine.pull();
    expect(pullResult.dealersExported).toBeGreaterThan(0);
  });
});
