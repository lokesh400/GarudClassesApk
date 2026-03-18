import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BatchesScreen from '../screens/BatchesScreen';
import TestSeriesDetailScreen from '../screens/TestSeriesDetailScreen';
import TestAttemptScreen from '../screens/TestAttemptScreen';
import TestResultScreen from '../screens/TestResultScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import MyPurchasesScreen from '../screens/MyPurchasesScreen';
import PurchaseReceiptDetailScreen from '../screens/PurchaseReceiptDetailScreen';

const Stack = createNativeStackNavigator();

export default function BatchesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BatchesList" component={BatchesScreen} />
      <Stack.Screen name="Downloads" component={DownloadsScreen} />
      <Stack.Screen name="MyPurchases" component={MyPurchasesScreen} />
      <Stack.Screen name="PurchaseReceiptDetail" component={PurchaseReceiptDetailScreen} />
      <Stack.Screen name="TestSeriesDetail" component={TestSeriesDetailScreen} />
      <Stack.Screen name="TestAttempt" component={TestAttemptScreen} />
      <Stack.Screen name="TestResult" component={TestResultScreen} />
    </Stack.Navigator>
  );
}
