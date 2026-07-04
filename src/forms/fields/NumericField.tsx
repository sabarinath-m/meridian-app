import React from 'react';
import {View, TextInput, Text, StyleSheet} from 'react-native';
import {NumericFieldConfig} from '../types';

interface Props {
  config: NumericFieldConfig;
  value: string | null;
  onChange: (value: string) => void;
}

export default function NumericField({config, value, onChange}: Props) {
  return (
    <View style={styles.row}>
      <TextInput
        style={styles.input}
        value={value ?? ''}
        onChangeText={text => onChange(text.replace(/[^0-9.-]/g, ''))}
        keyboardType="numeric"
        placeholder="0"
      />
      {config.unit ? <Text style={styles.unit}>{config.unit}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center'},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    minWidth: 100,
  },
  unit: {marginLeft: 8, fontSize: 15, color: '#555'},
});
