import { db } from '../lib/db.ts';

export async function notifyAdmins(title: string, message: string, type = 'INFO') {
  const { data: admins } = await db
    .from('User')
    .select('id')
    .in('role', ['SUPER_ADMIN', 'ADMIN'])
    .eq('isActive', true);
  if (!admins?.length) return;
  await db.from('Notification').insert(
    admins.map(u => ({ userId: u.id, title, message, type }))
  );
}
