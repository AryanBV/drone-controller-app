import React, { useRef, useState } from 'react';
import { View, StyleSheet, PanResponder, Animated } from 'react-native';

const CustomJoystick = ({ size = 150, onMove }) => {
  const pan = useRef(new Animated.ValueXY()).current;
  const [showActive, setShowActive] = useState(false);
  
  // Size calculations
  const centerPoint = size / 2;
  const stickSize = size / 3;
  const maxDistance = centerPoint - stickSize / 2;
  
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
        if (onMove) {
          onMove({
            x: x / maxDistance,
            y: -y / maxDistance // Invert Y since screen coordinate system is inverted
          });
        }
      },
      onPanResponderRelease: () => {
        setShowActive(false);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false
        }).start();
        
        if (onMove) {
          onMove({ x: 0, y: 0 });
        }
      }
    })
  ).current;

  return (
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

export default CustomJoystick;