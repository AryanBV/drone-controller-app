// src/services/EnhancedMockDroneService.js
// Enhanced mock implementation that supports telemetry and logs

import StorageService from './StorageService';

let connected = false;
let mockBatteryLevel = 100;
let mockInterval = null;
let mockFlightData = {
  isFlying: false,
  telemetry: {
    altitude: 0,
    speed: 0,
    batteryVoltage: 11.1,
    batteryPercentage: 100,
    pitch: 0,
    roll: 0,
    yaw: 0,
    temperatureESC: 32,
    temperatureMCU: 38,
    satellites: 0,
    gpsFix: false,
    latitude: 0,
    longitude: 0
  },
  flightStartTime: null,
  recording: false,
  recordedData: [],
  emergencyStop: false,
  pid: {
    p: 1.0,
    i: 0.0,
    d: 0.0
  }
};

// Helper to create random shifts in values
const randomShift = (value, intensity = 1, min = -Infinity, max = Infinity) => {
  const noise = (Math.random() - 0.5) * 2 * intensity;
  return Math.min(max, Math.max(min, value + noise));
};

const EnhancedMockDroneService = {
  // Initialize mock connection
  connect: async (ip, port) => {
    return new Promise((resolve) => {
      // Simulate connection delay
      setTimeout(() => {
        connected = true;
        console.log('Mock connected to drone at', ip || '192.168.4.1', ':', port || '8888');
        
        // Start mock battery drain
        if (mockInterval) {
          clearInterval(mockInterval);
        }
        
        mockInterval = setInterval(() => {
          if (mockBatteryLevel > 5) {
            mockBatteryLevel -= 1;
          }
          
          mockFlightData.telemetry.batteryPercentage = mockBatteryLevel;
          mockFlightData.telemetry.batteryVoltage = 11.1 - ((100 - mockBatteryLevel) / 100) * 3.3;
        }, 30000); // Decrease every 30 seconds
        
        resolve(true);
      }, 500);
    });
  },
  
  // Disconnect mock
  disconnect: () => {
    return new Promise((resolve) => {
      connected = false;
      
      if (mockInterval) {
        clearInterval(mockInterval);
        mockInterval = null;
      }
      
      // Reset mock flight data
      mockFlightData.isFlying = false;
      mockFlightData.telemetry.altitude = 0;
      mockFlightData.telemetry.speed = 0;
      mockFlightData.flightStartTime = null;
      
      console.log('Mock disconnected from drone');
      resolve(true);
    });
  },
  
  // Check if connected
  isConnected: () => {
    return connected;
  },
  
  // Get mock battery level
  getBatteryLevel: () => {
    return mockBatteryLevel;
  },
  
  // Send command to mock drone
  sendCommand: (command) => {
    if (!connected) {
      console.log('Not connected, cannot send command');
      return false;
    }
    
    // Start flight if not flying and throttle > 10
    if (!mockFlightData.isFlying && command.throttle > 10) {
      mockFlightData.isFlying = true;
      mockFlightData.flightStartTime = Date.now();
    }
    
    // Update mock telemetry based on commands
    if (mockFlightData.isFlying && !mockFlightData.emergencyStop) {
      // Update altitude based on throttle (when throttle > 50, drone climbs)
      const altitudeChange = (command.throttle - 50) / 500; // Throttle of 50 maintains altitude
      mockFlightData.telemetry.altitude = Math.max(0, mockFlightData.telemetry.altitude + altitudeChange);
      
      // Update speed based on pitch (forward/backward)
      mockFlightData.telemetry.speed = command.pitch * 0.2;
      
      // Update orientation
      mockFlightData.telemetry.pitch = command.pitch * 0.4;
      mockFlightData.telemetry.roll = command.roll * 0.4;
      mockFlightData.telemetry.yaw = (mockFlightData.telemetry.yaw + command.yaw * 0.1) % 360;
      
      // Record data point if recording
      if (mockFlightData.recording) {
        mockFlightData.recordedData.push({
          timestamp: Date.now(),
          ...mockFlightData.telemetry
        });
      }
    }
    
    // If throttle near zero for more than a few seconds, land the drone
    if (mockFlightData.isFlying && command.throttle < 5) {
      setTimeout(() => {
        if (command.throttle < 5) {
          mockFlightData.isFlying = false;
          mockFlightData.telemetry.altitude = 0;
          mockFlightData.telemetry.speed = 0;
        }
      }, 2000);
    }
    
    console.log('Mock command sent:', command);
    return true;
  },
  
  // Get current telemetry
  getTelemetry: () => {
    if (!connected) {
      return null;
    }
    
    // Add some random variations to make it look realistic
    const telemetry = { ...mockFlightData.telemetry };
    
    // Only add noise if actually flying
    if (mockFlightData.isFlying && !mockFlightData.emergencyStop) {
      telemetry.altitude = randomShift(telemetry.altitude, 0.05, 0);
      telemetry.speed = randomShift(telemetry.speed, 0.2);
      telemetry.pitch = randomShift(telemetry.pitch, 0.5, -25, 25);
      telemetry.roll = randomShift(telemetry.roll, 0.5, -30, 30);
      telemetry.yaw = (telemetry.yaw + randomShift(0, 0.3)) % 360;
      telemetry.temperatureESC = randomShift(telemetry.temperatureESC, 0.1, 25, 80);
      telemetry.temperatureMCU = randomShift(telemetry.temperatureMCU, 0.1, 30, 70);
      
      // Update GPS if flying
      if (telemetry.satellites < 10) {
        telemetry.satellites = Math.min(12, telemetry.satellites + (Math.random() > 0.8 ? 1 : 0));
      }
      telemetry.gpsFix = telemetry.satellites >= 4;
      
      // Simulate GPS movement
      if (telemetry.gpsFix) {
        if (telemetry.latitude === 0) {
          // Initialize to a random position
          telemetry.latitude = 37.7749 + (Math.random() - 0.5) * 0.01;
          telemetry.longitude = -122.4194 + (Math.random() - 0.5) * 0.01;
        } else {
          // Move slightly based on speed and orientation
          const speedFactor = telemetry.speed * 0.00001;
          const yawRad = telemetry.yaw * (Math.PI / 180);
          telemetry.latitude += speedFactor * Math.cos(yawRad);
          telemetry.longitude += speedFactor * Math.sin(yawRad);
        }
      }
    }
    
    return telemetry;
  },
  
  // Start flight logging
  startLogging: () => {
    if (!connected) return false;
    
    mockFlightData.recording = true;
    mockFlightData.recordedData = [];
    console.log('Mock flight logging started');
    return true;
  },
  
  // Stop flight logging and save
  stopLogging: async () => {
    if (!connected || !mockFlightData.recording) return false;
    
    mockFlightData.recording = false;
    
    // Process recorded data
    if (mockFlightData.recordedData.length > 0) {
      // Calculate flight statistics
      const startTime = mockFlightData.recordedData[0].timestamp;
      const endTime = mockFlightData.recordedData[mockFlightData.recordedData.length - 1].timestamp;
      const duration = Math.floor((endTime - startTime) / 1000); // In seconds
      
      // Extract max values and averages
      let maxAltitude = 0;
      let maxSpeed = 0;
      let totalBatteryPercentage = 0;
      
      mockFlightData.recordedData.forEach(data => {
        maxAltitude = Math.max(maxAltitude, data.altitude);
        maxSpeed = Math.max(maxSpeed, Math.abs(data.speed));
        totalBatteryPercentage += data.batteryPercentage;
      });
      
      const avgBatteryPercentage = totalBatteryPercentage / mockFlightData.recordedData.length;
      
      // Calculate distance (simplified)
      let distance = 0;
      for (let i = 1; i < mockFlightData.recordedData.length; i++) {
        const curr = mockFlightData.recordedData[i];
        const prev = mockFlightData.recordedData[i - 1];
        if (curr.gpsFix && prev.gpsFix) {
          // Very simple distance calculation - in a real app, use Haversine formula
          const latDiff = curr.latitude - prev.latitude;
          const lonDiff = curr.longitude - prev.longitude;
          distance += Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111000; // Approx meters
        }
      }
      
      // Create flight log
      const flightLog = {
        id: Date.now().toString(),
        name: `Flight ${new Date(startTime).toLocaleDateString()}`,
        startTime,
        duration,
        maxAltitude,
        maxSpeed,
        avgBatteryPercentage,
        distance,
        // Detailed data would be saved to a file in a real implementation
        // This is just a mock, so we're keeping it simple
        dataPoints: mockFlightData.recordedData.length
      };
      
      // Save flight log
      try {
        await StorageService.saveFlightLog(flightLog);
        console.log('Mock flight log saved:', flightLog);
        
        // Clear recorded data to free memory
        mockFlightData.recordedData = [];
        return true;
      } catch (error) {
        console.error('Failed to save mock flight log:', error);
        return false;
      }
    }
    
    return false;
  },
  
  // Emergency stop
  emergencyStop: () => {
    if (!connected) return false;
    
    mockFlightData.emergencyStop = true;
    mockFlightData.isFlying = false;
    mockFlightData.telemetry.altitude = 0;
    mockFlightData.telemetry.speed = 0;
    
    console.log('EMERGENCY STOP ACTIVATED');
    
    // Reset emergency stop after a short delay
    setTimeout(() => {
      mockFlightData.emergencyStop = false;
      console.log('Emergency stop reset');
    }, 5000);
    
    return true;
  },
  
  // Reset emergency stop
  resetEmergencyStop: () => {
    mockFlightData.emergencyStop = false;
    return true;
  },
  
  // Check if in emergency stop mode
  isEmergencyStop: () => {
    return mockFlightData.emergencyStop;
  },
  
  // Send PID parameters to mock drone
  sendPIDParameters: async (p, i, d) => {
    if (!connected) {
      console.log('Not connected, cannot send PID parameters');
      return false;
    }
    
    // If parameters provided, use them, otherwise load from settings
    if (p !== undefined && i !== undefined && d !== undefined) {
      mockFlightData.pid = { p, i, d };
    } else {
      try {
        const settings = await StorageService.getSettings();
        if (settings) {
          mockFlightData.pid = {
            p: parseFloat(settings.pGain) || 1.0,
            i: parseFloat(settings.iGain) || 0.0,
            d: parseFloat(settings.dGain) || 0.0
          };
        }
      } catch (error) {
        console.error('Failed to load PID settings:', error);
        return false;
      }
    }
    
    console.log('Mock PID parameters sent:', mockFlightData.pid);
    return true;
  },
  
  // Get PID parameters
  getPIDParameters: () => {
    return mockFlightData.pid;
  }
};

export default EnhancedMockDroneService;