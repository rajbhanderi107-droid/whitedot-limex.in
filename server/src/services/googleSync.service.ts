import { prisma } from "../config/prisma.js";
import { fetchAndStoreGoogleData } from "../controllers/google.controller.js";

/* ───────────────────────────────────────────────────────────────────────────
   Google Data Sync Service — automated background sync.

   On server boot:
     1. Fires an immediate sync
     2. Schedules a recurring sync every SYNC_INTERVAL_MS (default 6h)

   Each sync run:
     • Calls fetchAndStoreGoogleData() (GA4 + GSC + Ads + Logins)
     • Creates a GoogleDataSnapshot row with status, duration, payload
     • Logs an activity entry so it appears in the audit trail
   ─────────────────────────────────────────────────────────────────────────── */

const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

let syncTimer: ReturnType<typeof setInterval> | null = null;

/** Execute a single sync run, store the snapshot, and log the activity. */
export async function runGoogleSync(): Promise<{
  status: string;
  duration: number;
  error?: string;
}> {
  const start = Date.now();
  let status = "SUCCESS";
  let error: string | undefined;
  let data: unknown = {};

  try {
    data = await fetchAndStoreGoogleData();
  } catch (e) {
    status = "FAILED";
    error = e instanceof Error ? e.message : "Unknown sync error";
    console.error("[GoogleSync] Sync failed:", error);
  }

  const duration = Date.now() - start;

  // Persist snapshot
  try {
    await prisma.googleDataSnapshot.create({
      data: {
        status,
        data: data as any,
        error: error ?? null,
        duration,
      },
    });
  } catch (dbErr) {
    console.error("[GoogleSync] Failed to store snapshot:", dbErr);
  }

  // Activity log entry
  try {
    await prisma.activityLog.create({
      data: {
        action: "GOOGLE_DATA_SYNC",
        entityType: "INTEGRATION",
        metadata: { status, duration, error },
      },
    });
  } catch (logErr) {
    console.error("[GoogleSync] Failed to log activity:", logErr);
  }

  console.log(
    `[GoogleSync] Sync ${status} in ${duration}ms${error ? ` — ${error}` : ""}`,
  );

  // Prune old snapshots — keep latest 100
  try {
    const cutoff = await prisma.googleDataSnapshot.findMany({
      orderBy: { createdAt: "desc" },
      skip: 100,
      take: 1,
      select: { createdAt: true },
    });
    if (cutoff.length > 0) {
      await prisma.googleDataSnapshot.deleteMany({
        where: { createdAt: { lt: cutoff[0].createdAt } },
      });
    }
  } catch {
    // Non-critical
  }

  return { status, duration, error };
}

/** Get the latest stored snapshot. */
export async function getLatestSnapshot() {
  return prisma.googleDataSnapshot.findFirst({
    orderBy: { createdAt: "desc" },
  });
}

/** Get recent sync history. */
export async function getSnapshotHistory(limit = 10) {
  return prisma.googleDataSnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      status: true,
      duration: true,
      error: true,
      createdAt: true,
    },
  });
}

/** Get sync status including next scheduled sync time. */
export async function getSyncStatus() {
  const [latest, history] = await Promise.all([
    getLatestSnapshot(),
    getSnapshotHistory(10),
  ]);

  const nextSyncAt = latest
    ? new Date(new Date(latest.createdAt).getTime() + SYNC_INTERVAL_MS)
    : new Date(); // If no snapshot, next sync is now

  return {
    lastSync: latest
      ? {
          id: latest.id,
          status: latest.status,
          duration: latest.duration,
          error: latest.error,
          createdAt: latest.createdAt,
        }
      : null,
    nextSyncAt: nextSyncAt.toISOString(),
    intervalMs: SYNC_INTERVAL_MS,
    intervalHuman: "Every 6 hours",
    history,
  };
}

/** Start the background sync cron. Safe to call multiple times. */
export function startGoogleSyncCron() {
  if (syncTimer) return; // Already running

  console.log(
    `[GoogleSync] Starting cron — syncing every ${SYNC_INTERVAL_MS / 3_600_000}h`,
  );

  // First sync on boot (after a 10s delay to let the server warm up)
  setTimeout(() => {
    runGoogleSync().catch(() => {});
  }, 10_000);

  syncTimer = setInterval(() => {
    runGoogleSync().catch(() => {});
  }, SYNC_INTERVAL_MS);
}

/** Stop the background sync cron. */
export function stopGoogleSyncCron() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
    console.log("[GoogleSync] Cron stopped.");
  }
}
