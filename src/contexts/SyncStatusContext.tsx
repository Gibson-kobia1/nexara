import React, { createContext, useContext, useEffect, useState } from 'react';
import { SyncStatusManager, SyncStatus } from '../lib/syncRetry';

const SyncStatusContext = createContext<SyncStatus | null>(null);

/**
 * Provider component that tracks global sync status
 * Wraps your app to enable syncing indicator throughout
 */
export function SyncStatusProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    activeCount: 0,
    activeSyncs: [],
  });

  useEffect(() => {
    const manager = SyncStatusManager.getInstance();
    const unsubscribe = manager.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return (
    <SyncStatusContext.Provider value={status}>
      {children}
    </SyncStatusContext.Provider>
  );
}

/**
 * Hook to access sync status in any component
 */
export function useSyncStatus(): SyncStatus {
  const context = useContext(SyncStatusContext);
  if (!context) {
    throw new Error('useSyncStatus must be used within SyncStatusProvider');
  }
  return context;
}

/**
 * Global syncing indicator component
 * Shows a small spinner in the corner when data is syncing
 */
export function GlobalSyncIndicator() {
  const { isSyncing, activeCount } = useSyncStatus();

  if (!isSyncing) return null;

  return (
    <div
      className="fixed bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/50 text-sm font-medium shadow-lg"
      role="status"
      aria-live="polite"
    >
      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
      <span>
        Syncing{activeCount > 1 ? ` (${activeCount} operations)` : ''}...
      </span>
    </div>
  );
}
