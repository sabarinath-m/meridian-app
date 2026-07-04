import {Database} from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {schema} from './schema';
import Inspection from './models/Inspection';
import Photo from './models/Photo';
import MutationLogEntry from './models/MutationLogEntry';
import ConflictRecord from './models/ConflictRecord';

const adapter = new SQLiteAdapter({
  schema,
  jsi: true, // uses the JSI-backed adapter, no bridge serialization per record
  onSetUpError: error => {
    // Surfacing this loudly is deliberate: a broken local DB means the app
    // cannot function offline at all, which defeats the entire premise.
    console.error('[Meridian] Failed to set up local database', error);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Inspection, Photo, MutationLogEntry, ConflictRecord],
});
