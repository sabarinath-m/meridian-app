import {FakeSyncServer, SyncEntry} from '../mock-backend/fakeSyncServer';

/**
 * The "minimal backend" from spec section 6 ("just enough to prove
 * end-to-end sync"), wrapped in an async interface so swapping this for a
 * real Node/Express or Supabase HTTP client later is a one-file change —
 * syncEngine.ts below only depends on this push/pull shape, never on
 * FakeSyncServer directly.
 */
const sharedServer = new FakeSyncServer();

export const backend = {
  push: async (inspectionId: string, entries: SyncEntry[]): Promise<void> => {
    sharedServer.push(inspectionId, entries);
  },
  pull: async (inspectionId: string): Promise<SyncEntry[]> => {
    return sharedServer.pull(inspectionId);
  },
};
