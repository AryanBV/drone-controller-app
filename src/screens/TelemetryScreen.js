// src/screens/TelemetryScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EnhancedMockDroneService from '../services/EnhancedMockDroneService';

// Gauge component for telemetry visualization
const TelemetryGauge = ({ title, value, min, max, unit, color, isLandscape }) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  return (
    <View style={[styles.gaugeContainer, isLandscape && styles.gaugeContainerLandscape]}>
      <Text style={[styles.gaugeTitle, isLandscape && styles.gaugeTitleLandscape]}>{title}</Text>
      <View style={styles.gaugeOuter}>
        <View 
          style={[
            styles.gaugeInner, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={[styles.gaugeValue, isLandscape && styles.gaugeValueLandscape]}>
        {value} {unit}
      </Text>
    </View>
  );
};

// Attitude indicator component
const AttitudeIndicator = ({ pitch, roll, isLandscape }) => {
  // Limit pitch and roll for visual representation
  const limitedPitch = Math.min(45, Math.max(-45, pitch));
  const limitedRoll = Math.min(45, Math.max(-45, roll));
  
  return (
    <View style={[styles.attitudeContainer, isLandscape && styles.attitudeContainerLandscape]}>
      <Text style={[styles.attitudeTitle, isLandscape && styles.attitudeTitleLandscape]}>Altitude</Text>
      <View style={[styles.attitudeBox, isLandscape && styles.attitudeBoxLandscape]}>
        <View 
          style={[
            styles.attitudeInner,
            {
              transform: [
                { rotate: `${limitedRoll}deg` },
                { perspective: 1000 },
                { rotateX: `${-limitedPitch}deg` }
              ]
            }
          ]}
        >
          <View style={styles.horizonLine} />
          <View style={styles.pitchLines}>
            {[-30, -15, 0, 15, 30].map((line) => (
              <View key={line} style={[
                styles.pitchLine,
                { top: `${50 + line}%` }
              ]}>
                <Text style={styles.pitchText}>{line}</Text>
              </View>
            ))}
          </View>
          <View style={styles.rollIndicator} />
        </View>
      </View>
      <View style={styles.attitudeValues}>
        <Text style={[styles.attitudeValue, isLandscape && styles.attitudeValueLandscape]}>
          Pitch: {pitch.toFixed(1)}°
        </Text>
        <Text style={[styles.attitudeValue, isLandscape && styles.attitudeValueLandscape]}>
          Roll: {roll.toFixed(1)}°
        </Text>
      </View>
    </View>
  );
};

// GPS status component
const GPSStatus = ({ satellites, fix, latitude, longitude, isLandscape }) => {
  return (
    <View style={[styles.gpsContainer, isLandscape && styles.gpsContainerLandscape]}>
      <View style={styles.gpsHeader}>
        <MaterialIcons 
          name="satellite" 
          size={isLandscape ? 18 : 20} 
          color={fix ? "#4CAF50" : "#F44336"} 
        />
        <Text style={[styles.gpsTitle, isLandscape && styles.gpsTitleLandscape]}>GPS Status</Text>
        <View 
          style={[
            styles.gpsIndicator,
            { backgroundColor: fix ? "#4CAF50" : "#F44336" }
          ]} 
        />
      </View>
      <View style={styles.gpsDetails}>
        <Text style={[styles.gpsText, isLandscape && styles.gpsTextLandscape]}>
          Satellites: {satellites}
        </Text>
        <Text style={[styles.gpsText, isLandscape && styles.gpsTextLandscape]}>
          Status: {fix ? "Fixed" : "No Fix"}
        </Text>
      </View>
      <View style={styles.gpsCoordinates}>
        <Text style={[styles.gpsText, isLandscape && styles.gpsTextLandscape]}>
          Lat: {latitude.toFixed(6)}°
        </Text>
        <Text style={[styles.gpsText, isLandscape && styles.gpsTextLandscape]}>
          Lon: {longitude.toFixed(6)}°
        </Text>
      </View>
    </View>
  );
};

const TelemetryScreen = ({ navigation }) => {
  // Initial telemetry state with non-zero values
  const initialTelemetry = {
    altitude: 0,
    speed: 0,
    batteryVoltage: 11.1,
    batteryPercentage: EnhancedMockDroneService.getBatteryLevel() || 78,
    pitch: 0,
    roll: 0,
    yaw: 0,
    temperatureESC: 32,
    temperatureMCU: 38,
    satellites: 0,
    gpsFix: false,
    latitude: 37.7749, // Default location
    longitude: -122.4194
  };
  
  // State for telemetry data
  const [telemetry, setTelemetry] = useState(initialTelemetry);
  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const telemetryInterval = useRef(null);
  const recordingRef = useRef(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  // Function to start telemetry updates
  const startTelemetryUpdates = () => {
    // Clear any existing interval
    if (telemetryInterval.current) {
      clearInterval(telemetryInterval.current);
      telemetryInterval.current = null;
    }
    
    // Only start if connected
    if (!connected) return;
    
    telemetryInterval.current = setInterval(() => {
      // Double check we're still connected
      if (!EnhancedMockDroneService.isConnected()) {
        // If disconnected, clear interval and stop updates
        clearInterval(telemetryInterval.current);
        telemetryInterval.current = null;
        setConnected(false);
        return;
      }
      
      // Get mock battery data from DroneService
      const batteryPercent = EnhancedMockDroneService.getBatteryLevel();
      
      // Generate mock telemetry data with some "realistic" drift
      setTelemetry(prev => {
        // Add some random variation to create "realistic" telemetry
        const noise = () => (Math.random() - 0.5) * 2;
        const randomWalk = (val, intensity = 1, min = -Infinity, max = Infinity) => {
          return Math.min(max, Math.max(min, val + noise() * intensity));
        };
        
        return {
          altitude: randomWalk(prev.altitude, 0.3, 0, 150),
          speed: randomWalk(prev.speed, 0.5, 0, 30),
          batteryVoltage: 11.1 - ((100 - batteryPercent) / 100) * 3.3,
          batteryPercentage: batteryPercent,
          pitch: randomWalk(prev.pitch, 1, -25, 25),
          roll: randomWalk(prev.roll, 1, -30, 30),
          yaw: (prev.yaw + (1 + noise() * 0.5)) % 360,
          temperatureESC: randomWalk(prev.temperatureESC, 0.2, 30, 80),
          temperatureMCU: randomWalk(prev.temperatureMCU, 0.1, 35, 70),
          satellites: prev.satellites < 8 ? Math.min(12, prev.satellites + (Math.random() > 0.7 ? 1 : 0)) : prev.satellites,
          gpsFix: prev.satellites >= 4,
          latitude: prev.latitude === 0 ? 37.7749 + noise() * 0.01 : randomWalk(prev.latitude, 0.00001),
          longitude: prev.longitude === 0 ? -122.4194 + noise() * 0.01 : randomWalk(prev.longitude, 0.00001)
        };
      });
      
      // Record telemetry if recording is on
      if (recordingRef.current) {
        // This would save to a log file in the real implementation
        console.log('Recording telemetry data');
      }
    }, 500);
  };
  
  // Check connection status and update UI accordingly
  const updateConnectionStatus = () => {
    const isConnected = EnhancedMockDroneService.isConnected();
    
    // Only take action if connection status has changed
    if (isConnected !== connected) {
      setConnected(isConnected);
      
      if (isConnected) {
        // Start telemetry updates when connected
        startTelemetryUpdates();
      } else {
        // Stop telemetry updates when disconnected
        if (telemetryInterval.current) {
          clearInterval(telemetryInterval.current);
          telemetryInterval.current = null;
        }
        
        // Stop recording if active
        if (recording) {
          setRecording(false);
          recordingRef.current = false;
        }
      }
    }
  };
  
  // Initialize
  useEffect(() => {
    // Initial connection check
    updateConnectionStatus();
    
    // Set up regular connection checking
    const connectionCheckInterval = setInterval(updateConnectionStatus, 1000);
    
    // Clean up on unmount
    return () => {
      if (telemetryInterval.current) {
        clearInterval(telemetryInterval.current);
        telemetryInterval.current = null;
      }
      clearInterval(connectionCheckInterval);
    };
  }, []);
  
  // Update on screen focus
  useFocusEffect(
    React.useCallback(() => {
      updateConnectionStatus();
      
      return () => {
        // No need for cleanup here as the main useEffect handles it
      };
    }, [])
  );
  
  // Toggle telemetry recording
  const toggleRecording = () => {
    // Only allow toggling if connected
    if (!connected) {
      return;
    }
    
    const newRecordingState = !recording;
    setRecording(newRecordingState);
    recordingRef.current = newRecordingState;
    
    if (newRecordingState) {
      EnhancedMockDroneService.startLogging();
    } else {
      EnhancedMockDroneService.stopLogging();
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <Text style={[styles.headerTitle, isLandscape && styles.headerTitleLandscape]}>Telemetry</Text>
        <TouchableOpacity 
          style={[
            styles.recordButton, 
            isLandscape && styles.recordButtonLandscape,
            !connected && styles.recordButtonDisabled
          ]}
          onPress={toggleRecording}
          disabled={!connected}
        >
          <MaterialIcons 
            name={recording ? "stop" : "fiber-manual-record"} 
            size={isLandscape ? 20 : 24} 
            color={!connected ? "#666666" : recording ? "#FFFFFF" : "#F44336"} 
          />
          <Text style={[
            styles.recordText, 
            isLandscape && styles.recordTextLandscape,
            !connected && styles.recordTextDisabled
          ]}>
            {recording ? "Stop Recording" : "Record Flight"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.container}>
        <View style={[
          styles.telemetryGrid, 
          isLandscape && styles.telemetryGridLandscape
        ]}>
          {/* Flight Data Section */}
          <View style={[
            styles.section,
            isLandscape && styles.sectionLandscape
          ]}>
            <Text style={[styles.sectionTitle, isLandscape && styles.sectionTitleLandscape]}>Flight Data</Text>
            
            <TelemetryGauge 
              title="Altitude" 
              value={telemetry.altitude.toFixed(1)} 
              min={0} 
              max={150} 
              unit="m" 
              color="#2196F3"
              isLandscape={isLandscape}
            />
            
            <TelemetryGauge 
              title="Speed" 
              value={telemetry.speed.toFixed(1)} 
              min={0} 
              max={30} 
              unit="m/s" 
              color="#4CAF50"
              isLandscape={isLandscape}
            />
            
            <TelemetryGauge 
              title="Battery" 
              value={telemetry.batteryPercentage} 
              min={0} 
              max={100} 
              unit="%" 
              color={
                telemetry.batteryPercentage > 50 ? "#4CAF50" : 
                telemetry.batteryPercentage > 20 ? "#FFC107" : "#F44336"
              }
              isLandscape={isLandscape}
            />
            
            <TelemetryGauge 
              title="Battery Voltage" 
              value={telemetry.batteryVoltage.toFixed(1)} 
              min={7.5} 
              max={12.6} 
              unit="V" 
              color={
                telemetry.batteryVoltage > 11.1 ? "#4CAF50" : 
                telemetry.batteryVoltage > 10.5 ? "#FFC107" : "#F44336"
              }
              isLandscape={isLandscape}
            />
          </View>
          
          {/* Attitude & Orientation Section */}
          <View style={[
            styles.section,
            isLandscape && styles.sectionLandscape
          ]}>
            <Text style={[styles.sectionTitle, isLandscape && styles.sectionTitleLandscape]}>Orientation</Text>
            
            <AttitudeIndicator 
              pitch={telemetry.pitch} 
              roll={telemetry.roll}
              isLandscape={isLandscape}
            />
            
            <View style={styles.orientationData}>
              <View style={styles.orientationItem}>
                <Text style={[styles.orientationLabel, isLandscape && styles.orientationLabelLandscape]}>Yaw:</Text>
                <Text style={[styles.orientationValue, isLandscape && styles.orientationValueLandscape]}>
                  {telemetry.yaw.toFixed(1)}°
                </Text>
              </View>
            </View>
          </View>
          
          {/* System Health Section */}
          <View style={[
            styles.section,
            isLandscape && styles.sectionLandscape
          ]}>
            <Text style={[styles.sectionTitle, isLandscape && styles.sectionTitleLandscape]}>System Health</Text>
            
            <TelemetryGauge 
              title="ESC Temperature" 
              value={telemetry.temperatureESC.toFixed(1)} 
              min={20} 
              max={90} 
              unit="°C" 
              color={
                telemetry.temperatureESC < 50 ? "#4CAF50" : 
                telemetry.temperatureESC < 70 ? "#FFC107" : "#F44336"
              }
              isLandscape={isLandscape}
            />
            
            <TelemetryGauge 
              title="MCU Temperature" 
              value={telemetry.temperatureMCU.toFixed(1)} 
              min={20} 
              max={80} 
              unit="°C" 
              color={
                telemetry.temperatureMCU < 45 ? "#4CAF50" : 
                telemetry.temperatureMCU < 65 ? "#FFC107" : "#F44336"
              }
              isLandscape={isLandscape}
            />
            
            <GPSStatus 
              satellites={telemetry.satellites}
              fix={telemetry.gpsFix}
              latitude={telemetry.latitude}
              longitude={telemetry.longitude}
              isLandscape={isLandscape}
            />
          </View>
        </View>
      </ScrollView>
      
      {/* Disconnected Banner (instead of a full overlay) */}
      {!connected && (
        <View style={styles.disconnectedBanner}>
          <View style={styles.disconnectedBannerContent}>
            <MaterialIcons name="wifi-off" size={24} color="#F44336" />
            <Text style={styles.disconnectedBannerText}>
              Drone Disconnected - Static Data
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.connectButton}
            onPress={() => navigation.navigate('Connection')}
          >
            <MaterialIcons name="wifi" size={20} color="white" />
            <Text style={styles.connectButtonText}>Connect</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
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
  headerLandscape: {
    height: 50,
    paddingHorizontal: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerTitleLandscape: {
    fontSize: 18,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  recordButtonLandscape: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  recordButtonDisabled: {
    borderColor: '#666666',
    backgroundColor: '#222222',
  },
  recordText: {
    marginLeft: 4,
    color: 'white',
    fontSize: 14,
  },
  recordTextLandscape: {
    fontSize: 12,
  },
  recordTextDisabled: {
    color: '#666666',
  },
  container: {
    flex: 1,
    padding: 10,
  },
  telemetryGrid: {
    flexDirection: 'column',
  },
  telemetryGridLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  section: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sectionLandscape: {
    width: '32%',
    padding: 12,
    marginHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  sectionTitleLandscape: {
    fontSize: 16,
    marginBottom: 12,
  },
  gaugeContainer: {
    marginBottom: 16,
  },
  gaugeContainerLandscape: {
    marginBottom: 12,
  },
  gaugeTitle: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 4,
  },
  gaugeTitleLandscape: {
    fontSize: 12,
    marginBottom: 3,
  },
  gaugeOuter: {
    height: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  gaugeInner: {
    height: '100%',
    borderRadius: 8,
  },
  gaugeValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'right',
  },
  gaugeValueLandscape: {
    fontSize: 12,
  },
  attitudeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  attitudeContainerLandscape: {
    marginBottom: 12,
  },
  attitudeTitle: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  attitudeTitleLandscape: {
    fontSize: 12,
    marginBottom: 6,
  },
  attitudeBox: {
    width: '100%',
    height: 150,
    backgroundColor: '#000',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  attitudeBoxLandscape: {
    height: 120,
  },
  attitudeInner: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
  },
  horizonLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#FFF',
    top: '50%',
  },
  pitchLines: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pitchLine: {
    position: 'absolute',
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
    left: '20%',
  },
  pitchText: {
    position: 'absolute',
    left: -25,
    top: -8,
    color: 'white',
    fontSize: 10,
  },
  rollIndicator: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#FFC107',
    borderRadius: 5,
    top: 10,
    left: '50%',
    marginLeft: -5,
  },
  attitudeValues: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  attitudeValue: {
    fontSize: 14,
    color: 'white',
  },
  attitudeValueLandscape: {
    fontSize: 12,
  },
  orientationData: {
    marginTop: 16,
  },
  orientationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orientationLabel: {
    fontSize: 14,
    color: '#BBBBBB',
  },
  orientationLabelLandscape: {
    fontSize: 12,
  },
  orientationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  orientationValueLandscape: {
    fontSize: 12,
  },
  gpsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  gpsContainerLandscape: {
    marginTop: 12,
    padding: 8,
  },
  gpsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gpsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
    flex: 1,
  },
  gpsTitleLandscape: {
    fontSize: 12,
    marginLeft: 6,
  },
  gpsIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  gpsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  gpsCoordinates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gpsText: {
    fontSize: 12,
    color: '#BBBBBB',
  },
  gpsTextLandscape: {
    fontSize: 10,
  },
  // Disconnected banner styles (replacing the overlay)
  disconnectedBanner: {
    position: 'absolute',
    top: 70,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(33, 33, 33, 0.9)',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    zIndex: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  disconnectedBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  disconnectedBannerText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
});

export default TelemetryScreen;