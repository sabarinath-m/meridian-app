import {InspectionCrdtDoc, FieldValue, decodeUpdate, encodeUpdate} from './crdtDoc';
import {detectConflicts, FieldConflict} from './conflictDetector';
import {FakeSyncServer, SyncEntry} from '../mock-backend/fakeSyncServer';

export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface SyncResult {
  status: SyncStatus;
  conflicts: FieldConflict[];
  fields: Record<string, FieldValue>;
}

/**
 * One device's view of one inspection's sync state. This is the class the
 * merge test (__tests__/sync/merge.test.ts) drives directly to simulate
 * two offline clients; src/sync/syncEngine.ts wires the same class to
 * WatermelonDB + react-native-background-fetch for the real app.
 */
export class SyncClient {
  readonly deviceId: string;
  readonly inspectionId: string;
  private crdtDoc: InspectionCrdtDoc;
  private outbox: SyncEntry[] = [];
  private pendingLocalFieldIds = new Set<string>();

  constructor(deviceId: string, inspectionId: string, initialStateBase64?: string) {
    this.deviceId = deviceId;
    this.inspectionId = inspectionId;
    this.crdtDoc = new InspectionCrdtDoc(initialStateBase64);
  }

  getField(fieldId: string): FieldValue | undefined {
    return this.crdtDoc.getField(fieldId);
  }

  getAllFields(): Record<string, FieldValue> {
    return this.crdtDoc.getAllFields();
  }

  /** Local, offline edit. Queues the incremental update for the next sync. */
  setField(fieldId: string, value: FieldValue): void {
    const update = this.crdtDoc.setField(fieldId, value);
    this.outbox.push({deviceId: this.deviceId, fieldId, blob: encodeUpdate(update)});
    this.pendingLocalFieldIds.add(fieldId);
  }

  /**
   * Push this device's queued edits to the server, pull every edit any
   * device has ever pushed for this inspection, apply them, and flag any
   * field where this device's own pending edit got overwritten by a
   * concurrent one instead of letting it disappear silently.
   *
   * A field only stops being "watched" once we've actually pulled an
   * entry for it from a *different* device. Clearing it unconditionally
   * after every sync() call is a bug we hit while testing this: if device
   * A syncs before device B has pushed anything, A sees no conflict (there
   * is nothing to conflict with yet) — but if the pending flag were
   * cleared right there, A would never notice when B's conflicting edit
   * arrives on a *later* sync call, silently losing A's edit despite it
   * genuinely being concurrent with B's. Two offline clients don't push in
   * lockstep, so "no conflict visible yet" must not be treated as
   * "resolved" until the other side has actually been observed.
   */
  sync(server: FakeSyncServer): SyncResult {
    const beforeMerge = this.crdtDoc.getAllFields();

    if (this.outbox.length > 0) {
      server.push(this.inspectionId, this.outbox);
      this.outbox = [];
    }

    const pulled = server.pull(this.inspectionId);
    for (const entry of pulled) {
      this.crdtDoc.applyUpdate(decodeUpdate(entry.blob));
    }

    const afterMerge = this.crdtDoc.getAllFields();
    const conflicts = detectConflicts(beforeMerge, afterMerge, this.pendingLocalFieldIds);

    for (const entry of pulled) {
      if (entry.deviceId !== this.deviceId) {
        this.pendingLocalFieldIds.delete(entry.fieldId);
      }
    }

    return {
      status: conflicts.length > 0 ? 'conflict' : 'synced',
      conflicts,
      fields: afterMerge,
    };
  }

  hasPendingChanges(): boolean {
    return this.outbox.length > 0;
  }

  encodeState(): string {
    return this.crdtDoc.encodeFullState();
  }

  destroy(): void {
    this.crdtDoc.destroy();
  }
}
