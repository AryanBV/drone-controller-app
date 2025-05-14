// src/screens/PIDTuningScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import EnhancedStorageService from '../services/EnhancedStorageService';
import EnhancedMockDroneService from '../services/EnhancedMockDroneService';

// Custom SimpleSlider component to replace the react-native Slider
const SimpleSlider = ({ value, minimumValue, maximumValue, step, onValueChange, minimumTrackTintColor, maximumTrackTintColor, thumbTintColor, style }) => {
  const [sliderValue, setSliderValue] = useState(value);
  
  // Update internal value when prop changes
  useEffect(() => {
    setSliderValue(value);
  }, [value]);
  
  const handleValueChange = (newValue) => {
    const clampedValue = Math.min(maximumValue, Math.max(minimumValue, newValue));
    const steppedValue = Math.round(clampedValue / step) * step;
    setSliderValue(steppedValue);
    if (onValueChange) {
      onValueChange(steppedValue);
    }
  };
  
  const handleLayout = (event) => {
    sliderWidth.current = event.nativeEvent.layout.width;
  };
  
  const sliderWidth = useRef(0);
  
  const calculateValueFromPosition = (x) => {
    if (sliderWidth.current === 0) return value;
    const percentage = Math.max(0, Math.min(1, x / sliderWidth.current));
    return minimumValue + (maximumValue - minimumValue) * percentage;
  };
  
  const handlePress = (event) => {
    const newValue = calculateValueFromPosition(event.nativeEvent.locationX);
    handleValueChange(newValue);
  };
  
  const thumbPosition = ((sliderValue - minimumValue) / (maximumValue - minimumValue)) * 100;
  
  return (
    <View style={[customStyles.sliderContainer, style]}>
      <TouchableOpacity 
        style={[
          customStyles.sliderTrack, 
          { backgroundColor: maximumTrackTintColor || '#444444' }
        ]}
        activeOpacity={0.8}
        onPress={handlePress}
        onLayout={handleLayout}
      >
        <View 
          style={[
            customStyles.sliderFill, 
            { 
              width: `${thumbPosition}%`,
              backgroundColor: minimumTrackTintColor || '#2196F3'
            }
          ]} 
        />
        <View 
          style={[
            customStyles.sliderThumb,
            { 
              left: `${thumbPosition}%`,
              backgroundColor: thumbTintColor || '#2196F3'
            }
          ]} 
        />
      </TouchableOpacity>
    </View>
  );
};

