// src/components/joystick/MultiTouchJoystick.js
import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableWithoutFeedback } from 'react-native';

const MultiTouchJoystick = ({ id, label, onMove }) => {
  const [active, setActive] = useState(false);
  const [values, setValues] = useState({ x: 0, y: 0 });
  const position = useRef(new Animated.ValueXY()).current;
  const joystickRef = useRef(null);
  const baseLayout = useRef({ x: 0, y: 0, width: 0, height: 0 }).current;
  
  // Size calculations
  const size = 150;
  const stickSize = 60;
  const maxDistance = (size - stickSize) / 2;
  
  // Determine label and values text based on which joystick this is
  const valueLabels = label?.includes('Throttle') 
    ? { x: 'Yaw', y: 'Throttle' }
    : { x: 'Roll', y: 'Pitch' };

  const handleLayout = (event) => {
    joystickRef.current.measure((x, y, width, height, pageX, pageY) => {
      baseLayout.x = pageX;
      baseLayout.y = pageY;
      baseLayout.width = width;
      baseLayout.height = height;
    });
  };

  const handleResponderStart = (event) => {
    const touch = event.nativeEvent.touches.find(t => 
      isPointInsideJoystick(t.pageX, t.pageY)
    );
    
    if (touch) {
      setActive(true);
      handleMove(touch);
    }
  };
  
  const isPointInsideJoystick = (x, y) => {
    const centerX = baseLayout.x + (baseLayout.width / 2);
    const centerY = baseLayout.y + (baseLayout.height / 2);
    const distance = Math.sqrt(
      Math.pow(x - centerX, 2) + 
      Math.pow(y - centerY, 2)
    );
    return distance <= baseLayout.width / 2;
  };
  
  const handleMove = (touch) => {
    const centerX = baseLayout.x + (baseLayout.width / 2);
    const centerY = baseLayout.y + (baseLayout.height / 2);
    
    let dx = touch.pageX - centerX;
    let dy = touch.pageY - centerY;
    
    // Calculate distance from center
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Limit to circle boundary
    if (distance > maxDistance) {
      const angle = Math.atan2(dy, dx);
      dx = Math.cos(angle) * maxDistance;
      dy = Math.sin(angle) * maxDistance;
    }
    
    // Update values
    position.setValue({ x: dx, y: dy });
    
    // Normalize and send to parent
    const normalizedX = dx / maxDistance;
    const normalizedY = -dy / maxDistance; // Invert Y
    
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
  
  const handleResponderMove = (event) => {
    if (!active) return;
    
    // Find our touch among all current touches
    const touch = event.nativeEvent.touches.find(t => 
      isPointInsideJoystick(t.pageX, t.pageY) || 
      (active && t.identifier === activeTouch.current)
    );
    
    if (touch) {
      handleMove(touch);
    } else {
      handleResponderEnd();
    }
  };
  
  const handleResponderEnd = () => {
    if (!active) return;
    
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
    
    activeTouch.current = null;
  };

  return (
    <View 
      style={styles.joystickSection}
      onLayout={handleLayout}
      collapsable={false}
    >
      {label && <Text style={styles.joystickLabel}>{label}</Text>}
      
      <View
        ref={joystickRef}
        style={[
          styles.joystickWrapper,
          { width: size, height: size }
        ]}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={handleResponderStart}
        onResponderMove={handleResponderMove}
        onResponderRelease={handleResponderEnd}
        onResponderTerminate={handleResponderEnd}
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