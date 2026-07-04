import {Model} from '@nozbe/watermelondb';
import {field, date, readonly, relation} from '@nozbe/watermelondb/decorators';

export default class Photo extends Model {
  static table = 'photos';
  static associations = {
    inspections: {type: 'belongs_to' as const, key: 'inspection_id'},
  };

  @field('inspection_id') inspectionId!: string;
  @field('field_id') fieldId!: string;
  @field('local_uri') localUri!: string;
  @field('remote_url') remoteUrl!: string | null;
  @field('uploaded') uploaded!: boolean;

  @readonly @date('created_at') createdAt!: Date;

  @relation('inspections', 'inspection_id') inspection!: any;
}
