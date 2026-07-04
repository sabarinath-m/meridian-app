import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import InspectionListScreen from '../screens/InspectionListScreen';
import InspectionFormScreen from '../screens/InspectionFormScreen';
import ConflictResolutionScreen from '../screens/ConflictResolutionScreen';

export type RootStackParamList = {
  InspectionList: undefined;
  InspectionForm: {inspectionId: string};
  ConflictResolution: {inspectionId: string};
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="InspectionList"
          component={InspectionListScreen}
          options={{title: 'Inspections'}}
        />
        <Stack.Screen
          name="InspectionForm"
          component={InspectionFormScreen}
          options={{title: 'Inspection'}}
        />
        <Stack.Screen
          name="ConflictResolution"
          component={ConflictResolutionScreen}
          options={{title: 'Resolve conflicts'}}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
