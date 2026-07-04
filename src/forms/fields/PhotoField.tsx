import React from 'react';
import {View, Text, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {launchCamera} from 'react-native-image-picker';
import {PhotoFieldConfig} from '../types';

interface Props {
  config: PhotoFieldConfig;
  value: string | null; // local file URI
  onChange: (value: string) => void;
}

// Captures straight to local filesystem storage — the URI returned by the
// camera is already a local-first path. Upload is deferred entirely to the
// background sync engine (src/sync/syncEngine.ts); this component never
// touches the network, per the spec's "local-first, deferred upload" rule.
export default function PhotoField({value, onChange}: Props) {
  const capture = async () => {
    const result = await launchCamera({
      mediaType: 'photo',
      saveToPhotos: false,
      quality: 0.8,
    });
    const uri = result.assets?.[0]?.uri;
    if (uri) {
      onChange(uri);
    }
  };

  return (
    <View>
      {value ? (
        <Image source={{uri: value}} style={styles.preview} />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>No photo captured</Text>
        </View>
      )}
      <TouchableOpacity style={styles.button} onPress={capture}>
        <Text style={styles.buttonText}>{value ? 'Retake photo' : 'Capture photo'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  preview: {width: '100%', height: 180, borderRadius: 8, marginBottom: 8},
  placeholder: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  placeholderText: {color: '#888'},
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {color: '#fff', fontWeight: '600'},
});
