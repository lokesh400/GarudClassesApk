import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BatchesStack from './BatchesStack';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1E3A8A',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#E5E7EB',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Batches"
        component={BatchesStack}
        options={{
          tabBarLabel: 'Batches',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji={focused ? '📚' : '📖'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
