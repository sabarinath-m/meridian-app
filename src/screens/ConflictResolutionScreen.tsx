import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, StyleSheet} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import {database} from '../db';
import {useInspection, useUnresolvedConflicts} from '../db/hooks';
import ConflictRecord from '../db/models/ConflictRecord';
import {recordFieldEdit} from '../sync/syncEngine';
import {getDeviceId} from '../sync/deviceId';
import {RootStackParamList} from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'ConflictResolution'>;

/**
 * The manual field-by-field merge picker the spec calls for (section 4,
 * stretch features — pulled into the MVP here since a conflict that can
 * never be resolved isn't a finished feature). Every conflict shows both
 * sides plainly; nothing is auto-resolved by this screen.
 */
export default function ConflictResolutionScreen({route}: Props) {
  const {inspectionId} = route.params;
  const inspection = useInspection(inspectionId);
  const conflicts = useUnresolvedConflicts(inspectionId);
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    getDeviceId().then(setDeviceId);
  }, []);

  const resolve = async (conflict: ConflictRecord, chosenValue: string) => {
    if (!inspection || !deviceId) {
      return;
    }
    await database.write(async () => {
      await conflict.update(record => {
        record.resolved = true;
        record.resolvedValue = chosenValue;
      });
    });
    // Writing the resolved value as a new local edit makes it the doc's
    // current value and queues it to propagate on the next sync — the
    // conflict doesn't just get dismissed, the disagreement gets settled.
    await recordFieldEdit(database, inspection, conflict.fieldId, chosenValue, deviceId);
  };

  if (conflicts.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>No unresolved conflicts. 🎉</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {conflicts.map(conflict => (
        <View key={conflict.id} style={styles.card}>
          <Text style={styles.fieldName}>{conflict.fieldId}</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={styles.option}
              onPress={() => resolve(conflict, conflict.mineValue)}>
              <Text style={styles.optionLabel}>Keep mine</Text>
              <Text style={styles.optionValue}>{conflict.mineValue || '(empty)'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.option}
              onPress={() => resolve(conflict, conflict.theirsValue)}>
              <Text style={styles.optionLabel}>Keep theirs</Text>
              <Text style={styles.optionValue}>{conflict.theirsValue || '(empty)'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {padding: 16},
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  emptyText: {fontSize: 16, color: '#555'},
  card: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  fieldName: {fontWeight: '700', fontSize: 15, marginBottom: 10},
  optionsRow: {flexDirection: 'row', gap: 10},
  option: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 6,
    padding: 10,
  },
  optionLabel: {color: '#2563eb', fontWeight: '600', fontSize: 12, marginBottom: 4},
  optionValue: {fontSize: 14},
});
