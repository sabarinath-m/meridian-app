import {appSchema, tableSchema} from '@nozbe/watermelondb';

// schema version bumps whenever a table/column is added or removed.
export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'inspections',
      columns: [
        {name: 'title', type: 'string'},
        {name: 'site_name', type: 'string'},
        {name: 'status', type: 'string'}, // 'draft' | 'submitted'
        {name: 'merge_status', type: 'string'}, // 'synced' | 'pending' | 'conflict'
        {name: 'gps_lat', type: 'number', isOptional: true},
        {name: 'gps_lng', type: 'number', isOptional: true},
        // Base64-encoded Yjs binary state for this inspection's CRDT doc.
        // This is the merged, authoritative snapshot of all field values.
        {name: 'crdt_state', type: 'string'},
        {name: 'created_at', type: 'number'},
        {name: 'updated_at', type: 'number'},
        {name: 'synced_at', type: 'number', isOptional: true},
      ],
    }),
    tableSchema({
      name: 'photos',
      columns: [
        {name: 'inspection_id', type: 'string', isIndexed: true},
        {name: 'field_id', type: 'string'},
        {name: 'local_uri', type: 'string'},
        {name: 'remote_url', type: 'string', isOptional: true},
        {name: 'uploaded', type: 'boolean'},
        {name: 'created_at', type: 'number'},
      ],
    }),
    tableSchema({
      name: 'mutation_log',
      columns: [
        // Append-only log of local Yjs updates produced by this device.
        // Each entry is one field-level change, queued for push on reconnect.
        {name: 'inspection_id', type: 'string', isIndexed: true},
        {name: 'field_id', type: 'string'},
        {name: 'update_blob', type: 'string'}, // base64 Yjs update
        {name: 'device_id', type: 'string'},
        // `pushed`: sent to the backend at least once — never re-pushed
        // after that, so a never-contested field doesn't get re-sent
        // forever.
        {name: 'pushed', type: 'boolean'},
        // `confirmed`: a DIFFERENT device's write to this same field has
        // been observed at least once, so this device now knows whether
        // its own edit won or lost. Until that happens the field must
        // keep being watched for conflicts across sync rounds — see
        // syncClient.ts and syncEngine.ts for why clearing this early is
        // the bug that let concurrent edits get silently dropped.
        {name: 'confirmed', type: 'boolean'},
        {name: 'created_at', type: 'number'},
      ],
    }),
    tableSchema({
      name: 'conflicts',
      columns: [
        {name: 'inspection_id', type: 'string', isIndexed: true},
        {name: 'field_id', type: 'string'},
        {name: 'mine_value', type: 'string'},
        {name: 'theirs_value', type: 'string'},
        {name: 'resolved', type: 'boolean'},
        {name: 'resolved_value', type: 'string', isOptional: true},
        {name: 'created_at', type: 'number'},
      ],
    }),
  ],
});
