# ESP32 WiFi-Controlled Drone

A cross-platform mobile application built with React Native to control an ESP32-based quadcopter drone via WiFi. This app provides real-time control through advanced virtual joysticks with haptic feedback and comprehensive drone management capabilities including telemetry visualization, PID tuning, and flight logging.

![Drone Controller App](screenshots/app-screenshot.png)

## Project Status

- ✅ Development environment configured
- ✅ React Native project structure established
- ✅ Main application screens created
- ✅ Advanced dual joystick control with multitouch support implemented
- ✅ Haptic feedback for joystick controls with user toggle option
- ✅ Connection status synchronization across screens
- ✅ Mock drone service for testing without hardware
- ✅ Responsive UI for both portrait and landscape orientations
- ✅ Basic UI components fully functional
- ✅ Settings storage and management system
- ✅ Application successfully running on Android devices
- ✅ Intelligent orientation handling with automatic layout adjustment
- ✅ Optimized landscape interface for active flight control
- ✅ Comprehensive telemetry visualization system
- ✅ Flight logging system with historical data review
- ✅ PID controller tuning interface
- ✅ Emergency stop functionality
- ✅ Battery monitoring with configurable alerts

## Key Features

### Advanced Control Interface
- **Dual Joystick Control System**
  - Left joystick: Throttle (up/down) and Yaw (left/right)
  - Right joystick: Pitch (forward/backward) and Roll (left/right)
  - True simultaneous multitouch operation
  - Tactile haptic feedback with customizable settings

- **Orientation-Optimized UI**
  - Portrait Mode: Full access to all settings and features
  - Landscape Mode: Flight-focused interface with maximized control space
  - Automatic detection and smooth transition between orientations
  - Persistent critical controls (emergency stop) in all modes

- **Comprehensive Flight Status**
  - Real-time connection status monitoring
  - Visual feedback for all control inputs
  - Battery level with alert thresholds
  - Critical notifications with haptic feedback

### Advanced Flight Management

- **Telemetry Visualization**
  - Real-time altitude and speed visualization
  - Battery voltage and percentage monitoring
  - Visual attitude indicator showing pitch and roll
  - Temperature monitoring for ESCs and MCU
  - GPS status tracking with coordinates

- **Flight Logging System**
  - Complete flight recording functionality
  - Historical flight data review with statistics
  - Detailed log view with interactive graphs
  - Data analysis for multiple flight parameters
  - Secure local storage for log data

- **PID Controller Tuning**
  - Interactive parameter adjustment sliders
  - Real-time visual feedback in tuning mode
  - Preset configurations for different flight characteristics
  - Custom parameter saving and loading
  - Visual response graphs

- **Enhanced Safety Features**
  - One-tap emergency stop with confirmation
  - Maximum altitude limit settings
  - Flight mode selection (Normal/Sport/Beginner)
  - Low battery auto-return capability
  - Connection health monitoring

## Technology Stack

### Development Environment
- **Operating System**: Windows 10 (also compatible with macOS, Linux)
- **IDE**: Visual Studio Code
- **Version Control**: Git/GitHub
- **Node.js**: v18.19.0
- **JDK**: v17.0.15 (Temurin)
- **Android Studio**: Latest version
- **Android SDK**: API Level 33
- **Android Build Tools**: v35.0.0

### Frontend Application
- **React Native**: v0.79.2
- **React Navigation**: Screen navigation and stack management
- **AsyncStorage**: Local data persistence
- **React Native Gesture Handler**: Advanced touch handling
- **React Native SVG**: Vector graphics rendering
- **React Native UDP**: For drone communication
- **Vibration API**: For haptic feedback
- **Custom Components**: Multiple specialized UI components

### Hardware (Planned)
- **Microcontroller**: ESP32 (ESP32-WROOM-32)
- **Motors**: 4 × Brushless DC Motors (2204/2300KV)
- **ESCs**: 4 × 30A Electronic Speed Controllers
- **Frame**: 250mm carbon fiber/plastic frame
- **Power**: 3S LiPo Battery (11.1V)
- **Sensors**: MPU6050 (Gyroscope + Accelerometer)

## Prerequisites

- Node.js (v18.19.0+)
- JDK 17
- Android Studio with Android SDK (API level 33 recommended)
- A physical Android device or emulator
- ESP32 hardware running compatible firmware (for full functionality)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/esp32-wifi-drone.git
cd esp32-wifi-drone
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Android Permissions

Make sure your `android/app/src/main/AndroidManifest.xml` includes the following permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### 4. Start Metro Bundler

```bash
npx react-native start
```

### 5. Run the App

In a new terminal window:

```bash
npx react-native run-android
```

## Running on Physical Device

To run the app on your physical device instead of an emulator:

1. Enable USB debugging on your device (Settings → Developer options)
2. Connect your device via USB
3. Find your device ID:
   ```bash
   adb devices
   ```
4. Run the app specifically on your device:
   ```bash
   npx react-native run-android --device=YOUR_DEVICE_ID
   ```

## Application Usage

