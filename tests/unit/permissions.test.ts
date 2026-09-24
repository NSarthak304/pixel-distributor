import { describe, it, expect } from 'vitest';
import {
  hasCapability,
  canPerform,
  getPermittedModules,
  getDefaultPermissionsForRole,
  PermissionContext,
} from '../../shared/permissions/index.js';

describe('Multi-Tier Permission Engine Unit Tests', () => {
  it('SUPER_ADMIN has unrestricted ADMIN capability on every module', () => {
    const superAdmin: PermissionContext = {
      userId: 'usr_super',
      dealerId: 'CENTRAL',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      modules: {},
    };

    expect(hasCapability(superAdmin, 'inventory', 'ADMIN')).toBe(true);
    expect(hasCapability(superAdmin, 'orders', 'ADMIN')).toBe(true);
    expect(hasCapability(superAdmin, 'settings', 'ADMIN')).toBe(true);
    expect(canPerform(superAdmin, 'finance', 'admin')).toBe(true);
  });

  it('Suspended user has zero capabilities', () => {
    const suspendedUser: PermissionContext = {
      userId: 'usr_suspended',
      dealerId: 'DLR-101',
      role: 'DEALER',
      status: 'SUSPENDED',
      modules: { orders: 'EDIT', inventory: 'VIEW' },
    };

    expect(hasCapability(suspendedUser, 'orders', 'VIEW')).toBe(false);
    expect(hasCapability(suspendedUser, 'inventory', 'VIEW')).toBe(false);
    expect(getPermittedModules(suspendedUser)).toEqual([]);
  });

  it('Verifies Dealer A Scenario (Inventory=EDIT, Orders=EDIT, Customers=VIEW, Payments=VIEW, Reports=VIEW)', () => {
    const dealerA: PermissionContext = {
      userId: 'usr_dlr_a',
      dealerId: 'DLR-A',
      role: 'DEALER',
      status: 'ACTIVE',
      modules: {
        inventory: 'EDIT',
        orders: 'EDIT',
        customers: 'VIEW',
        payments: 'VIEW',
        reports: 'VIEW',
      },
    };

    // Inventory capability: can view, create, edit; cannot delete or admin
    expect(hasCapability(dealerA, 'inventory', 'VIEW')).toBe(true);
    expect(hasCapability(dealerA, 'inventory', 'CREATE')).toBe(true);
    expect(hasCapability(dealerA, 'inventory', 'EDIT')).toBe(true);
    expect(hasCapability(dealerA, 'inventory', 'DELETE')).toBe(false);
    expect(hasCapability(dealerA, 'inventory', 'ADMIN')).toBe(false);

    // Orders capability: can edit
    expect(canPerform(dealerA, 'orders', 'edit')).toBe(true);
    expect(canPerform(dealerA, 'orders', 'delete')).toBe(false);

    // Customers capability: view only
    expect(hasCapability(dealerA, 'customers', 'VIEW')).toBe(true);
    expect(hasCapability(dealerA, 'customers', 'CREATE')).toBe(false);
    expect(hasCapability(dealerA, 'customers', 'EDIT')).toBe(false);
  });

  it('Verifies Dealer B Scenario (Inventory=VIEW, Orders=CREATE, Customers=HIDDEN, Payments=HIDDEN, Reports=HIDDEN)', () => {
    const dealerB: PermissionContext = {
      userId: 'usr_dlr_b',
      dealerId: 'DLR-B',
      role: 'DEALER',
      status: 'ACTIVE',
      modules: {
        inventory: 'VIEW',
        orders: 'CREATE',
        customers: 'HIDDEN',
        payments: 'HIDDEN',
        reports: 'HIDDEN',
      },
    };

    expect(hasCapability(dealerB, 'inventory', 'VIEW')).toBe(true);
    expect(hasCapability(dealerB, 'inventory', 'EDIT')).toBe(false);

    expect(hasCapability(dealerB, 'orders', 'VIEW')).toBe(true); // CREATE inherits VIEW
    expect(hasCapability(dealerB, 'orders', 'CREATE')).toBe(true);
    expect(hasCapability(dealerB, 'orders', 'EDIT')).toBe(false);

    expect(hasCapability(dealerB, 'customers', 'VIEW')).toBe(false);
    expect(hasCapability(dealerB, 'payments', 'VIEW')).toBe(false);
    expect(hasCapability(dealerB, 'reports', 'VIEW')).toBe(false);
  });

  it('Verifies Dealer C Scenario (Inventory=HIDDEN, Orders=VIEW, Customers=VIEW, Payments=VIEW)', () => {
    const dealerC: PermissionContext = {
      userId: 'usr_dlr_c',
      dealerId: 'DLR-C',
      role: 'DEALER',
      status: 'ACTIVE',
      modules: {
        inventory: 'HIDDEN',
        orders: 'VIEW',
        customers: 'VIEW',
        payments: 'VIEW',
      },
    };

    expect(hasCapability(dealerC, 'inventory', 'VIEW')).toBe(false);
    expect(hasCapability(dealerC, 'orders', 'VIEW')).toBe(true);
    expect(hasCapability(dealerC, 'orders', 'CREATE')).toBe(false);
    expect(hasCapability(dealerC, 'customers', 'VIEW')).toBe(true);
    expect(hasCapability(dealerC, 'payments', 'VIEW')).toBe(true);
  });

  it('Generates complete default permissions for INVENTORY_MANAGER', () => {
    const perms = getDefaultPermissionsForRole('INVENTORY_MANAGER');
    expect(perms.centralInventory).toBe('ADMIN');
    expect(perms.productMaster).toBe('EDIT');
    expect(perms.finance).toBe('HIDDEN');
  });
});
