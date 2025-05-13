import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import DroneService from '../services/DroneService';
import StorageService from '../services/StorageService';

const ConnectionScreen = () => {
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Disconnected');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('');

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await StorageService.getSettings();
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
    const connectionStatus = DroneService.isConnected();
    setConnected(connectionStatus);
    setStatus(connectionStatus ? 'Connected' : 'Disconnected');

    return () => {
      // Clean up if needed
    };
  }, []);

  // Connect to drone
  const connectToDrone = async () => {
    setConnecting(true);
    setStatus('Connecting...');
    
    try {
      const success = await DroneService.connect(ipAddress, port);
      setConnected(success);
      setStatus(success ? 'Connected' : 'Connection failed');
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('Connection error: ' + error.message);
      setConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect from drone
  const disconnectFromDrone = async () => {
    try {
      await DroneService.disconnect();
      setConnected(false);
      setStatus('Disconnected');
    } catch (error) {
      console.error('Disconnection error:', error);
      setStatus('Disconnection error: ' + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>Status:</Text>
        <Text style={[
          styles.statusValue, 
          { color: connected ? '#28a745' : '#dc3545' }
        ]}>
          {status}
        </Text>
        
        {connecting && (
          <ActivityIndicator size="small" color="#007AFF" style={styles.spinner} />
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>IP Address: {ipAddress}</Text>
        <Text style={styles.infoText}>Port: {port}</Text>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.button, 
          { backgroundColor: connected ? '#dc3545' : '#007AFF' }
        ]}
        onPress={connected ? disconnectFromDrone : connectToDrone}
        disabled={connecting}
      >
        <Text style={styles.buttonText}>
          {connected ? 'Disconnect' : 'Connect'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.helpText}>
        Note: Make sure your device is connected to the ESP32's WiFi network or on the same network as the ESP32.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusValue: {
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  spinner: {
    marginLeft: 10,
  },
  infoContainer: {
    backgroundColor: 'white',
    width: '100%',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 8,
  },
  button: {
    width: '80%',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
});

export default ConnectionScreen;
