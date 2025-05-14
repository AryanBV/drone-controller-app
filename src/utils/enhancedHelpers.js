// src/utils/enhancedHelpers.js
/**
 * Enhanced helper functions for drone controller app
 */

// Normalize a value between min and max
export const normalize = (value, min, max) => {
  return Math.min(max, Math.max(min, value));
};

// Map a value from one range to another
export const mapRange = (value, inMin, inMax, outMin, outMax) => {
  return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
};

// Format a value with specific decimals
export const formatValue = (value, decimals = 0) => {
  return Number(value).toFixed(decimals);
};

// Validate IP address format
export const isValidIP = (ip) => {
  const regex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return regex.test(ip);
};

// Validate port number
export const isValidPort = (port) => {
  const portNum = parseInt(port, 10);
  return !isNaN(portNum) && portNum >= 0 && portNum <= 65535;
};

// Create a debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Format a timestamp as date (e.g., "May 14, 2025")
export const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format a timestamp as time (e.g., "14:23:45")
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// Format a duration in seconds to a readable format (e.g., "5m 23s")
export const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  
  if (mins === 0) {
    return `${secs}s`;
  } else {
    return `${mins}m ${secs}s`;
  }
};

// Calculate distance between two GPS coordinates (Haversine formula)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
};

// Generate a unique ID
export const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Battery voltage to percentage converter (for 3S LiPo)
export const batteryVoltageToPercentage = (voltage) => {
  // 3S LiPo battery (11.1V nominal, 12.6V max, 9.0V min)
  const maxVoltage = 12.6;
  const minVoltage = 9.0;
  
  const percentage = ((voltage - minVoltage) / (maxVoltage - minVoltage)) * 100;
  return Math.min(100, Math.max(0, Math.round(percentage)));
};

// Get appropriate color for battery percentage
export const getBatteryColor = (percentage) => {
  if (percentage > 50) return '#4CAF50'; // Green
  if (percentage > 20) return '#FFC107'; // Yellow
  return '#F44336'; // Red
};

// Filter telemetry data to reduce array size
export const filterTelemetryData = (data, maxPoints = 100) => {
  if (data.length <= maxPoints) return data;
  
  const result = [];
  const step = Math.floor(data.length / maxPoints);
  
  for (let i = 0; i < data.length; i += step) {
    result.push(data[i]);
  }
  
  // Ensure we include the last point
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  
  return result;
};