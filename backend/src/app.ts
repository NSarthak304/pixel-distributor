/**
 * Pixel Distributor - Express Application & REST API
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { globalStore } from './store/memory-store.js';
import { DealerService } from './services/dealer.service.js';
import { InventoryService } from './services/inventory.service.js';
import { OrderService } from './services/order.service.js';
import { ReleaseService } from './services/release.service.js';
import { AuditService } from './services/audit.service.js';
import { ExcelEtlService } from './services/excel-etl.service.js';
import {
  CreateDealerSchema,
  CreateProductSchema,
  CreateOrderSchema,
  CreateAppReleaseSchema,
  StockMovementSchema,
  CreateStockTransferSchema,
  hasCapability,
} from '@pixel/shared';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.raw({ type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', limit: '20mb' }));

// Health Check
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'Pixel Distributor Central API',
    timestamp: new Date().toISOString(),
    dealersCount: globalStore.dealers.size,
    productsCount: globalStore.products.size,
    ordersCount: globalStore.orders.size,
  });
});

// =============================================================================
// DEALER MANAGEMENT ENDPOINTS (Specification Section 4 & 5)
// =============================================================================

// List All Dealers
app.get('/api/v1/dealers', (_req: Request, res: Response) => {
  const dealers = Array.from(globalStore.dealers.values());
  res.json({ success: true, count: dealers.length, data: dealers });
});

// Get Single Dealer
app.get('/api/v1/dealers/:dealerId', (req: Request, res: Response) => {
  const dealer = globalStore.dealers.get(req.params.dealerId);
  if (!dealer) {
    return res.status(404).json({ success: false, error: 'Dealer not found' });
  }
  const appConfig = globalStore.appConfigurations.get(dealer.dealerId);
  const userPerm = globalStore.userPermissions.get(`${dealer.dealerId}_usr_${dealer.dealerId.toLowerCase().replace(/[^a-z0-9]/g, '')}_owner`);

  res.json({
    success: true,
    data: {
      dealer,
      appConfiguration: appConfig,
      userPermission: userPerm,
    },
  });
});

// Add Dealer Workflow (Section 5)
app.post('/api/v1/dealers', (req: Request, res: Response) => {
  const parseResult = CreateDealerSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, errors: parseResult.error.issues });
  }

  const dealerId = DealerService.generateDealerId(globalStore.dealers.size + 1000);
  const adminActor = { uid: 'usr_admin_01', email: 'admin@pixeldistributor.com' };

  const provisioning = DealerService.provisionDealer(parseResult.data, dealerId, adminActor);

  // Commit to Store
  globalStore.dealers.set(provisioning.dealer.dealerId, provisioning.dealer);
  globalStore.users.set(provisioning.user.userId, provisioning.user);
  globalStore.userPermissions.set(provisioning.permissionProfile.userPermissionId, provisioning.permissionProfile);
  globalStore.appConfigurations.set(provisioning.appConfiguration.configId, provisioning.appConfiguration);
  globalStore.activityLogs.push(provisioning.auditRecord);

  res.status(201).json({
    success: true,
    message: 'Dealer successfully provisioned with default permissions and app config',
    data: provisioning,
  });
});

// Suspend / Activate Dealer
app.patch('/api/v1/dealers/:dealerId/status', (req: Request, res: Response) => {
  const dealer = globalStore.dealers.get(req.params.dealerId);
  if (!dealer) return res.status(404).json({ success: false, error: 'Dealer not found' });

  const { status, reason } = req.body;
  if (!['ACTIVE', 'SUSPENDED', 'INVITED', 'DEACTIVATED'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid account status' });
  }

  dealer.accountStatus = status;
  dealer.updatedAt = new Date().toISOString();

  // Update associated user status
  for (const user of globalStore.users.values()) {
    if (user.dealerId === dealer.dealerId) {
      user.status = status;
      user.updatedAt = new Date().toISOString();
    }
  }

  globalStore.activityLogs.push(
    AuditService.createLogRecord({
      actorId: 'usr_admin_01',
      actorEmail: 'admin@pixeldistributor.com',
      actorRole: 'ADMIN',
      dealerId: dealer.dealerId,
      action: 'DEALER_STATUS_CHANGED',
      entity: 'dealers',
      entityId: dealer.dealerId,
      metadata: { newStatus: status, reason },
    })
  );

  res.json({ success: true, data: dealer });
});

// Update Dealer Permissions (Specification Section 6)
app.put('/api/v1/dealers/:dealerId/permissions', (req: Request, res: Response) => {
  const { dealerId } = req.params;
  const { modules } = req.body;

  // Find user permission doc
  let foundKey: string | null = null;
  for (const [key, perm] of globalStore.userPermissions.entries()) {
    if (perm.dealerId === dealerId) {
      foundKey = key;
      perm.modules = modules;
      perm.updatedAt = new Date().toISOString();
      break;
    }
  }

  if (!foundKey) {
    return res.status(404).json({ success: false, error: 'Permission profile not found for dealer' });
  }

  globalStore.activityLogs.push(
    AuditService.createLogRecord({
      actorId: 'usr_admin_01',
      actorEmail: 'admin@pixeldistributor.com',
      actorRole: 'ADMIN',
      dealerId,
      action: 'PERMISSIONS_OVERRIDDEN',
      entity: 'userPermissions',
      entityId: foundKey,
      metadata: { updatedModules: modules },
    })
  );

  res.json({ success: true, message: 'Permissions updated successfully', data: globalStore.userPermissions.get(foundKey) });
});

// Update Dealer App Configuration (Specification Section 19)
app.put('/api/v1/dealers/:dealerId/config', (req: Request, res: Response) => {
  const { dealerId } = req.params;
  const config = globalStore.appConfigurations.get(dealerId);
  if (!config) return res.status(404).json({ success: false, error: 'App configuration not found' });

  // Invariant: purchaseCostVisibility is ALWAYS false for dealers
  const updatedConfig = {
    ...config,
    ...req.body,
    dealerId,
    configId: dealerId,
    purchaseCostVisibility: false,
    updatedAt: new Date().toISOString(),
  };

  globalStore.appConfigurations.set(dealerId, updatedConfig);

  globalStore.activityLogs.push(
    AuditService.createLogRecord({
      actorId: 'usr_admin_01',
      actorEmail: 'admin@pixeldistributor.com',
      actorRole: 'ADMIN',
      dealerId,
      action: 'APP_CONFIGURATION_UPDATED',
      entity: 'appConfigurations',
      entityId: dealerId,
      metadata: req.body,
    })
  );

  res.json({ success: true, data: updatedConfig });
});

// =============================================================================
// PRODUCT MASTER ENDPOINTS
// =============================================================================

app.get('/api/v1/products', (req: Request, res: Response) => {
  const callerRole = (req.query.role as string) || 'DEALER';
  const priceGroup = (req.query.priceGroup as string) || 'STANDARD';

  const products = Array.from(globalStore.products.values()).map((p) => {
    // If dealer, strip purchasePrice!
    if (callerRole === 'DEALER' || callerRole === 'DEALER_STAFF') {
      const { purchasePrice, ...dealerView } = p;
      return {
        ...dealerView,
        activePrice: p.dealerPrices[priceGroup as keyof typeof p.dealerPrices] || p.dealerPrices.STANDARD,
      };
    }
    return p;
  });

  res.json({ success: true, data: products });
});

app.post('/api/v1/products', (req: Request, res: Response) => {
  const parseResult = CreateProductSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, errors: parseResult.error.issues });
  }

  const productId = `PRD-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();

  const product = {
    ...parseResult.data,
    productId,
    createdAt: now,
    updatedAt: now,
  };

  globalStore.products.set(productId, product);

  globalStore.activityLogs.push(
    AuditService.createLogRecord({
      actorId: 'usr_admin_01',
      actorEmail: 'admin@pixeldistributor.com',
      actorRole: 'ADMIN',
      dealerId: 'CENTRAL',
      action: 'PRODUCT_CREATED',
      entity: 'products',
      entityId: productId,
      metadata: { sku: product.sku, name: product.name },
    })
  );

  res.status(201).json({ success: true, data: product });
});

// =============================================================================
// INVENTORY & STOCK TRANSFERS ENDPOINTS (Specification Section 10 & 11)
// =============================================================================

// Query Current Inventory
app.get('/api/v1/inventory', (req: Request, res: Response) => {
  const dealerId = req.query.dealerId as string;
  let items = Array.from(globalStore.inventory.values());

  if (dealerId && dealerId !== 'ALL') {
    items = items.filter((i) => i.dealerId === dealerId || i.dealerId === 'CENTRAL');
  }

  res.json({ success: true, count: items.length, data: items });
});

// Record Stock Movement (Stock In / Stock Out / Damaged / Return)
app.post('/api/v1/inventory/movements', (req: Request, res: Response) => {
  const parseResult = StockMovementSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, errors: parseResult.error.issues });
  }

  const movement = parseResult.data;
  const inventoryKey = `${movement.locationType}_${movement.locationId}_${movement.sku}`;
  const currentItem = globalStore.inventory.get(inventoryKey) || null;
  const product = Array.from(globalStore.products.values()).find((p) => p.sku === movement.sku);

  if (!product) {
    return res.status(404).json({ success: false, error: `Product SKU '${movement.sku}' not found` });
  }

  try {
    const { updatedInventory, transaction } = InventoryService.applyStockMovement({
      currentInventory: currentItem,
      type: movement.type,
      sku: movement.sku,
      productId: product.productId,
      productName: product.name,
      locationType: movement.locationType,
      locationId: movement.locationId,
      dealerId: movement.dealerId,
      quantityDelta: movement.quantityDelta,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      actorId: 'usr_admin_01',
      notes: movement.notes,
    });

    globalStore.inventory.set(inventoryKey, updatedInventory);
    globalStore.inventoryTransactions.push(transaction);

    res.json({ success: true, data: { inventory: updatedInventory, transaction } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown stock movement error';
    res.status(422).json({ success: false, error: message });
  }
});

// List Stock Transfers
app.get('/api/v1/inventory/transfers', (req: Request, res: Response) => {
  const dealerId = req.query.dealerId as string;
  let transfers = Array.from(globalStore.stockTransfers.values());

  if (dealerId) {
    transfers = transfers.filter((t) => t.dealerId === dealerId);
  }

  res.json({ success: true, data: transfers });
});

// Create Stock Transfer (Warehouse -> Dealer)
app.post('/api/v1/inventory/transfers', (req: Request, res: Response) => {
  const parseResult = CreateStockTransferSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, errors: parseResult.error.issues });
  }

  const transfer = InventoryService.createStockTransfer(
    parseResult.data.sourceId,
    parseResult.data.destinationId,
    parseResult.data.items,
    'usr_admin_01',
    parseResult.data.notes
  );

  globalStore.stockTransfers.set(transfer.transferId, transfer);

  globalStore.activityLogs.push(
    AuditService.createLogRecord({
      actorId: 'usr_admin_01',
      actorEmail: 'admin@pixeldistributor.com',
      actorRole: 'ADMIN',
      dealerId: transfer.dealerId,
      action: 'STOCK_TRANSFER_INITIATED',
      entity: 'stockTransfers',
      entityId: transfer.transferId,
      metadata: { itemsCount: transfer.items.length },
    })
  );

  res.status(201).json({ success: true, data: transfer });
});

// Finalize Transfer Delivery
app.post('/api/v1/inventory/transfers/:transferId/deliver', (req: Request, res: Response) => {
  const transfer = globalStore.stockTransfers.get(req.params.transferId);
  if (!transfer) return res.status(404).json({ success: false, error: 'Transfer not found' });
  if (transfer.status === 'DELIVERED') {
    return res.status(400).json({ success: false, error: 'Transfer already delivered' });
  }

  const whMap = new Map<string, typeof globalStore.inventory extends Map<string, infer V> ? V : never>();
  const dlrMap = new Map<string, typeof globalStore.inventory extends Map<string, infer V> ? V : never>();

  for (const item of transfer.items) {
    const whKey = `CENTRAL_WAREHOUSE_${transfer.sourceId}_${item.sku}`;
    const dlrKey = `DEALER_${transfer.destinationId}_${item.sku}`;
    const whItem = globalStore.inventory.get(whKey);
    const dlrItem = globalStore.inventory.get(dlrKey);
    if (whItem) whMap.set(item.sku, whItem);
    if (dlrItem) dlrMap.set(item.sku, dlrItem);
  }

  try {
    const completion = InventoryService.completeStockTransfer(
      transfer,
      whMap,
      dlrMap,
      'usr_admin_01'
    );

    // Apply updates
    completion.warehouseUpdates.forEach((u) => globalStore.inventory.set(u.inventoryId, u));
    completion.dealerUpdates.forEach((u) => globalStore.inventory.set(u.inventoryId, u));
    completion.transactions.forEach((t) => globalStore.inventoryTransactions.push(t));

    transfer.status = 'DELIVERED';
    transfer.receivedAt = new Date().toISOString();
    transfer.updatedAt = new Date().toISOString();

    globalStore.activityLogs.push(
      AuditService.createLogRecord({
        actorId: 'usr_admin_01',
        actorEmail: 'admin@pixeldistributor.com',
        actorRole: 'ADMIN',
        dealerId: transfer.dealerId,
        action: 'STOCK_TRANSFER_DELIVERED',
        entity: 'stockTransfers',
        entityId: transfer.transferId,
        metadata: { itemsCount: transfer.items.length },
      })
    );

    res.json({ success: true, message: 'Transfer delivered successfully', data: transfer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Transfer fulfillment error';
    res.status(422).json({ success: false, error: message });
  }
});

// =============================================================================
// ORDERS ENDPOINTS (Specification Section 12)
// =============================================================================

app.get('/api/v1/orders', (req: Request, res: Response) => {
  const dealerId = req.query.dealerId as string;
  let orders = Array.from(globalStore.orders.values());

  if (dealerId && dealerId !== 'ALL') {
    orders = orders.filter((o) => o.dealerId === dealerId);
  }

  res.json({ success: true, count: orders.length, data: orders });
});

app.post('/api/v1/orders', (req: Request, res: Response) => {
  const parseResult = CreateOrderSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, errors: parseResult.error.issues });
  }

  const dealer = globalStore.dealers.get(parseResult.data.dealerId);
  if (!dealer) {
    return res.status(404).json({ success: false, error: 'Dealer not found' });
  }

  try {
    const { order, updatedDealerBalance } = OrderService.createOrder(
      parseResult.data,
      dealer,
      'usr_dealer_client'
    );

    dealer.outstandingBalance = updatedDealerBalance;
    globalStore.orders.set(order.orderId, order);

    globalStore.activityLogs.push(
      AuditService.createLogRecord({
        actorId: 'usr_dealer_client',
        actorEmail: dealer.email,
        actorRole: 'DEALER',
        dealerId: dealer.dealerId,
        action: 'ORDER_PLACED',
        entity: 'orders',
        entityId: order.orderId,
        metadata: { grandTotal: order.grandTotal },
      })
    );

    res.status(201).json({ success: true, data: order });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Order creation error';
    res.status(422).json({ success: false, error: message });
  }
});

app.patch('/api/v1/orders/:orderId/status', (req: Request, res: Response) => {
  const order = globalStore.orders.get(req.params.orderId);
  if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

  const { status } = req.body;
  if (!OrderService.isValidTransition(order.status, status)) {
    return res.status(400).json({
      success: false,
      error: `Illegal state transition from '${order.status}' to '${status}'`,
    });
  }

  const oldStatus = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();

  globalStore.activityLogs.push(
    AuditService.createLogRecord({
      actorId: 'usr_admin_01',
      actorEmail: 'admin@pixeldistributor.com',
      actorRole: 'ADMIN',
      dealerId: order.dealerId,
      action: 'ORDER_STATUS_CHANGED',
      entity: 'orders',
      entityId: order.orderId,
      metadata: { oldStatus, newStatus: status },
    })
  );

  res.json({ success: true, data: order });
});

// =============================================================================
// APP RELEASES & APK DISTRIBUTION (Specification Sections 16, 17, 18)
// =============================================================================

// Client APK Version Interrogation Endpoint (Section 17)
app.get('/api/v1/releases/latest', (req: Request, res: Response) => {
  const clientVersionCode = parseInt((req.query.versionCode as string) || '0', 10);
  const releases = Array.from(globalStore.appReleases.values()).filter((r) => r.status === 'ACTIVE');

  if (releases.length === 0) {
    return res.status(404).json({ success: false, error: 'No active release found' });
  }

  // Find release with highest versionCode
  const latestRelease = releases.reduce((prev, curr) => (curr.versionCode > prev.versionCode ? curr : prev));

  const evaluation = ReleaseService.evaluateClientVersion(clientVersionCode, latestRelease);
  res.json({ success: true, data: evaluation });
});

// List All Releases for Admin Control Centre (Section 18)
app.get('/api/v1/releases', (_req: Request, res: Response) => {
  const releases = Array.from(globalStore.appReleases.values());
  res.json({
    success: true,
    data: releases,
    telemetry: {
      totalUsers: globalStore.users.size,
      versionDistribution: {
        'v1.0.0 (100)': globalStore.users.size,
      },
    },
  });
});

// Publish APK Release (Section 18)
app.post('/api/v1/releases', (req: Request, res: Response) => {
  const parseResult = CreateAppReleaseSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ success: false, errors: parseResult.error.issues });
  }

  const activeReleases = Array.from(globalStore.appReleases.values()).filter((r) => r.status === 'ACTIVE');
  const latestActive = activeReleases.length > 0
    ? activeReleases.reduce((p, c) => (c.versionCode > p.versionCode ? c : p))
    : null;

  try {
    const release = ReleaseService.publishRelease(parseResult.data, latestActive, 'usr_admin_01');
    globalStore.appReleases.set(release.releaseId, release);

    globalStore.activityLogs.push(
      AuditService.createLogRecord({
        actorId: 'usr_admin_01',
        actorEmail: 'admin@pixeldistributor.com',
        actorRole: 'ADMIN',
        dealerId: 'CENTRAL',
        action: 'APK_PUBLISHED',
        entity: 'appReleases',
        entityId: release.releaseId,
        metadata: {
          version: release.version,
          versionCode: release.versionCode,
          mandatory: release.mandatory,
        },
      })
    );

    res.status(201).json({ success: true, data: release });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Release publish error';
    res.status(422).json({ success: false, error: message });
  }
});

// =============================================================================
// AUDIT LOGS ENDPOINT (Specification Section 24)
// =============================================================================

app.get('/api/v1/activity', (_req: Request, res: Response) => {
  const logs = [...globalStore.activityLogs].reverse();
  res.json({ success: true, count: logs.length, data: logs });
});

// =============================================================================
// EXCEL BULK EXPORT ENDPOINTS
// =============================================================================

app.get('/api/v1/excel/export/:entity', (req: Request, res: Response) => {
  const { entity } = req.params;

  if (entity === 'products') {
    const products = Array.from(globalStore.products.values());
    const buffer = ExcelEtlService.exportProductsToBuffer(products);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Products_Export.xlsx"');
    return res.send(Buffer.from(buffer));
  }

  if (entity === 'dealers') {
    const dealers = Array.from(globalStore.dealers.values());
    const buffer = ExcelEtlService.exportDealersToBuffer(dealers);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Dealers_Export.xlsx"');
    return res.send(Buffer.from(buffer));
  }

  res.status(404).json({ success: false, error: 'Entity export not supported' });
});
