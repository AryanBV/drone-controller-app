// src/components/joystick/JoystickControl.js
import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const JoystickControl = ({ label, onMove }) => {
  const [active, setActive] = useState(false);
  const [values, setValues] = useState({ x: 0, y: 0 });
  const pan = useRef(new Animated.ValueXY()).current;
  
  // Size calculations
  const size = 150;
  const stickSize = 60;
  const maxDistance = (size - stickSize) / 2;
  
  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: pan.x,
          translationY: pan.y,
        },
      },
    ],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      // End of gesture, reset position
      setActive(false);
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
        friction: 5,
        tension: 40
      }).start();
      
      setValues({ x: 0, y: 0 });
      if (onMove) {
        onMove({ x: 0, y: 0 });
      }
    } else if (event.nativeEvent.state === State.BEGAN) {
      // Start of gesture
      setActive(true);
    } else if (event.nativeEvent.state === State.ACTIVE) {
      // During gesture
      let x = event.nativeEvent.translationX;
      let y = event.nativeEvent.translationY;
      
      // Calculate distance from center
      const distance = Math.sqrt(x * x + y * y);
      
      // Limit to circle boundary
      if (distance > maxDistance) {
        const angle = Math.atan2(y, x);
        x = Math.cos(angle) * maxDistance;
        y = Math.sin(angle) * maxDistance;
        
        // Update animated values manually if beyond bounds
        pan.setValue({ x, y });
      }
      
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
    }
  };

  // Determine label and values text based on which joystick this is
  const valueLabels = label && label.includes('Throttle') 
    ? { x: 'Yaw', y: 'Throttle' }
    : { x: 'Roll', y: 'Pitch' };

  return (
    <View style={styles.joystickSection}>
      {label && <Text style={styles.joystickLabel}>{label}</Text>}
      <View style={styles.joystickWrapper}>
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
      <Text style={styles.joystickValues}>
        {valueLabels.y}: {values.y}, {valueLabels.x}: {values.x}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  baseCircle: {
    position: 'absolute',
    backgroundColor: '#EEEEEE',
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  stickCircle: {
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stickActive: {
    backgroundColor: '#0056b3',
  },
});

export default JoystickControl;