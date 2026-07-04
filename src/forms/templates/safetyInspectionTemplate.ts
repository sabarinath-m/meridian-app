import {FormSchema} from '../types';

// A sample form definition proving the renderer is schema-driven, not
// hardcoded per field. Swap this for a server-fetched or user-authored
// schema and the renderer needs no changes — that's the "dynamic" part.
// (There's no visual drag-and-drop builder UI in this MVP; see the README
// trade-offs section for why that's out of scope here.)
export const safetyInspectionTemplate: FormSchema = [
  {
    id: 'site_conditions',
    label: 'Site conditions',
    type: 'checklist',
    options: [
      'Adequate lighting',
      'Clear walkways',
      'Fire extinguisher accessible',
      'PPE available on site',
    ],
  },
  {
    id: 'notes',
    label: 'Notes',
    type: 'text',
    multiline: true,
  },
  {
    id: 'temperature',
    label: 'Ambient temperature',
    type: 'numeric',
    unit: '°F',
  },
  {
    id: 'site_photo',
    label: 'Site photo',
    type: 'photo',
  },
  {
    id: 'inspector_signature',
    label: 'Inspector signature',
    type: 'signature',
    required: true,
  },
];
