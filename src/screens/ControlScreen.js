import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Joystick from '../components/joystick/JoystickControl';
import StatusBar from '../components/status/StatusBar';
import DroneService from '../services/DroneService';

const ControlScreen = ({ navigation }) => {
  const [connected, setConnected] = useState(false);
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

    // Clean up on unmount
    return () => {
      DroneService.disconnect();
    };
  }, []);

  // Handle left joystick movement (throttle and yaw)
  const handleLeftJoystickMove = (data) => {
    const newThrottle = Math.round(data.y * -100); // Convert y to throttle (0-100)
    const newYaw = Math.round(data.x * 100);       // Convert x to yaw (-100 to 100)
    
    setThrottle(newThrottle);
    setYaw(newYaw);
    
    sendDroneCommand();
  };

  // Handle right joystick movement (pitch and roll)
  const handleRightJoystickMove = (data) => {
    const newPitch = Math.round(data.y * -100);    // Convert y to pitch (-100 to 100)
    const newRoll = Math.round(data.x * 100);      // Convert x to roll (-100 to 100)
    
    setPitch(newPitch);
    setRoll(newRoll);
    
    sendDroneCommand();
  };

  // Send command to drone
  const sendDroneCommand = () => {
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
    <View style={styles.container}>
      <StatusBar connected={connected} />
      
      <View style={styles.joystickContainer}>
        <View style={styles.joystickSection}>
          <Text style={styles.joystickLabel}>Throttle / Yaw</Text>
          <Joystick onMove={handleLeftJoystickMove} />
          <Text style={styles.values}>Throttle: {throttle}, Yaw: {yaw}</Text>
        </View>
        
        <View style={styles.joystickSection}>
          <Text style={styles.joystickLabel}>Pitch / Roll</Text>
          <Joystick onMove={handleRightJoystickMove} />
          <Text style={styles.values}>Pitch: {pitch}, Roll: {roll}</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.buttonText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate('Connection')}
        >
          <Text style={styles.buttonText}>Connection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  joystickContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  joystickSection: {
    alignItems: 'center',
  },
  joystickLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  values: {
    marginTop: 10,
    fontSize: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ControlScreen;
