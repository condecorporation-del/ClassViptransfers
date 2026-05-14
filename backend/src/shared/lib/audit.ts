import { prisma } from './prisma';
import { AuditAction, Prisma } from '@prisma/client';

export interface AuditLogParams {
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId?: string;
  userEmail?: string;
  description: string;
  changes?: Record<string, unknown>;
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    const changes = params.changes as Prisma.InputJsonValue | undefined;
    await prisma.adminAuditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        userId: params.userId,
        userEmail: params.userEmail,
        description: params.description,
        changes,
      },
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    console.error('Failed to create audit log:', error);
  }
}

