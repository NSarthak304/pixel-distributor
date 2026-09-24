/**
 * Pixel Distributor - In-Memory State Store & Persistence Layer
 *
 * Provides a self-contained, reactive storage layer for running the platform
 * locally and in test environments, adhering to Cloud Firestore semantics.
 */

import {
  Dealer,
  User,
  Product,
  Category,
  Warehouse,
  InventoryItem,
  InventoryTransaction,
  StockTransfer,
  Order,
  Customer,
  Payment,
  ActivityLog,
  AppRelease,
  UserPermission,
  AppConfiguration,
} from '@pixel/shared';
import { DealerService } from '../services/dealer.service.js';
import { CreateDealerInput } from '@pixel/shared';

export class MemoryStore {
  public dealers: Map<string, Dealer> = new Map();
  public users: Map<string, User> = new Map();
  public userPermissions: Map<string, UserPermission> = new Map();
  public appConfigurations: Map<string, AppConfiguration> = new Map();
  public products: Map<string, Product> = new Map();
  public categories: Map<string, Category> = new Map();
  public warehouses: Map<string, Warehouse> = new Map();
  public inventory: Map<string, InventoryItem> = new Map();
  public inventoryTransactions: InventoryTransaction[] = [];
  public stockTransfers: Map<string, StockTransfer> = new Map();
  public orders: Map<string, Order> = new Map();
  public customers: Map<string, Customer> = new Map();
  public payments: Map<string, Payment> = new Map();
  public activityLogs: ActivityLog[] = [];
  public appReleases: Map<string, AppRelease> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  public seedDefaultData(): void {
    const now = new Date().toISOString();

    // 1. Central Warehouses
    const wh1: Warehouse = {
      warehouseId: 'WH-MUMBAI-01',
      name: 'Central Mumbai Fulfillment Hub',
      address: 'Plot 18, Kurla Industrial Estate',
      city: 'Mumbai',
      state: 'Maharashtra',
      contactPerson: 'Sanjay Verma',
      contactPhone: '+919820011223',
      isActive: true,
    };
    this.warehouses.set(wh1.warehouseId, wh1);

    // 2. Categories
    this.categories.set('smartphones', {
      categoryId: 'smartphones',
      name: 'Smartphones & Tablets',
      displayOrder: 1,
    });
    this.categories.set('audio', {
      categoryId: 'audio',
      name: 'Audio & Wearables',
      displayOrder: 2,
    });

    // 3. Products
    const p1: Product = {
      productId: 'PRD-101',
      sku: 'PX-ULTRA-256',
      name: 'Pixel Ultra 256GB Titanium',
      categoryId: 'smartphones',
      categoryName: 'Smartphones & Tablets',
      brand: 'Pixel',
      model: 'Ultra 2026',
      unit: 'PCS',
      mrp: 74999,
      purchasePrice: 52000,
      dealerPrices: { TIER_1: 56000, TIER_2: 58000, TIER_3: 60000, STANDARD: 62000 },
      reorderLevel: 10,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const p2: Product = {
      productId: 'PRD-102',
      sku: 'PX-PRO-128',
      name: 'Pixel Pro 128GB Obsidian',
      categoryId: 'smartphones',
      categoryName: 'Smartphones & Tablets',
      brand: 'Pixel',
      model: 'Pro 2026',
      unit: 'PCS',
      mrp: 59999,
      purchasePrice: 41000,
      dealerPrices: { TIER_1: 44000, TIER_2: 46000, TIER_3: 48000, STANDARD: 50000 },
      reorderLevel: 15,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    const p3: Product = {
      productId: 'PRD-103',
      sku: 'PX-BUDS-PRO',
      name: 'Pixel Buds Pro Wireless ANC',
      categoryId: 'audio',
      categoryName: 'Audio & Wearables',
      brand: 'Pixel',
      model: 'Buds Pro 2',
      unit: 'PCS',
      mrp: 14999,
      purchasePrice: 8500,
      dealerPrices: { TIER_1: 9900, TIER_2: 10500, TIER_3: 11000, STANDARD: 11500 },
      reorderLevel: 25,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.products.set(p1.productId, p1);
    this.products.set(p2.productId, p2);
    this.products.set(p3.productId, p3);

    // 4. Central Warehouse Inventory
    this.inventory.set('CENTRAL_WAREHOUSE_WH-MUMBAI-01_PX-ULTRA-256', {
      inventoryId: 'CENTRAL_WAREHOUSE_WH-MUMBAI-01_PX-ULTRA-256',
      locationType: 'CENTRAL_WAREHOUSE',
      locationId: 'WH-MUMBAI-01',
      dealerId: 'CENTRAL',
      productId: p1.productId,
      sku: p1.sku,
      productName: p1.name,
      quantity: 250,
      reservedQuantity: 0,
      reorderLevel: 20,
      updatedAt: now,
    });
    this.inventory.set('CENTRAL_WAREHOUSE_WH-MUMBAI-01_PX-PRO-128', {
      inventoryId: 'CENTRAL_WAREHOUSE_WH-MUMBAI-01_PX-PRO-128',
      locationType: 'CENTRAL_WAREHOUSE',
      locationId: 'WH-MUMBAI-01',
      dealerId: 'CENTRAL',
      productId: p2.productId,
      sku: p2.sku,
      productName: p2.name,
      quantity: 180,
      reservedQuantity: 0,
      reorderLevel: 20,
      updatedAt: now,
    });
    this.inventory.set('CENTRAL_WAREHOUSE_WH-MUMBAI-01_PX-BUDS-PRO', {
      inventoryId: 'CENTRAL_WAREHOUSE_WH-MUMBAI-01_PX-BUDS-PRO',
      locationType: 'CENTRAL_WAREHOUSE',
      locationId: 'WH-MUMBAI-01',
      dealerId: 'CENTRAL',
      productId: p3.productId,
      sku: p3.sku,
      productName: p3.name,
      quantity: 400,
      reservedQuantity: 0,
      reorderLevel: 50,
      updatedAt: now,
    });

    // 5. Seed Central Admin User
    this.users.set('usr_admin_01', {
      userId: 'usr_admin_01',
      dealerId: 'CENTRAL',
      email: 'admin@pixeldistributor.com',
      displayName: 'System Administrator',
      phone: '+919800000001',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    });

    // 6. Seed Initial Dealers: Dealer A, Dealer B, Dealer C (as specified)
    const dealerAInput: CreateDealerInput = {
      businessName: 'Apex Telecom & Digital (Dealer A)',
      ownerName: 'Rajesh Kumar',
      mobile: '+919876543210',
      email: 'dealerA@apex.in',
      address: '42 Ring Road, Commercial Zone',
      city: 'Mumbai',
      state: 'Maharashtra',
      pin: '400093',
      dealerType: 'GOLD',
      priceGroup: 'TIER_1',
      creditLimit: 500000,
      paymentTerms: 'NET_30',
      assignedWarehouse: 'WH-MUMBAI-01',
      accountStatus: 'ACTIVE',
    };
    const provA = DealerService.provisionDealer(dealerAInput, 'DLR-1001', {
      uid: 'usr_admin_01',
      email: 'admin@pixeldistributor.com',
    });
    provA.permissionProfile.modules = {
      dashboard: 'VIEW',
      inventory: 'EDIT',
      orders: 'EDIT',
      customers: 'VIEW',
      payments: 'VIEW',
      reports: 'VIEW',
    };
    provA.appConfiguration.dashboardCards = ['sales', 'orders', 'inventory', 'outstanding', 'customers'];
    this.dealers.set(provA.dealer.dealerId, provA.dealer);
    this.users.set(provA.user.userId, provA.user);
    this.userPermissions.set(provA.permissionProfile.userPermissionId, provA.permissionProfile);
    this.appConfigurations.set(provA.appConfiguration.configId, provA.appConfiguration);

    const dealerBInput: CreateDealerInput = {
      businessName: 'Supreme Mobiles (Dealer B)',
      ownerName: 'Suresh Patel',
      mobile: '+919811223344',
      email: 'dealerB@supreme.in',
      address: '88 Station Road',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pin: '380001',
      dealerType: 'PLATINUM',
      priceGroup: 'TIER_1',
      creditLimit: 1000000,
      paymentTerms: 'NET_30',
      assignedWarehouse: 'WH-MUMBAI-01',
      accountStatus: 'ACTIVE',
    };
    const provB = DealerService.provisionDealer(dealerBInput, 'DLR-1002', {
      uid: 'usr_admin_01',
      email: 'admin@pixeldistributor.com',
    });
    provB.permissionProfile.modules = {
      dashboard: 'VIEW',
      inventory: 'VIEW',
      orders: 'CREATE',
      customers: 'HIDDEN',
      payments: 'HIDDEN',
      reports: 'HIDDEN',
    };
    provB.appConfiguration.dashboardCards = ['orders', 'inventory'];
    provB.appConfiguration.visibleModules = ['dashboard', 'productMaster', 'dealerInventory', 'orders'];
    this.dealers.set(provB.dealer.dealerId, provB.dealer);
    this.users.set(provB.user.userId, provB.user);
    this.userPermissions.set(provB.permissionProfile.userPermissionId, provB.permissionProfile);
    this.appConfigurations.set(provB.appConfiguration.configId, provB.appConfiguration);

    const dealerCInput: CreateDealerInput = {
      businessName: 'City Connect Retail (Dealer C)',
      ownerName: 'Anil Deshmukh',
      mobile: '+919922334455',
      email: 'dealerC@cityconnect.in',
      address: '15 Gandhi Square',
      city: 'Pune',
      state: 'Maharashtra',
      pin: '411001',
      dealerType: 'STANDARD',
      priceGroup: 'STANDARD',
      creditLimit: 250000,
      paymentTerms: 'NET_15',
      assignedWarehouse: 'WH-MUMBAI-01',
      accountStatus: 'ACTIVE',
    };
    const provC = DealerService.provisionDealer(dealerCInput, 'DLR-1003', {
      uid: 'usr_admin_01',
      email: 'admin@pixeldistributor.com',
    });
    provC.permissionProfile.modules = {
      dashboard: 'VIEW',
      inventory: 'HIDDEN',
      orders: 'VIEW',
      customers: 'VIEW',
      payments: 'VIEW',
      reports: 'HIDDEN',
    };
    provC.appConfiguration.dashboardCards = ['orders', 'outstanding'];
    provC.appConfiguration.visibleModules = ['dashboard', 'orders', 'customers', 'finance'];
    this.dealers.set(provC.dealer.dealerId, provC.dealer);
    this.users.set(provC.user.userId, provC.user);
    this.userPermissions.set(provC.permissionProfile.userPermissionId, provC.permissionProfile);
    this.appConfigurations.set(provC.appConfiguration.configId, provC.appConfiguration);

    // 7. Seed Central Super Admin User
    const superAdmin: User = {
      userId: 'usr_admin_naren',
      dealerId: 'CENTRAL',
      email: 'naren7703@gmail.com',
      displayName: 'Naren (Super Admin)',
      phone: '+919876543210',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(superAdmin.userId, superAdmin);

    // 8. Seed Active APK Release
    const rel1: AppRelease = {
      releaseId: 'REL-v1.0.0',
      version: '1.0.0',
      versionCode: 100,
      releaseDate: now,
      downloadUrl: '/releases/pixel-distributor-v1.0.0.apk',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      fileSize: 18450120,
      releaseNotes: '• Initial Production Release\n• Unified multi-tenant dealer engine\n• Offline cache support',
      minimumSupportedVersion: '1.0.0',
      minimumVersionCode: 100,
      mandatory: false,
      status: 'ACTIVE',
      publishedBy: superAdmin.userId,
      createdAt: now,
    };
    this.appReleases.set(rel1.releaseId, rel1);
  }
}

// Global Singleton Store Instance
export const globalStore = new MemoryStore();
