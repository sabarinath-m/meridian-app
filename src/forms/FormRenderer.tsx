import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {FormSchema, FieldValueMap} from './types';
import ChecklistField from './fields/ChecklistField';
import TextField from './fields/TextField';
import NumericField from './fields/NumericField';
import PhotoField from './fields/PhotoField';
import SignatureField from './fields/SignatureField';

interface Props {
  schema: FormSchema;
  values: FieldValueMap;
  onFieldChange: (fieldId: string, value: string) => void;
}

/**
 * Fully schema-driven: the set of fields, their order, and their types all
 * come from `schema`, not from hardcoded JSX. Swapping in a different
 * FormSchema (a different inspection type entirely) requires no changes
 * here — that's what makes this a "dynamic form renderer" rather than a
 * fixed form with a config-sounding name.
 */
export default function FormRenderer({schema, values, onFieldChange}: Props) {
  return (
    <View>
      {schema.map(field => {
        const value = values[field.id] ?? null;
        const onChange = (v: string) => onFieldChange(field.id, v);

        return (
          <View key={field.id} style={styles.fieldWrapper}>
            <Text style={styles.label}>
              {field.label}
              {field.required ? <Text style={styles.required}> *</Text> : null}
            </Text>
            {field.type === 'checklist' && (
              <ChecklistField config={field} value={value as string | null} onChange={onChange} />
            )}
            {field.type === 'text' && (
              <TextField config={field} value={value as string | null} onChange={onChange} />
            )}
            {field.type === 'numeric' && (
              <NumericField config={field} value={value as string | null} onChange={onChange} />
            )}
            {field.type === 'photo' && (
              <PhotoField config={field} value={value as string | null} onChange={onChange} />
            )}
            {field.type === 'signature' && (
              <SignatureField config={field} value={value as string | null} onChange={onChange} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldWrapper: {marginBottom: 20},
  label: {fontSize: 14, fontWeight: '600', marginBottom: 6, color: '#333'},
  required: {color: '#dc2626'},
});
