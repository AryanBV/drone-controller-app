# ESP32 WiFi Drone Controller

A mobile application built with React Native to control an ESP32-based quadcopter drone via WiFi. This app provides real-time control through virtual joysticks and manages drone connectivity, settings, and telemetry.

![Drone Controller App Screenshot](screenshots/app-screenshot.png)

## Features

- **Dual Joystick Interface**
  - Left joystick: Throttle (up/down) and Yaw (left/right)
  - Right joystick: Pitch (forward/backward) and Roll (left/right)

- **Wireless Connectivity**
  - Connect to ESP32 drone via WiFi
  - UDP communication for low-latency control
  - Connection status monitoring

- **Telemetry Display**
  - Battery level indicator
  - Connection status
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
```

### 3. Start Metro Bundler

```bash
npx react-native start
```

### 4. Run the App

In a new terminal window:

```bash
npx react-native run-android
```

## Project Structure

```
drone-controller-app/
├── android/                # Android native code
├── ios/                    # iOS native code (if applicable)
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

## Usage

### Connecting to the Drone

1. Power on your ESP32 drone
2. Navigate to the "Connection" screen in the app
3. Enter the IP address of your ESP32 (default: 192.168.4.1)
4. Enter the UDP port (default: 8888)
5. Tap "Connect"
6. The status indicator will turn green when connected

### Controlling the Drone

- **Left Joystick**:
  - Vertical axis: Throttle (up increases altitude, down decreases)
  - Horizontal axis: Yaw (left rotates counterclockwise, right rotates clockwise)

- **Right Joystick**:
  - Vertical axis: Pitch (up moves forward, down moves backward)
  - Horizontal axis: Roll (left banks left, right banks right)

### Adjusting Settings

Navigate to the "Settings" screen to:
- Adjust PID controller parameters (P, I, D gains)
- Configure connection settings
- Customize control sensitivity

## ESP32 Hardware Integration

This app is designed to work with an ESP32-based drone that:
- Creates a WiFi access point or connects to a local network
- Listens for UDP commands on a specified port
- Interprets JSON commands with throttle, yaw, pitch, and roll values
- Optionally sends telemetry data back to the app

For complete hardware integration, refer to the firmware repository: [ESP32-Drone-Firmware](https://github.com/yourusername/esp32-drone-firmware)

## Planned Features

- [ ] Flight data logging and export
- [ ] Autonomous flight modes
- [ ] Waypoint navigation
- [ ] Geofencing capabilities
- [ ] Camera feed display (if drone has camera)
- [ ] Voice commands

## Troubleshooting

### Connection Issues
- Ensure your phone is connected to the same WiFi network as the ESP32
- Check that the correct IP address and port are configured
- Verify that no firewall is blocking UDP communication

### App Crashes
- Check Metro logs for JavaScript errors
- Ensure all dependencies are correctly installed
- Verify Android SDK and JDK versions are compatible

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- React Native community for the excellent framework
- ESP32 community for firmware development resources
- All contributors who have helped shape this project

---

*This project is part of a broader DIY drone development initiative aimed at making drone technology more accessible to hobbyists and students.*