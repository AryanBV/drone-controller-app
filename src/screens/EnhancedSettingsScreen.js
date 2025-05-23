// src/screens/EnhancedSettingsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import EnhancedStorageService from '../services/EnhancedStorageService';
import EnhancedMockDroneService from '../services/EnhancedMockDroneService';

const EnhancedSettingsScreen = ({ navigation }) => {
  const [ipAddress, setIpAddress] = useState('192.168.4.1');
  const [port, setPort] = useState('8888');
  const [pGain, setPGain] = useState('1.0');
  const [iGain, setIGain] = useState('0.0');
  const [dGain, setDGain] = useState('0.0');
  const [autoConnect, setAutoConnect] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [lowBatteryAlertThreshold, setLowBatteryAlertThreshold] = useState('20');
  const [criticalBatteryAlertThreshold, setCriticalBatteryAlertThreshold] = useState('10');
  const [maxAltitude, setMaxAltitude] = useState('100');
  const [returnToHomeEnabled, setReturnToHomeEnabled] = useState(true);
  const [changed, setChanged] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [interfaceSettings, setInterfaceSettings] = useState(false);
  const [safetySettings, setSafetySettings] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await EnhancedStorageService.getSettings();
      if (settings) {
        setIpAddress(settings.ipAddress || '192.168.4.1');
        setPort(settings.port || '8888');
        setPGain(settings.pGain || '1.0');
        setIGain(settings.iGain || '0.0');
        setDGain(settings.dGain || '0.0');
        setAutoConnect(settings.autoConnect || false);
        setHapticFeedback(settings.hapticFeedback !== false);
        setLowBatteryAlertThreshold(settings.lowBatteryAlertThreshold?.toString() || '20');
        setCriticalBatteryAlertThreshold(settings.criticalBatteryAlertThreshold?.toString() || '10');
        setMaxAltitude(settings.maxAltitude?.toString() || '100');
        setReturnToHomeEnabled(settings.returnToHomeEnabled !== false);
      }
      setChanged(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load settings.');
    }
  };

  // Save settings
  const saveSettings = async () => {
    try {
      // Validate inputs
      const lowBatteryThreshold = parseInt(lowBatteryAlertThreshold, 10);
      const criticalBatteryThreshold = parseInt(criticalBatteryAlertThreshold, 10);
      const maxAltitudeValue = parseInt(maxAltitude, 10);
      
      if (isNaN(lowBatteryThreshold) || lowBatteryThreshold < 0 || lowBatteryThreshold > 100) {
        Alert.alert('Invalid Value', 'Low battery threshold must be a number between 0 and 100.');
        return;
      }
      
      if (isNaN(criticalBatteryThreshold) || criticalBatteryThreshold < 0 || criticalBatteryThreshold > 100) {
        Alert.alert('Invalid Value', 'Critical battery threshold must be a number between 0 and 100.');
        return;
      }
      
      if (criticalBatteryThreshold >= lowBatteryThreshold) {
        Alert.alert('Invalid Value', 'Critical battery threshold must be lower than the low battery threshold.');
        return;
      }
      
      if (isNaN(maxAltitudeValue) || maxAltitudeValue <= 0) {
        Alert.alert('Invalid Value', 'Maximum altitude must be a positive number.');
        return;
      }
      
      await EnhancedStorageService.saveSettings({
        ipAddress,
        port,
        pGain,
        iGain,
        dGain,
        autoConnect,
        hapticFeedback,
        lowBatteryAlertThreshold: lowBatteryThreshold,
        criticalBatteryAlertThreshold: criticalBatteryThreshold,
        maxAltitude: maxAltitudeValue,
        returnToHomeEnabled
      });
      
      // If connected, update PID parameters on the drone
      if (EnhancedMockDroneService.isConnected()) {
        await EnhancedMockDroneService.sendPIDParameters(
          parseFloat(pGain),
          parseFloat(iGain),
          parseFloat(dGain)
        );
      }
      
      Alert.alert('Success', 'Settings saved successfully!');
      setChanged(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
    }
  };

  // Reset settings to defaults
  const resetToDefaults = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setIpAddress('192.168.4.1');
            setPort('8888');
            setPGain('1.0');
            setIGain('0.0');
            setDGain('0.0');
            setAutoConnect(false);
            setHapticFeedback(true);
            setLowBatteryAlertThreshold('20');
            setCriticalBatteryAlertThreshold('10');
            setMaxAltitude('100');
            setReturnToHomeEnabled(true);
            setChanged(true);
          }
        }
      ]
    );
  };

  // Handle value changes and set changed flag
  const handleChange = (setter, value) => {
    setter(value);
    setChanged(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <ScrollView style={styles.container}>
        {/* Connection Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connection Settings</Text>
          
          <Text style={styles.inputLabel}>ESP32 IP Address</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="wifi" size={20} color="#BBBBBB" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={ipAddress}
              onChangeText={(value) => handleChange(setIpAddress, value)}
              placeholder="192.168.4.1"
              placeholderTextColor="#666666"
              keyboardType="default"
            />
          </View>
          
          <Text style={styles.inputLabel}>UDP Port</Text>
          <View style={styles.inputContainer}>
            <MaterialIcons name="settings-ethernet" size={20} color="#BBBBBB" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={port}
              onChangeText={(value) => handleChange(setPort, value)}
              placeholder="8888"
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.switchRow}>
            <MaterialIcons name="repeat" size={20} color="#BBBBBB" />
            <Text style={styles.switchLabel}>Auto-connect on startup</Text>
            <Switch
              value={autoConnect}
              onValueChange={(value) => handleChange(setAutoConnect, value)}
              trackColor={{ false: '#333', true: '#2196F3' }}
              thumbColor={autoConnect ? '#FFFFFF' : '#BBBBBB'}
            />
          </View>
        </View>
        
        {/* Interface Settings Section */}
        <TouchableOpacity 
          style={styles.collapseButton}
          onPress={() => setInterfaceSettings(!interfaceSettings)}
        >
          <Text style={styles.collapseButtonText}>
            {interfaceSettings ? 'Hide Interface Settings' : 'Show Interface Settings'}
          </Text>
          <MaterialIcons 
            name={interfaceSettings ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#2196F3" 
          />
        </TouchableOpacity>
        
        {interfaceSettings && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Interface Settings</Text>
            
            <View style={styles.switchRow}>
              <MaterialIcons name="vibration" size={20} color="#BBBBBB" />
              <Text style={styles.switchLabel}>Haptic Feedback</Text>
              <Switch
                value={hapticFeedback}
                onValueChange={(value) => handleChange(setHapticFeedback, value)}
                trackColor={{ false: '#333', true: '#2196F3' }}
                thumbColor={hapticFeedback ? '#FFFFFF' : '#BBBBBB'}
              />
            </View>
            <Text style={styles.settingDescription}>
              Enable vibration when using joystick controls
            </Text>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('PIDTuning')}
            >
              <MaterialIcons name="tune" size={20} color="#2196F3" />
              <Text style={styles.actionButtonText}>Open PID Tuning Interface</Text>
              <MaterialIcons name="chevron-right" size={20} color="#2196F3" />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Safety Settings Section */}
        <TouchableOpacity 
          style={styles.collapseButton}
          onPress={() => setSafetySettings(!safetySettings)}
        >
          <Text style={styles.collapseButtonText}>
            {safetySettings ? 'Hide Safety Settings' : 'Show Safety Settings'}
          </Text>
          <MaterialIcons 
            name={safetySettings ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#2196F3" 
          />
        </TouchableOpacity>
        
        {safetySettings && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Safety Settings</Text>
            
            <Text style={styles.inputLabel}>Low Battery Alert Threshold (%)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="battery-alert" size={20} color="#BBBBBB" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={lowBatteryAlertThreshold}
                onChangeText={(value) => handleChange(setLowBatteryAlertThreshold, value)}
                placeholder="20"
                placeholderTextColor="#666666"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.settingDescription}>
              Battery percentage at which low battery alerts will be shown
            </Text>
            
            <Text style={styles.inputLabel}>Critical Battery Alert Threshold (%)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="battery-alert" size={20} color="#F44336" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={criticalBatteryAlertThreshold}
                onChangeText={(value) => handleChange(setCriticalBatteryAlertThreshold, value)}
                placeholder="10"
                placeholderTextColor="#666666"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.settingDescription}>
              Battery percentage at which critical battery alerts will be shown
            </Text>
            
            <Text style={styles.inputLabel}>Maximum Altitude (meters)</Text>
            <View style={styles.inputContainer}>
              <MaterialIcons name="height" size={20} color="#BBBBBB" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={maxAltitude}
                onChangeText={(value) => handleChange(setMaxAltitude, value)}
                placeholder="100"
                placeholderTextColor="#666666"
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.settingDescription}>
              Maximum allowed altitude above ground level
            </Text>
            
            <View style={styles.switchRow}>
              <MaterialIcons name="home" size={20} color="#BBBBBB" />
              <Text style={styles.switchLabel}>Return to Home on Low Battery</Text>
              <Switch
                value={returnToHomeEnabled}
                onValueChange={(value) => handleChange(setReturnToHomeEnabled, value)}
                trackColor={{ false: '#333', true: '#2196F3' }}
                thumbColor={returnToHomeEnabled ? '#FFFFFF' : '#BBBBBB'}
              />
            </View>
            <Text style={styles.settingDescription}>
              Automatically return to takeoff position when battery is low
            </Text>
            
            <View style={styles.warningContainer}>
              <MaterialIcons name="warning" size={20} color="#FFC107" />
              <Text style={styles.warningText}>
                Always maintain visual contact with your drone and be ready to take manual control.
              </Text>
            </View>
          </View>
        )}
        
        {/* Advanced Settings Section */}
        <TouchableOpacity 
          style={styles.collapseButton}
          onPress={() => setAdvanced(!advanced)}
        >
          <Text style={styles.collapseButtonText}>
            {advanced ? 'Hide Advanced Settings' : 'Show Advanced Settings'}
          </Text>
          <MaterialIcons 
            name={advanced ? 'expand-less' : 'expand-more'} 
            size={24} 
            color="#2196F3" 
          />
        </TouchableOpacity>
        
        {advanced && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>PID Controller Settings</Text>
            
            <View style={styles.pidContainer}>
              <View style={styles.pidValueContainer}>
                <Text style={styles.inputLabel}>P Gain</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="tune" size={20} color="#BBBBBB" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={pGain}
                    onChangeText={(value) => handleChange(setPGain, value)}
                    placeholder="1.0"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.pidDescription}>Proportional control</Text>
              </View>
              
              <View style={styles.pidValueContainer}>
                <Text style={styles.inputLabel}>I Gain</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="tune" size={20} color="#BBBBBB" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={iGain}
                    onChangeText={(value) => handleChange(setIGain, value)}
                    placeholder="0.0"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.pidDescription}>Integral control</Text>
              </View>
              
              <View style={styles.pidValueContainer}>
                <Text style={styles.inputLabel}>D Gain</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="tune" size={20} color="#BBBBBB" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={dGain}
                    onChangeText={(value) => handleChange(setDGain, value)}
                    placeholder="0.0"
                    placeholderTextColor="#666666"
                    keyboardType="numeric"
                  />
                </View>
                <Text style={styles.pidDescription}>Derivative control</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('PIDTuning')}
            >
              <MaterialIcons name="tune" size={20} color="#2196F3" />
              <Text style={styles.actionButtonText}>Open PID Tuning Interface</Text>
              <MaterialIcons name="chevron-right" size={20} color="#2196F3" />
            </TouchableOpacity>
            
            <View style={styles.warningContainer}>
              <MaterialIcons name="warning" size={20} color="#FFC107" />
              <Text style={styles.warningText}>
                Caution: Adjusting PID settings incorrectly may cause unstable flight behavior.
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.saveButton, !changed && styles.disabledButton]}
            onPress={saveSettings}
            disabled={!changed}
          >
            <MaterialIcons name="save" size={20} color="white" />
            <Text style={styles.buttonText}>Save Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.resetButton]}
            onPress={resetToDefaults}
          >
            <MaterialIcons name="refresh" size={20} color="white" />
            <Text style={styles.buttonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoCard}>
          <MaterialIcons name="info-outline" size={20} color="#BBBBBB" />
          <Text style={styles.infoText}>
            Settings will be automatically applied after saving. Some settings require reconnecting to the drone.
          </Text>
        </View>
        
        {/* Additional Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Management</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Logs')}
          >
            <MaterialIcons name="history" size={20} color="#2196F3" />
            <Text style={styles.actionButtonText}>View Flight Logs</Text>
            <MaterialIcons name="chevron-right" size={20} color="#2196F3" />
          </TouchableOpacity>
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
    marginBottom: 10,
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  switchLabel: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#BBBBBB',
  },
  settingDescription: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 30,
    marginTop: 4,
    marginBottom: 12,
  },
  collapseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  collapseButtonText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  pidContainer: {
    marginBottom: 10,
  },
  pidValueContainer: {
    marginBottom: 16,
  },
  pidDescription: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  warningText: {
    color: '#FFC107',
    marginLeft: 10,
    flex: 1,
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
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  infoText: {
    color: '#BBBBBB',
    marginLeft: 10,
    flex: 1,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    flex: 1,
    color: '#2196F3',
    marginLeft: 8,
    fontSize: 14,
  },
});

export default EnhancedSettingsScreen;