const PIDTuningScreen = ({ navigation }) => {
  // PID parameters state
  const [pGain, setPGain] = useState(1.0);
  const [iGain, setIGain] = useState(0.0);
  const [dGain, setDGain] = useState(0.0);
  const [connected, setConnected] = useState(false);
  const [changed, setChanged] = useState(false);
  const [realtimeMode, setRealtimeMode] = useState(false);
  const [responseGraph, setResponseGraph] = useState([]);
  
  // Refs for tracking previous values and intervals
  const prevValuesRef = useRef({ p: 1.0, i: 0.0, d: 0.0 });
  const realtimeIntervalRef = useRef(null);
  
  // Load PID parameters on component mount and focus
  useFocusEffect(
    React.useCallback(() => {
      loadPIDParameters();
      updateConnectionStatus();
      
      // Check connection status periodically
      const connectionInterval = setInterval(updateConnectionStatus, 1000);
      
      return () => {
        clearInterval(connectionInterval);
        stopRealtimeUpdates();
      };
    }, [])
  );
  
  // Update connection status
  const updateConnectionStatus = () => {
    setConnected(EnhancedMockDroneService.isConnected());
  };
  
  // Load PID parameters from settings
  const loadPIDParameters = async () => {
    try {
      const settings = await EnhancedStorageService.getSettings();
      
      // Get values from settings or drone service
      if (EnhancedMockDroneService.isConnected()) {
        const dronePID = EnhancedMockDroneService.getPIDParameters();
        if (dronePID) {
          setPGain(dronePID.p);
          setIGain(dronePID.i);
          setDGain(dronePID.d);
          prevValuesRef.current = { p: dronePID.p, i: dronePID.i, d: dronePID.d };
          return;
        }
      }
      
      // Fall back to settings if drone service not available
      if (settings) {
        setPGain(parseFloat(settings.pGain) || 1.0);
        setIGain(parseFloat(settings.iGain) || 0.0);
        setDGain(parseFloat(settings.dGain) || 0.0);
        prevValuesRef.current = { 
          p: parseFloat(settings.pGain) || 1.0,
          i: parseFloat(settings.iGain) || 0.0,
          d: parseFloat(settings.dGain) || 0.0
        };
      }
      
      setChanged(false);
    } catch (error) {
      console.error('Failed to load PID parameters:', error);
      Alert.alert('Error', 'Failed to load PID parameters.');
    }
  };
  
  // Save PID parameters to settings and drone
  const savePIDParameters = async () => {
    try {
      // Update settings
      const settings = await EnhancedStorageService.getSettings();
      await EnhancedStorageService.saveSettings({
        ...settings,
        pGain: pGain.toString(),
        iGain: iGain.toString(),
        dGain: dGain.toString()
      });
      
      // If connected, send to drone
      if (EnhancedMockDroneService.isConnected()) {
        await EnhancedMockDroneService.sendPIDParameters(pGain, iGain, dGain);
      }
      
      prevValuesRef.current = { p: pGain, i: iGain, d: dGain };
      setChanged(false);
      
      Alert.alert('Success', 'PID parameters saved successfully!');
    } catch (error) {
      console.error('Failed to save PID parameters:', error);
      Alert.alert('Error', 'Failed to save PID parameters.');
    }
  };
  
  // Reset PID parameters to previous values
  const resetPIDParameters = () => {
    setPGain(prevValuesRef.current.p);
    setIGain(prevValuesRef.current.i);
    setDGain(prevValuesRef.current.d);
    setChanged(false);
  };
  
  // Handle value changes and set changed flag
  const handleChange = (setter, value) => {
    setter(value);
    setChanged(true);
    
    // If in realtime mode, send values to drone immediately
    if (realtimeMode && connected) {
      EnhancedMockDroneService.sendPIDParameters(
        setter === setPGain ? value : pGain,
        setter === setIGain ? value : iGain,
        setter === setDGain ? value : dGain
      );
    }
  };
  
  // Toggle realtime update mode
  const toggleRealtimeMode = () => {
    if (!connected) {
      Alert.alert('Not Connected', 'Please connect to the drone first to use realtime mode.');
      return;
    }
    
    if (!realtimeMode) {
      // Start realtime mode
      startRealtimeUpdates();
    } else {
      // Stop realtime mode
      stopRealtimeUpdates();
    }
    
    setRealtimeMode(!realtimeMode);
  };
  
  // Start realtime updates
  const startRealtimeUpdates = () => {
    // Send initial values
    EnhancedMockDroneService.sendPIDParameters(pGain, iGain, dGain);
    
    // Reset response graph
    setResponseGraph([]);
    
    // Start interval to fetch response data
    realtimeIntervalRef.current = setInterval(() => {
      // In a real implementation, we would get response data from the drone
      // For mock implementation, generate simulated response data
      const telemetry = EnhancedMockDroneService.getTelemetry();
      if (telemetry) {
        // Simulate PID controller response
        // In a real implementation, this would come from the drone
        const setpoint = 0; // Target is level (0 degrees)
        const current = telemetry.pitch; // Current value
        const error = setpoint - current;
        
        // Add point to response graph
        setResponseGraph(prev => {
          const newGraph = [...prev, {
            time: Date.now(),
            setpoint,
            current,
            error
          }];
          
          // Keep only the last 50 points to prevent performance issues
          if (newGraph.length > 50) {
            return newGraph.slice(newGraph.length - 50);
          }
          return newGraph;
        });
      }
    }, 200);
  };
  
  // Stop realtime updates
  const stopRealtimeUpdates = () => {
    if (realtimeIntervalRef.current) {
      clearInterval(realtimeIntervalRef.current);
      realtimeIntervalRef.current = null;
    }
  };
  
  // Generate visual representation of response
  const renderResponseGraph = () => {
    if (responseGraph.length === 0) {
      return (
        <View style={styles.graphPlaceholder}>
          <Text style={styles.graphPlaceholderText}>
            Response data will appear here in realtime mode
          </Text>
        </View>
      );
    }
    
    const height = 150;
    const width = 300;
    const graphPadding = 10;
    const graphHeight = height - (graphPadding * 2);
    const graphWidth = width - (graphPadding * 2);
    
    // Find min/max for scaling
    let minValue = -10;
    let maxValue = 10;
    
    responseGraph.forEach(point => {
      minValue = Math.min(minValue, point.current, point.setpoint);
      maxValue = Math.max(maxValue, point.current, point.setpoint);
    });
    
    // Add some padding
    const valueRange = maxValue - minValue;
    minValue -= valueRange * 0.1;
    maxValue += valueRange * 0.1;
    
    // Scale and map values to graph coordinates
    const scaleY = (value) => {
      return graphHeight - ((value - minValue) / (maxValue - minValue) * graphHeight) + graphPadding;
    };
    
    // Calculate X positions based on the number of points
    const getX = (index) => {
      return (index / (responseGraph.length - 1)) * graphWidth + graphPadding;
    };
    
    // Generate paths for setpoint and current value
    const setpointPath = responseGraph.map((point, i) => 
      `${i === 0 ? 'M' : 'L'} ${getX(i)} ${scaleY(point.setpoint)}`
    ).join(' ');
    
    const currentPath = responseGraph.map((point, i) => 
      `${i === 0 ? 'M' : 'L'} ${getX(i)} ${scaleY(point.current)}`
    ).join(' ');
    
    return (
      <View style={styles.graphContainer}>
        <Text style={styles.graphTitle}>PID Response</Text>
        
        <View style={[styles.graph, { width, height }]}>
          {/* Horizontal center line */}
          <View style={[styles.graphCenterLine, { top: scaleY(0) }]} />
          
          {/* Y-axis labels */}
          <Text style={[styles.graphLabel, { top: graphPadding - 10 }]}>
            {maxValue.toFixed(1)}
          </Text>
          <Text style={[styles.graphLabel, { top: scaleY(0) - 10 }]}>
            0
          </Text>
          <Text style={[styles.graphLabel, { top: height - 20 }]}>
            {minValue.toFixed(1)}
          </Text>
          
          {/* SVG Paths */}
          <svg width={width} height={height}>
            {/* Setpoint line */}
            <path
              d={setpointPath}
              stroke="#4CAF50"
              strokeWidth="2"
              fill="none"
            />
            
            {/* Current value line */}
            <path
              d={currentPath}
              stroke="#2196F3"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </View>
        
        <View style={styles.graphLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>Setpoint</Text>
          </View>
          
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.legendText}>Current</Text>
          </View>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PID Tuning</Text>
        
        <TouchableOpacity
          style={[
            styles.realtimeButton,
            realtimeMode && styles.realtimeButtonActive
          ]}
          onPress={toggleRealtimeMode}
          disabled={!connected}
        >
          <MaterialIcons 
            name={realtimeMode ? "timer-off" : "timer"} 
            size={20} 
            color={realtimeMode ? "white" : "#2196F3"} 
          />
          <Text style={[
            styles.realtimeButtonText,
            realtimeMode && styles.realtimeButtonTextActive
          ]}>
            {realtimeMode ? "Stop Realtime" : "Realtime Mode"}
          </Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>PID Controller Parameters</Text>
            <View style={[
              styles.connectionIndicator,
              { backgroundColor: connected ? '#4CAF50' : '#F44336' }
            ]} />
          </View>
          
          <Text style={styles.description}>
            Adjust these parameters to tune your drone's flight characteristics.
            Higher P values make the response more aggressive, I helps eliminate steady-state error,
            and D helps dampen oscillations.
          </Text>
          
          {!connected && (
            <View style={styles.warningCard}>
              <MaterialIcons name="info" size={24} color="#FFC107" />
              <Text style={styles.warningText}>
                The drone is not connected. Changes will be saved locally but not sent to the drone.
              </Text>
            </View>
          )}
          
          {/* P Gain */}
          <View style={styles.paramContainer}>
            <View style={styles.paramHeader}>
              <Text style={styles.paramTitle}>P Gain</Text>
              <Text style={styles.paramValue}>{pGain.toFixed(2)}</Text>
            </View>
            
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={5}
              step={0.05}
              value={pGain}
              onValueChange={(value) => handleChange(setPGain, value)}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#444444"
              thumbTintColor="#2196F3"
            />
            
            <Text style={styles.paramDescription}>
              Proportional gain. Controls how aggressively the system responds to errors.
            </Text>
          </View>
          
          {/* I Gain */}
          <View style={styles.paramContainer}>
            <View style={styles.paramHeader}>
              <Text style={styles.paramTitle}>I Gain</Text>
              <Text style={styles.paramValue}>{iGain.toFixed(2)}</Text>
            </View>
            
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={1}
              step={0.01}
              value={iGain}
              onValueChange={(value) => handleChange(setIGain, value)}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#444444"
              thumbTintColor="#2196F3"
            />
            
            <Text style={styles.paramDescription}>
              Integral gain. Helps eliminate steady-state error. Too high can cause oscillations.
            </Text>
          </View>
          
          {/* D Gain */}
          <View style={styles.paramContainer}>
            <View style={styles.paramHeader}>
              <Text style={styles.paramTitle}>D Gain</Text>
              <Text style={styles.paramValue}>{dGain.toFixed(2)}</Text>
            </View>
            
            <SimpleSlider
              style={styles.slider}
              minimumValue={0}
              maximumValue={2}
              step={0.05}
              value={dGain}
              onValueChange={(value) => handleChange(setDGain, value)}
              minimumTrackTintColor="#2196F3"
              maximumTrackTintColor="#444444"
              thumbTintColor="#2196F3"
            />
            
            <Text style={styles.paramDescription}>
              Derivative gain. Helps dampen oscillations. Too high can amplify noise.
            </Text>
          </View>
        </View>
        
        {/* Real-time Response Graph */}
        <View style={styles.responseCard}>
          {renderResponseGraph()}
        </View>
        
        {/* Preset Buttons */}
        <View style={styles.presetCard}>
          <Text style={styles.presetTitle}>Quick Presets</Text>
          
          <View style={styles.presetGrid}>
            <TouchableOpacity 
              style={styles.presetButton}
              onPress={() => {
                handleChange(setPGain, 1.0);
                handleChange(setIGain, 0.0);
                handleChange(setDGain, 0.0);
              }}
            >
              <Text style={styles.presetButtonText}>Default</Text>
              <Text style={styles.presetButtonValues}>P: 1.0, I: 0.0, D: 0.0</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.presetButton}
              onPress={() => {
                handleChange(setPGain, 1.2);
                handleChange(setIGain, 0.1);
                handleChange(setDGain, 0.2);
              }}
            >
              <Text style={styles.presetButtonText}>Stable</Text>
              <Text style={styles.presetButtonValues}>P: 1.2, I: 0.1, D: 0.2</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.presetButton}
              onPress={() => {
                handleChange(setPGain, 2.0);
                handleChange(setIGain, 0.05);
                handleChange(setDGain, 0.5);
              }}
            >
              <Text style={styles.presetButtonText}>Responsive</Text>
              <Text style={styles.presetButtonValues}>P: 2.0, I: 0.05, D: 0.5</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.presetButton}
              onPress={() => {
                handleChange(setPGain, 0.6);
                handleChange(setIGain, 0.02);
                handleChange(setDGain, 0.4);
              }}
            >
              <Text style={styles.presetButtonText}>Smooth</Text>
              <Text style={styles.presetButtonValues}>P: 0.6, I: 0.02, D: 0.4</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton, !changed && styles.disabledButton]}
            onPress={savePIDParameters}
            disabled={!changed}
          >
            <MaterialIcons name="save" size={20} color="white" />
            <Text style={styles.buttonText}>Save Parameters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.resetButton, !changed && styles.disabledButton]}
            onPress={resetPIDParameters}
            disabled={!changed}
          >
            <MaterialIcons name="refresh" size={20} color="white" />
            <Text style={styles.buttonText}>Reset Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Custom slider styles
