import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/auth/AuthContext';
import AuthStack from './src/navigation/AuthStack';
import AppTabs from './src/navigation/AppTabs';

// RootNavigator reads auth state and renders the correct navigator.
// It MUST live inside AuthProvider to access the context.
function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // isLoading is only true during the brief AsyncStorage check on launch.
  // Show a spinner to prevent a flash of the Login screen for returning users.
  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return isAuthenticated ? <AppTabs /> : <AuthStack />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <RootNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
