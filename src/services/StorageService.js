import AsyncStorage from '@react-native-async-storage/async-storage';

const SETTINGS_KEY = '@DroneController:settings';

const StorageService = {
  // Save settings to AsyncStorage
  saveSettings: async (settings) => {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(SETTINGS_KEY, jsonValue);
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
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
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
