// src/services/EnhancedStorageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@DroneController:settings';
const FLIGHT_LOGS_KEY = '@DroneController:flightLogs';
const FLIGHT_LOG_PREFIX = '@DroneController:flightLog:';

// Default settings
const defaultSettings = {
  ipAddress: '192.168.4.1',
  port: '8888',
  pGain: '1.0',
  iGain: '0.0',
  dGain: '0.0',
  autoConnect: false,
  hapticFeedback: true,
  lowBatteryAlertThreshold: 20,
  criticalBatteryAlertThreshold: 10,
  maxAltitude: 100,
  returnToHomeEnabled: true
};

const EnhancedStorageService = {
  // Settings Management
  
  // Save settings to AsyncStorage
  saveSettings: async (settings) => {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
      console.log('Settings saved:', settings);
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },
  
  // Get settings from AsyncStorage
  getSettings: async () => {
    try {
      const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
      const settings = jsonValue != null ? JSON.parse(jsonValue) : defaultSettings;
      
      // Fill in any missing settings with defaults
      const mergedSettings = { ...defaultSettings, ...settings };
      
      return mergedSettings;
    } catch (error) {
      console.error('Error getting settings:', error);
      return defaultSettings;
    }
  },
  
  // Clear all settings
  clearSettings: async () => {
    try {
      await AsyncStorage.removeItem(SETTINGS_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing settings:', error);
      throw error;
    }
  },
  
  // Flight Logs Management
  
  // Save a flight log entry
  saveFlightLog: async (logData) => {
    try {
      // Get existing log index
      const jsonLogs = await AsyncStorage.getItem(FLIGHT_LOGS_KEY);
      let logs = jsonLogs ? JSON.parse(jsonLogs) : [];
      
      // Add new log to index
      if (!logs.includes(logData.id)) {
        logs.push(logData.id);
      }
      
      // Sort logs by startTime (newest first)
      logs.sort((a, b) => b - a);
      
      // Save updated log index
      await AsyncStorage.setItem(FLIGHT_LOGS_KEY, JSON.stringify(logs));
      
      // Save detailed log data
      await AsyncStorage.setItem(FLIGHT_LOG_PREFIX + logData.id, JSON.stringify(logData));
      
      return true;
    } catch (error) {
      console.error('Error saving flight log:', error);
      throw error;
    }
  },
  
  // Get all flight logs
  getFlightLogs: async () => {
    try {
      const jsonLogs = await AsyncStorage.getItem(FLIGHT_LOGS_KEY);
      if (!jsonLogs) return [];
      
      const logIds = JSON.parse(jsonLogs);
      const logs = [];
      
      // Load basic info from each log
      for (const id of logIds) {
        const jsonLog = await AsyncStorage.getItem(FLIGHT_LOG_PREFIX + id);
        if (jsonLog) {
          logs.push(JSON.parse(jsonLog));
        }
      }
      
      // Sort by startTime (newest first)
      logs.sort((a, b) => b.startTime - a.startTime);
      
      return logs;
    } catch (error) {
      console.error('Error getting flight logs:', error);
      return [];
    }
  },
  
  // Get a specific flight log by ID
  getFlightLogById: async (id) => {
    try {
      const jsonLog = await AsyncStorage.getItem(FLIGHT_LOG_PREFIX + id);
      return jsonLog ? JSON.parse(jsonLog) : null;
    } catch (error) {
      console.error('Error getting flight log:', error);
      return null;
    }
  },
  
  // Delete a specific flight log
  deleteFlightLog: async (id) => {
    try {
      // Remove from index
      const jsonLogs = await AsyncStorage.getItem(FLIGHT_LOGS_KEY);
      if (jsonLogs) {
        let logs = JSON.parse(jsonLogs);
        logs = logs.filter(logId => logId !== id);
        await AsyncStorage.setItem(FLIGHT_LOGS_KEY, JSON.stringify(logs));
      }
      
      // Delete log data
      await AsyncStorage.removeItem(FLIGHT_LOG_PREFIX + id);
      
      return true;
    } catch (error) {
      console.error('Error deleting flight log:', error);
      throw error;
    }
  },
  
  // Clear all flight logs
  clearFlightLogs: async () => {
    try {
      // Get all log IDs
      const jsonLogs = await AsyncStorage.getItem(FLIGHT_LOGS_KEY);
      if (jsonLogs) {
        const logIds = JSON.parse(jsonLogs);
        
        // Delete each log
        for (const id of logIds) {
          await AsyncStorage.removeItem(FLIGHT_LOG_PREFIX + id);
        }
      }
      
      // Clear index
      await AsyncStorage.removeItem(FLIGHT_LOGS_KEY);
      
      return true;
    } catch (error) {
      console.error('Error clearing flight logs:', error);
      throw error;
    }
  },
  
  // Get usage statistics
  getStorageUsage: async () => {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();
      
      // Filter by prefix
      const settingsKeys = keys.filter(key => key === SETTINGS_KEY);
      const logIndexKeys = keys.filter(key => key === FLIGHT_LOGS_KEY);
      const logKeys = keys.filter(key => key.startsWith(FLIGHT_LOG_PREFIX));
      
      // Calculate item counts
      return {
        totalItems: keys.length,
        settings: settingsKeys.length,
        logIndexes: logIndexKeys.length,
        flightLogs: logKeys.length
      };
    } catch (error) {
      console.error('Error getting storage usage:', error);
      return null;
    }
  }
};

export default EnhancedStorageService;