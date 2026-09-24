import { describe, it, expect } from 'vitest';
import { DealerService } from '../../backend/src/services/dealer.service.js';
import { InventoryService } from '../../backend/src/services/inventory.service.js';
import { OrderService } from '../../backend/src/services/order.service.js';
import { ReleaseService } from '../../backend/src/services/release.service.js';
import { Dealer, InventoryItem } from '../../shared/types/index.js';

describe('Backend Services Suite Unit Tests', () => {
  describe('DealerService Provisioning Workflow', () => {
    it('provisions a dealer with automatically generated IDs, permissions, and app config', () => {
      const input = {
        businessName: 'Apex Electronics',
        ownerName: 'Vikas Sharma',
        mobile: '+919876543210',
        email: 'vikas@apexelectronics.in',
        address: '88 Tech Zone',
        city: 'Bengaluru',
        state: 'Karnataka',
        pin: '560001',
        dealerType: 'GOLD' as const,
        priceGroup: 'TIER_1' as const,
        creditLimit: 500000,
        paymentTerms: 'NET_30',
        assignedWarehouse: 'WH-BLR-01',
        accountStatus: 'ACTIVE' as const,
      };

      const result = DealerService.provisionDealer(input, 'DLR-1005', {
        uid: 'usr_admin',
        email: 'admin@pixeldistributor.com',
      });

      expect(result.dealer.dealerId).toBe('DLR-1005');
      expect(result.dealer.businessName).toBe('Apex Electronics');
      expect(result.user.userId).toContain('dlr1005');
      expect(result.user.role).toBe('DEALER');
      expect(result.permissionProfile.dealerId).toBe('DLR-1005');
      expect(result.permissionProfile.modules.orders).toBe('EDIT');
      expect(result.appConfiguration.dealerId).toBe('DLR-1005');
      expect(result.appConfiguration.purchaseCostVisibility).toBe(false); // Invariant
      expect(result.auditRecord.action).toBe('DEALER_PROVISIONED');
    });
  });

  describe('InventoryService Transaction Engine', () => {
    it('applies atomic stock delta and produces immutable transaction record', () => {
      const currentItem: InventoryItem = {
        inventoryId: 'CENTRAL_WAREHOUSE_WH-MUM_PX-ULTRA',
        locationType: 'CENTRAL_WAREHOUSE',
        locationId: 'WH-MUM',
        dealerId: 'CENTRAL',
        productId: 'PRD-1',
        sku: 'PX-ULTRA',
        productName: 'Pixel Ultra',
        quantity: 50,
        reservedQuantity: 0,
        reorderLevel: 10,
        updatedAt: '2026-01-01',
      };

      const { updatedInventory, transaction } = InventoryService.applyStockMovement({
        currentInventory: currentItem,
        type: 'STOCK_IN',
        sku: 'PX-ULTRA',
        productId: 'PRD-1',
        productName: 'Pixel Ultra',
        locationType: 'CENTRAL_WAREHOUSE',
        locationId: 'WH-MUM',
        dealerId: 'CENTRAL',
        quantityDelta: 25,
        referenceType: 'PURCHASE_RECEIPT',
        referenceId: 'INW-101',
        actorId: 'usr_inv_mgr',
      });

      expect(updatedInventory.quantity).toBe(75);
      expect(transaction.quantityDelta).toBe(25);
      expect(transaction.balanceAfter).toBe(75);
      expect(transaction.type).toBe('STOCK_IN');
    });

    it('rejects movements that would result in negative stock', () => {
      const currentItem: InventoryItem = {
        inventoryId: 'DEALER_DLR-1_PX-ULTRA',
        locationType: 'DEALER',
        locationId: 'DLR-1',
        dealerId: 'DLR-1',
        productId: 'PRD-1',
        sku: 'PX-ULTRA',
        productName: 'Pixel Ultra',
        quantity: 5,
        reservedQuantity: 0,
        reorderLevel: 10,
        updatedAt: '2026-01-01',
      };

      expect(() => {
        InventoryService.applyStockMovement({
          currentInventory: currentItem,
          type: 'SALE',
          sku: 'PX-ULTRA',
          productId: 'PRD-1',
          productName: 'Pixel Ultra',
          locationType: 'DEALER',
          locationId: 'DLR-1',
          dealerId: 'DLR-1',
          quantityDelta: -10, // Exceeds available 5
          referenceType: 'ORDER',
          referenceId: 'ORD-999',
          actorId: 'usr_dlr_1',
        });
      }).toThrowError(/Insufficient stock/);
    });

    it('completes stock transfer between warehouse and dealer with paired transactions', () => {
      const transfer = InventoryService.createStockTransfer(
        'WH-MUM',
        'DLR-101',
        [{ sku: 'PX-ULTRA', productId: 'PRD-1', productName: 'Pixel Ultra', quantity: 20 }],
        'usr_admin'
      );

      const whMap = new Map<string, InventoryItem>();
      whMap.set('PX-ULTRA', {
        inventoryId: 'CENTRAL_WAREHOUSE_WH-MUM_PX-ULTRA',
        locationType: 'CENTRAL_WAREHOUSE',
        locationId: 'WH-MUM',
        dealerId: 'CENTRAL',
        productId: 'PRD-1',
        sku: 'PX-ULTRA',
        productName: 'Pixel Ultra',
        quantity: 100,
        reservedQuantity: 0,
        reorderLevel: 10,
        updatedAt: '2026-01-01',
      });

      const dlrMap = new Map<string, InventoryItem>();
      dlrMap.set('PX-ULTRA', {
        inventoryId: 'DEALER_DLR-101_PX-ULTRA',
        locationType: 'DEALER',
        locationId: 'DLR-101',
        dealerId: 'DLR-101',
        productId: 'PRD-1',
        sku: 'PX-ULTRA',
        productName: 'Pixel Ultra',
        quantity: 10,
        reservedQuantity: 0,
        reorderLevel: 5,
        updatedAt: '2026-01-01',
      });

      const completion = InventoryService.completeStockTransfer(
        transfer,
        whMap,
        dlrMap,
        'usr_admin'
      );

      expect(completion.warehouseUpdates[0].quantity).toBe(80); // 100 - 20
      expect(completion.dealerUpdates[0].quantity).toBe(30); // 10 + 20
      expect(completion.transactions.length).toBe(2);
      expect(completion.transactions[0].type).toBe('TRANSFER_OUT');
      expect(completion.transactions[1].type).toBe('TRANSFER_IN');
    });
  });

  describe('OrderService Credit & Lifecycle Engine', () => {
    const sampleDealer: Dealer = {
      dealerId: 'DLR-101',
      businessName: 'Sample Dealer',
      ownerName: 'Owner',
      mobile: '+919999999999',
      email: 'dealer@sample.in',
      address: 'Street',
      city: 'City',
      state: 'State',
      pin: '400001',
      dealerType: 'STANDARD',
      priceGroup: 'STANDARD',
      creditLimit: 200000,
      paymentTerms: 'NET_30',
      assignedWarehouse: 'WH-1',
      accountStatus: 'ACTIVE',
      appId: 'APP-101',
      outstandingBalance: 150000, // 50,000 available
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    };

    it('enforces credit limit rejection when order exceeds available line', () => {
      const orderInput = {
        dealerId: 'DLR-101',
        items: [
          {
            sku: 'PX-1',
            productId: 'PRD-1',
            productName: 'Phone',
            quantity: 2,
            unitPrice: 30000,
            tax: 0,
            discount: 0,
            lineTotal: 60000,
          },
        ],
        subtotal: 60000,
        grandTotal: 60000, // Exceeds available 50,000
        shippingAddress: { address: 'Shop 1', city: 'City', state: 'State', pin: '400001' },
      };

      expect(() => {
        OrderService.createOrder(orderInput, sampleDealer, 'usr_dlr');
      }).toThrowError(/Order exceeds available credit limit/);
    });

    it('creates order successfully when within available credit limit', () => {
      const orderInput = {
        dealerId: 'DLR-101',
        items: [
          {
            sku: 'PX-1',
            productId: 'PRD-1',
            productName: 'Phone',
            quantity: 1,
            unitPrice: 40000,
            tax: 0,
            discount: 0,
            lineTotal: 40000,
          },
        ],
        subtotal: 40000,
        grandTotal: 40000, // Within 50,000 available
        shippingAddress: { address: 'Shop 1', city: 'City', state: 'State', pin: '400001' },
      };

      const result = OrderService.createOrder(orderInput, sampleDealer, 'usr_dlr');
      expect(result.order.status).toBe('PENDING');
      expect(result.updatedDealerBalance).toBe(190000); // 150k + 40k
    });

    it('validates order status lifecycle transitions', () => {
      expect(OrderService.isValidTransition('PENDING', 'CONFIRMED')).toBe(true);
      expect(OrderService.isValidTransition('CONFIRMED', 'PROCESSING')).toBe(true);
      expect(OrderService.isValidTransition('PROCESSING', 'DISPATCHED')).toBe(true);
      expect(OrderService.isValidTransition('DISPATCHED', 'COMPLETED')).toBe(true);
      expect(OrderService.isValidTransition('COMPLETED', 'PENDING')).toBe(false); // Illegal backwards
      expect(OrderService.isValidTransition('DRAFT', 'COMPLETED')).toBe(false); // Illegal skip
    });
  });

  describe('ReleaseService APK Manager', () => {
    it('rejects publish when versionCode is not strictly greater than active release', () => {
      const activeRelease = {
        releaseId: 'REL-1.2.0',
        version: '1.2.0',
        versionCode: 120,
        releaseDate: '2026-01-01',
        downloadUrl: 'https://storage/app.apk',
        checksum: 'a'.repeat(64),
        fileSize: 1000,
        releaseNotes: 'Old',
        minimumSupportedVersion: '1.0.0',
        minimumVersionCode: 100,
        mandatory: false,
        status: 'ACTIVE' as const,
        publishedBy: 'admin',
        createdAt: '2026-01-01',
      };

      expect(() => {
        ReleaseService.publishRelease(
          {
            version: '1.2.1',
            versionCode: 120, // Not greater than 120
            downloadUrl: 'https://storage/new.apk',
            checksum: 'b'.repeat(64),
            fileSize: 2000,
            releaseNotes: 'New',
            minimumSupportedVersion: '1.0.0',
            minimumVersionCode: 100,
            mandatory: false,
            status: 'ACTIVE',
          },
          activeRelease,
          'admin'
        );
      }).toThrowError(/strictly greater/);
    });
  });
});
