import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  StatusBar,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// import DroneService from '../services/DroneService';
import DroneService from '../services/MockDroneService'; // Use mock service
import Ionicons from 'react-native-vector-icons/Ionicons';
import GestureJoystick from '../components/joystick/GestureJoystick'; // Import the new joystick
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Important!

// Enhanced Status Bar Component
const EnhancedStatusBar = ({ connected, batteryLevel }) => {
  // Status bar implementation...
  const getBatteryColor = () => {
    if (batteryLevel > 50) return '#4CAF50';
    if (batteryLevel > 20) return '#FFC107';
    return '#F44336';
  };

  return (
    <View style={styles.statusBar}>
      <View style={styles.statusItem}>
        <Text style={styles.statusLabel}>Connection:</Text>
        <View style={[
          styles.connectionIndicator, 
          { backgroundColor: connected ? '#4CAF50' : '#F44336' }
        ]} />
        <Text style={[
          styles.statusValue,
          { color: connected ? '#4CAF50' : '#F44336' }
        ]}>
          {connected ? 'Connected' : 'Disconnected'}
        </Text>
      </View>
      
      <View style={styles.statusItem}>
        <Text style={styles.statusLabel}>Battery:</Text>
        <View style={styles.batteryOuterContainer}>
          <View 
            style={[
              styles.batteryLevel, 
              { 
                width: `${batteryLevel}%`,
                backgroundColor: getBatteryColor()
              }
            ]} 
          />
        </View>
        <Text style={[
          styles.statusValue,
          { color: getBatteryColor() }
        ]}>
          {batteryLevel}%
        </Text>
      </View>
    </View>
  );
};

const EnhancedControlScreen = ({ navigation }) => {
  const [connected, setConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(78);
  const [throttle, setThrottle] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);

  // Connect to drone on component mount
  useEffect(() => {
    // Initialize connection
    const initConnection = async () => {
      try {
        await DroneService.connect();
        setConnected(true);
      } catch (error) {
        console.error('Failed to connect:', error);
      }
    };

    initConnection();

    // Simulate battery drain (for demo purposes)
    const interval = setInterval(() => {
      setBatteryLevel(prev => {
        if (prev > 0) return prev - 1;
        return 0;
      });
    }, 30000); // Decrease every 30 seconds

    // Clean up on unmount
    return () => {
      clearInterval(interval);
      DroneService.disconnect();
    };
  }, []);

  // Handle left joystick movement (throttle and yaw)
  const handleLeftJoystickMove = (data) => {
    const newThrottle = Math.round(data.y * 100);
    const newYaw = Math.round(data.x * 100);
    
    setThrottle(newThrottle);
    setYaw(newYaw);
    
    sendDroneCommand(newThrottle, newYaw, pitch, roll);
  };

  // Handle right joystick movement (pitch and roll)
  const handleRightJoystickMove = (data) => {
    const newPitch = Math.round(data.y * 100);
    const newRoll = Math.round(data.x * 100);
    
    setPitch(newPitch);
    setRoll(newRoll);
    
    sendDroneCommand(throttle, yaw, newPitch, newRoll);
  };

  // Send command to drone
  const sendDroneCommand = (throttle, yaw, pitch, roll) => {
    if (connected) {
      DroneService.sendCommand({
        throttle,
        yaw,
        pitch,
        roll
      });
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Drone Controller</Text>
        </View>
        
        <EnhancedStatusBar connected={connected} batteryLevel={batteryLevel} />
        
        <View style={styles.joystickContainer}>
          <GestureJoystick 
            testID="left-joystick"
            label="Throttle / Yaw" 
            onMove={handleLeftJoystickMove} 
          />
          
          <GestureJoystick 
            testID="right-joystick"
            label="Pitch / Roll" 
            onMove={handleRightJoystickMove} 
          />
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings" size={20} color="white" />
            <Text style={styles.buttonText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('Connection')}
          >
            <Ionicons name="wifi" size={20} color="white" />
            <Text style={styles.buttonText}>Connection</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    margin: 16,
    padding: 16,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#BBBBBB',
    marginRight: 8,
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  batteryOuterContainer: {
    width: 50,
    height: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 7,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  batteryLevel: {
    height: '100%',
  },
  joystickContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default EnhancedControlScreen;