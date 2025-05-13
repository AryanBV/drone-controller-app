// src/components/joystick/CustomJoystick.js
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';

const CustomJoystick = ({ size = 150, onMove, label }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [showActive, setShowActive] = useState(false);
  const [values, setValues] = useState({ x: 0, y: 0 });
  
  // Size calculations
  const centerPoint = size / 2;
  const stickSize = size / 3;
  const maxDistance = centerPoint - stickSize / 2;
  
  // Determine label and values text based on which joystick this is
  const valueLabels = label?.includes('Throttle') 
    ? { x: 'Yaw', y: 'Throttle' }
    : { x: 'Roll', y: 'Pitch' };
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setShowActive(true);
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        let x = gesture.dx;
        let y = gesture.dy;
        
        // Calculate distance from center
        const distance = Math.sqrt(x * x + y * y);
        
        // Limit to circle boundary
        if (distance > maxDistance) {
          const angle = Math.atan2(y, x);
          x = Math.cos(angle) * maxDistance;
          y = Math.sin(angle) * maxDistance;
        }
        
        // Update animated values
        pan.setValue({ x, y });
        
        // Normalize values to -1...1 range for controller input
        const normalizedX = x / maxDistance;
        const normalizedY = -y / maxDistance; // Invert Y since screen coordinate system is inverted
        
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
      },
      onPanResponderRelease: () => {
        setShowActive(false);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false
        }).start();
        
        setValues({ x: 0, y: 0 });
        if (onMove) {
          onMove({ x: 0, y: 0 });
        }
      }
    })
  ).current;

  return (
    <View style={styles.joystickSection}>
      {label && <Text style={styles.joystickLabel}>{label}</Text>}
      <View style={[styles.container, { width: size, height: size }]}>
        <View 
          style={[
            styles.baseCircle, 
            { width: size, height: size, borderRadius: size / 2 }
          ]} 
        />
        <Animated.View
          style={{
            transform: [{ translateX: pan.x }, { translateY: pan.y }]
          }}
          {...panResponder.panHandlers}
        >
          <View 
            style={[
              styles.stickCircle,
              showActive ? styles.stickActive : {},
              { width: stickSize, height: stickSize, borderRadius: stickSize / 2 }
            ]} 
          />
        </Animated.View>
      </View>
      <Text style={styles.joystickValues}>
        {valueLabels.y}: {values.y}, {valueLabels.x}: {values.x}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  joystickSection: {
    alignItems: 'center',
    width: 160,
  },
  joystickLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseCircle: {
    position: 'absolute',
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: '#333',
  },
  stickCircle: {
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
});

export default CustomJoystick;