// src/screens/LogDetailScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
// Changed from StorageService to EnhancedStorageService
import EnhancedStorageService from '../services/EnhancedStorageService';
import { formatDate, formatTime } from '../utils/helpers';

const LogChartItem = ({ title, data, min, max, color }) => {
  const chartWidth = Dimensions.get('window').width - 48;
  const chartHeight = 80;
  
  // No data handling
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={[styles.chartBox, { height: chartHeight }]}>
          <Text style={styles.noDataText}>No data available</Text>
        </View>
      </View>
    );
  }
  
  // Create points for the graph
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    // Normalize value between min and max
    const normalizedValue = Math.min(1, Math.max(0, (value - min) / (max - min)));
    const y = chartHeight - normalizedValue * chartHeight;
    return { x, y };
  });
  
  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.chartStats}>
          <Text style={styles.chartStatLabel}>Min: <Text style={styles.chartStatValue}>{Math.min(...data).toFixed(1)}</Text></Text>
          <Text style={styles.chartStatLabel}>Max: <Text style={styles.chartStatValue}>{Math.max(...data).toFixed(1)}</Text></Text>
          <Text style={styles.chartStatLabel}>Avg: <Text style={styles.chartStatValue}>
            {(data.reduce((sum, val) => sum + val, 0) / data.length).toFixed(1)}
          </Text></Text>
        </View>
      </View>
      
      <View style={[styles.chartBox, { height: chartHeight }]}>
        <View style={styles.chartY}>
          <Text style={styles.chartYLabel}>{max}</Text>
          <Text style={styles.chartYLabel}>{min}</Text>
        </View>
        
        <View style={styles.chartContent}>
          {/* Draw chart points */}
          <View style={styles.chartLines}>
            {points.map((point, index) => {
              if (index === 0) return null;
              const prevPoint = points[index - 1];
              return (
                <View
                  key={`line-${index}`}
                  style={{
                    position: 'absolute',
                    left: prevPoint.x,
                    top: prevPoint.y,
                    width: point.x - prevPoint.x,
                    height: 2,
                    backgroundColor: color,
                    transform: [
                      { translateY: -1 },
                      { rotate: `${Math.atan2(point.y - prevPoint.y, point.x - prevPoint.x) * (180 / Math.PI)}deg` },
                      { translateY: 1 }
                    ],
                    transformOrigin: 'left center',
                  }}
                />
              );
            })}
          </View>
          
          {/* Draw data points */}
          {points.map((point, index) => (
            <View
              key={`point-${index}`}
              style={{
                position: 'absolute',
                left: point.x - 3,
                top: point.y - 3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: color,
              }}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const LogDetailScreen = ({ route, navigation }) => {
  const { logId } = route.params;
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('altitude');
  const { width } = useWindowDimensions();
  
  // Load log data on component mount
  useEffect(() => {
    const loadLogData = async () => {
      setLoading(true);
      try {
        // Using EnhancedStorageService instead of StorageService
        const logData = await EnhancedStorageService.getFlightLogById(logId);
        if (logData) {
          setLog(logData);
        } else {
          // Log not found
          alert('Flight log not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error('Failed to load log data:', error);
        alert('Failed to load flight log data');
      } finally {
        setLoading(false);
      }
    };
    
    loadLogData();
  }, [logId, navigation]);
  
  // Create mock detailed log data if not available
  const createMockDetailData = () => {
    if (!log) return null;
    
    // Generate mock data series
    const dataPoints = 50; // Number of data points
    const seriesData = {
      altitude: [],
      speed: [],
      batteryPercentage: [],
      pitch: [],
      roll: [],
      yaw: [],
      temperatureESC: [],
      temperatureMCU: []
    };
    
    // Initial values
    let altitude = 0;
    let speed = 0;
    let battery = log.avgBatteryPercentage + 10; // Start a bit higher than average
    let pitch = 0;
    let roll = 0;
    let yaw = 0;
    let tempESC = 30;
    let tempMCU = 35;
    
    // Generate data with some patterns
    for (let i = 0; i < dataPoints; i++) {
      const progress = i / (dataPoints - 1); // 0 to 1
      const noise = () => (Math.random() - 0.5) * 2;
      
      // Patterns for data series
      if (progress < 0.3) {
        // Takeoff phase
        altitude = Math.min(log.maxAltitude, altitude + (log.maxAltitude / 10) * (1 + noise() * 0.2));
        speed = Math.min(log.maxSpeed * 0.7, speed + log.maxSpeed / 15 * (1 + noise() * 0.3));
      } else if (progress < 0.7) {
        // Flight phase
        altitude = altitude + log.maxAltitude / 20 * noise();
        speed = log.maxSpeed * (0.7 + noise() * 0.3);
      } else {
        // Landing phase
        altitude = Math.max(0, altitude - (log.maxAltitude / 10) * (1 + noise() * 0.1));
        speed = Math.max(0, speed - log.maxSpeed / 15 * (1 + noise() * 0.2));
      }
      
      // Battery drains throughout flight
      battery = Math.max(log.avgBatteryPercentage - 20, battery - 0.5 * (1 + noise() * 0.1));
      
      // Orientation has more variation during flight
      pitch = 10 * noise() * (progress > 0.3 && progress < 0.7 ? 2 : 1);
      roll = 15 * noise() * (progress > 0.3 && progress < 0.7 ? 2 : 1);
      yaw = (yaw + 5 * (1 + noise())) % 360;
      
      // Temperatures rise during flight
      tempESC = 30 + (progress * 25) + (noise() * 5);
      tempMCU = 35 + (progress * 20) + (noise() * 3);
      
      // Add to series
      seriesData.altitude.push(altitude);
      seriesData.speed.push(speed);
      seriesData.batteryPercentage.push(battery);
      seriesData.pitch.push(pitch);
      seriesData.roll.push(roll);
      seriesData.yaw.push(yaw);
      seriesData.temperatureESC.push(tempESC);
      seriesData.temperatureMCU.push(tempMCU);
    }
    
    return seriesData;
  };
  
  const seriesData = createMockDetailData();
  
  // No data to display
  if (!log || !seriesData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#121212" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {log.name || `Flight ${formatDate(log.startTime)}`}
        </Text>
      </View>
      
      <ScrollView style={styles.container}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Flight Summary</Text>
          
          <View style={styles.summaryGrid}>
            <View style={styles.summaryItem}>
              <MaterialIcons name="event" size={20} color="#BBBBBB" />
              <Text style={styles.summaryLabel}>Date</Text>
              <Text style={styles.summaryValue}>{formatDate(log.startTime)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <MaterialIcons name="access-time" size={20} color="#BBBBBB" />
              <Text style={styles.summaryLabel}>Time</Text>
              <Text style={styles.summaryValue}>{formatTime(log.startTime)}</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <MaterialIcons name="timer" size={20} color="#BBBBBB" />
              <Text style={styles.summaryLabel}>Duration</Text>
              <Text style={styles.summaryValue}>{Math.floor(log.duration / 60)}m {log.duration % 60}s</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <MaterialIcons name="straighten" size={20} color="#BBBBBB" />
              <Text style={styles.summaryLabel}>Distance</Text>
              <Text style={styles.summaryValue}>{log.distance.toFixed(1)} m</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <MaterialIcons name="flight-takeoff" size={20} color="#BBBBBB" />
              <Text style={styles.summaryLabel}>Max Altitude</Text>
              <Text style={styles.summaryValue}>{log.maxAltitude.toFixed(1)} m</Text>
            </View>
            
            <View style={styles.summaryItem}>
              <MaterialIcons name="speed" size={20} color="#BBBBBB" />
              <Text style={styles.summaryLabel}>Max Speed</Text>
              <Text style={styles.summaryValue}>{log.maxSpeed.toFixed(1)} m/s</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.tabContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'altitude' && styles.selectedTab]}
              onPress={() => setSelectedTab('altitude')}
            >
              <Text style={[styles.tabText, selectedTab === 'altitude' && styles.selectedTabText]}>Altitude</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'speed' && styles.selectedTab]}
              onPress={() => setSelectedTab('speed')}
            >
              <Text style={[styles.tabText, selectedTab === 'speed' && styles.selectedTabText]}>Speed</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'battery' && styles.selectedTab]}
              onPress={() => setSelectedTab('battery')}
            >
              <Text style={[styles.tabText, selectedTab === 'battery' && styles.selectedTabText]}>Battery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'orientation' && styles.selectedTab]}
              onPress={() => setSelectedTab('orientation')}
            >
              <Text style={[styles.tabText, selectedTab === 'orientation' && styles.selectedTabText]}>Orientation</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'temperature' && styles.selectedTab]}
              onPress={() => setSelectedTab('temperature')}
            >
              <Text style={[styles.tabText, selectedTab === 'temperature' && styles.selectedTabText]}>Temperature</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
        
        <View style={styles.chartSection}>
          {selectedTab === 'altitude' && (
            <LogChartItem
              title="Altitude (m)"
              data={seriesData.altitude}
              min={0}
              max={log.maxAltitude * 1.1}
              color="#2196F3"
            />
          )}
          
          {selectedTab === 'speed' && (
            <LogChartItem
              title="Speed (m/s)"
              data={seriesData.speed}
              min={0}
              max={log.maxSpeed * 1.1}
              color="#4CAF50"
            />
          )}
          
          {selectedTab === 'battery' && (
            <LogChartItem
              title="Battery (%)"
              data={seriesData.batteryPercentage}
              min={Math.min(...seriesData.batteryPercentage) * 0.9}
              max={100}
              color="#FFC107"
            />
          )}
          
          {selectedTab === 'orientation' && (
            <>
              <LogChartItem
                title="Pitch (degrees)"
                data={seriesData.pitch}
                min={-30}
                max={30}
                color="#E91E63"
              />
              
              <LogChartItem
                title="Roll (degrees)"
                data={seriesData.roll}
                min={-30}
                max={30}
                color="#9C27B0"
              />
              
              <LogChartItem
                title="Yaw (degrees)"
                data={seriesData.yaw}
                min={0}
                max={360}
                color="#FF9800"
              />
            </>
          )}
          
          {selectedTab === 'temperature' && (
            <>
              <LogChartItem
                title="ESC Temperature (°C)"
                data={seriesData.temperatureESC}
                min={20}
                max={70}
                color="#F44336"
              />
              
              <LogChartItem
                title="MCU Temperature (°C)"
                data={seriesData.temperatureMCU}
                min={20}
                max={60}
                color="#FF9800"
              />
            </>
          )}
        </View>
      </ScrollView>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#BBBBBB',
    marginTop: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 2,
  },
  tabContainer: {
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
  },
  selectedTab: {
    backgroundColor: '#2196F3',
  },
  tabText: {
    color: '#BBBBBB',
    fontSize: 14,
  },
  selectedTabText: {
    color: 'white',
    fontWeight: 'bold',
  },
  chartSection: {
    backgroundColor: '#1E1E1E',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  chartContainer: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartTitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: 'bold',
  },
  chartStats: {
    flexDirection: 'row',
  },
  chartStatLabel: {
    fontSize: 12,
    color: '#BBBBBB',
    marginLeft: 8,
  },
  chartStatValue: {
    color: 'white',
    fontWeight: 'bold',
  },
  chartBox: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 8,
    paddingRight: 4,
  },
  chartY: {
    width: 30,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  chartYLabel: {
    fontSize: 10,
    color: '#999999',
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  chartLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  noDataText: {
    color: '#999999',
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
});

export default LogDetailScreen;