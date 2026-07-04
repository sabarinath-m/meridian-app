import {useEffect, useState} from 'react';
import {Q} from '@nozbe/watermelondb';
import {database} from './index';
import Inspection from './models/Inspection';
import ConflictRecord from './models/ConflictRecord';

export function useInspections(): Inspection[] {
  const [inspections, setInspections] = useState<Inspection[]>([]);

  useEffect(() => {
    const subscription = database
      .get<Inspection>('inspections')
      .query(Q.sortBy('updated_at', Q.desc))
      .observe()
      .subscribe(setInspections);
    return () => subscription.unsubscribe();
  }, []);

  return inspections;
}

export function useInspection(id: string): Inspection | null {
  const [inspection, setInspection] = useState<Inspection | null>(null);

  useEffect(() => {
    const subscription = database
      .get<Inspection>('inspections')
      .findAndObserve(id)
      .subscribe(setInspection);
    return () => subscription.unsubscribe();
  }, [id]);

  return inspection;
}

export function useUnresolvedConflicts(inspectionId: string): ConflictRecord[] {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([]);

  useEffect(() => {
    const subscription = database
      .get<ConflictRecord>('conflicts')
      .query(Q.where('inspection_id', inspectionId), Q.where('resolved', false))
      .observe()
      .subscribe(setConflicts);
    return () => subscription.unsubscribe();
  }, [inspectionId]);

  return conflicts;
}
