// src/screens/ControlScreen.js
import { Joystick } from 'react-native-virtual-joystick';
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  StatusBar,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DroneService from '../services/DroneService';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Enhanced Custom Joystick component
const EnhancedJoystick = ({ label, onMove }) => {
  const [values, setValues] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  
  // Size calculations
  const size = 150;
  const stickSize = 60;
  const maxDistance = (size - stickSize) / 2;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActive(true);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        let x = gesture.dx;
        let y = gesture.dy;
        
        // Calculate distance from center
        const distance = Math.sqrt(x * x + y * y);
        
        // Limit to circle boundary
        if (distance > maxDistance) {
          const angle = Math.atan2(y, x);
          x = Math.cos(angle) * maxDistance;
          y = Math.sin(angle) * maxDistance;
        }
        
        // Update animated values
        pan.setValue({ x, y });
        
        // Normalize values to -1...1 range for controller input
        const normalizedX = x / maxDistance;
        const normalizedY = -y / maxDistance; // Invert Y since screen coordinate system is inverted
        
        setValues({
          x: Math.round(normalizedX * 100),
          y: Math.round(normalizedY * 100)
        });
        
        if (onMove) {
          onMove({
            x: normalizedX,
            y: normalizedY
          });
        }
      },
      onPanResponderRelease: () => {
        setActive(false);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5,
          tension: 40
        }).start();
        
        setValues({ x: 0, y: 0 });
        
        if (onMove) {
          onMove({ x: 0, y: 0 });
        }
      }
    })
  ).current;

  // Determine label and values text based on which joystick this is
  const valueLabels = label.includes('Throttle') 
    ? { x: 'Yaw', y: 'Throttle' }
    : { x: 'Roll', y: 'Pitch' };

  return (
    <View style={styles.joystickSection}>
      <Text style={styles.joystickLabel}>{label}</Text>
      <View style={styles.joystickWrapper}>
        <View 
          style={[
            styles.joystickBase, 
            { width: size, height: size, borderRadius: size / 2 }
          ]} 
        >
          <View style={styles.joystickGuides}>
            <View style={styles.horizontalLine} />
            <View style={styles.verticalLine} />
          </View>
        </View>
        <Animated.View
          style={[
            styles.stickPosition,
            {
              transform: [
                { translateX: pan.x },
                { translateY: pan.y }
              ]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View 
            style={[
              styles.stick,
              active ? styles.stickActive : {},
              { width: stickSize, height: stickSize, borderRadius: stickSize / 2 }
            ]} 
          />
        </Animated.View>
      </View>
      <Text style={styles.joystickValues}>
        {valueLabels.y}: {values.y}, {valueLabels.x}: {values.x}
      </Text>
    </View>
  );
};

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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Drone Controller</Text>
      </View>
      
      <EnhancedStatusBar connected={connected} batteryLevel={batteryLevel} />
      
      <View style={styles.joystickContainer}>
        <EnhancedJoystick 
          label="Throttle / Yaw" 
          onMove={handleLeftJoystickMove} 
        />
        
        <EnhancedJoystick 
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
  joystickSection: {
    alignItems: 'center',
    width: width / 2 - 20,
  },
  joystickLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  joystickWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickBase: {
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  joystickGuides: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalLine: {
    position: 'absolute',
    width: '90%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  verticalLine: {
    position: 'absolute',
    width: 1,
    height: '90%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stickPosition: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stick: {
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  stickActive: {
    backgroundColor: '#1976D2',
    elevation: 8,
    shadowOpacity: 0.8,
  },
  joystickValues: {
    marginTop: 15,
    fontSize: 14,
    color: '#BBBBBB',
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