/**
 * Helper functions for drone controller app
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
