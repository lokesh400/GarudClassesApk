import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OttHomeScreen from '../screens/ott/OttHomeScreen';
import OttCourseDetailScreen from '../screens/ott/OttCourseDetailScreen';
import OttVideoPlayerScreen from '../screens/ott/OttVideoPlayerScreen';

const Stack = createNativeStackNavigator();

export default function OttTabs() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OttHome" component={OttHomeScreen} />
      <Stack.Screen name="OttCourseDetail" component={OttCourseDetailScreen} />
      <Stack.Screen name="OttVideoPlayer" component={OttVideoPlayerScreen} />
      {/* Add more OTT screens here as needed */}
    </Stack.Navigator>
  );
}
