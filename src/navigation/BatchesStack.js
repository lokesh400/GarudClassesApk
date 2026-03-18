import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BatchesScreen from '../screens/BatchesScreen';
import TestSeriesDetailScreen from '../screens/TestSeriesDetailScreen';
import TestAttemptScreen from '../screens/TestAttemptScreen';
import TestResultScreen from '../screens/TestResultScreen';

const Stack = createNativeStackNavigator();

export default function BatchesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BatchesList" component={BatchesScreen} />
      <Stack.Screen name="TestSeriesDetail" component={TestSeriesDetailScreen} />
      <Stack.Screen name="TestAttempt" component={TestAttemptScreen} />
      <Stack.Screen name="TestResult" component={TestResultScreen} />
    </Stack.Navigator>
  );
}
