// App.js
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import our enhanced screens
import EnhancedControlScreen from './src/screens/EnhancedControlScreen';
import EnhancedSettingsScreen from './src/screens/EnhancedSettingsScreen';
import EnhancedConnectionScreen from './src/screens/ConnectionScreen';
import TelemetryScreen from './src/screens/TelemetryScreen';
import LogsScreen from './src/screens/LogsScreen';
import LogDetailScreen from './src/screens/LogDetailScreen';
import PIDTuningScreen from './src/screens/PIDTuningScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Control"
            screenOptions={{
              headerShown: false,
              cardStyle: { backgroundColor: '#121212' }
            }}
          >
            <Stack.Screen name="Control" component={EnhancedControlScreen} />
            <Stack.Screen name="Settings" component={EnhancedSettingsScreen} />
            <Stack.Screen name="Connection" component={EnhancedConnectionScreen} />
            <Stack.Screen name="Telemetry" component={TelemetryScreen} />
            <Stack.Screen name="Logs" component={LogsScreen} />
            <Stack.Screen name="LogDetail" component={LogDetailScreen} />
            <Stack.Screen name="PIDTuning" component={PIDTuningScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;