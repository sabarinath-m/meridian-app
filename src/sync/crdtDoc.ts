import * as Y from 'yjs';
import {bytesToBase64, base64ToBytes} from './base64';

export type FieldValue = string | number | boolean | null;

/**
 * Wraps one inspection's CRDT state. Every form field is a key in a single
 * Y.Map, so unrelated fields merge independently (Yjs never conflicts two
 * different map keys), while the same key edited concurrently on two
 * devices resolves deterministically via Yjs's internal clock/actor
 * ordering. That silent last-write-wins resolution is fine for
 * convergence, but the spec requires same-field conflicts to be surfaced,
 * not dropped — so callers must snapshot before/after applying a remote
 * update and diff against their own pending edits. See conflictDetector.ts.
 */
export class InspectionCrdtDoc {
  readonly doc: Y.Doc;
  private readonly fields: Y.Map<FieldValue>;

  constructor(existingStateBase64?: string) {
    this.doc = new Y.Doc();
    this.fields = this.doc.getMap<FieldValue>('fields');
    if (existingStateBase64) {
      Y.applyUpdate(this.doc, base64ToBytes(existingStateBase64));
    }
  }

  getField(fieldId: string): FieldValue | undefined {
    return this.fields.get(fieldId);
  }

  getAllFields(): Record<string, FieldValue> {
    return Object.fromEntries(this.fields.entries());
  }

  /**
   * Writes a field value and returns the incremental Yjs update produced by
   * this single change, so callers can append it to the local mutation log
   * without re-encoding the whole document.
   */
  setField(fieldId: string, value: FieldValue): Uint8Array {
    const before = Y.encodeStateVector(this.doc);
    this.fields.set(fieldId, value);
    return Y.encodeStateAsUpdate(this.doc, before);
  }

  applyUpdate(update: Uint8Array): void {
    Y.applyUpdate(this.doc, update);
  }

  encodeFullState(): string {
    return bytesToBase64(Y.encodeStateAsUpdate(this.doc));
  }

  destroy(): void {
    this.doc.destroy();
  }
}

export function decodeUpdate(base64: string): Uint8Array {
  return base64ToBytes(base64);
}

export function encodeUpdate(update: Uint8Array): string {
  return bytesToBase64(update);
}
