import {SyncClient} from '../../src/sync/syncClient';
import {FakeSyncServer} from '../../src/mock-backend/fakeSyncServer';
import {FieldConflict} from '../../src/sync/conflictDetector';

/**
 * This is the single highest-value test in the repo (see README "Metric"
 * section). It simulates the exact scenario the whole app exists to solve:
 * two field techs go offline, both edit the same inspection record, and
 * when they reconnect the merge must not silently drop anyone's work.
 *
 * Three edit shapes are covered in one pass:
 *  - a field only device A touched ("notes")            -> must survive untouched
 *  - a field only device B touched ("signature")         -> must survive untouched
 *  - a field BOTH devices touched concurrently ("temperature") -> must
 *    converge to one value on both devices, AND must be flagged as a
 *    conflict on whichever device's write lost, never dropped silently.
 */
describe('offline multi-device merge', () => {
  it('merges non-overlapping field edits with zero data loss', () => {
    const server = new FakeSyncServer();
    const deviceA = new SyncClient('device-a', 'inspection-1');
    const deviceB = new SyncClient('device-b', 'inspection-1');

    deviceA.setField('notes', 'Leak detected near valve 3');
    deviceB.setField('signature', 'b64-signature-data');

    deviceA.sync(server);
    deviceB.sync(server);
    // second round trip so each device picks up what the other pushed
    deviceA.sync(server);
    deviceB.sync(server);

    expect(deviceA.getField('notes')).toBe('Leak detected near valve 3');
    expect(deviceA.getField('signature')).toBe('b64-signature-data');
    expect(deviceB.getField('notes')).toBe('Leak detected near valve 3');
    expect(deviceB.getField('signature')).toBe('b64-signature-data');
  });

  it('converges same-field concurrent edits and flags the loser as a conflict, never silently dropping it', () => {
    const server = new FakeSyncServer();
    const deviceA = new SyncClient('device-a', 'inspection-2');
    const deviceB = new SyncClient('device-b', 'inspection-2');

    // Both offline, both editing the same record.
    deviceA.setField('notes', 'Leak detected near valve 3');
    deviceA.setField('temperature', '68');
    deviceB.setField('signature', 'b64-signature-data');
    deviceB.setField('temperature', '72');

    // Round 1: both reconnect and push+pull once.
    const resultA1 = deviceA.sync(server);
    const resultB1 = deviceB.sync(server);
    // Round 2: pick up whatever the other device pushed in round 1.
    const resultA2 = deviceA.sync(server);
    const resultB2 = deviceB.sync(server);

    // Convergence: both devices must agree on every field's final value.
    expect(deviceA.getAllFields()).toEqual(deviceB.getAllFields());

    // Different-field edits: never lost.
    expect(deviceA.getField('notes')).toBe('Leak detected near valve 3');
    expect(deviceA.getField('signature')).toBe('b64-signature-data');

    // Same-field edit: must converge to exactly one of the two attempted
    // values (not undefined, not corrupted, not a third value).
    const finalTemperature = deviceA.getField('temperature');
    expect(['68', '72']).toContain(finalTemperature);

    // The conflict must be flagged on whichever device's write did not win,
    // across the two sync rounds it took to fully converge.
    const allConflicts: FieldConflict[] = [
      ...resultA1.conflicts,
      ...resultA2.conflicts,
      ...resultB1.conflicts,
      ...resultB2.conflicts,
    ];
    const temperatureConflicts = allConflicts.filter(c => c.fieldId === 'temperature');

    expect(temperatureConflicts.length).toBeGreaterThan(0);
    for (const conflict of temperatureConflicts) {
      // The conflict must carry both sides of the disagreement so the UI
      // can show a real field-by-field merge picker, not just "something
      // changed".
      expect(['68', '72']).toContain(conflict.mine);
      expect(conflict.theirs).toBe(finalTemperature);
      expect(conflict.mine).not.toBe(conflict.theirs);
    }

    // At least one of the two devices ends this scenario in 'conflict'
    // status rather than a silent 'synced' — that's the whole point.
    const anyDeviceFlaggedConflict = [resultA1, resultA2, resultB1, resultB2].some(
      r => r.status === 'conflict',
    );
    expect(anyDeviceFlaggedConflict).toBe(true);
  });

  it('is idempotent: re-syncing with no new server data does not re-flag resolved conflicts', () => {
    const server = new FakeSyncServer();
    const deviceA = new SyncClient('device-a', 'inspection-3');
    const deviceB = new SyncClient('device-b', 'inspection-3');

    deviceA.setField('temperature', '68');
    deviceB.setField('temperature', '72');

    deviceA.sync(server);
    deviceB.sync(server);
    deviceA.sync(server);
    deviceB.sync(server);

    // Fully converged now; syncing again with no new local edits and no
    // new server data must be a no-op, not a repeat conflict.
    const resultA = deviceA.sync(server);
    const resultB = deviceB.sync(server);

    expect(resultA.conflicts).toHaveLength(0);
    expect(resultB.conflicts).toHaveLength(0);
    expect(resultA.status).toBe('synced');
    expect(resultB.status).toBe('synced');
  });
});
