// src/screens/ConnectionScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EnhancedMockDroneService from '../services/EnhancedMockDroneService'; // Updated to use EnhancedMockDroneService
import EnhancedStorageService from '../services/EnhancedStorageService'; // Updated to use EnhancedStorageService
import { isValidIP, isValidPort } from '../utils/helpers';

const ConnectionScreen = ({ navigation }) => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [ipAddress, setIpAddress] = useState('192.168.4.1');
  const [port, setPort] = useState('8888');
  
  // Get window dimensions for responsive layout
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await EnhancedStorageService.getSettings();
        if (settings) {
          setIpAddress(settings.ipAddress || '192.168.4.1');
          setPort(settings.port || '8888');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
    
    // Check connection status
    const connectionStatus = EnhancedMockDroneService.isConnected();
    setConnected(connectionStatus);
    setStatus(connectionStatus ? 'Connected' : 'Disconnected');

    // Regular connection check
    const connectionInterval = setInterval(() => {
      const currentStatus = EnhancedMockDroneService.isConnected();
      setConnected(currentStatus);
      setStatus(currentStatus ? 'Connected' : 'Disconnected');
    }, 1000);

    return () => {
      clearInterval(connectionInterval);
    };
  }, []);

  // Validate input before connecting
  const validateInput = () => {
    if (!isValidIP(ipAddress)) {
      Alert.alert('Invalid IP Address', 'Please enter a valid IP address.');
      return false;
    }
    
    if (!isValidPort(port)) {
      Alert.alert('Invalid Port', 'Port must be a number between 0 and 65535.');
      return false;
    }
    
    return true;
  };

  // Connect to drone
  const connectToDrone = async () => {
    if (!validateInput()) return;
    
    setConnecting(true);
    setStatus('Connecting...');
    
    try {
      const success = await EnhancedMockDroneService.connect(ipAddress, port);
      setConnected(success);
      
      if (success) {
        setStatus('Connected');
        // Save connection settings on successful connection
        await EnhancedStorageService.saveSettings({
          ...(await EnhancedStorageService.getSettings()),
          ipAddress,
          port
        });
      } else {
        setStatus('Connection failed');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setStatus(`Connection error: ${error.message}`);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from drone
  const disconnectFromDrone = async () => {
    try {
      await EnhancedMockDroneService.disconnect();
      setConnected(false);
      setStatus('Disconnected');
    } catch (error) {
      console.error('Disconnection error:', error);
      setStatus(`Disconnection error: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={[styles.header, isLandscape && styles.headerLandscape]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isLandscape && styles.headerTitleLandscape]}>Connection</Text>
      </View>
      
      <View style={[styles.container, isLandscape && styles.containerLandscape]}>
        {isLandscape ? (
          // Landscape layout
          <View style={styles.landscapeLayout}>
            {/* Left side - Status card */}
            <View style={styles.landscapeColumn}>
              <View style={styles.statusCard}>
                <View style={styles.statusRow}>
                  <Text style={styles.statusLabel}>Status:</Text>
                  <View style={[
                    styles.statusIndicator, 
                    { backgroundColor: connected ? '#28a745' : connecting ? '#FFC107' : '#dc3545' }
                  ]} />
                  <Text style={[
                    styles.statusValue,
                    { 
                      color: connected ? '#28a745' : 
                            connecting ? '#FFC107' : '#dc3545' 
                    }
                  ]}>
                    {status}
                  </Text>
                  
                  {connecting && (
                    <ActivityIndicator size="small" color="#FFC107" style={styles.spinner} />
                  )}
                </View>
              </View>
              
              <TouchableOpacity 
                style={[
                  styles.button, 
                  { backgroundColor: connected ? '#F44336' : '#2196F3' },
                  styles.landscapeButton
                ]}
                onPress={connected ? disconnectFromDrone : connectToDrone}
                disabled={connecting}
              >
                <MaterialIcons 
                  name={connected ? 'wifi-off' : 'wifi'} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.buttonText}>
                  {connected ? 'Disconnect' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Right side - Connection form */}
            <View style={styles.landscapeColumn}>
              <View style={styles.formCard}>
                <Text style={styles.cardTitle}>Connection Settings</Text>
                
                <Text style={styles.inputLabel}>ESP32 IP Address</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="wifi" size={20} color="#BBBBBB" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={ipAddress}
                    onChangeText={setIpAddress}
                    placeholder="192.168.4.1"
                    placeholderTextColor="#666666"
                    keyboardType="default"
                    editable={!connected}
                  />
                </View>
                
                <Text style={styles.inputLabel}>UDP Port</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="settings-ethernet" size={20} color="#BBBBBB" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={port}
                    onChangeText={setPort}
                    placeholder="8888"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                    editable={!connected}
                  />
                </View>
              </View>
            </View>
          </View>
        ) : (
          // Portrait layout (original)
          <>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Status:</Text>
                <View style={[
                  styles.statusIndicator, 
                  { backgroundColor: connected ? '#28a745' : connecting ? '#FFC107' : '#dc3545' }
                ]} />
                <Text style={[
                  styles.statusValue,
                  { 
                    color: connected ? '#28a745' : 
                          connecting ? '#FFC107' : '#dc3545' 
                  }
                ]}>
                  {status}
                </Text>
                
                {connecting && (
                  <ActivityIndicator size="small" color="#FFC107" style={styles.spinner} />
                )}
              </View>
            </View>
            
            <View style={styles.formCard}>
              <Text style={styles.cardTitle}>Connection Settings</Text>
              
              <Text style={styles.inputLabel}>ESP32 IP Address</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="wifi" size={20} color="#BBBBBB" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={ipAddress}
                  onChangeText={setIpAddress}
                  placeholder="192.168.4.1"
                  placeholderTextColor="#666666"
                  keyboardType="default"
                  editable={!connected}
                />
              </View>
              
              <Text style={styles.inputLabel}>UDP Port</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="settings-ethernet" size={20} color="#BBBBBB" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={port}
                  onChangeText={setPort}
                  placeholder="8888"
                  placeholderTextColor="#666666"
                  keyboardType="numeric"
                  editable={!connected}
                />
              </View>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.button, 
                { backgroundColor: connected ? '#F44336' : '#2196F3' }
              ]}
              onPress={connected ? disconnectFromDrone : connectToDrone}
              disabled={connecting}
            >
              <MaterialIcons 
                name={connected ? 'wifi-off' : 'wifi'} 
                size={20} 
                color="white" 
              />
              <Text style={styles.buttonText}>
                {connected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        
        <View style={[styles.infoCard, isLandscape && styles.infoCardLandscape]}>
          <MaterialIcons name="info-outline" size={20} color="#BBBBBB" />
          <Text style={styles.infoText}>
            Make sure your device is connected to the ESP32's WiFi network or on the same network as the drone.
          </Text>
        </View>
      </View>
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
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerLandscape: {
    height: 50,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerTitleLandscape: {
    fontSize: 18,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  containerLandscape: {
    padding: 10,
  },
  landscapeLayout: {
    flexDirection: 'row',
    flex: 1,
  },
  landscapeColumn: {
    flex: 1,
    paddingHorizontal: 8,
  },
  statusCard: {
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginRight: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  spinner: {
    marginLeft: 10,
  },
  formCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: '#BBBBBB',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  landscapeButton: {
    paddingVertical: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoCardLandscape: {
    padding: 10,
    marginBottom: 10,
  },
  infoText: {
    color: '#BBBBBB',
    marginLeft: 10,
    flex: 1,
  },
});

export default ConnectionScreen;