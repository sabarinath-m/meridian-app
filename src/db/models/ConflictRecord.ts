import {Model} from '@nozbe/watermelondb';
import {field, date, readonly, relation} from '@nozbe/watermelondb/decorators';

// A same-field conflicting edit, surfaced for manual resolution.
// Never auto-resolved silently — see src/sync/conflictDetector.ts.
export default class ConflictRecord extends Model {
  static table = 'conflicts';
  static associations = {
    inspections: {type: 'belongs_to' as const, key: 'inspection_id'},
  };

  @field('inspection_id') inspectionId!: string;
  @field('field_id') fieldId!: string;
  @field('mine_value') mineValue!: string;
  @field('theirs_value') theirsValue!: string;
  @field('resolved') resolved!: boolean;
  @field('resolved_value') resolvedValue!: string | null;

  @readonly @date('created_at') createdAt!: Date;

  @relation('inspections', 'inspection_id') inspection!: any;
}
