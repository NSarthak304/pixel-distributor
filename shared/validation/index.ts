/**
 * Pixel Distributor - Zod Runtime Validation Schemas
 */

import { z } from 'zod';

// =============================================================================
// PRIMITIVES & REGEX VALIDATORS
// =============================================================================

export const MobileRegex = /^\+?[0-9]{10,14}$/;
export const GstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PanRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const PinRegex = /^[1-9][0-9]{5}$/; // Indian 6-digit PIN

// =============================================================================
// DEALER SCHEMAS
// =============================================================================

export const DealerTypeEnum = z.enum(['PLATINUM', 'GOLD', 'SILVER', 'STANDARD']);
export const PriceGroupEnum = z.enum(['TIER_1', 'TIER_2', 'TIER_3', 'STANDARD']);
export const AccountStatusEnum = z.enum(['ACTIVE', 'SUSPENDED', 'INVITED', 'DEACTIVATED']);

export const CreateDealerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  ownerName: z.string().min(2, 'Owner name must be at least 2 characters'),
  mobile: z.string().regex(MobileRegex, 'Invalid phone number format'),
  whatsapp: z.string().regex(MobileRegex, 'Invalid WhatsApp number format').optional().or(z.literal('')),
  email: z.string().email('Invalid email address'),
  gstin: z.string().regex(GstinRegex, 'Invalid GSTIN format').optional().or(z.literal('')),
  pan: z.string().regex(PanRegex, 'Invalid PAN format').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pin: z.string().regex(PinRegex, 'PIN code must be a valid 6-digit postal code'),
  dealerType: DealerTypeEnum.default('STANDARD'),
  priceGroup: PriceGroupEnum.default('STANDARD'),
  creditLimit: z.number().min(0, 'Credit limit cannot be negative').default(100000),
  paymentTerms: z.string().min(2, 'Payment terms required').default('NET_30'),
  assignedWarehouse: z.string().min(2, 'Assigned warehouse is required'),
  accountStatus: AccountStatusEnum.default('ACTIVE'),
});

export type CreateDealerInput = z.infer<typeof CreateDealerSchema>;

export const UpdateDealerSchema = CreateDealerSchema.partial().extend({
  dealerId: z.string(),
});

// =============================================================================
// USER SCHEMAS
// =============================================================================

