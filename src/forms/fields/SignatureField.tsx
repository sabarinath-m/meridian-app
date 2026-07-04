import React, {useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, PanResponder} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {SignatureFieldConfig} from '../types';

interface Props {
  config: SignatureFieldConfig;
  value: string | null; // SVG path "d" string
  onChange: (value: string) => void;
}

const PAD_HEIGHT = 160;

// A minimal signature pad: no extra native dependency, just
// PanResponder + react-native-svg. Strokes are accumulated into a single
// SVG path string, which is what gets stored as the field's CRDT value —
// same trade-off as ChecklistField: the whole signature is one field-level
// conflict unit, not per-stroke.
export default function SignatureField({value, onChange}: Props) {
  const [path, setPath] = useState(value ?? '');
  const pathRef = useRef(value ?? '');

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        pathRef.current += `${pathRef.current ? ' ' : ''}M${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setPath(pathRef.current);
      },
      onPanResponderMove: evt => {
        const {locationX, locationY} = evt.nativeEvent;
        pathRef.current += ` L${locationX.toFixed(1)},${locationY.toFixed(1)}`;
        setPath(pathRef.current);
      },
      onPanResponderRelease: () => {
        onChange(pathRef.current);
      },
    }),
  ).current;

  const clear = () => {
    pathRef.current = '';
    setPath('');
    onChange('');
  };

  return (
    <View>
      <View style={styles.pad} {...panResponder.panHandlers}>
        <Svg width="100%" height={PAD_HEIGHT}>
          {path ? <Path d={path} stroke="#111" strokeWidth={2} fill="none" /> : null}
        </Svg>
        {!path && <Text style={styles.hint}>Sign here</Text>}
      </View>
      <TouchableOpacity style={styles.clearButton} onPress={clear}>
        <Text style={styles.clearText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    height: PAD_HEIGHT,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hint: {position: 'absolute', color: '#bbb'},
  clearButton: {marginTop: 6, alignSelf: 'flex-start'},
  clearText: {color: '#2563eb', fontWeight: '600'},
});
