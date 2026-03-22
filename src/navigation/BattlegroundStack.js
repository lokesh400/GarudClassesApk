import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BattlegroundScreen from '../screens/BattlegroundScreen';
import BattlegroundAttemptScreen from '../screens/BattlegroundAttemptScreen';
import BattlegroundPrizesScreen from '../screens/BattlegroundPrizesScreen';

const Stack = createNativeStackNavigator();

export default function BattlegroundStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="BattlegroundMain" component={BattlegroundScreen} />
      <Stack.Screen name="BattlegroundAttempt" component={BattlegroundAttemptScreen} />
      <Stack.Screen name="BattlegroundPrizes" component={BattlegroundPrizesScreen} />
    </Stack.Navigator>
  );
}
