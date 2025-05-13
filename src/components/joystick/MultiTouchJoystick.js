// src/components/joystick/MultiTouchJoystick.js
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, PanResponder } from 'react-native';

const MultiTouchJoystick = ({ id, label, onMove }) => {
  const [values, setValues] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const position = useRef(new Animated.ValueXY()).current;
  const joystickRef = useRef(null);
  const [layout, setLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  // Size calculations
  const size = 150;
  const stickSize = 60;
  const maxDistance = (size - stickSize) / 2;
  
  // Create pan responder with proper multitouch support
  const panResponder = useRef(
    PanResponder.create({
      // Critical for multitouch - don't take over all touches
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: () => false,
      
      // This is important - we only want to handle our specific touch
      onStartShouldSetPanResponder: (evt) => {
        // Check if touch is inside our joystick area
        const touch = evt.nativeEvent.touches[0];
        const centerX = layout.x + layout.width / 2;
        const centerY = layout.y + layout.height / 2;
        
        const distance = Math.sqrt(
          Math.pow(touch.pageX - centerX, 2) + 
          Math.pow(touch.pageY - centerY, 2)
        );
        
        return distance <= layout.width / 2;
      },
      
      onMoveShouldSetPanResponder: () => active,
      
      onPanResponderGrant: () => {
        setActive(true);
        position.setValue({ x: 0, y: 0 });
      },
      
      onPanResponderMove: (evt, gestureState) => {
        let x = gestureState.dx;
        let y = gestureState.dy;
        
        // Calculate distance from center
        const distance = Math.sqrt(x * x + y * y);
        
        // Limit to circle boundary
        if (distance > maxDistance) {
          const angle = Math.atan2(y, x);
          x = Math.cos(angle) * maxDistance;
          y = Math.sin(angle) * maxDistance;
        }
        
        // Update animated values
        position.setValue({ x, y });
        
        // Normalize values to -1...1 range for controller input
        const normalizedX = x / maxDistance;
        const normalizedY = -y / maxDistance; // Invert Y
        
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
        setActive(false);
        Animated.spring(position, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 5,
          tension: 40
        }).start();
        
        setValues({ x: 0, y: 0 });
        
        if (onMove) {
          onMove({ x: 0, y: 0 });
        }
      },
      
      // IMPORTANT: Allow simultaneous responders
      onPanResponderTerminationRequest: () => false,
    })
  ).current;

  // Update layout measurements
  useEffect(() => {
    // Measure function needs a small delay to get accurate values
    const timeoutId = setTimeout(() => {
      if (joystickRef.current) {
        joystickRef.current.measure((x, y, width, height, pageX, pageY) => {
          setLayout({
            x: pageX,
            y: pageY,
            width,
            height
          });
        });
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Determine label and values text
  const valueLabels = label?.includes('Throttle') 
    ? { x: 'Yaw', y: 'Throttle' }
    : { x: 'Roll', y: 'Pitch' };

  return (
    <View 
      style={styles.joystickSection} 
      collapsable={false}
    >
      {label && <Text style={styles.joystickLabel}>{label}</Text>}
      
      <View
        ref={joystickRef}
        style={[
          styles.joystickWrapper,
          { width: size, height: size }
        ]}
        {...panResponder.panHandlers}
      >
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
        
        <Animated.View
          style={[
            styles.stickPosition,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y }
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
});

export default MultiTouchJoystick;