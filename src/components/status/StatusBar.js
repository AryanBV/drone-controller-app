import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatusBar = ({ connected, batteryLevel = 0 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.statusItem}>
        <Text style={styles.label}>Connection:</Text>
        <View style={[
          styles.indicator, 
          { backgroundColor: connected ? '#28a745' : '#dc3545' }
        ]} />
        <Text style={styles.value}>{connected ? 'Connected' : 'Disconnected'}</Text>
      </View>
      
      <View style={styles.statusItem}>
        <Text style={styles.label}>Battery:</Text>
        <View style={styles.batteryContainer}>
          <View 
            style={[
              styles.batteryLevel, 
              { 
                width: `${batteryLevel}%`,
                backgroundColor: batteryLevel > 20 ? '#28a745' : '#dc3545'
              }
            ]} 
          />
        </View>
        <Text style={styles.value}>{batteryLevel}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    marginRight: 8,
    color: '#555',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  batteryContainer: {
    width: 50,
    height: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden',
  },
  batteryLevel: {
    height: '100%',
  },
});

export default StatusBar;
