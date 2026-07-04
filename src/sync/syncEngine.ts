import {Database, Q} from '@nozbe/watermelondb';
import Inspection from '../db/models/Inspection';
import MutationLogEntry from '../db/models/MutationLogEntry';
import {InspectionCrdtDoc, encodeUpdate, decodeUpdate} from './crdtDoc';
import {detectConflicts} from './conflictDetector';
import {backend} from './backend';
import {SyncEntry} from '../mock-backend/fakeSyncServer';

/**
 * The RN/WatermelonDB-integrated counterpart to SyncClient
 * (src/sync/syncClient.ts). SyncClient is the pure, directly-unit-tested
 * sync core; this module re-implements the same push → pull → diff →
 * flag-conflicts sequence against real persisted records instead of
 * in-memory state, because WatermelonDB writes are async and
 * transaction-scoped in a way that doesn't fit SyncClient's synchronous
 * API. Keep the two in sync if the merge algorithm ever changes — in
 * particular the `confirmed` handling below mirrors SyncClient's
 * pendingLocalFieldIds fix: a field must stay "watched" for conflicts
 * across multiple sync rounds until a different device's write to it has
 * actually been observed, since two offline clients don't push in
 * lockstep.
 */

/** Local, offline edit: write to the CRDT doc and queue it for the next sync. */
export async function recordFieldEdit(
  database: Database,
  inspection: Inspection,
  fieldId: string,
  value: string,
  deviceId: string,
): Promise<void> {
  const doc = new InspectionCrdtDoc(inspection.crdtState || undefined);
  const update = doc.setField(fieldId, value);
  const newState = doc.encodeFullState();
  doc.destroy();

  await database.write(async () => {
    await database.get<MutationLogEntry>('mutation_log').create(entry => {
      entry.inspectionId = inspection.id;
      entry.fieldId = fieldId;
      entry.updateBlob = encodeUpdate(update);
      entry.deviceId = deviceId;
      entry.pushed = false;
      entry.confirmed = false;
    });

    await inspection.update(record => {
      record.crdtState = newState;
      record.mergeStatus = 'pending';
    });
  });
}

/** Push this inspection's pending edits, pull everyone else's, flag conflicts. */
export async function syncInspection(
  database: Database,
  inspection: Inspection,
  deviceId: string,
): Promise<{conflictCount: number}> {
  const unpushedEntries = await database
    .get<MutationLogEntry>('mutation_log')
    .query(Q.where('inspection_id', inspection.id), Q.where('pushed', false))
    .fetch();

  // Fields this device edited that haven't yet had a foreign write
  // observed — these are the ones a concurrent edit could silently
  // clobber, so they're what detectConflicts checks against.
  const unconfirmedEntries = await database
    .get<MutationLogEntry>('mutation_log')
    .query(
      Q.where('inspection_id', inspection.id),
      Q.where('device_id', deviceId),
      Q.where('confirmed', false),
    )
    .fetch();
  const pendingFieldIds = new Set(unconfirmedEntries.map(e => e.fieldId));

  const doc = new InspectionCrdtDoc(inspection.crdtState || undefined);
  const beforeMerge = doc.getAllFields();

  if (unpushedEntries.length > 0) {
    const outbox: SyncEntry[] = unpushedEntries.map(e => ({
      deviceId: e.deviceId,
      fieldId: e.fieldId,
      blob: e.updateBlob,
    }));
    await backend.push(inspection.id, outbox);
  }

  const remoteEntries = await backend.pull(inspection.id);
  for (const entry of remoteEntries) {
    doc.applyUpdate(decodeUpdate(entry.blob));
  }

  const afterMerge = doc.getAllFields();
  const conflicts = detectConflicts(beforeMerge, afterMerge, pendingFieldIds);
  const newState = doc.encodeFullState();
  doc.destroy();

  const foreignFieldIds = new Set(
    remoteEntries.filter(e => e.deviceId !== deviceId).map(e => e.fieldId),
  );
  const entriesToConfirm = unconfirmedEntries.filter(e => foreignFieldIds.has(e.fieldId));
  const remainingUnconfirmedCount = unconfirmedEntries.length - entriesToConfirm.length;

  await database.write(async () => {
    for (const entry of unpushedEntries) {
      await entry.update(record => {
        record.pushed = true;
      });
    }

    for (const entry of entriesToConfirm) {
      await entry.update(record => {
        record.confirmed = true;
      });
    }

    for (const conflict of conflicts) {
      await database.get('conflicts').create((record: any) => {
        record.inspectionId = inspection.id;
        record.fieldId = conflict.fieldId;
        record.mineValue = String(conflict.mine ?? '');
        record.theirsValue = String(conflict.theirs ?? '');
        record.resolved = false;
        record.resolvedValue = null;
      });
    }

    await inspection.update(record => {
      record.crdtState = newState;
      record.mergeStatus =
        conflicts.length > 0 ? 'conflict' : remainingUnconfirmedCount > 0 ? 'pending' : 'synced';
      record.syncedAt = new Date();
    });
  });

  return {conflictCount: conflicts.length};
}

/**
 * Called from the background-fetch handler (see backgroundSync.ts) and
 * from any manual "sync now" UI action. Non-blocking with respect to the
 * UI thread by construction: it's invoked off the render path, and every
 * WatermelonDB write here is already async.
 */
export async function syncAllPendingInspections(
  database: Database,
  deviceId: string,
): Promise<void> {
  const inspections = await database
    .get<Inspection>('inspections')
    .query(Q.where('merge_status', Q.notEq('synced')))
    .fetch();

  for (const inspection of inspections) {
    await syncInspection(database, inspection, deviceId);
  }
}
