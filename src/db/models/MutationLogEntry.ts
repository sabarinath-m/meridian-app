import {Model} from '@nozbe/watermelondb';
import {field, date, readonly, relation} from '@nozbe/watermelondb/decorators';

// One row per local field-level edit, queued for push to the sync server.
// This is the append-only log described in the spec's sync design (section 7).
export default class MutationLogEntry extends Model {
  static table = 'mutation_log';
  static associations = {
    inspections: {type: 'belongs_to' as const, key: 'inspection_id'},
  };

  @field('inspection_id') inspectionId!: string;
  @field('field_id') fieldId!: string;
  @field('update_blob') updateBlob!: string;
  @field('device_id') deviceId!: string;
  @field('pushed') pushed!: boolean;
  @field('confirmed') confirmed!: boolean;

  @readonly @date('created_at') createdAt!: Date;

  @relation('inspections', 'inspection_id') inspection!: any;
}
