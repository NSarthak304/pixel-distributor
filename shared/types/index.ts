/**
 * Pixel Distributor - Core Shared Type Definitions
 */

// =============================================================================
// ROLES & ACCESS CONTROL
// =============================================================================

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'INVENTORY_MANAGER'
  | 'SALES_MANAGER'
  | 'DEALER'
  | 'DEALER_STAFF'
  | 'VIEWER';

export type CapabilityLevel =
  | 'HIDDEN'
  | 'VIEW'
  | 'CREATE'
  | 'EDIT'
  | 'DELETE'
  | 'ADMIN';

export type ModuleKey =
  | 'dashboard'
  | 'dealerManagement'
  | 'userManagement'
  | 'productMaster'
  | 'centralInventory'
  | 'dealerInventory'
  | 'stockTransfers'
  | 'orders'
  | 'customers'
  | 'finance'
  | 'reports'
  | 'appManagement'
  | 'activityLogs'
  | 'settings';

export type ActionVerb = 'view' | 'create' | 'edit' | 'delete' | 'admin';

export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'DEACTIVATED';

// =============================================================================
// 1. USERS
// =============================================================================

export interface User {
  userId: string;
  dealerId: string; // "CENTRAL" for central team, or specific Dealer ID
  email: string;
  displayName: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  lastLoginAt?: string | null;
  currentAppVersion?: string | null;
  deviceInfo?: {
    platform?: string;
    model?: string;
    fcmToken?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// 2. DEALERS
// =============================================================================

export type DealerType = 'PLATINUM' | 'GOLD' | 'SILVER' | 'STANDARD';
export type PriceGroup = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'STANDARD';

export interface Dealer {
  dealerId: string; // e.g. "DLR-1001"
  businessName: string;
  ownerName: string;
  mobile: string;
  whatsapp?: string;
  email: string;
  gstin?: string;
  pan?: string;
  address: string;
  city: string;
  state: string;
  pin: string;
  dealerType: DealerType;
  priceGroup: PriceGroup;
  creditLimit: number;
  paymentTerms: string; // e.g. "NET_30", "ADVANCE"
  assignedWarehouse: string;
  accountStatus: AccountStatus;
  appId: string;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// 3. ROLES & PERMISSIONS
// =============================================================================

export interface Role {
  roleId: UserRole;
  name: string;
  description: string;
  defaultPermissions: Record<ModuleKey, CapabilityLevel>;
  isSystemRole: boolean;
}

export interface Permission {
  permissionId: ModuleKey;
  displayName: string;
  category: 'OPERATIONS' | 'COMMERCE' | 'FINANCE' | 'SYSTEM';
  supportedLevels: CapabilityLevel[];
}

export interface UserPermission {
  userPermissionId: string; // {dealerId}_{userId}
  dealerId: string;
  userId: string;
  modules: Record<ModuleKey, CapabilityLevel>;
  grantedBy: string;
  updatedAt: string;
}

// =============================================================================
// 4. APP CONFIGURATION
// =============================================================================

export type DashboardCardKey =
  | 'sales'
  | 'orders'
  | 'inventory'
  | 'outstanding'
  | 'customers'
  | 'notifications';

export type PriceVisibilityMode = 'DEALER_ONLY' | 'DEALER_AND_MRP' | 'ALL';
export type InventoryVisibilityMode = 'FULL' | 'RESTRICTED' | 'HIDDEN';

export interface AppConfiguration {
  configId: string; // same as dealerId
  dealerId: string;
  visibleModules: ModuleKey[];
  dashboardCards: DashboardCardKey[];
  inventoryVisibility: InventoryVisibilityMode;
  priceVisibility: PriceVisibilityMode;
  mrpVisibility: boolean;
  purchaseCostVisibility: boolean; // Strictly false for dealers
  canCreateOrders: boolean;
  canEditProducts: boolean;
  canRequestStock: boolean;
  canViewReports: boolean;
  canViewPayments: boolean;
  themeColor?: string;
  updatedAt: string;
}

// =============================================================================
// 5. PRODUCTS & CATALOG
// =============================================================================

export interface Product {
  productId: string;
  sku: string;
  name: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  model: string;
  variant?: string;
  unit: string; // "PCS", "BOX", etc.
  mrp: number;
  purchasePrice: number; // Masked from dealers
  dealerPrices: Record<PriceGroup, number>;
  reorderLevel: number;
  isActive: boolean;
  imageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  categoryId: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface Warehouse {
  warehouseId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  contactPerson: string;
  contactPhone: string;
  isActive: boolean;
}

// =============================================================================
// 6. INVENTORY & TRANSACTIONS
// =============================================================================

export type LocationType = 'CENTRAL_WAREHOUSE' | 'DEALER';

export interface InventoryItem {
  inventoryId: string; // {locationType}_{locationId}_{sku}
  locationType: LocationType;
  locationId: string; // Warehouse ID or Dealer ID
  dealerId: string; // "CENTRAL" or Dealer ID
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  reservedQuantity: number;
  reorderLevel: number;
  updatedAt: string;
}

export type InventoryTransactionType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'SALE'
  | 'RETURN'
  | 'DAMAGED'
  | 'ADJUSTMENT';

export interface InventoryTransaction {
  transactionId: string;
  type: InventoryTransactionType;
  sku: string;
  productId: string;
  locationType: LocationType;
  locationId: string;
  dealerId: string;
  quantityDelta: number; // e.g. +50 or -10
  balanceAfter: number;
  referenceType: 'ORDER' | 'TRANSFER' | 'PURCHASE_RECEIPT' | 'AUDIT_ADJUSTMENT' | 'DAMAGE';
  referenceId: string;
  createdBy: string;
  notes?: string;
  timestamp: string;
}

export type TransferStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export interface StockTransferItem {
  sku: string;
  productId: string;
  productName: string;
  quantity: number;
}

export interface StockTransfer {
  transferId: string;
  sourceType: LocationType;
  sourceId: string;
  destinationType: LocationType;
  destinationId: string;
  dealerId: string; // destination dealer ID for tenant queries
  items: StockTransferItem[];
  status: TransferStatus;
  trackingNumber?: string;
  createdBy: string;
  approvedBy?: string;
  dispatchedAt?: string;
  receivedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// 7. ORDERS
// =============================================================================

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface OrderItem {
  sku: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  discount: number;
  lineTotal: number;
}

export interface Order {
  orderId: string;
  dealerId: string;
  customerId?: string;
  customerName?: string;
  items: OrderItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  grandTotal: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    pin: string;
  };
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// 8. CUSTOMERS
// =============================================================================

export interface Customer {
  customerId: string;
  dealerId: string; // Strictly tenant isolated
  name: string;
  phone: string;
  email?: string;
  gstin?: string;
  address?: string;
  city?: string;
  state?: string;
  pin?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// 9. FINANCE & PAYMENTS
// =============================================================================

export type PaymentMode = 'NEFT' | 'RTGS' | 'UPI' | 'CHEQUE' | 'CASH' | 'CREDIT_NOTE';
export type PaymentVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface Payment {
  paymentId: string;
  dealerId: string;
  orderId?: string;
  amount: number;
  mode: PaymentMode;
  referenceNumber: string;
  status: PaymentVerificationStatus;
  notes?: string;
  verifiedBy?: string;
  paymentDate: string;
  createdAt: string;
}

// =============================================================================
// 10. NOTIFICATIONS & AUDIT
// =============================================================================

export interface Notification {
  notificationId: string;
  recipientType: 'BROADCAST' | 'DEALER' | 'USER';
  dealerId?: string;
  userId?: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  logId: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  dealerId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// =============================================================================
// 11. APP RELEASES & APK DISTRIBUTION
// =============================================================================

export type ReleaseStatus = 'DRAFT' | 'ACTIVE' | 'DEPRECATED' | 'REVOKED';

export interface AppRelease {
  releaseId: string;
  version: string; // e.g. "1.2.0"
  versionCode: number; // e.g. 120
  releaseDate: string;
  downloadUrl: string;
  checksum: string; // SHA-256
  fileSize: number;
  releaseNotes: string;
  minimumSupportedVersion: string;
  minimumVersionCode: number;
  mandatory: boolean;
  status: ReleaseStatus;
  publishedBy: string;
  createdAt: string;
}

// =============================================================================
// 12. SETTINGS
// =============================================================================

export interface SystemSettings {
  settingId: string;
  data: Record<string, unknown>;
  updatedAt: string;
  updatedBy: string;
}

// =============================================================================
// 13. STAGED EXCEL IMPORT CONTRACTS
// =============================================================================

export interface ExcelValidationError {
  row: number;
  column: string;
  value: unknown;
  message: string;
}

export interface ExcelImportPreview<T = unknown> {
  entityType: 'products' | 'dealers' | 'inventory' | 'priceList';
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  errors: ExcelValidationError[];
  toCreate: T[];
  toUpdate: { id: string; oldData: Partial<T>; newData: Partial<T> }[];
}