### Main Control Screen
- **Portrait Mode**: Provides access to all controls and navigation to other screens
- **Landscape Mode**: Focused flight control interface with essential indicators
- **Dual Joysticks**: Control throttle, yaw, pitch, and roll simultaneously
- **Flight Mode Selector**: Switch between Normal, Sport, and Beginner modes
- **Emergency Stop**: Immediately stop all motors in case of emergency
- **Recording**: Start/stop flight data recording for later analysis
- **Quick Access**: Fast navigation to telemetry, logs, and settings

### Connection Screen
- Set the IP address and port of your ESP32 drone
- Connect or disconnect from the drone
- View real-time connection status
- Visual indicators for connection health

### Telemetry Screen
- View comprehensive flight data in real-time
- Monitor altitude, speed, battery level, and orientation
- Track system temperatures and GPS status
- Record telemetry data for later analysis

### PID Tuning Screen
- Adjust PID controller parameters (P, I, D gains)
- See real-time response visualization in a dynamic graph
- Use preset configurations for different flight characteristics
- Save and load custom tuning profiles
- Switch between normal and real-time tuning modes

### Logs Screen
- View history of all recorded flights
- See flight statistics (duration, max altitude, etc.)
- Select flights for detailed analysis
- Interactive graphs for multiple flight parameters
- Delete individual logs or clear history

### Settings Screen
- Configure connection parameters
- Adjust interface preferences (haptic feedback toggle)
- Set safety limits (maximum altitude, low battery alerts)
- Configure automatic return-to-home options
- Reset to default values if needed

## Project Structure

```
drone-controller-app/
├── android/                # Android native code
├── ios/                    # iOS configuration (not primary focus)
├── src/                    # Source files
│   ├── components/         # UI components
│   │   ├── joystick/       # Advanced joystick controls
│   │   │   ├── GestureJoystick.js     # Multitouch-enabled joystick
│   │   │   └── CustomJoystick.js      # Alternative implementation
│   │   ├── status/         # Status indicators
│   │   └── connection/     # Connection components
│   ├── screens/            # Application screens
│   │   ├── EnhancedControlScreen.js   # Main control interface
│   │   ├── EnhancedSettingsScreen.js  # Settings configuration
│   │   ├── ConnectionScreen.js        # WiFi connection management
│   │   ├── TelemetryScreen.js         # Telemetry visualization
│   │   ├── LogsScreen.js              # Flight logs list
│   │   ├── LogDetailScreen.js         # Detailed flight log view
│   │   └── PIDTuningScreen.js         # PID parameter tuning
│   ├── services/           # Business logic
│   │   ├── DroneService.js            # Real drone communication
│   │   ├── EnhancedMockDroneService.js # Mock implementation for testing
│   │   └── EnhancedStorageService.js  # Local settings and log storage
│   └── utils/              # Helper functions
│       ├── enhancedHelpers.js         # Utility functions
│       └── navigation.js              # Navigation utilities
├── App.js                  # Main application component
└── index.js                # Application entry point
```

## ESP32 Hardware Integration (Planned)

The application is designed to work with an ESP32-based drone that:
1. Creates a WiFi access point or connects to a local network
2. Listens for UDP commands on a specified port
3. Interprets JSON commands with throttle, yaw, pitch, and roll values
4. Sends telemetry data back to the app

### Hardware Integration Steps (When Hardware is Ready)
- Set up ESP32 with proper flight controller firmware
- Configure WiFi access point on ESP32
- Implement UDP server on ESP32 to receive commands
- Update DroneService.js with real UDP communication
- Test end-to-end communication

## Troubleshooting

### App not displaying correctly
1. Restart the Metro bundler with cache reset:
   ```bash
   npx react-native start --reset-cache
   ```
2. Ensure your phone and computer are on the same network
3. For direct USB connection, run:
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```

### Joysticks not working simultaneously
1. Make sure the GestureJoystick component is being used
2. Verify that your app is wrapped in GestureHandlerRootView
3. Check that your device supports multi-touch

### Haptic feedback not working
1. Ensure the VIBRATE permission is in your AndroidManifest.xml
2. Check that haptic feedback is enabled in the app settings
3. Some devices may have limited or no haptic capabilities

### PID Tuning Realtime Mode Error
If you encounter errors when activating realtime mode in the PID Tuning screen:
1. Make sure the drone is connected first
2. The drone may need to be in "flight mode" - try setting a throttle value first
3. If using the mock service, ensure it's properly initialized

### Connection issues
1. Verify your phone is connected to the same WiFi network as the ESP32
2. Check that the IP address and port in settings are correct
3. Ensure UDP communication isn't blocked by any firewall
4. Try restarting both the app and the ESP32

## Future Plans

### Additional Software Features
- Map integration for GPS visualization
- Flight path planning capabilities
- Automated flight modes (orbit, follow, waypoints)
- Sensor calibration interface
- Firmware update mechanism

### AI Integration (Future Enhancement)
- Computer vision for obstacle detection (requires camera)
- Voice command recognition
- Autonomous flight modes
- Flight path optimization
- Gesture controls via phone camera

