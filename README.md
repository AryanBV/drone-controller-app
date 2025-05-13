# ESP32 WiFi Drone Controller

A mobile application built with React Native to control an ESP32-based quadcopter drone via WiFi. This app provides real-time control through virtual joysticks and manages drone connectivity, settings, and telemetry.

![Drone Controller App](screenshots/app-screenshot.png)

## Features

- **Advanced Dual Joystick Interface**
  - Left joystick: Throttle (up/down) and Yaw (left/right)
  - Right joystick: Pitch (forward/backward) and Roll (left/right)
  - Supports simultaneous multi-touch operation for both joysticks

- **Modern Dark UI**
  - Sleek dark theme designed for outdoor visibility
  - Visual feedback for joystick movements
  - Responsive controls with spring animations

- **Wireless Connectivity**
  - Connect to ESP32 drone via WiFi
  - UDP communication for low-latency control
  - Connection status monitoring

- **Telemetry Display**
  - Battery level indicator with color coding
  - Connection status with visual feedback
  - Real-time flight data

- **Configuration Options**
  - PID controller parameter adjustments
  - WiFi connection settings
  - Control sensitivity customization

## Technology Stack

- **Frontend**: React Native
- **State Management**: React Hooks
- **Navigation**: React Navigation
- **Storage**: AsyncStorage
- **Communication**: React Native UDP
- **UI Components**: Custom components with React Native Animated

## Prerequisites

- Node.js (v14 or higher)
- JDK 17
- Android Studio
- Android SDK (API level 33 recommended)
- A physical Android device or emulator
- ESP32 hardware running compatible firmware (for full functionality)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/drone-controller-app.git
cd drone-controller-app
```

### 2. Install Dependencies

```bash
npm install
npm install react-native-vector-icons react-native-safe-area-context
```

### 3. Configure Vector Icons (for Android)

Add this to your `android/app/build.gradle` file:

```gradle
apply from: "../../node_modules/react-native-vector-icons/fonts.gradle"
```

### 4. Enable Multi-Touch Joysticks

Install the required dependency for simultaneous joystick control:

```bash
npm install react-native-virtual-joystick
```

OR

If you're using the custom MultiTouchJoystick component, no additional dependencies are needed.

### 5. Start Metro Bundler

```bash
npx react-native start
```

### 6. Run the App

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

## Troubleshooting

### App not displaying on physical device

If the app installs but doesn't display:

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

If you can't use both joysticks at once:

1. Make sure you've implemented the MultiTouchJoystick component or installed react-native-virtual-joystick
2. Check that touch events aren't being captured by parent components
3. Verify that your device supports multi-touch (most modern phones do)

### Connection issues

If you're having trouble connecting to the drone:

1. Verify your phone is connected to the same WiFi network as the ESP32
2. Check that the IP address and port in settings are correct
3. Ensure UDP communication isn't blocked by any firewall

## Project Structure

```
drone-controller-app/
├── android/                # Android native code
├── ios/                    # iOS native code
├── src/                    # Source files
│   ├── components/         # Reusable UI components
│   │   ├── joystick/       # Joystick control components
│   │   ├── status/         # Status indicators
│   │   └── connection/     # Connection management UI
│   ├── screens/            # App screens
│   │   ├── ControlScreen.js      # Main control interface
│   │   ├── SettingsScreen.js     # App settings
│   │   └── ConnectionScreen.js   # Connection management
│   ├── services/           # Business logic
│   │   ├── DroneService.js      # Drone communication
│   │   └── StorageService.js    # Local storage management
│   └── utils/              # Utility functions
├── App.js                  # App entry point
└── index.js                # React Native entry point
```

## ESP32 Hardware Integration

This app is designed to work with an ESP32-based drone that:
- Creates a WiFi access point or connects to a local network
- Listens for UDP commands on a specified port
- Interprets JSON commands with throttle, yaw, pitch, and roll values
- Optionally sends telemetry data back to the app

## UI Enhancement Features

The enhanced UI includes:

- **Dark theme** for better visibility outdoors
- **Color-coded status indicators** for immediate feedback
- **Animated joystick** feedback for improved control feel
- **Guide lines** on joysticks for precision movement
- **Material design** elements throughout the app
- **Advanced settings** toggle to reduce complexity
- **Improved form components** with icons and proper spacing

## Credits

This project uses several open-source packages:
- React Native
- React Navigation
- AsyncStorage
- React Native Vector Icons
- React Native UDP
- React Native Safe Area Context

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*This project is part of a broader DIY drone development initiative aimed at making drone technology more accessible to hobbyists and students.*