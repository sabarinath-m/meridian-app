export type FieldType = 'checklist' | 'text' | 'numeric' | 'photo' | 'signature';

interface BaseFieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
}

export interface ChecklistFieldConfig extends BaseFieldConfig {
  type: 'checklist';
  options: string[];
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text';
  multiline?: boolean;
}

export interface NumericFieldConfig extends BaseFieldConfig {
  type: 'numeric';
  unit?: string;
}

export interface PhotoFieldConfig extends BaseFieldConfig {
  type: 'photo';
}

export interface SignatureFieldConfig extends BaseFieldConfig {
  type: 'signature';
}

export type FormFieldConfig =
  | ChecklistFieldConfig
  | TextFieldConfig
  | NumericFieldConfig
  | PhotoFieldConfig
  | SignatureFieldConfig;

export type FormSchema = FormFieldConfig[];

// Field values live in the inspection's Yjs doc (src/sync/crdtDoc.ts).
// Checklist values are stored as a JSON-encoded string array since the CRDT
// field map only stores primitive scalars — see forms/fields/ChecklistField.
export type FieldValueMap = Record<string, string | number | boolean | null>;
