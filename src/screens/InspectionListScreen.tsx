import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {database} from '../db';
import Inspection from '../db/models/Inspection';
import {useInspections} from '../db/hooks';
import {InspectionCrdtDoc} from '../sync/crdtDoc';
import {captureGps} from '../location/gps';
import SyncStatusBadge from '../components/SyncStatusBadge';
import {RootStackParamList} from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'InspectionList'>;

export default function InspectionListScreen({navigation}: Props) {
  const inspections = useInspections();
  const [creating, setCreating] = useState(false);

  const createInspection = useCallback(async () => {
    setCreating(true);
    try {
      // GPS is best-effort: a tech in a basement with no fix shouldn't be
      // blocked from starting an inspection. Airplane mode must never
      // prevent offline CRUD (spec section 8).
      const gps = await captureGps().catch(() => null);

      const doc = new InspectionCrdtDoc();
      const crdtState = doc.encodeFullState();
      doc.destroy();

      let created!: Inspection;
      await database.write(async () => {
        created = await database.get<Inspection>('inspections').create(record => {
          record.title = `Inspection ${new Date().toLocaleDateString()}`;
          record.siteName = 'Unnamed site';
          record.status = 'draft';
          record.mergeStatus = 'synced';
          record.gpsLat = gps?.lat ?? null;
          record.gpsLng = gps?.lng ?? null;
          record.crdtState = crdtState;
          record.syncedAt = null;
        });
      });

      navigation.navigate('InspectionForm', {inspectionId: created.id});
    } finally {
      setCreating(false);
    }
  }, [navigation]);

  return (
    <View style={styles.container}>
      <FlatList
        data={inspections}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({item}) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('InspectionForm', {inspectionId: item.id})}>
            <View style={styles.rowText}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.subtitle}>{item.siteName}</Text>
            </View>
            <SyncStatusBadge status={item.mergeStatus} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No inspections yet. Start one below.</Text>
        }
      />
      <TouchableOpacity style={styles.fab} onPress={createInspection} disabled={creating}>
        {creating ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.fabText}>+ New inspection</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  list: {padding: 16},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  rowText: {flex: 1},
  title: {fontSize: 16, fontWeight: '600'},
  subtitle: {fontSize: 13, color: '#777', marginTop: 2},
  empty: {textAlign: 'center', color: '#999', marginTop: 40},
  fab: {
    backgroundColor: '#2563eb',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  fabText: {color: '#fff', fontWeight: '700', fontSize: 15},
});
