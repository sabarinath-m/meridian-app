import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {MergeStatus} from '../db/models/Inspection';

const CONFIG: Record<MergeStatus, {label: string; color: string}> = {
  synced: {label: 'Synced', color: '#16a34a'},
  pending: {label: 'Pending sync', color: '#d97706'},
  conflict: {label: 'Conflict', color: '#dc2626'},
};

export default function SyncStatusBadge({status}: {status: MergeStatus}) {
  const {label, color} = CONFIG[status];
  return (
    <View style={[styles.badge, {backgroundColor: `${color}22`}]}>
      <View style={[styles.dot, {backgroundColor: color}]} />
      <Text style={[styles.text, {color}]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {width: 6, height: 6, borderRadius: 3, marginRight: 6},
  text: {fontSize: 12, fontWeight: '600'},
});
