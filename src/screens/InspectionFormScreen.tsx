import React, {useEffect, useMemo, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {useMutation} from '@tanstack/react-query';
import {database} from '../db';
import {useInspection, useUnresolvedConflicts} from '../db/hooks';
import {InspectionCrdtDoc} from '../sync/crdtDoc';
import {recordFieldEdit} from '../sync/syncEngine';
import {triggerManualSync} from '../sync/backgroundSync';
import {getDeviceId} from '../sync/deviceId';
import {recordPhoto} from '../photos/photoStorage';
import FormRenderer from '../forms/FormRenderer';
import {safetyInspectionTemplate} from '../forms/templates/safetyInspectionTemplate';
import SyncStatusBadge from '../components/SyncStatusBadge';
import {RootStackParamList} from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionForm'>;

export default function InspectionFormScreen({route, navigation}: Props) {
  const {inspectionId} = route.params;
  const inspection = useInspection(inspectionId);
  const conflicts = useUnresolvedConflicts(inspectionId);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  // Recomputed whenever inspection.crdtState changes (i.e. after every
  // local edit or every completed sync) — this is what makes the form
  // reactive to both this device's own writes and merged remote writes.
  const values = useMemo(() => {
    if (!inspection) {
      return {};
    }
    const doc = new InspectionCrdtDoc(inspection.crdtState || undefined);
    const fields = doc.getAllFields();
    doc.destroy();
    return fields;
    // Deliberately keyed on crdtState alone, not the whole `inspection`
    // object: WatermelonDB's observe() emits a new record instance on
    // every field change, not just crdtState changes, which would make
    // this recompute (and destroy/recreate a Yjs doc) on unrelated writes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspection?.crdtState]);

  const syncMutation = useMutation({
    mutationFn: triggerManualSync,
    retry: 3,
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10_000),
  });

  if (!inspection || !deviceId) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  const onFieldChange = async (fieldId: string, value: string) => {
    await recordFieldEdit(database, inspection, fieldId, value, deviceId);

    const fieldConfig = safetyInspectionTemplate.find(f => f.id === fieldId);
    if (fieldConfig?.type === 'photo' && value) {
      await recordPhoto(database, inspection.id, fieldId, value);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SyncStatusBadge status={inspection.mergeStatus} />
        {conflicts.length > 0 && (
          <TouchableOpacity
            style={styles.conflictLink}
            onPress={() => navigation.navigate('ConflictResolution', {inspectionId})}>
            <Text style={styles.conflictLinkText}>
              {conflicts.length} field{conflicts.length > 1 ? 's' : ''} need resolution →
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <FormRenderer
          schema={safetyInspectionTemplate}
          values={values}
          onFieldChange={onFieldChange}
        />
      </ScrollView>

      <TouchableOpacity
        style={styles.syncButton}
        onPress={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}>
        {syncMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.syncButtonText}>Sync now</Text>
        )}
      </TouchableOpacity>
      {syncMutation.isError && (
        <Text style={styles.syncError}>Sync failed — will retry in the background.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  conflictLink: {},
  conflictLinkText: {color: '#dc2626', fontWeight: '600', fontSize: 13},
  scrollContent: {padding: 16},
  syncButton: {
    backgroundColor: '#2563eb',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  syncButtonText: {color: '#fff', fontWeight: '700', fontSize: 15},
  syncError: {color: '#dc2626', textAlign: 'center', marginBottom: 12, fontSize: 12},
});
