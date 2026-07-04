export interface SyncEntry {
  deviceId: string;
  fieldId: string;
  blob: string; // base64 Yjs update, see src/sync/base64.ts
}

/**
 * Stands in for the "minimal backend" from the spec (section 6: "just
 * enough to prove end-to-end sync"). A real deployment swaps this for a
 * Node/Express or Supabase endpoint that stores the same shape of data —
 * the sync algorithm in src/sync/syncClient.ts doesn't know or care which
 * one it's talking to.
 *
 * Deliberately dumb: it never merges anything itself, it just accumulates
 * every update any device has ever pushed for an inspection and hands the
 * full history back to whoever asks. Yjs updates are idempotent and
 * order-independent, so re-delivering a device's own updates back to it is
 * harmless — this keeps the server free of any per-device cursor logic.
 */
export class FakeSyncServer {
  private store = new Map<string, SyncEntry[]>();

  push(inspectionId: string, entries: SyncEntry[]): void {
    const existing = this.store.get(inspectionId) ?? [];
    this.store.set(inspectionId, [...existing, ...entries]);
  }

  pull(inspectionId: string): SyncEntry[] {
    return this.store.get(inspectionId) ?? [];
  }

  reset(): void {
    this.store.clear();
  }
}
