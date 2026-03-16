import { useEffect } from 'react';
import { onSyncMessage, SyncMessage } from '@/db/sync';

export function useMultiTabSync(callback: (msg: SyncMessage) => void) {
  useEffect(() => {
    const cleanup = onSyncMessage(callback);
    return cleanup;
  }, [callback]);
}
