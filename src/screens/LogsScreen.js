// src/screens/LogsScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import StorageService from '../services/StorageService';
import { formatDate, formatTime, formatDuration } from '../utils/helpers';

const LogsScreen = ({ navigation }) => {
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Load logs on component mount
  useEffect(() => {
    loadLogs();
  }, []);
  
  // Load logs from storage
  const loadLogs = async () => {
    setLoading(true);
    try {
      const flightLogs = await StorageService.getFlightLogs();
      setLogs(flightLogs || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
      Alert.alert('Error', 'Failed to load flight logs.');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete a specific log
  const deleteLog = (logId) => {
    Alert.alert(
      'Delete Log',
      'Are you sure you want to delete this flight log?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteFlightLog(logId);
              await loadLogs(); // Reload logs after deletion
              if (selectedLog && selectedLog.id === logId) {
                setSelectedLog(null);
              }
            } catch (error) {
              console.error('Failed to delete log:', error);
              Alert.alert('Error', 'Failed to delete flight log.');
            }
          }
        }
      ]
    );
  };
  
  // Delete all logs
  const deleteAllLogs = () => {
    Alert.alert(
      'Delete All Logs',
      'Are you sure you want to delete all flight logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearFlightLogs();
              setLogs([]);
              setSelectedLog(null);
            } catch (error) {
              console.error('Failed to delete all logs:', error);
              Alert.alert('Error', 'Failed to delete all flight logs.');
            }
          }
        }
      ]
    );
  };
  
  // Render log item
  const renderLogItem = ({ item }) => {
    const isSelected = selectedLog && selectedLog.id === item.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.logItem,
          isSelected && styles.selectedLogItem
        ]}
        onPress={() => setSelectedLog(isSelected ? null : item)}
      >
        <View style={styles.logHeader}>
          <Text style={styles.logTitle}>{item.name || `Flight ${formatDate(item.startTime)}`}</Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteLog(item.id)}
          >
            <MaterialIcons name="delete" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.logInfo}>
          <View style={styles.logInfoItem}>
            <MaterialIcons name="access-time" size={16} color="#BBBBBB" />
            <Text style={styles.logInfoText}>
              {formatTime(item.startTime)}
            </Text>
          </View>
          
          <View style={styles.logInfoItem}>
            <MaterialIcons name="straighten" size={16} color="#BBBBBB" />
            <Text style={styles.logInfoText}>
              {formatDuration(item.duration)}
            </Text>
          </View>
        </View>
        
        {isSelected && (
          <View style={styles.logDetails}>
            <View style={styles.logDetailRow}>
              <Text style={styles.logDetailLabel}>Max Altitude:</Text>
              <Text style={styles.logDetailValue}>{item.maxAltitude.toFixed(1)} m</Text>
            </View>
            
            <View style={styles.logDetailRow}>
              <Text style={styles.logDetailLabel}>Max Speed:</Text>
              <Text style={styles.logDetailValue}>{item.maxSpeed.toFixed(1)} m/s</Text>
            </View>
            
            <View style={styles.logDetailRow}>
              <Text style={styles.logDetailLabel}>Avg. Battery:</Text>
              <Text style={styles.logDetailValue}>{item.avgBatteryPercentage.toFixed(0)}%</Text>
            </View>
            
            <View style={styles.logDetailRow}>
              <Text style={styles.logDetailLabel}>Distance:</Text>
              <Text style={styles.logDetailValue}>{item.distance.toFixed(1)} m</Text>
            </View>
            
            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => navigation.navigate('LogDetail', { logId: item.id })}
            >
              <Text style={styles.viewDetailsText}>View Detailed Log</Text>
              <MaterialIcons name="chevron-right" size={18} color="#2196F3" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Flight Logs</Text>
      </View>
      
      <View style={styles.container}>
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="flight-takeoff" size={50} color="#444444" />
            <Text style={styles.emptyStateText}>No flight logs yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your flight logs will appear here after you record telemetry data
            </Text>
          </View>
        ) : (
          <>
            <FlatList
              data={logs}
              renderItem={renderLogItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.logsList}
              refreshing={loading}
              onRefresh={loadLogs}
            />
            
            <TouchableOpacity
              style={styles.deleteAllButton}
              onPress={deleteAllLogs}
            >
              <MaterialIcons name="delete-sweep" size={20} color="white" />
              <Text style={styles.deleteAllText}>Delete All Logs</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#BBBBBB',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#777777',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  logsList: {
    paddingBottom: 80,
  },
  logItem: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedLogItem: {
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  deleteButton: {
    padding: 4,
  },
  logInfo: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  logInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  logInfoText: {
    fontSize: 14,
    color: '#BBBBBB',
    marginLeft: 4,
  },
  logDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  logDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  logDetailLabel: {
    fontSize: 14,
    color: '#BBBBBB',
  },
  logDetailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  viewDetailsText: {
    fontSize: 14,
    color: '#2196F3',
    marginRight: 4,
  },
  deleteAllButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#F44336',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  deleteAllText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default LogsScreen;