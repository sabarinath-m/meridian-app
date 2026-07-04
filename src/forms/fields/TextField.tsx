import React from 'react';
import {TextInput, StyleSheet} from 'react-native';
import {TextFieldConfig} from '../types';

interface Props {
  config: TextFieldConfig;
  value: string | null;
  onChange: (value: string) => void;
}

export default function TextField({config, value, onChange}: Props) {
  return (
    <TextInput
      style={[styles.input, config.multiline && styles.multiline]}
      value={value ?? ''}
      onChangeText={onChange}
      multiline={config.multiline}
      placeholder={`Enter ${config.label.toLowerCase()}`}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
  },
  multiline: {minHeight: 80, textAlignVertical: 'top'},
});
