// src/services/MockDroneService.js
// This is a mock implementation that doesn't use UDP sockets

let connected = false;
let mockBatteryLevel = 100;
let mockInterval = null;

const MockDroneService = {
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
    
    console.log('Mock command sent:', command);
    return true;
  },
  
  // Send PID parameters to mock drone
  sendPIDParameters: async () => {
    if (!connected) {
      console.log('Not connected, cannot send PID parameters');
      return false;
    }
    
    console.log('Mock PID parameters sent');
    return true;
  }
};

export default MockDroneService;