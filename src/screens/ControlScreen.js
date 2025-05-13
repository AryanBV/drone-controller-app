// src/screens/ControlScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  StatusBar,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import DroneService from '../services/MockDroneService'; // Use mock service for testing
import Ionicons from 'react-native-vector-icons/Ionicons';
import GestureJoystick from '../components/joystick/GestureJoystick';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Enhanced Status Bar Component
const EnhancedStatusBar = ({ connected, batteryLevel }) => {
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
  
  // Store intervals in refs to clean them up properly
  const batteryIntervalRef = useRef(null);
  const connectionIntervalRef = useRef(null);
  
  // Get window dimensions for responsive layout
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Connect to drone on component mount
  useEffect(() => {
    // Initialize connection
    const initConnection = async () => {
      try {
        const isConnected = DroneService.isConnected();
        if (!isConnected) {
          await DroneService.connect();
        }
        setConnected(DroneService.isConnected());
      } catch (error) {
        console.error('Failed to connect:', error);
        setConnected(false);
      }
    };

    initConnection();
    
    // Simulate battery drain (for demo purposes)
    batteryIntervalRef.current = setInterval(() => {
      if (DroneService.getBatteryLevel) {
        setBatteryLevel(DroneService.getBatteryLevel());
      } else {
        setBatteryLevel(prev => {
          if (prev > 0) return prev - 1;
          return 0;
        });
      }
    }, 30000); // Decrease every 30 seconds

    // Clean up on unmount
    return () => {
      if (batteryIntervalRef.current) {
        clearInterval(batteryIntervalRef.current);
      }
      if (connectionIntervalRef.current) {
        clearInterval(connectionIntervalRef.current);
      }
    };
  }, []);
  
  // Update connection status whenever screen is focused
  useFocusEffect(
    useCallback(() => {
      // Check connection status immediately when screen is focused
      setConnected(DroneService.isConnected());
      
      // Also setup an interval to periodically check connection status
      connectionIntervalRef.current = setInterval(() => {
        const currentStatus = DroneService.isConnected();
        setConnected(currentStatus);
        
        // Update battery level too
        if (DroneService.getBatteryLevel) {
          setBatteryLevel(DroneService.getBatteryLevel());
        }
      }, 1000); // Check every second
      
      return () => {
        if (connectionIntervalRef.current) {
          clearInterval(connectionIntervalRef.current);
          connectionIntervalRef.current = null;
        }
      };
    }, [])
  );

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
        
        {/* Responsive layout based on orientation */}
        <View style={isLandscape ? styles.containerLandscape : styles.containerPortrait}>
          <View style={isLandscape ? styles.joystickContainerLandscape : styles.joystickContainerPortrait}>
            <View style={styles.joystickWrapper}>
              <GestureJoystick 
                testID="left-joystick"
                label="Throttle / Yaw" 
                onMove={handleLeftJoystickMove} 
              />
              <Text style={styles.joystickValues}>
                Throttle: {throttle}, Yaw: {yaw}
              </Text>
            </View>
            
            <View style={styles.joystickWrapper}>
              <GestureJoystick 
                testID="right-joystick"
                label="Pitch / Roll" 
                onMove={handleRightJoystickMove} 
              />
              <Text style={styles.joystickValues}>
                Pitch: {pitch}, Roll: {roll}
              </Text>
            </View>
          </View>
          
          <View style={isLandscape ? styles.buttonContainerLandscape : styles.buttonContainerPortrait}>
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
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

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
  // Portrait mode containers
  containerPortrait: {
    flex: 1,
    flexDirection: 'column',
  },
  joystickContainerPortrait: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  buttonContainerPortrait: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingBottom: 20,
  },
  // Landscape mode containers
  containerLandscape: {
    flex: 1,
    flexDirection: 'row',
  },
  joystickContainerLandscape: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainerLandscape: {
    width: 150,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 20,
    gap: 20,
  },
  // Common styles
  joystickWrapper: {
    alignItems: 'center',
  },
  joystickValues: {
    marginTop: 10,
    color: '#BBBBBB',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    minWidth: 150,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});

export default EnhancedControlScreen;