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
import DroneService from '../services/MockDroneService'; // Use mock service for testing

// Gauge component for telemetry visualization
const TelemetryGauge = ({ title, value, min, max, unit, color }) => {
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
  
  return (
    <View style={styles.gaugeContainer}>
      <Text style={styles.gaugeTitle}>{title}</Text>
      <View style={styles.gaugeOuter}>
        <View 
          style={[
            styles.gaugeInner, 
            { width: `${percentage}%`, backgroundColor: color }
          ]} 
        />
      </View>
      <Text style={styles.gaugeValue}>
        {value} {unit}
      </Text>
    </View>
  );
};

// Attitude indicator component
const AttitudeIndicator = ({ pitch, roll }) => {
  // Limit pitch and roll for visual representation
  const limitedPitch = Math.min(45, Math.max(-45, pitch));
  const limitedRoll = Math.min(45, Math.max(-45, roll));
  
  return (
    <View style={styles.attitudeContainer}>
      <Text style={styles.attitudeTitle}>Attitude</Text>
      <View style={styles.attitudeBox}>
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
        <Text style={styles.attitudeValue}>Pitch: {pitch.toFixed(1)}°</Text>
        <Text style={styles.attitudeValue}>Roll: {roll.toFixed(1)}°</Text>
      </View>
    </View>
  );
};

// GPS status component
const GPSStatus = ({ satellites, fix, latitude, longitude }) => {
  return (
    <View style={styles.gpsContainer}>
      <View style={styles.gpsHeader}>
        <MaterialIcons 
          name="satellite" 
          size={20} 
          color={fix ? "#4CAF50" : "#F44336"} 
        />
        <Text style={styles.gpsTitle}>GPS Status</Text>
        <View 
          style={[
            styles.gpsIndicator,
            { backgroundColor: fix ? "#4CAF50" : "#F44336" }
          ]} 
        />
      </View>
      <View style={styles.gpsDetails}>
        <Text style={styles.gpsText}>Satellites: {satellites}</Text>
        <Text style={styles.gpsText}>Status: {fix ? "Fixed" : "No Fix"}</Text>
      </View>
      <View style={styles.gpsCoordinates}>
        <Text style={styles.gpsText}>Lat: {latitude.toFixed(6)}°</Text>
        <Text style={styles.gpsText}>Lon: {longitude.toFixed(6)}°</Text>
      </View>
    </View>
  );
};

const TelemetryScreen = ({ navigation }) => {
  // State for telemetry data
  const [telemetry, setTelemetry] = useState({
    altitude: 0,
    speed: 0,
    batteryVoltage: 11.1,
    batteryPercentage: 78,
    pitch: 0,
    roll: 0,
    yaw: 0,
    temperatureESC: 32,
    temperatureMCU: 38,
    satellites: 0,
    gpsFix: false,
    latitude: 0,
    longitude: 0
  });
  
  const [connected, setConnected] = useState(false);
  const [recording, setRecording] = useState(false);
  const telemetryInterval = useRef(null);
  const recordingRef = useRef(false);
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  // Initialize mock telemetry data generation
  useEffect(() => {
    // Check connection
    setConnected(DroneService.isConnected());
    
    // Clean up on unmount
    return () => {
      if (telemetryInterval.current) {
        clearInterval(telemetryInterval.current);
      }
    };
  }, []);
  
  // Update telemetry when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      setConnected(DroneService.isConnected());
      
      // Start mock telemetry data updates
      telemetryInterval.current = setInterval(() => {
        // Only update if connected
        if (DroneService.isConnected()) {
          // Get mock battery data from DroneService
          const batteryPercent = DroneService.getBatteryLevel();
          
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
              batteryVoltage: 11.1 - ((100 - batteryPercent) / 100) * 3.3, // Simulate voltage drop
              batteryPercentage: batteryPercent,
              pitch: randomWalk(prev.pitch, 1, -25, 25),
              roll: randomWalk(prev.roll, 1, -30, 30),
              yaw: (prev.yaw + (1 + noise() * 0.5)) % 360, // Slowly rotate yaw
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
            console.log('Recording telemetry:', telemetry);
          }
        }
      }, 500); // Update every 0.5 seconds
      
      return () => {
        if (telemetryInterval.current) {
          clearInterval(telemetryInterval.current);
        }
      };
    }, [])
  );
  
  // Toggle telemetry recording
  const toggleRecording = () => {
    setRecording(!recording);
    recordingRef.current = !recordingRef.current;
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Telemetry</Text>
        <TouchableOpacity 
          style={styles.recordButton}
          onPress={toggleRecording}
        >
          <MaterialIcons 
            name={recording ? "stop" : "fiber-manual-record"} 
            size={24} 
            color={recording ? "#FFFFFF" : "#F44336"} 
          />
          <Text style={styles.recordText}>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Flight Data</Text>
            
            <TelemetryGauge 
              title="Altitude" 
              value={telemetry.altitude.toFixed(1)} 
              min={0} 
              max={150} 
              unit="m" 
              color="#2196F3" 
            />
            
            <TelemetryGauge 
              title="Speed" 
              value={telemetry.speed.toFixed(1)} 
              min={0} 
              max={30} 
              unit="m/s" 
              color="#4CAF50" 
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
            />
          </View>
          
          {/* Attitude & Orientation Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orientation</Text>
            
            <AttitudeIndicator 
              pitch={telemetry.pitch} 
              roll={telemetry.roll} 
            />
            
            <View style={styles.orientationData}>
              <View style={styles.orientationItem}>
                <Text style={styles.orientationLabel}>Yaw:</Text>
                <Text style={styles.orientationValue}>{telemetry.yaw.toFixed(1)}°</Text>
              </View>
            </View>
          </View>
          
          {/* System Health Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>System Health</Text>
            
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
            />
            
            <GPSStatus 
              satellites={telemetry.satellites}
              fix={telemetry.gpsFix}
              latitude={telemetry.latitude}
              longitude={telemetry.longitude}
            />
          </View>
        </View>
      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
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
  recordText: {
    marginLeft: 4,
    color: 'white',
    fontSize: 14,
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
    flexWrap: 'wrap',
    justifyContent: 'space-around',
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  gaugeContainer: {
    marginBottom: 16,
  },
  gaugeTitle: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 4,
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
  attitudeContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  attitudeTitle: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 8,
    alignSelf: 'flex-start',
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
  orientationValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  gpsContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
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
});

export default TelemetryScreen;