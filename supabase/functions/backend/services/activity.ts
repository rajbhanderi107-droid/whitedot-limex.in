import { db } from '../lib/db.ts';

interface ActivityParams {
  userId: string; action: string; entityType: string; entityId?: string;
  ipAddress?: string; userAgent?: string; metadata?: unknown;
}

export async function logActivity(params: ActivityParams) {
  await db.from('ActivityLog').insert(params).catch(console.error);
}
