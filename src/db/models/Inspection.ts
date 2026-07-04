import {Model} from '@nozbe/watermelondb';
import {field, date, children, readonly} from '@nozbe/watermelondb/decorators';

// Named MergeStatus (not SyncStatus) because WatermelonDB's own `Model`
// base class already declares a `syncStatus` accessor for its internal
// created/updated/deleted bookkeeping — reusing that name here would
// shadow it and break WatermelonDB's sync protocol.
export type MergeStatus = 'synced' | 'pending' | 'conflict';
export type InspectionStatus = 'draft' | 'submitted';

export default class Inspection extends Model {
  static table = 'inspections';
  static associations = {
    photos: {type: 'has_many' as const, foreignKey: 'inspection_id'},
    mutation_log: {type: 'has_many' as const, foreignKey: 'inspection_id'},
    conflicts: {type: 'has_many' as const, foreignKey: 'inspection_id'},
  };

  @field('title') title!: string;
  @field('site_name') siteName!: string;
  @field('status') status!: InspectionStatus;
  @field('merge_status') mergeStatus!: MergeStatus;
  @field('gps_lat') gpsLat!: number | null;
  @field('gps_lng') gpsLng!: number | null;
  @field('crdt_state') crdtState!: string;

  @readonly @date('created_at') createdAt!: Date;
  @readonly @date('updated_at') updatedAt!: Date;
  @date('synced_at') syncedAt!: Date | null;

  @children('photos') photos!: any;
  @children('mutation_log') mutationLog!: any;
  @children('conflicts') conflicts!: any;
}
