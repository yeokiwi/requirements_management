// ---------------------------------------------------------------------------
// BroadcastChannel multi-tab sync
// ---------------------------------------------------------------------------

export type SyncMessageType =
  | 'requirement_updated'
  | 'project_updated'
  | 'data_changed';

export interface SyncMessage {
  type: SyncMessageType;
  payload: any;
  tabId: string;
}

const CHANNEL_NAME = 'req-manager-sync';
const TAB_ID = crypto.randomUUID();

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel {
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
  return channel;
}

/**
 * Broadcast a change notification to other tabs.
 */
export function broadcastChange(type: SyncMessageType, data: any): void {
  const msg: SyncMessage = {
    type,
    payload: data,
    tabId: TAB_ID,
  };
  getChannel().postMessage(msg);
}

/**
 * Register a listener for sync messages from other tabs.
 * Messages originating from this tab are ignored.
 */
export function onSyncMessage(callback: (msg: SyncMessage) => void): () => void {
  const handler = (event: MessageEvent<SyncMessage>) => {
    // Ignore messages from the same tab
    if (event.data?.tabId === TAB_ID) return;
    callback(event.data);
  };
  getChannel().addEventListener('message', handler);

  // Return an unsubscribe function
  return () => {
    getChannel().removeEventListener('message', handler);
  };
}
