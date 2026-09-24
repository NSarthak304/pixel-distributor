/**
 * Pixel Distributor - Multi-Tier Capability & Permission Engine
 */

import {
  CapabilityLevel,
  ModuleKey,
  UserRole,
  UserPermission,
  AppConfiguration,
} from '../types/index.js';

export const CAPABILITY_RANKS: Record<CapabilityLevel, number> = {
  HIDDEN: 0,
  VIEW: 1,
  CREATE: 2,
  EDIT: 3,
  DELETE: 4,
  ADMIN: 5,
};

export interface PermissionContext {
  userId: string;
  dealerId: string;
  role: UserRole;
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED' | 'DEACTIVATED';
  modules: Partial<Record<ModuleKey, CapabilityLevel>>;
}

/**
 * Evaluates whether a user context satisfies the minimum required capability for a target module.
 */
export function hasCapability(
  context: PermissionContext | null | undefined,
  module: ModuleKey,
  requiredLevel: CapabilityLevel
): boolean {
  if (!context) return false;
  if (context.status !== 'ACTIVE') return false;

  // Super Admin has unrestricted access to everything
  if (context.role === 'SUPER_ADMIN') return true;

  const currentLevel = context.modules[module] ?? 'HIDDEN';
  return CAPABILITY_RANKS[currentLevel] >= CAPABILITY_RANKS[requiredLevel];
}

/**
 * Convenience method mapping common action verbs to capability thresholds.
 */
export function canPerform(
  context: PermissionContext | null | undefined,
  module: ModuleKey,
  action: 'view' | 'create' | 'edit' | 'delete' | 'admin'
): boolean {
  const mapping: Record<'view' | 'create' | 'edit' | 'delete' | 'admin', CapabilityLevel> = {
    view: 'VIEW',
    create: 'CREATE',
    edit: 'EDIT',
    delete: 'DELETE',
    admin: 'ADMIN',
  };
  return hasCapability(context, module, mapping[action]);
}

/**
 * Returns list of modules where capability is at least VIEW.
 */
export function getPermittedModules(
  context: PermissionContext | null | undefined
): ModuleKey[] {
  if (!context || context.status !== 'ACTIVE') return [];
  if (context.role === 'SUPER_ADMIN') {
    return [
      'dashboard',
      'dealerManagement',
      'userManagement',
      'productMaster',
      'centralInventory',
      'dealerInventory',
      'stockTransfers',
      'orders',
      'customers',
      'finance',
      'reports',
      'appManagement',
      'activityLogs',
      'settings',
    ];
  }

  const allModules: ModuleKey[] = [
    'dashboard',
    'dealerManagement',
    'userManagement',
    'productMaster',
    'centralInventory',
    'dealerInventory',
    'stockTransfers',
    'orders',
    'customers',
    'finance',
    'reports',
    'appManagement',
    'activityLogs',
    'settings',
  ];

  return allModules.filter((mod) => hasCapability(context, mod, 'VIEW'));
}

/**
 * Returns standard default permissions assigned upon role creation.
 */
