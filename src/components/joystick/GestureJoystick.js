// src/components/joystick/GestureJoystick.js
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

const GestureJoystick = ({ label, onMove, testID }) => {
  const [values, setValues] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  
  // Size calculations
  const size = 150;
  const stickSize = 60;
  const maxDistance = (size - stickSize) / 2;
  
  // Determine label and values text based on which joystick this is
  const valueLabels = label?.includes('Throttle') 
    ? { x: 'Yaw', y: 'Throttle' }
    : { x: 'Roll', y: 'Pitch' };
  
  // Handle gesture events - specifically limit the movement to the circle
  const onGestureEvent = (event) => {
    const { translationX, translationY } = event.nativeEvent;
    
    // Calculate distance from center
    const distance = Math.sqrt(translationX * translationX + translationY * translationY);
    
    // Apply limits
    let limitedX = translationX;
    let limitedY = translationY;
    
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
      }).start();
      
      setValues({ x: 0, y: 0 });
      
      if (onMove) {
        onMove({ x: 0, y: 0 });
      }
    } else if (event.nativeEvent.state === State.BEGAN) {
      // Start of gesture
      setActive(true);
    }
  };

  return (
    <View style={styles.joystickSection} testID={testID}>
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
    width: 150,
    height: 150,
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

export default GestureJoystick;