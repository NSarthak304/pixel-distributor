/**
 * Pixel Distributor - Transaction-Based Inventory Engine
 *
 * Implements Specification Section 10 & 11:
 * Invariant stock equation with immutable event ledger.
 */

import {
  InventoryItem,
  InventoryTransaction,
  InventoryTransactionType,
  StockTransfer,
  StockTransferItem,
  LocationType,
} from '@pixel/shared';

export interface ApplyStockMovementParams {
  currentInventory: InventoryItem | null;
  type: InventoryTransactionType;
  sku: string;
  productId: string;
  productName: string;
  locationType: LocationType;
  locationId: string;
  dealerId: string;
  quantityDelta: number; // positive or negative
  referenceType: 'ORDER' | 'TRANSFER' | 'PURCHASE_RECEIPT' | 'AUDIT_ADJUSTMENT' | 'DAMAGE';
  referenceId: string;
  actorId: string;
  notes?: string;
}

export class InventoryService {
  /**
   * Applies an atomic stock movement and generates the corresponding immutable transaction.
   */
  public static applyStockMovement(
    params: ApplyStockMovementParams
  ): {
    updatedInventory: InventoryItem;
    transaction: InventoryTransaction;
  } {
    const currentQty = params.currentInventory ? params.currentInventory.quantity : 0;
    const reservedQty = params.currentInventory ? params.currentInventory.reservedQuantity : 0;
    const reorderLevel = params.currentInventory ? params.currentInventory.reorderLevel : 10;

    const newBalance = currentQty + params.quantityDelta;

    if (newBalance < 0) {
      throw new Error(
        `Insufficient stock for SKU '${params.sku}' at location '${params.locationId}'. Current: ${currentQty}, Requested Delta: ${params.quantityDelta}`
      );
    }

    const now = new Date().toISOString();
    const inventoryId = `${params.locationType}_${params.locationId}_${params.sku}`;
    const transactionId = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedInventory: InventoryItem = {
      inventoryId,
      locationType: params.locationType,
      locationId: params.locationId,
      dealerId: params.dealerId,
      productId: params.productId,
      sku: params.sku,
      productName: params.productName,
      quantity: newBalance,
      reservedQuantity: reservedQty,
      reorderLevel,
      updatedAt: now,
    };

    const transaction: InventoryTransaction = {
      transactionId,
      type: params.type,
      sku: params.sku,
      productId: params.productId,
      locationType: params.locationType,
      locationId: params.locationId,
      dealerId: params.dealerId,
      quantityDelta: params.quantityDelta,
      balanceAfter: newBalance,
      referenceType: params.referenceType,
      referenceId: params.referenceId,
      createdBy: params.actorId,
      notes: params.notes,
      timestamp: now,
    };

    return { updatedInventory, transaction };
  }

  /**
   * Dispatches a Central Warehouse -> Dealer Transfer.
   */
  public static createStockTransfer(
    sourceWarehouseId: string,
    destinationDealerId: string,
    items: StockTransferItem[],
    actorId: string,
    notes?: string
  ): StockTransfer {
    const now = new Date().toISOString();
    const transferId = `TRF-${Date.now().toString().slice(-6)}`;

    return {
      transferId,
      sourceType: 'CENTRAL_WAREHOUSE',
      sourceId: sourceWarehouseId,
      destinationType: 'DEALER',
      destinationId: destinationDealerId,
      dealerId: destinationDealerId,
      items,
      status: 'APPROVED',
      createdBy: actorId,
      notes,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Finalizes delivery of a stock transfer:
   * Generates paired TRANSFER_OUT (at warehouse) and TRANSFER_IN (at dealer).
   */
  public static completeStockTransfer(
    transfer: StockTransfer,
    warehouseInventoryMap: Map<string, InventoryItem>,
    dealerInventoryMap: Map<string, InventoryItem>,
    actorId: string
  ): {
    warehouseUpdates: InventoryItem[];
    dealerUpdates: InventoryItem[];
    transactions: InventoryTransaction[];
  } {
    const warehouseUpdates: InventoryItem[] = [];
    const dealerUpdates: InventoryItem[] = [];
    const transactions: InventoryTransaction[] = [];

    for (const item of transfer.items) {
      const whItem = warehouseInventoryMap.get(item.sku) || null;
      const dlrItem = dealerInventoryMap.get(item.sku) || null;

      // 1. Deduct from source warehouse (TRANSFER_OUT)
      const whResult = this.applyStockMovement({
        currentInventory: whItem,
        type: 'TRANSFER_OUT',
        sku: item.sku,
        productId: item.productId,
        productName: item.productName,
        locationType: 'CENTRAL_WAREHOUSE',
        locationId: transfer.sourceId,
        dealerId: 'CENTRAL',
        quantityDelta: -item.quantity,
        referenceType: 'TRANSFER',
        referenceId: transfer.transferId,
        actorId,
        notes: `Transfer dispatch to ${transfer.destinationId}`,
      });
      warehouseUpdates.push(whResult.updatedInventory);
      transactions.push(whResult.transaction);

      // 2. Increment at destination dealer (TRANSFER_IN)
      const dlrResult = this.applyStockMovement({
        currentInventory: dlrItem,
        type: 'TRANSFER_IN',
        sku: item.sku,
        productId: item.productId,
        productName: item.productName,
        locationType: 'DEALER',
        locationId: transfer.destinationId,
        dealerId: transfer.destinationId,
        quantityDelta: item.quantity,
        referenceType: 'TRANSFER',
        referenceId: transfer.transferId,
        actorId,
        notes: `Transfer received from ${transfer.sourceId}`,
      });
      dealerUpdates.push(dlrResult.updatedInventory);
      transactions.push(dlrResult.transaction);
    }

    return {
      warehouseUpdates,
      dealerUpdates,
      transactions,
    };
  }
}
