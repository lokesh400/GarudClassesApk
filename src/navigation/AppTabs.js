import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

import BatchesStack from './BatchesStack';
import DashboardStack from './DashboardStack';
import OttTabs from './OttTabs';

const Tab = createBottomTabNavigator();

const baseTabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopColor: '#E5E7EB',
  borderTopWidth: 1,
  height: 60,
  paddingBottom: 8,
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 6,
};

export default function AppTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1D4ED8',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: baseTabBarStyle,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardStack}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'view-dashboard' : 'view-dashboard-outline'} size={28} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Batches"
        component={BatchesStack}
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) || 'BatchesList';
          const hideTabBar = routeName === 'TestAttempt';

          return {
            tabBarLabel: 'Batches',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'book-open-variant' : 'book-outline'} size={28} color={color} />
            ),
            popToTopOnBlur: true,
            unmountOnBlur: true,
            tabBarStyle: hideTabBar
              ? { ...baseTabBarStyle, display: 'none' }
              : baseTabBarStyle,
          };
        }}
      />
      <Tab.Screen
        name="OTT"
        component={OttTabs}
        options={{
          tabBarLabel: 'OTT',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons name={focused ? 'play-box' : 'play-box-outline'} size={28} color={color} />
          ),
          tabBarStyle: { ...baseTabBarStyle, display: 'none' },
        }}
      />
    </Tab.Navigator>
  );
}
