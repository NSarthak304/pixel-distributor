import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { ExcelEtlService } from '../../backend/src/services/excel-etl.service.js';
import { Product } from '../../shared/types/index.js';

describe('Excel Staged ETL Service Unit Tests', () => {
  const templatesDir = path.resolve(process.cwd(), 'excel/templates');

  it('successfully validates Products.xlsx template with 100% valid rows', () => {
    const filePath = path.join(templatesDir, 'Products.xlsx');
    expect(fs.existsSync(filePath)).toBe(true);

    const fileBuffer = fs.readFileSync(filePath);
    const existingProducts = new Map<string, Product>();

    const preview = ExcelEtlService.validateProducts(fileBuffer, existingProducts);

    expect(preview.entityType).toBe('products');
    expect(preview.totalRows).toBe(3);
    expect(preview.validRowsCount).toBe(3);
    expect(preview.errorRowsCount).toBe(0);
    expect(preview.toCreate.length).toBe(3);
    expect(preview.toUpdate.length).toBe(0);
  });

  it('correctly categorizes existing SKUs into updates and computes deltas', () => {
    const filePath = path.join(templatesDir, 'Products.xlsx');
    const fileBuffer = fs.readFileSync(filePath);

    // Existing product in system with older price
    const existingProducts = new Map<string, Product>();
    existingProducts.set('PX-ULTRA-256', {
      productId: 'PRD-EXISTING-01',
      sku: 'PX-ULTRA-256',
      name: 'Pixel Ultra 256GB Old',
      categoryId: 'cat_phones',
      categoryName: 'Smartphones',
      brand: 'Pixel',
      model: 'Ultra',
      unit: 'PCS',
      mrp: 69999, // Will be updated to 74999
      purchasePrice: 50000,
      dealerPrices: { TIER_1: 54000, TIER_2: 56000, TIER_3: 58000, STANDARD: 58000 },
      reorderLevel: 10,
      isActive: true,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    });

    const preview = ExcelEtlService.validateProducts(fileBuffer, existingProducts);

    expect(preview.validRowsCount).toBe(3);
    expect(preview.toCreate.length).toBe(2);
    expect(preview.toUpdate.length).toBe(1);

    const updateItem = preview.toUpdate[0];
    expect(updateItem.id).toBe('PRD-EXISTING-01');
    expect(updateItem.oldData.mrp).toBe(69999);
    expect(updateItem.newData.mrp).toBe(74999);
  });

  it('validates Dealers.xlsx template and handles dealer onboarding records', () => {
    const filePath = path.join(templatesDir, 'Dealers.xlsx');
    const fileBuffer = fs.readFileSync(filePath);
    const existingDealers = new Map();

    const preview = ExcelEtlService.validateDealers(fileBuffer, existingDealers);

    expect(preview.entityType).toBe('dealers');
    expect(preview.totalRows).toBe(3);
    expect(preview.validRowsCount).toBe(3);
    expect(preview.errorRowsCount).toBe(0);
    expect(preview.toCreate.length).toBe(3);
  });
});
