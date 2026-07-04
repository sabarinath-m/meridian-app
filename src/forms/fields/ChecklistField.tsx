import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {ChecklistFieldConfig} from '../types';

interface Props {
  config: ChecklistFieldConfig;
  value: string | null;
  onChange: (value: string) => void;
}

// Checked options are stored as a JSON-encoded array in the field's single
// CRDT scalar value — the Yjs map only holds primitives, so composite
// values get serialized rather than modeled as nested CRDT structures.
// That's a deliberate simplicity trade-off: a whole-checklist edit is one
// field-level conflict unit, not one per checkbox.
function parse(value: string | null): string[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ChecklistField({config, value, onChange}: Props) {
  const selected = new Set(parse(value));

  const toggle = (option: string) => {
    const next = new Set(selected);
    if (next.has(option)) {
      next.delete(option);
    } else {
      next.add(option);
    }
    onChange(JSON.stringify(Array.from(next)));
  };

  return (
    <View>
      {config.options.map(option => {
        const checked = selected.has(option);
        return (
          <TouchableOpacity
            key={option}
            style={styles.row}
            onPress={() => toggle(option)}
            accessibilityRole="checkbox"
            accessibilityState={{checked}}>
            <View style={[styles.box, checked && styles.boxChecked]}>
              {checked && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.label}>{option}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
  box: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: '#888',
    borderRadius: 4,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {backgroundColor: '#2563eb', borderColor: '#2563eb'},
  checkmark: {color: '#fff', fontSize: 14, fontWeight: '700'},
  label: {fontSize: 15},
});
