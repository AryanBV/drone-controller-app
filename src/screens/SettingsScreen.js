import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import StorageService from '../services/StorageService';

const SettingsScreen = () => {
  const [ipAddress, setIpAddress] = useState('192.168.4.1');
  const [port, setPort] = useState('8888');
  const [pGain, setPGain] = useState('1.0');
  const [iGain, setIGain] = useState('0.0');
  const [dGain, setDGain] = useState('0.0');

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await StorageService.getSettings();
        if (settings) {
          setIpAddress(settings.ipAddress || '192.168.4.1');
          setPort(settings.port || '8888');
          setPGain(settings.pGain || '1.0');
          setIGain(settings.iGain || '0.0');
          setDGain(settings.dGain || '0.0');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save settings
  const saveSettings = async () => {
    try {
      await StorageService.saveSettings({
        ipAddress,
        port,
        pGain,
        iGain,
        dGain,
      });
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Connection Settings</Text>
        
        <Text style={styles.label}>ESP32 IP Address</Text>
        <TextInput
          style={styles.input}
          value={ipAddress}
          onChangeText={setIpAddress}
          placeholder="192.168.4.1"
          keyboardType="default"
        />
        
        <Text style={styles.label}>UDP Port</Text>
        <TextInput
          style={styles.input}
          value={port}
          onChangeText={setPort}
          placeholder="8888"
          keyboardType="numeric"
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PID Controller Settings</Text>
        
        <Text style={styles.label}>P Gain</Text>
        <TextInput
          style={styles.input}
          value={pGain}
          onChangeText={setPGain}
          placeholder="1.0"
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>I Gain</Text>
        <TextInput
          style={styles.input}
          value={iGain}
          onChangeText={setIGain}
          placeholder="0.0"
          keyboardType="numeric"
        />
        
        <Text style={styles.label}>D Gain</Text>
        <TextInput
          style={styles.input}
          value={dGain}
          onChangeText={setDGain}
          placeholder="0.0"
          keyboardType="numeric"
        />
      </View>
      
      <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SettingsScreen;