export function getDefaultPermissionsForRole(
  role: UserRole
): Record<ModuleKey, CapabilityLevel> {
  switch (role) {
    case 'SUPER_ADMIN':
      return {
        dashboard: 'ADMIN',
        dealerManagement: 'ADMIN',
        userManagement: 'ADMIN',
        productMaster: 'ADMIN',
        centralInventory: 'ADMIN',
        dealerInventory: 'ADMIN',
        stockTransfers: 'ADMIN',
        orders: 'ADMIN',
        customers: 'ADMIN',
        finance: 'ADMIN',
        reports: 'ADMIN',
        appManagement: 'ADMIN',
        activityLogs: 'ADMIN',
        settings: 'ADMIN',
      };

    case 'ADMIN':
      return {
        dashboard: 'ADMIN',
        dealerManagement: 'ADMIN',
        userManagement: 'ADMIN',
        productMaster: 'ADMIN',
        centralInventory: 'ADMIN',
        dealerInventory: 'ADMIN',
        stockTransfers: 'ADMIN',
        orders: 'ADMIN',
        customers: 'ADMIN',
        finance: 'ADMIN',
        reports: 'ADMIN',
        appManagement: 'ADMIN',
        activityLogs: 'VIEW',
        settings: 'EDIT',
      };

    case 'INVENTORY_MANAGER':
      return {
        dashboard: 'VIEW',
        dealerManagement: 'VIEW',
        userManagement: 'HIDDEN',
        productMaster: 'EDIT',
        centralInventory: 'ADMIN',
        dealerInventory: 'EDIT',
        stockTransfers: 'ADMIN',
        orders: 'VIEW',
        customers: 'HIDDEN',
        finance: 'HIDDEN',
        reports: 'VIEW',
        appManagement: 'HIDDEN',
        activityLogs: 'VIEW',
        settings: 'HIDDEN',
      };

    case 'SALES_MANAGER':
      return {
        dashboard: 'VIEW',
        dealerManagement: 'VIEW',
        userManagement: 'HIDDEN',
        productMaster: 'VIEW',
        centralInventory: 'VIEW',
        dealerInventory: 'VIEW',
        stockTransfers: 'EDIT',
        orders: 'ADMIN',
        customers: 'ADMIN',
        finance: 'VIEW',
        reports: 'VIEW',
        appManagement: 'HIDDEN',
        activityLogs: 'VIEW',
        settings: 'HIDDEN',
      };

    case 'DEALER': // Default Dealer Owner Profile
      return {
        dashboard: 'VIEW',
        dealerManagement: 'HIDDEN',
        userManagement: 'EDIT', // Can manage own staff
        productMaster: 'VIEW',
        centralInventory: 'HIDDEN',
        dealerInventory: 'EDIT',
        stockTransfers: 'CREATE', // Can request stock
        orders: 'EDIT', // CREATE + EDIT orders
        customers: 'EDIT',
        finance: 'VIEW',
        reports: 'VIEW',
        appManagement: 'HIDDEN',
        activityLogs: 'HIDDEN',
        settings: 'HIDDEN',
      };

    case 'DEALER_STAFF':
      return {
        dashboard: 'VIEW',
        dealerManagement: 'HIDDEN',
        userManagement: 'HIDDEN',
        productMaster: 'VIEW',
        centralInventory: 'HIDDEN',
        dealerInventory: 'VIEW',
        stockTransfers: 'VIEW',
        orders: 'CREATE',
        customers: 'EDIT',
        finance: 'HIDDEN',
        reports: 'HIDDEN',
        appManagement: 'HIDDEN',
        activityLogs: 'HIDDEN',
        settings: 'HIDDEN',
      };

    case 'VIEWER':
    default:
      return {
        dashboard: 'VIEW',
        dealerManagement: 'HIDDEN',
        userManagement: 'HIDDEN',
        productMaster: 'VIEW',
        centralInventory: 'VIEW',
        dealerInventory: 'VIEW',
        stockTransfers: 'VIEW',
        orders: 'VIEW',
        customers: 'VIEW',
        finance: 'HIDDEN',
        reports: 'HIDDEN',
        appManagement: 'HIDDEN',
        activityLogs: 'HIDDEN',
        settings: 'HIDDEN',
      };
  }
}

/**
 * Generates an initial UserPermission record for a newly provisioned dealer.
 */
export function createDefaultDealerPermissionProfile(
  dealerId: string,
  userId: string,
  grantedBy: string,
  overrides?: Partial<Record<ModuleKey, CapabilityLevel>>
): UserPermission {
  const basePermissions = getDefaultPermissionsForRole('DEALER');
  return {
    userPermissionId: `${dealerId}_${userId}`,
    dealerId,
    userId,
    modules: {
      ...basePermissions,
      ...(overrides || {}),
    },
    grantedBy,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generates the default AppConfiguration record for a newly provisioned dealer.
 */
export function createDefaultAppConfiguration(
  dealerId: string,
  overrides?: Partial<AppConfiguration>
): AppConfiguration {
  return {
    configId: dealerId,
    dealerId,
    visibleModules: [
      'dashboard',
      'productMaster',
      'dealerInventory',
      'stockTransfers',
      'orders',
      'customers',
      'finance',
      'reports',
    ],
    dashboardCards: [
      'sales',
      'orders',
      'inventory',
      'outstanding',
      'customers',
    ],
    inventoryVisibility: 'FULL',
    priceVisibility: 'DEALER_AND_MRP',
    mrpVisibility: true,
    purchaseCostVisibility: false, // Invariant: always false for dealers
    canCreateOrders: true,
    canEditProducts: false,
    canRequestStock: true,
    canViewReports: true,
    canViewPayments: true,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
