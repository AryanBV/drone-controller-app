import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import ControlScreen from './src/screens/ControlScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ConnectionScreen from './src/screens/ConnectionScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Control">
        <Stack.Screen name="Control" component={ControlScreen} options={{ title: 'Drone Controller' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Connection" component={ConnectionScreen} options={{ title: 'Connection' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
