/**
 * Sync-and-Move Pattern: Fire update, allow immediate navigation, retry in background
 * 
 * Implements resilient data persistence:
 * - Non-blocking: User navigates immediately
 * - Persistent: Retries failed updates (max 3 attempts)
 * - Trackable: Returns promise for sync status
 */

interface SyncRetryOptions {
  maxAttempts?: number;
  delayMs?: number;
}

interface SyncRetryResult {
  success: boolean;
  attempt: number;
  error?: string;
}

/**
 * Execute a Supabase operation with automatic retry on failure
 * Returns immediately (non-blocking) but tracks sync in background
 * 
 * @param operation - Async function that performs the DB operation
 * @param options - Configuration for retry behavior
 * @returns Promise that resolves when sync completes or max retries exhausted
 */
export async function syncWithRetry(
  operation: () => Promise<{ error: any; data?: any }>,
  options: SyncRetryOptions = {}
): Promise<SyncRetryResult> {
  const maxAttempts = options.maxAttempts ?? 3;
  const delayMs = options.delayMs ?? 500;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await operation();

      if (!result.error) {
        console.log(`[SYNC_RETRY] ✓ Success on attempt ${attempt}/${maxAttempts}`);
        return {
          success: true,
          attempt,
        };
      }

      console.warn(`[SYNC_RETRY] Attempt ${attempt}/${maxAttempts} failed:`, result.error);

      // If it's the last attempt, return the error
      if (attempt === maxAttempts) {
        return {
          success: false,
          attempt,
          error: result.error?.message || 'Unknown error',
        };
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    } catch (err) {
      console.error(`[SYNC_RETRY] Exception on attempt ${attempt}/${maxAttempts}:`, err);

      if (attempt === maxAttempts) {
        return {
          success: false,
          attempt,
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  return {
    success: false,
    attempt: maxAttempts,
    error: 'Max retries exhausted',
  };
}

/**
 * Global sync status tracker for UI indicators
 * Tracks all in-flight sync operations
 */
export class SyncStatusManager {
  private static instance: SyncStatusManager;
  private activeSyncs: Map<string, Promise<SyncRetryResult>> = new Map();
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  static getInstance(): SyncStatusManager {
    if (!SyncStatusManager.instance) {
      SyncStatusManager.instance = new SyncStatusManager();
    }
    return SyncStatusManager.instance;
  }

  /**
   * Track a sync operation
   */
  trackSync(id: string, promise: Promise<SyncRetryResult>): Promise<SyncRetryResult> {
    this.activeSyncs.set(id, promise);
    this.notifyListeners();

    return promise.finally(() => {
      this.activeSyncs.delete(id);
      this.notifyListeners();
    });
  }

  /**
   * Get current sync status
   */
  getStatus(): SyncStatus {
    return {
      isSyncing: this.activeSyncs.size > 0,
      activeCount: this.activeSyncs.size,
      activeSyncs: Array.from(this.activeSyncs.keys()),
    };
  }

  /**
   * Subscribe to sync status changes
   */
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach((listener) => listener(status));
  }
}

export interface SyncStatus {
  isSyncing: boolean;
  activeCount: number;
  activeSyncs: string[];
}

/**
 * Fire-and-move helper: Execute DB operation with optional retry
 * 
 * Usage in React components:
 * ```typescript
 * const syncId = `noones-step-2-${trackingId}`;
 * fireAndMove(
 *   () => supabase.from(...).update(...),
 *   syncId,
 *   { maxAttempts: 3 }
 * );
 * ```
 */
export async function fireAndMove(
  operation: () => Promise<{ error: any; data?: any }>,
  syncId: string,
  options?: SyncRetryOptions
): Promise<void> {
  const manager = SyncStatusManager.getInstance();
  console.log(`[FIRE_AND_MOVE] ${syncId}: starting background sync operation`);
  const syncPromise = syncWithRetry(operation, options);
  
  // Start tracking but don't wait
  manager.trackSync(syncId, syncPromise);
}
