/**
 * Pixel Distributor - Immutable Audit Logging Service
 */

import { ActivityLog, UserRole } from '@pixel/shared';

export interface AuditLogInput {
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  dealerId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Generates an immutable ActivityLog document.
   */
  public static createLogRecord(input: AuditLogInput): ActivityLog {
    const timestamp = new Date().toISOString();
    const logId = `LOG-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    return {
      logId,
      actorId: input.actorId,
      actorEmail: input.actorEmail,
      actorRole: input.actorRole,
      dealerId: input.dealerId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata || {},
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      timestamp,
    };
  }
}