const customStyles = StyleSheet.create({
  sliderContainer: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: -8,
    marginLeft: -10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  realtimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  realtimeButtonActive: {
    backgroundColor: '#2196F3',
  },
  realtimeButtonText: {
    marginLeft: 4,
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  realtimeButtonTextActive: {
    color: 'white',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  connectionIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  description: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 16,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  warningText: {
    color: '#FFC107',
    marginLeft: 8,
    flex: 1,
    fontSize: 14,
  },
  paramContainer: {
    marginBottom: 20,
  },
  paramHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paramTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  paramValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  paramDescription: {
    fontSize: 12,
    color: '#BBBBBB',
  },
  responseCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center',
  },
  graphContainer: {
    alignItems: 'center',
  },
  graphTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  graph: {
    position: 'relative',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    overflow: 'hidden',
  },
  graphCenterLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  graphLabel: {
    position: 'absolute',
    left: 5,
    fontSize: 10,
    color: '#BBBBBB',
  },
  graphLegend: {
    flexDirection: 'row',
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 12,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#BBBBBB',
  },
  graphPlaceholder: {
    width: 300,
    height: 150,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  graphPlaceholderText: {
    color: '#777777',
    fontSize: 14,
    textAlign: 'center',
  },
  presetCard: {
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
  presetTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  presetButton: {
    backgroundColor: '#2A2A2A',
    width: '48%',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  presetButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 4,
  },
  presetButtonValues: {
    color: '#BBBBBB',
    fontSize: 12,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveButton: {
    backgroundColor: '#2196F3',
  },
  resetButton: {
    backgroundColor: '#757575',
  },
  disabledButton: {
    backgroundColor: '#444444',
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default PIDTuningScreen;