export const UserRoleEnum = z.enum([
  'SUPER_ADMIN',
  'ADMIN',
  'INVENTORY_MANAGER',
  'SALES_MANAGER',
  'DEALER',
  'DEALER_STAFF',
  'VIEWER',
]);

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  displayName: z.string().min(2, 'Name is required'),
  phone: z.string().regex(MobileRegex, 'Invalid phone number'),
  role: UserRoleEnum,
  dealerId: z.string().default('CENTRAL'),
  status: AccountStatusEnum.default('ACTIVE'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

// =============================================================================
// PRODUCT SCHEMAS
// =============================================================================

export const CreateProductSchema = z.object({
  sku: z.string().min(3, 'SKU must be at least 3 characters').toUpperCase(),
  name: z.string().min(2, 'Product name is required'),
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().min(1, 'Category name is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  variant: z.string().optional(),
  unit: z.string().default('PCS'),
  mrp: z.number().positive('MRP must be positive'),
  purchasePrice: z.number().min(0, 'Purchase price cannot be negative'),
  dealerPrices: z.object({
    TIER_1: z.number().positive('Price must be positive'),
    TIER_2: z.number().positive('Price must be positive'),
    TIER_3: z.number().positive('Price must be positive').optional(),
    STANDARD: z.number().positive('Price must be positive'),
  }),
  reorderLevel: z.number().min(0, 'Reorder level cannot be negative').default(10),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductSchema>;

// =============================================================================
// INVENTORY & STOCK TRANSFERS
// =============================================================================

export const StockTransferItemSchema = z.object({
  sku: z.string().min(1),
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be an integer greater than zero'),
});

export const CreateStockTransferSchema = z.object({
  sourceType: z.enum(['CENTRAL_WAREHOUSE', 'DEALER']).default('CENTRAL_WAREHOUSE'),
  sourceId: z.string().min(1, 'Source ID required'),
  destinationType: z.enum(['CENTRAL_WAREHOUSE', 'DEALER']).default('DEALER'),
  destinationId: z.string().min(1, 'Destination ID required'),
  dealerId: z.string().min(1, 'Destination Dealer ID required'),
  items: z.array(StockTransferItemSchema).min(1, 'Transfer must contain at least one item'),
  notes: z.string().optional(),
});

export type CreateStockTransferInput = z.infer<typeof CreateStockTransferSchema>;

export const StockMovementSchema = z.object({
  type: z.enum([
    'STOCK_IN',
    'STOCK_OUT',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'SALE',
    'RETURN',
    'DAMAGED',
    'ADJUSTMENT',
  ]),
  sku: z.string().min(1),
  productId: z.string().min(1),
  locationType: z.enum(['CENTRAL_WAREHOUSE', 'DEALER']),
  locationId: z.string().min(1),
  dealerId: z.string().min(1),
  quantityDelta: z.number().int().refine((val) => val !== 0, 'Quantity delta cannot be zero'),
  referenceType: z.enum(['ORDER', 'TRANSFER', 'PURCHASE_RECEIPT', 'AUDIT_ADJUSTMENT', 'DAMAGE']),
  referenceId: z.string().min(1),
  notes: z.string().optional(),
});

export type StockMovementInput = z.infer<typeof StockMovementSchema>;

// =============================================================================
// ORDERS
// =============================================================================

export const OrderItemSchema = z.object({
  sku: z.string().min(1),
  productId: z.string().min(1),
  productName: z.string().min(1),
  quantity: z.number().int().positive('Quantity must be at least 1'),
  unitPrice: z.number().positive('Unit price must be positive'),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  lineTotal: z.number().positive(),
});

export const CreateOrderSchema = z.object({
  dealerId: z.string().min(1, 'Dealer ID is required'),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one line item'),
  subtotal: z.number().min(0),
  discountTotal: z.number().min(0).default(0),
  taxTotal: z.number().min(0).default(0),
  grandTotal: z.number().positive('Grand total must be positive'),
  shippingAddress: z.object({
    address: z.string().min(3),
    city: z.string().min(2),
    state: z.string().min(2),
    pin: z.string().regex(PinRegex),
  }),
  notes: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

// =============================================================================
// PAYMENTS
// =============================================================================

export const CreatePaymentSchema = z.object({
  dealerId: z.string().min(1),
  orderId: z.string().optional(),
  amount: z.number().positive('Payment amount must be greater than zero'),
  mode: z.enum(['NEFT', 'RTGS', 'UPI', 'CHEQUE', 'CASH', 'CREDIT_NOTE']),
  referenceNumber: z.string().min(3, 'Reference number is required'),
  paymentDate: z.string(),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;

// =============================================================================
// APP RELEASES & APK DISTRIBUTION
// =============================================================================

export const CreateAppReleaseSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow SemVer (e.g. 1.2.0)'),
  versionCode: z.number().int().positive('Version code must be a positive integer'),
  downloadUrl: z.string().url('Download URL must be a valid URL'),
  checksum: z.string().regex(/^[a-f0-9]{64}$/i, 'Checksum must be a valid 64-char SHA-256 hash'),
  fileSize: z.number().int().positive('File size must be positive in bytes'),
  releaseNotes: z.string().min(5, 'Release notes must be at least 5 characters'),
  minimumSupportedVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  minimumVersionCode: z.number().int().positive(),
  mandatory: z.boolean().default(false),
  status: z.enum(['DRAFT', 'ACTIVE', 'DEPRECATED', 'REVOKED']).default('ACTIVE'),
});

export type CreateAppReleaseInput = z.infer<typeof CreateAppReleaseSchema>;

// =============================================================================
// EXCEL ROW SCHEMAS
// =============================================================================

export const ExcelProductRowSchema = z.object({
  SKU: z.string().min(2),
  Name: z.string().min(2),
  Category: z.string().min(1),
  Brand: z.string().min(1),
  Model: z.string().min(1),
  Unit: z.string().default('PCS'),
  MRP: z.coerce.number().positive(),
  Purchase_Price: z.coerce.number().min(0),
  Dealer_Price_Tier1: z.coerce.number().positive(),
  Dealer_Price_Tier2: z.coerce.number().positive(),
  Reorder_Level: z.coerce.number().min(0).default(10),
});

export const ExcelDealerRowSchema = z.object({
  Dealer_ID: z.string().min(2),
  Business_Name: z.string().min(2),
  Owner_Name: z.string().min(2),
  Mobile: z.coerce.string().regex(MobileRegex),
  Email: z.string().email(),
  Address: z.string().min(3),
  City: z.string().min(2),
  State: z.string().min(2),
  PIN: z.coerce.string().regex(PinRegex),
  Dealer_Type: DealerTypeEnum.default('STANDARD'),
  Price_Group: PriceGroupEnum.default('STANDARD'),
  Credit_Limit: z.coerce.number().min(0).default(100000),
  Assigned_Warehouse: z.string().min(2),
});
