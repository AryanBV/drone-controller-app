// src/components/joystick/GestureJoystick.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, useWindowDimensions, Vibration, AppState } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import StorageService from '../../services/StorageService';

const GestureJoystick = ({ label, onMove, testID }) => {
  const [values, setValues] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const previousDistance = useRef(0);
  const isCentered = useRef(true);
  const wasAtEdge = useRef(false);
  const [hapticEnabled, setHapticEnabled] = useState(false); // Default to false until loaded
  const lastVibrationTime = useRef(0);
  const appState = useRef(AppState.currentState);
  
  // Load haptic setting
  const loadHapticSetting = async () => {
    try {
      const settings = await StorageService.getSettings();
      if (settings) {
        console.log('Haptic setting loaded:', settings.hapticFeedback);
        setHapticEnabled(settings.hapticFeedback === true);
      } else {
        setHapticEnabled(false);
      }
    } catch (error) {
      console.log('Error loading haptic setting:', error);
      setHapticEnabled(false);
    }
  };
  
  // Add app state listener to reload settings when app becomes active
  useEffect(() => {
    // Initial load
    loadHapticSetting();
    
    // Listen for app state changes
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === "active") {
        // App has come to the foreground, reload settings
        loadHapticSetting();
      }
      appState.current = nextAppState;
    });
    
    // Also periodically check the setting (every 2 seconds)
    const settingsCheckInterval = setInterval(() => {
      loadHapticSetting();
    }, 2000);

    return () => {
      subscription.remove();
      clearInterval(settingsCheckInterval);
    };
  }, []);
  
  // Get current window dimensions for responsive sizing
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  // Calculate appropriate size based on orientation
  const baseSize = isLandscape ? 130 : 150;
  const size = baseSize;
  const stickSize = baseSize * 0.4;
  const maxDistance = (size - stickSize) / 2;
  
  // Edge detection threshold (percentage of max distance)
  const edgeThreshold = 0.9; // 90% of max distance is considered at edge
  const centerThreshold = 0.2; // 20% of max distance is considered centered (increased from 15%)
  
  // Determine label and values text based on which joystick this is
  const valueLabels = label?.includes('Throttle') 
    ? { x: 'Yaw', y: 'Throttle' }
    : { x: 'Roll', y: 'Pitch' };
  
  // Improved haptic implementation with rate limiting
  const triggerHaptic = (intensity) => {
    if (!hapticEnabled) return;
    
    const now = Date.now();
    // Rate limit vibrations to prevent stuttering (minimum 100ms between vibrations)
    if (now - lastVibrationTime.current < 150) {
      return;
    }
    
    try {
      // Use shorter durations for smoother feel
      switch (intensity) {
        case 'light':
          Vibration.vibrate(10); // Shorter duration (was 20)
          break;
        case 'medium':
          Vibration.vibrate(15); // Shorter duration (was 40)
          break;
        case 'heavy':
          Vibration.vibrate(25); // Shorter duration (was 60)
          break;
        default:
          Vibration.vibrate(10);
      }
      lastVibrationTime.current = now;
    } catch (error) {
      console.log('Haptic error:', error);
    }
  };
  
  // Handle gesture events - specifically limit the movement to the circle
  const onGestureEvent = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    
    // Calculate distance from center
    const distance = Math.sqrt(translationX * translationX + translationY * translationY);
    const distanceRatio = distance / maxDistance;
    
    // Apply limits
    let limitedX = translationX;
    let limitedY = translationY;
    
    // Limit edge haptic trigger to just once per edge contact
    if (distanceRatio >= edgeThreshold && !wasAtEdge.current) {
      // Trigger edge haptic feedback
      triggerHaptic('medium');
      wasAtEdge.current = true;
    } else if (distanceRatio < edgeThreshold - 0.05) { // Add hysteresis
      wasAtEdge.current = false;
    }
    
    // Check for center crossing for haptic feedback
    if (previousDistance.current > centerThreshold * maxDistance && 
        distance <= centerThreshold * maxDistance && 
        !isCentered.current) {
      // Trigger center haptic feedback
      triggerHaptic('light');
      isCentered.current = true;
    } else if (distance > (centerThreshold + 0.1) * maxDistance) { // Add hysteresis
      isCentered.current = false;
    }
    
    // Store current distance for next comparison
    previousDistance.current = distance;
    
    // Limit movement to circle boundary
    if (distance > maxDistance) {
      const angle = Math.atan2(translationY, translationX);
      limitedX = Math.cos(angle) * maxDistance;
      limitedY = Math.sin(angle) * maxDistance;
    }
    
    // Update pan values
    pan.x.setValue(limitedX);
    pan.y.setValue(limitedY);
    
    // Calculate normalized values (-1 to 1)
    const normalizedX = limitedX / maxDistance;
    const normalizedY = -limitedY / maxDistance; // Invert Y
    
    // Update state and send to parent
    setValues({
      x: Math.round(normalizedX * 100),
      y: Math.round(normalizedY * 100)
    });
    
    if (onMove) {
      onMove({
        x: normalizedX,
        y: normalizedY
      });
    }
  };
  
  // Handle gesture state changes
  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // End of gesture, reset position
      setActive(false);
      
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
        friction: 5,
        tension: 40
      }).start(() => {
        // When spring animation completes, trigger haptic feedback for center position
        if (!isCentered.current) {
          triggerHaptic('light');
          isCentered.current = true;
        }
      });
      
      setValues({ x: 0, y: 0 });
      
      if (onMove) {
        onMove({ x: 0, y: 0 });
      }
    } else if (event.nativeEvent.state === State.BEGAN) {
      // Start of gesture
      setActive(true);
      // Initial touch haptic feedback
      triggerHaptic('light');
    }
  };

  return (
    <View 
      style={[
        styles.joystickSection, 
        isLandscape && styles.joystickSectionLandscape,
        { width: isLandscape ? baseSize : 160 }
      ]} 
      testID={testID}
    >
      {label && (
        <Text style={[
          styles.joystickLabel,
          isLandscape && styles.joystickLabelLandscape
        ]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.joystickWrapper,
        { width: size, height: size }
      ]}>
        <View 
          style={[
            styles.joystickBase, 
            { width: size, height: size, borderRadius: size / 2 }
          ]} 
        >
          <View style={styles.joystickGuides}>
            <View style={styles.horizontalLine} />
            <View style={styles.verticalLine} />
          </View>
        </View>
        
        <PanGestureHandler
          onGestureEvent={onGestureEvent}
          onHandlerStateChange={onHandlerStateChange}
          maxPointers={1}
        >
          <Animated.View
            style={[
              styles.stickPosition,
              {
                transform: [
                  { translateX: pan.x },
                  { translateY: pan.y }
                ]
              }
            ]}
          >
            <View 
              style={[
                styles.stick,
                active ? styles.stickActive : {},
                { width: stickSize, height: stickSize, borderRadius: stickSize / 2 }
              ]} 
            />
          </Animated.View>
        </PanGestureHandler>
      </View>
      
      <Text style={[
        styles.joystickValues,
        isLandscape && styles.joystickValuesLandscape
      ]}>
        {valueLabels.y}: {values.y}, {valueLabels.x}: {values.x}
      </Text>
    </View>
  );
};

// Same styles as before
const styles = StyleSheet.create({
  // Styles remain the same
  joystickSection: {
    alignItems: 'center',
    width: 160,
  },
  joystickSectionLandscape: {
    marginVertical: 5,
  },
  joystickLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  joystickLabelLandscape: {
    fontSize: 14,
    marginBottom: 8,
  },
  joystickWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  joystickBase: {
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  joystickGuides: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalLine: {
    position: 'absolute',
    width: '90%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  verticalLine: {
    position: 'absolute',
    width: 1,
    height: '90%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  stickPosition: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stick: {
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#1E88E5',
  },
  stickActive: {
    backgroundColor: '#1976D2',
    elevation: 8,
    shadowOpacity: 0.8,
  },
  joystickValues: {
    marginTop: 15,
    fontSize: 14,
    color: '#BBBBBB',
  },
  joystickValuesLandscape: {
    marginTop: 8,
    fontSize: 12,
  }
});

export default GestureJoystick;