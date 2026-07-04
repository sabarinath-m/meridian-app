import {FieldValue} from './crdtDoc';

export interface FieldConflict {
  fieldId: string;
  mine: FieldValue | undefined;
  theirs: FieldValue | undefined;
}

/**
 * Diffs a device's field snapshot from immediately before/after applying
 * incoming remote updates, restricted to fields this device itself had
 * unsynced local edits on.
 *
 * Yjs's Y.Map already resolves same-key concurrent writes deterministically
 * (so every device converges to the same value — no crashes, no undefined
 * state). What it does NOT do is tell you when *your* pending edit lost
 * that resolution. That's the gap this function closes: if a field this
 * device just edited comes out of the merge holding a different value than
 * what this device wrote, the local edit was silently overwritten by a
 * concurrent one and must be flagged rather than allowed to vanish.
 *
 * Fields nobody else touched, or fields this device didn't have a pending
 * edit on, are never reported here — those are the "different-field edits
 * merge cleanly" case from the spec, and need no user-facing conflict UI.
 */
export function detectConflicts(
  beforeMerge: Record<string, FieldValue>,
  afterMerge: Record<string, FieldValue>,
  pendingLocalFieldIds: ReadonlySet<string>,
): FieldConflict[] {
  const conflicts: FieldConflict[] = [];

  for (const fieldId of pendingLocalFieldIds) {
    const mine = beforeMerge[fieldId];
    const theirs = afterMerge[fieldId];
    if (mine !== theirs) {
      conflicts.push({fieldId, mine, theirs});
    }
  }

  return conflicts;
}
