/**
 * Pixel Distributor - Staged Excel ETL Engine (Plan B Integration)
 *
 * Implements the 5-Stage Import Pipeline:
 * Upload -> Validate -> Preview -> Confirm -> Import
 */

import * as XLSX from 'xlsx';
import {
  ExcelProductRowSchema,
  ExcelDealerRowSchema,
} from '@pixel/shared';
import {
  Product,
  Dealer,
  ExcelValidationError,
  ExcelImportPreview,
} from '@pixel/shared';

export class ExcelEtlService {
  /**
   * Stage 1 & 2: Parse and Validate Products.xlsx
   */
  public static validateProducts(
    buffer: Buffer | Uint8Array,
    existingProductsMap: Map<string, Product>
  ): ExcelImportPreview<Record<string, unknown>> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Excel workbook contains no sheets');
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Sheet ${sheetName} not found`);
    }

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    const errors: ExcelValidationError[] = [];
    const toCreate: Record<string, unknown>[] = [];
    const toUpdate: { id: string; oldData: Partial<Product>; newData: Partial<Product> }[] = [];

    const seenSkus = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowIndex = index + 2; // 1-based, row 1 is header
      const sku = String(row['SKU'] || '').trim().toUpperCase();

      if (!sku) {
        errors.push({
          row: rowIndex,
          column: 'SKU',
          value: '',
          message: 'SKU is required',
        });
        return;
      }

      if (seenSkus.has(sku)) {
        errors.push({
          row: rowIndex,
          column: 'SKU',
          value: sku,
          message: `Duplicate SKU '${sku}' found in row ${rowIndex}`,
        });
        return;
      }
      seenSkus.add(sku);

      // Validate against Zod schema
      const parseResult = ExcelProductRowSchema.safeParse(row);
      if (!parseResult.success) {
        parseResult.error.issues.forEach((issue) => {
          errors.push({
            row: rowIndex,
            column: issue.path.join('.'),
            value: row[issue.path[0] as string],
            message: issue.message,
          });
        });
        return;
      }

      const validData = parseResult.data;

      // Check against existing products to categorize Create vs Update
      const existing = existingProductsMap.get(sku);
      if (existing) {
        toUpdate.push({
          id: existing.productId,
          oldData: {
            mrp: existing.mrp,
            purchasePrice: existing.purchasePrice,
            dealerPrices: existing.dealerPrices,
          },
          newData: {
            mrp: validData.MRP,
            purchasePrice: validData.Purchase_Price,
            dealerPrices: {
              ...existing.dealerPrices,
              TIER_1: validData.Dealer_Price_Tier1,
              TIER_2: validData.Dealer_Price_Tier2,
            },
          },
        });
      } else {
        toCreate.push({
          sku: validData.SKU,
          name: validData.Name,
          categoryName: validData.Category,
          brand: validData.Brand,
          model: validData.Model,
          unit: validData.Unit,
          mrp: validData.MRP,
          purchasePrice: validData.Purchase_Price,
          dealerPrices: {
            TIER_1: validData.Dealer_Price_Tier1,
            TIER_2: validData.Dealer_Price_Tier2,
            STANDARD: validData.Dealer_Price_Tier2,
          },
          reorderLevel: validData.Reorder_Level,
        });
      }
    });

    return {
      entityType: 'products',
      totalRows: rawRows.length,
      validRowsCount: toCreate.length + toUpdate.length,
      errorRowsCount: errors.length,
      errors,
      toCreate,
      toUpdate,
    };
  }

  /**
   * Stage 1 & 2: Parse and Validate Dealers.xlsx
   */
  public static validateDealers(
    buffer: Buffer | Uint8Array,
    existingDealersMap: Map<string, Dealer>
  ): ExcelImportPreview<Record<string, unknown>> {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Excel workbook contains no sheets');

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) throw new Error(`Sheet ${sheetName} not found`);

    const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
    const errors: ExcelValidationError[] = [];
    const toCreate: Record<string, unknown>[] = [];
    const toUpdate: { id: string; oldData: Partial<Dealer>; newData: Partial<Dealer> }[] = [];

    const seenDealerIds = new Set<string>();

    rawRows.forEach((row, index) => {
      const rowIndex = index + 2;
      const dealerId = String(row['Dealer_ID'] || '').trim().toUpperCase();

      if (!dealerId) {
        errors.push({
          row: rowIndex,
          column: 'Dealer_ID',
          value: '',
          message: 'Dealer_ID is required',
        });
        return;
      }

      if (seenDealerIds.has(dealerId)) {
        errors.push({
          row: rowIndex,
          column: 'Dealer_ID',
          value: dealerId,
          message: `Duplicate Dealer_ID '${dealerId}' in row ${rowIndex}`,
        });
        return;
      }
      seenDealerIds.add(dealerId);

      const parseResult = ExcelDealerRowSchema.safeParse(row);
      if (!parseResult.success) {
        parseResult.error.issues.forEach((issue) => {
          errors.push({
            row: rowIndex,
            column: issue.path.join('.'),
            value: row[issue.path[0] as string],
            message: issue.message,
          });
        });
        return;
      }

      const validData = parseResult.data;
      const existing = existingDealersMap.get(dealerId);

      if (existing) {
        toUpdate.push({
          id: dealerId,
          oldData: {
            creditLimit: existing.creditLimit,
            priceGroup: existing.priceGroup,
            dealerType: existing.dealerType,
          },
          newData: {
            creditLimit: validData.Credit_Limit,
            priceGroup: validData.Price_Group,
            dealerType: validData.Dealer_Type,
          },
        });
      } else {
        toCreate.push({
          dealerId: validData.Dealer_ID,
          businessName: validData.Business_Name,
          ownerName: validData.Owner_Name,
          mobile: validData.Mobile,
          email: validData.Email,
          address: validData.Address,
          city: validData.City,
          state: validData.State,
          pin: validData.PIN,
          dealerType: validData.Dealer_Type,
          priceGroup: validData.Price_Group,
          creditLimit: validData.Credit_Limit,
          assignedWarehouse: validData.Assigned_Warehouse,
        });
      }
    });

    return {
      entityType: 'dealers',
      totalRows: rawRows.length,
      validRowsCount: toCreate.length + toUpdate.length,
      errorRowsCount: errors.length,
      errors,
      toCreate,
      toUpdate,
    };
  }

  /**
   * Export Utilities: Convert in-memory entities to downloadable Excel buffer
   */
  public static exportProductsToBuffer(products: Product[]): Uint8Array {
    const flat = products.map((p) => ({
      Product_ID: p.productId,
      SKU: p.sku,
      Name: p.name,
      Category: p.categoryName,
      Brand: p.brand,
      Model: p.model,
      Unit: p.unit,
      MRP: p.mrp,
      Purchase_Price: p.purchasePrice,
      Dealer_Tier1: p.dealerPrices?.TIER_1 ?? 0,
      Dealer_Tier2: p.dealerPrices?.TIER_2 ?? 0,
      Reorder_Level: p.reorderLevel,
      Status: p.isActive ? 'ACTIVE' : 'INACTIVE',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flat);
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }

  public static exportDealersToBuffer(dealers: Dealer[]): Uint8Array {
    const flat = dealers.map((d) => ({
      Dealer_ID: d.dealerId,
      Business_Name: d.businessName,
      Owner_Name: d.ownerName,
      Mobile: d.mobile,
      Email: d.email,
      City: d.city,
      State: d.state,
      PIN: d.pin,
      Type: d.dealerType,
      Price_Group: d.priceGroup,
      Credit_Limit: d.creditLimit,
      Outstanding_Balance: d.outstandingBalance,
      Warehouse: d.assignedWarehouse,
      Status: d.accountStatus,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(flat);
    XLSX.utils.book_append_sheet(wb, ws, 'Dealers');
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
}
