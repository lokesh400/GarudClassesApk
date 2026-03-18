import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import BatchesStack from './BatchesStack';
import DashboardScreen from '../screens/DashboardScreen';

const Tab = createBottomTabNavigator();

const baseTabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopColor: '#E5E7EB',
  borderTopWidth: 1,
  height: 60,
  paddingBottom: 8,
};

function TabIcon({ emoji }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

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
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: () => (
            <TabIcon emoji="🏠" />
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
            tabBarIcon: () => (
              <TabIcon emoji='📖' />
            ),
            popToTopOnBlur: true,
            unmountOnBlur: true,
            tabBarStyle: hideTabBar
              ? { ...baseTabBarStyle, display: 'none' }
              : baseTabBarStyle,
          };
        }}
      />
    </Tab.Navigator>
  );
}
