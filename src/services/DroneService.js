// src/services/DroneService.js
import dgram from 'react-native-udp';
import StorageService from './StorageService';

let socket = null;
let connected = false;
let ipAddress = '192.168.4.1';
let port = 8888;

const DroneService = {
  // Initialize connection to drone
  connect: async (ip, udpPort) => {
    // If already connected, disconnect first
    if (connected && socket) {
      await DroneService.disconnect();
    }
    
    // Use provided values or load from storage
    if (ip && udpPort) {
      ipAddress = ip;
      port = parseInt(udpPort, 10);
    } else {
      const settings = await StorageService.getSettings();
      if (settings) {
        ipAddress = settings.ipAddress || ipAddress;
        port = parseInt(settings.port || port, 10);
      }
    }
    
    // Create UDP socket with error handling
    return new Promise((resolve, reject) => {
      try {
        // Make sure any previous socket is fully closed
        if (socket) {
          socket.close();
          socket = null;
        }
        
        // Create new socket
        socket = dgram.createSocket({
          type: 'udp4',
          reusePort: true  // Add this to fix the clientNotFound issue
        });
        
        // Handle socket errors
        socket.once('error', (err) => {
          console.error('Socket error:', err);
          connected = false;
          socket = null;
          reject(err);
        });
        
        // Properly bind socket with a 1-second timeout
        const bindTimeout = setTimeout(() => {
          if (!connected) {
            console.error('Socket bind timeout');
            if (socket) {
              socket.close();
              socket = null;
            }
            reject(new Error('Socket bind timeout'));
          }
        }, 3000);
        
        socket.bind(0, () => {
          clearTimeout(bindTimeout);
          console.log('UDP socket bound successfully');
          
          // Send a ping to test connection - with timeout
          const pingMessage = JSON.stringify({ type: 'ping' });
          try {
            socket.send(pingMessage, 0, pingMessage.length, port, ipAddress, (err) => {
              if (err) {
                console.error('Failed to send ping:', err);
                connected = false;
                reject(err);
              } else {
                console.log('Connected to drone at', ipAddress + ':' + port);
                connected = true;
                resolve(true);
              }
            });
          } catch (sendError) {
            console.error('Error sending ping message:', sendError);
            connected = false;
            reject(sendError);
          }
        });
      } catch (error) {
        console.error('Failed to create socket:', error);
        connected = false;
        if (socket) {
          socket.close();
          socket = null;
        }
        reject(error);
      }
    });
  },
  
  // Disconnect from drone
  disconnect: () => {
    return new Promise((resolve) => {
      if (socket) {
        try {
          socket.close(() => {
            console.log('Socket closed');
            socket = null;
            connected = false;
            resolve(true);
          });
        } catch (error) {
          console.error('Error closing socket:', error);
          socket = null;
          connected = false;
          resolve(false);
        }
      } else {
        connected = false;
        resolve(true);
      }
    });
  },
  
  // Check if connected
  isConnected: () => {
    return connected && socket !== null;
  },
  
  // Send command to drone
  sendCommand: (command) => {
    if (!connected || !socket) {
      console.log('Not connected, cannot send command');
      return false;
    }
    
    try {
      // Format command as JSON
      const commandMessage = JSON.stringify({
        throttle: command.throttle || 0,
        yaw: command.yaw || 0,
        pitch: command.pitch || 0,
        roll: command.roll || 0
      });
      
      socket.send(commandMessage, 0, commandMessage.length, port, ipAddress, (err) => {
        if (err) {
          console.error('Failed to send command:', err);
          return false;
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error sending command:', error);
      return false;
    }
  },
  
  // Send PID parameters to drone
  sendPIDParameters: async () => {
    if (!connected || !socket) {
      console.error('Not connected');
      return false;
    }
    
    try {
      const settings = await StorageService.getSettings();
      if (settings) {
        const pidMessage = JSON.stringify({
          type: 'pid',
          p: parseFloat(settings.pGain) || 1.0,
          i: parseFloat(settings.iGain) || 0.0,
          d: parseFloat(settings.dGain) || 0.0
        });
        
        socket.send(pidMessage, 0, pidMessage.length, port, ipAddress, (err) => {
          if (err) {
            console.error('Failed to send PID parameters:', err);
            return false;
          }
        });
        
        return true;
      }
    } catch (error) {
      console.error('Error sending PID parameters:', error);
      return false;
    }
  }
};

export default DroneService;