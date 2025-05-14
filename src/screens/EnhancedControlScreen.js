// src/screens/EnhancedControlScreen.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  Modal,
  Alert,
  Vibration,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import EnhancedMockDroneService from '../services/EnhancedMockDroneService';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import GestureJoystick from '../components/joystick/GestureJoystick';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Compact Status Bar for Landscape Mode
const CompactStatusBar = ({ connected, batteryLevel }) => {
  const getBatteryColor = () => {
    if (batteryLevel > 50) return '#4CAF50';
    if (batteryLevel > 20) return '#FFC107';
    return '#F44336';
  };

  return (
    <View style={styles.compactStatusBar}>
      <View style={styles.statusGroup}>
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
      
      <View style={styles.statusGroup}>
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

// Mini Telemetry Display
const MiniTelemetryDisplay = ({ telemetry }) => {
  if (!telemetry) return null;
  
  return (
    <View style={styles.miniTelemetry}>
      <View style={styles.telemetryRow}>
        <Text style={styles.telemetryLabel}>Alt:</Text>
        <Text style={styles.telemetryValue}>{telemetry.altitude.toFixed(1)} m</Text>
      </View>
      
      <View style={styles.telemetryRow}>
        <Text style={styles.telemetryLabel}>Speed:</Text>
        <Text style={styles.telemetryValue}>{telemetry.speed.toFixed(1)} m/s</Text>
      </View>
      
      <View style={styles.telemetryRow}>
        <Text style={styles.telemetryLabel}>Batt:</Text>
        <Text style={styles.telemetryValue}>{telemetry.batteryVoltage.toFixed(1)} V</Text>
      </View>
    </View>
  );
};

// Menu Button for Landscape Mode
const MenuButton = ({ onPress }) => {
  return (
    <TouchableOpacity style={styles.menuButton} onPress={onPress}>
      <MaterialIcons name="menu" size={24} color="white" />
    </TouchableOpacity>
  );
};

// Flight Mode Selector
const FlightModeSelector = ({ currentMode, onModeChange }) => {
  const modes = ['Normal', 'Sport', 'Beginner'];
  
  return (
    <View style={styles.flightModeSelector}>
      {modes.map(mode => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.modeButton,
            currentMode === mode && styles.modeButtonActive
          ]}
          onPress={() => onModeChange(mode)}
        >
          <Text style={[
            styles.modeButtonText,
            currentMode === mode && styles.modeButtonTextActive
          ]}>
            {mode}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Main EnhancedControlScreen Component
const EnhancedControlScreen = ({ navigation }) => {
  // State
  const [connected, setConnected] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(78);
  const [throttle, setThrottle] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(0);
  const [roll, setRoll] = useState(0);
  const [telemetry, setTelemetry] = useState(null);
  const [recording, setRecording] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [flightMode, setFlightMode] = useState('Normal');
  const [orientationKey, setOrientationKey] = useState(0); // Key to force re-render of joysticks
  
  // Refs for intervals
  const connectionIntervalRef = useRef(null);
  const telemetryIntervalRef = useRef(null);
  const previousOrientation = useRef('portrait');
  
  // Get window dimensions for responsive layout
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  // Initialize connection and intervals
  useEffect(() => {
    // Connect to drone
    const initConnection = async () => {
      try {
        const isConnected = EnhancedMockDroneService.isConnected();
        if (!isConnected) {
          await EnhancedMockDroneService.connect();
        }
        setConnected(EnhancedMockDroneService.isConnected());
      } catch (error) {
        console.error('Failed to connect:', error);
        setConnected(false);
      }
    };

    initConnection();
    
    // Clean up on unmount
    return () => {
      if (connectionIntervalRef.current) {
        clearInterval(connectionIntervalRef.current);
      }
      if (telemetryIntervalRef.current) {
        clearInterval(telemetryIntervalRef.current);
      }
    };
  }, []);
  
  // Handle orientation changes
  useEffect(() => {
    const currentOrientation = isLandscape ? 'landscape' : 'portrait';
    
    // Check if orientation actually changed
    if (previousOrientation.current !== currentOrientation) {
      // Configure the animation
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      
      // Update the key to force joystick re-render
      setOrientationKey(prev => prev + 1);
      
      // Save current orientation for next comparison
      previousOrientation.current = currentOrientation;
    }
  }, [isLandscape]);
  
  // Update connection status and telemetry on screen focus
  useFocusEffect(
    useCallback(() => {
      // Check connection status
      setConnected(EnhancedMockDroneService.isConnected());
      
      // Setup connection interval
      connectionIntervalRef.current = setInterval(() => {
        const currentStatus = EnhancedMockDroneService.isConnected();
        setConnected(currentStatus);
        
        // Update battery level
        if (EnhancedMockDroneService.getBatteryLevel) {
          const battLevel = EnhancedMockDroneService.getBatteryLevel();
          setBatteryLevel(battLevel);
        }
      }, 1000);
      
      // Setup telemetry interval
      telemetryIntervalRef.current = setInterval(() => {
        if (EnhancedMockDroneService.isConnected()) {
          const telemetryData = EnhancedMockDroneService.getTelemetry();
          setTelemetry(telemetryData);
        }
      }, 500);
      
      return () => {
        if (connectionIntervalRef.current) {
          clearInterval(connectionIntervalRef.current);
        }
        if (telemetryIntervalRef.current) {
          clearInterval(telemetryIntervalRef.current);
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
      EnhancedMockDroneService.sendCommand({
        throttle,
        yaw,
        pitch,
        roll,
        flightMode
      });
    }
  };
  
  // Handle emergency stop
  const handleEmergencyStop = () => {
    if (!connected) return;
    
    // Vibrate for haptic feedback
    Vibration.vibrate([100, 100, 100, 100, 300]);
    
    // Show confirmation dialog
    Alert.alert(
      'Emergency Stop',
      'Are you sure you want to trigger the emergency stop? This will immediately stop all motors and may cause the drone to drop.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'STOP',
          style: 'destructive',
          onPress: () => {
            // Trigger emergency stop
            EnhancedMockDroneService.emergencyStop();
          },
        },
      ],
    );
  };
  
  // Toggle recording
  const toggleRecording = () => {
    if (!connected) return;
    
    if (!recording) {
      // Start recording
      const success = EnhancedMockDroneService.startLogging();
      if (success) {
        setRecording(true);
      }
    } else {
      // Stop recording
      EnhancedMockDroneService.stopLogging().then(success => {
        if (success) {
          setRecording(false);
        }
      });
    }
  };
  
  // Show menu modal
  const showMenu = () => {
    setShowMenuModal(true);
  };
  
  // Handle menu option selection
  const handleMenuSelect = (screen) => {
    setShowMenuModal(false);
    navigation.navigate(screen);
  };
  
  // Render menu modal
  const renderMenuModal = () => {
    return (
      <Modal
        transparent={true}
        visible={showMenuModal}
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenuModal(false)}
        >
          <View style={styles.menuModal}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect('Telemetry')}
            >
              <MaterialIcons name="assessment" size={24} color="#2196F3" />
              <Text style={styles.menuItemText}>Telemetry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect('Logs')}
            >
              <MaterialIcons name="history" size={24} color="#2196F3" />
              <Text style={styles.menuItemText}>Flight Logs</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect('Settings')}
            >
              <MaterialIcons name="settings" size={24} color="#2196F3" />
              <Text style={styles.menuItemText}>Settings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect('Connection')}
            >
              <MaterialIcons name="wifi" size={24} color="#2196F3" />
              <Text style={styles.menuItemText}>Connection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleMenuSelect('PIDTuning')}
            >
              <MaterialIcons name="tune" size={24} color="#2196F3" />
              <Text style={styles.menuItemText}>PID Tuning</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        
        {isLandscape ? (
          // Landscape layout - Optimized for flight
          <View style={styles.landscapeContainer} key={`landscape-${orientationKey}`}>
            {/* Top status bar */}
            <CompactStatusBar connected={connected} batteryLevel={batteryLevel} />
            
            <View style={styles.mainControlArea}>
              {/* Left joystick */}
              <View style={styles.joystickContainer}>
                <Text style={styles.joystickLabel}>Throttle / Yaw</Text>
                <GestureJoystick 
                  testID="left-joystick"
                  onMove={handleLeftJoystickMove} 
                />
              </View>
              
              {/* Center area with telemetry and buttons */}
              <View style={styles.centerControls}>
                <MiniTelemetryDisplay telemetry={telemetry} />
                
                <View style={styles.centerButtonsGroup}>
                  {/* Recording button */}
                  <TouchableOpacity 
                    style={[
                      styles.recordButton,
                      recording && styles.recordingActive
                    ]}
                    onPress={toggleRecording}
                    disabled={!connected}
                  >
                    <MaterialIcons 
                      name={recording ? "stop" : "fiber-manual-record"} 
                      size={24} 
                      color={recording ? "#FFFFFF" : "#F44336"} 
                    />
                  </TouchableOpacity>
                  
                  {/* Flight mode selector */}
                  <FlightModeSelector 
                    currentMode={flightMode}
                    onModeChange={setFlightMode}
                  />
                </View>
              </View>
              
              {/* Right joystick */}
              <View style={styles.joystickContainer}>
                <Text style={styles.joystickLabel}>Pitch / Roll</Text>
                <GestureJoystick 
                  testID="right-joystick"
                  onMove={handleRightJoystickMove} 
                />
              </View>
            </View>
            
            {/* Bottom bar with emergency stop and menu */}
            <View style={styles.bottomBar}>
              <TouchableOpacity 
                style={styles.emergencyStopButton}
                onPress={handleEmergencyStop}
                disabled={!connected}
              >
                <MaterialIcons name="pan-tool" size={24} color="white" />
                <Text style={styles.emergencyStopText}>EMERGENCY STOP</Text>
              </TouchableOpacity>
              
              <MenuButton onPress={showMenu} />
            </View>
          </View>
        ) : (
          // Portrait layout - Standard control screen
          <View style={styles.portraitContainer} key={`portrait-${orientationKey}`}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Drone Controller</Text>
              
              {/* Recording button */}
              <TouchableOpacity 
                style={[
                  styles.recordButton,
                  recording && styles.recordingActive
                ]}
                onPress={toggleRecording}
                disabled={!connected}
              >
                <MaterialIcons 
                  name={recording ? "stop" : "fiber-manual-record"} 
                  size={24} 
                  color={recording ? "#FFFFFF" : "#F44336"} 
                />
                {recording && (
                  <Text style={styles.recordingText}>REC</Text>
                )}
              </TouchableOpacity>
            </View>
            
            {/* Status bar */}
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
                        backgroundColor: batteryLevel > 50 ? '#4CAF50' : 
                                        batteryLevel > 20 ? '#FFC107' : '#F44336'
                      }
                    ]} 
                  />
                </View>
                <Text style={[
                  styles.statusValue,
                  { 
                    color: batteryLevel > 50 ? '#4CAF50' : 
                           batteryLevel > 20 ? '#FFC107' : '#F44336'
                  }
                ]}>
                  {batteryLevel}%
                </Text>
              </View>
            </View>
            
            {/* Telemetry mini */}
            {telemetry && (
              <TouchableOpacity 
                style={styles.telemetryMini}
                onPress={() => navigation.navigate('Telemetry')}
                disabled={!connected}
              >
                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>Altitude:</Text>
                  <Text style={styles.telemetryValue}>{telemetry.altitude.toFixed(1)} m</Text>
                  
                  <Text style={styles.telemetryLabel}>Speed:</Text>
                  <Text style={styles.telemetryValue}>{telemetry.speed.toFixed(1)} m/s</Text>
                </View>
                
                <View style={styles.telemetryRow}>
                  <Text style={styles.telemetryLabel}>Voltage:</Text>
                  <Text style={styles.telemetryValue}>{telemetry.batteryVoltage.toFixed(1)} V</Text>
                  
                  <MaterialIcons 
                    name="expand-more" 
                    size={20} 
                    color="#BBBBBB" 
                    style={styles.telemetryExpand}
                  />
                </View>
              </TouchableOpacity>
            )}
            
            {/* Joysticks */}
            <View style={styles.joysticksContainer}>
              <View style={styles.joystickWrapper}>
                <GestureJoystick 
                  testID="left-joystick"
                  label="Throttle / Yaw" 
                  onMove={handleLeftJoystickMove} 
                />
              </View>
              
              <View style={styles.joystickWrapper}>
                <GestureJoystick 
                  testID="right-joystick"
                  label="Pitch / Roll" 
                  onMove={handleRightJoystickMove} 
                />
              </View>
            </View>
            
            {/* Buttons */}
            <View style={styles.buttonsContainer}>
              {/* Emergency Stop Button */}
              <TouchableOpacity 
                style={styles.emergencyStopButton}
                onPress={handleEmergencyStop}
                disabled={!connected}
              >
                <MaterialIcons name="pan-tool" size={24} color="white" />
                <Text style={styles.emergencyStopText}>EMERGENCY STOP</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate('Telemetry')}
              >
                <MaterialIcons name="assessment" size={20} color="white" />
                <Text style={styles.buttonText}>Telemetry</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate('Logs')}
              >
                <MaterialIcons name="history" size={20} color="white" />
                <Text style={styles.buttonText}>Flight Logs</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate('Settings')}
              >
                <MaterialIcons name="settings" size={20} color="white" />
                <Text style={styles.buttonText}>Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.button}
                onPress={() => navigation.navigate('Connection')}
              >
                <MaterialIcons name="wifi" size={20} color="white" />
                <Text style={styles.buttonText}>Connection</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Menu Modal */}
        {renderMenuModal()}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  // Landscape layout styles
  landscapeContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  compactStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  mainControlArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  joystickContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 2,
  },
  joystickLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  centerControls: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  miniTelemetry: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    minWidth: 120,
  },
  centerButtonsGroup: {
    alignItems: 'center',
  },
  flightModeSelector: {
    flexDirection: 'column',
    marginTop: 16,
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2A2A2A',
    marginVertical: 1,
  },
  modeButtonActive: {
    backgroundColor: '#2196F3',
  },
  modeButtonText: {
    color: '#BBBBBB',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modeButtonTextActive: {
    color: 'white',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Portrait layout styles
  portraitContainer: {
    flex: 1,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  recordButton: {
    backgroundColor: '#2A2A2A',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  recordingActive: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    width: 80,
    borderRadius: 20,
  },
  recordingText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
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
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
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
  telemetryMini: {
    backgroundColor: '#1E1E1E',
    marginHorizontal: 16,
    marginTop: -8,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  telemetryLabel: {
    fontSize: 12,
    color: '#BBBBBB',
    marginRight: 4,
    width: 60,
  },
  telemetryValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 16,
  },
  telemetryExpand: {
    marginLeft: 'auto',
  },
  joysticksContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  joystickWrapper: {
    alignItems: 'center',
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  emergencyStopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F44336',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    marginBottom: 10,
  },
  emergencyStopText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
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
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  menuModal: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    padding: 16,
    width: '50%',
    maxWidth: 250,
    marginRight: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 16,
  },
});

export default EnhancedControlScreen;