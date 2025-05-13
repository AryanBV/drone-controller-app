# ESP32 WiFi Drone Controller

A mobile application built with React Native to control an ESP32-based quadcopter drone via WiFi. This app provides real-time control through virtual joysticks with haptic feedback and manages drone connectivity, settings, and telemetry.

![Drone Controller App](screenshots/app-screenshot.png)

## Features

- **Advanced Dual Joystick Interface**
  - Left joystick: Throttle (up/down) and Yaw (left/right)
  - Right joystick: Pitch (forward/backward) and Roll (left/right)
  - Supports true simultaneous multi-touch operation
  - Haptic feedback with customizable settings

- **Responsive UI Design**
  - Sleek dark theme designed for outdoor visibility
  - Visual feedback for joystick movements
  - Supports both portrait and landscape orientations
  - Dynamic layouts that adapt to screen size and orientation

- **Wireless Connectivity**
  - Connect to ESP32 drone via WiFi
  - UDP communication for low-latency control
  - Connection status monitoring that syncs across screens
  - Automatic status updates when switching screens

- **Telemetry Display**
  - Battery level indicator with color coding
  - Connection status with visual feedback
  - Real-time flight data

- **Comprehensive Settings**
  - PID controller parameter adjustments
  - WiFi connection settings
  - Interface preferences (haptic feedback toggle)
  - Control sensitivity customization
  - Settings are saved persistently

## Technology Stack

- **Frontend**: React Native 0.79.2
- **State Management**: React Hooks
- **Navigation**: React Navigation
- **Storage**: AsyncStorage
- **Communication**: UDP for drone control
- **Touch Handling**: React Native Gesture Handler
- **UI Components**: Custom components with React Native Animated
- **Feedback**: Vibration API for haptic response

## Prerequisites

- Node.js (v18.19.0+)
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

The control screen provides dual joystick controls:
- **Left Joystick**: Controls throttle (vertical axis) and yaw (horizontal axis)
- **Right Joystick**: Controls pitch (vertical axis) and roll (horizontal axis)
- Both joysticks can be used simultaneously for complete control
- Haptic feedback provides tactile response when using the joysticks
- Status bar shows connection status and battery level

### Connection Screen

Manage your connection to the drone:
- Set the IP address of your ESP32 drone
- Configure the UDP port
- Connect or disconnect from the drone
- View live connection status

### Settings Screen

Customize your drone controller:
- **Connection Settings**: Configure IP address and port
- **Interface Settings**: Toggle haptic feedback for joysticks
- **Advanced PID Settings**: Fine-tune flight control parameters
- Save settings to persist between app launches
- Reset to default values if needed

## Project Structure

```
drone-controller-app/
├── android/                # Android native code
├── ios/                    # iOS native code
├── src/                    # Source files
│   ├── components/         # Reusable UI components
│   │   ├── joystick/       # Joystick control components
│   │   │   ├── GestureJoystick.js     # Multitouch-enabled joystick
│   │   │   └── CustomJoystick.js      # Alternative implementation
│   │   ├── status/         # Status indicators
│   │   └── connection/     # Connection management UI
│   ├── screens/            # App screens
│   │   ├── ControlScreen.js      # Main control interface
│   │   ├── SettingsScreen.js     # App settings
│   │   └── ConnectionScreen.js   # Connection management
│   ├── services/           # Business logic
│   │   ├── DroneService.js      # Drone communication
│   │   ├── MockDroneService.js  # Mock implementation for testing
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

1. Make sure the GestureJoystick component is being used
2. Verify that your app is wrapped in GestureHandlerRootView
3. Check that your device supports multi-touch

### Haptic feedback not working

If haptic feedback is not working:

1. Ensure the VIBRATE permission is in your AndroidManifest.xml
2. Check that haptic feedback is enabled in the app settings
3. Some devices may have limited or no haptic capabilities

### Connection issues

If you're having trouble connecting to the drone:

1. Verify your phone is connected to the same WiFi network as the ESP32
2. Check that the IP address and port in settings are correct
3. Ensure UDP communication isn't blocked by any firewall

## Future Plans

- Implement telemetry data visualization
- Add flight logging capabilities
- Develop emergency stop functionality
- Create autonomous flight modes
- Implement gesture control via camera

## Credits

This project uses several open-source packages:
- React Native
- React Navigation
- AsyncStorage
- React Native Gesture Handler
- React Native Safe Area Context

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

*This project is part of a broader DIY drone development initiative aimed at making drone technology more accessible to hobbyists and students.*