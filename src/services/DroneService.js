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
    
    // Create UDP socket
    return new Promise((resolve, reject) => {
      try {
        socket = dgram.createSocket('udp4');
        
        socket.once('error', (err) => {
          console.error('Socket error:', err);
          connected = false;
          reject(err);
        });
        
        socket.bind(0, '0.0.0.0', () => {
          console.log('UDP socket bound');
          connected = true;
          
          // Send a ping to test connection
          const pingMessage = JSON.stringify({ type: 'ping' });
          socket.send(pingMessage, 0, pingMessage.length, port, ipAddress, (err) => {
            if (err) {
              console.error('Failed to send ping:', err);
              connected = false;
              reject(err);
            } else {
              console.log('Connected to drone at', ipAddress + ':' + port);
              resolve(true);
            }
          });
        });
      } catch (error) {
        console.error('Failed to create socket:', error);
        connected = false;
        reject(error);
      }
    });
  },
  
  // Disconnect from drone
  disconnect: () => {
    return new Promise((resolve) => {
      if (socket) {
        socket.close(() => {
          console.log('Socket closed');
          socket = null;
          connected = false;
          resolve(true);
        });
      } else {
        connected = false;
        resolve(true);
      }
    });
  },
  
  // Check if connected
  isConnected: () => {
    return connected;
  },
  
  // Send command to drone
  sendCommand: (command) => {
    if (!connected || !socket) {
      console.error('Not connected');
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
