// src/services/StorageService.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@DroneController:settings';

// Default settings
const defaultSettings = {
  ipAddress: '192.168.4.1',
  port: '8888',
  pGain: '1.0',
  iGain: '0.0',
  dGain: '0.0',
  autoConnect: false,
  hapticFeedback: false // Default haptic to off
};

const StorageService = {
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
  }
};

export default StorageService;