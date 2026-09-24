/**
 * Pixel Distributor - Dealer Management Service
 */

import {
  Dealer,
  User,
  UserPermission,
  AppConfiguration,
  createDefaultDealerPermissionProfile,
  createDefaultAppConfiguration,
  CreateDealerInput,
} from '@pixel/shared';
import { AuditService } from './audit.service.js';

export interface DealerProvisioningResult {
  dealer: Dealer;
  user: User;
  permissionProfile: UserPermission;
  appConfiguration: AppConfiguration;
  auditRecord: ReturnType<typeof AuditService.createLogRecord>;
}

export class DealerService {
  /**
   * Generates a sequential human-readable Dealer ID.
   */
  public static generateDealerId(lastSequenceNumber: number): string {
    const nextSeq = lastSequenceNumber + 1;
    return `DLR-${nextSeq.toString().padStart(4, '0')}`;
  }

  /**
   * Complete Dealer Onboarding & Auto-Provisioning Workflow (Specification Section 5)
   */
  public static provisionDealer(
    input: CreateDealerInput,
    assignedDealerId: string,
    adminActor: { uid: string; email: string }
  ): DealerProvisioningResult {
    const now = new Date().toISOString();
    const userId = `usr_${assignedDealerId.toLowerCase().replace(/[^a-z0-9]/g, '')}_owner`;
    const appId = `APP-${assignedDealerId}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 1. Construct Dealer Master Entity
    const dealer: Dealer = {
      dealerId: assignedDealerId,
      businessName: input.businessName,
      ownerName: input.ownerName,
      mobile: input.mobile,
      whatsapp: input.whatsapp || input.mobile,
      email: input.email,
      gstin: input.gstin || undefined,
      pan: input.pan || undefined,
      address: input.address,
      city: input.city,
      state: input.state,
      pin: input.pin,
      dealerType: input.dealerType,
      priceGroup: input.priceGroup,
      creditLimit: input.creditLimit,
      paymentTerms: input.paymentTerms,
      assignedWarehouse: input.assignedWarehouse,
      accountStatus: input.accountStatus,
      appId,
      outstandingBalance: 0,
      createdAt: now,
      updatedAt: now,
    };

    // 2. Automatically generate Owner User Account
    const user: User = {
      userId,
      dealerId: assignedDealerId,
      email: input.email,
      displayName: input.ownerName,
      phone: input.mobile,
      role: 'DEALER',
      status: input.accountStatus,
      createdAt: now,
      updatedAt: now,
    };

    // 3. Automatically generate Default Permission Profile
    const permissionProfile = createDefaultDealerPermissionProfile(
      assignedDealerId,
      userId,
      adminActor.uid
    );

    // 4. Automatically generate Default App Configuration
    const appConfiguration = createDefaultAppConfiguration(assignedDealerId);

    // 5. Generate Immutable Audit Log Entry
    const auditRecord = AuditService.createLogRecord({
      actorId: adminActor.uid,
      actorEmail: adminActor.email,
      actorRole: 'ADMIN',
      dealerId: assignedDealerId,
      action: 'DEALER_PROVISIONED',
      entity: 'dealers',
      entityId: assignedDealerId,
      metadata: {
        businessName: input.businessName,
        assignedWarehouse: input.assignedWarehouse,
        creditLimit: input.creditLimit,
        ownerUserId: userId,
        appId,
      },
    });

    return {
      dealer,
      user,
      permissionProfile,
      appConfiguration,
      auditRecord,
    };
  }
}
