import {Database} from '@nozbe/watermelondb';
import Photo from '../db/models/Photo';

/**
 * Tracks a captured photo for deferred upload. The field's CRDT value
 * already holds the local URI (see forms/fields/PhotoField.tsx) — this
 * table exists separately so the sync engine has an `uploaded` flag to
 * drive the "upload the file itself" side of sync, independent of the
 * lightweight text/JSON field values that travel through Yjs updates.
 * A real deployment's background sync would iterate unuploaded rows here
 * and PUT each file to an S3 presigned URL (spec section 6) — that part
 * is out of scope for this portfolio pass and is called out in the README.
 */
export async function recordPhoto(
  database: Database,
  inspectionId: string,
  fieldId: string,
  localUri: string,
): Promise<void> {
  await database.write(async () => {
    await database.get<Photo>('photos').create(photo => {
      photo.inspectionId = inspectionId;
      photo.fieldId = fieldId;
      photo.localUri = localUri;
      photo.remoteUrl = null;
      photo.uploaded = false;
    });
  });
}
