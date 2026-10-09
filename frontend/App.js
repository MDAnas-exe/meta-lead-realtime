import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { io } from 'socket.io-client';
import { SERVER_URL } from './config';

export default function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    const socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    socket.on('lead', (newLead) => {
      setLeads((prevLeads) => [
        {
          id: Date.now().toString(),
          receivedAt: new Date().toLocaleTimeString(),
          ...newLead,
        },
        ...prevLeads,
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTime}>{item.receivedAt}</Text>
        <View style={[styles.badge, isConnected ? styles.badgeLive : styles.badgeDead]}>
          <Text style={styles.badgeText}>
            {isConnected ? 'Live' : 'Disconnected'}
          </Text>
        </View>
      </View>
      <Text style={styles.cardField}><Text style={styles.label}>Lead ID:</Text> {item.id || '—'}</Text>
      <Text style={styles.cardField}><Text style={styles.label}>Name:</Text> {item.full_name || item.name || '—'}</Text>
      <Text style={styles.cardField}><Text style={styles.label}>Email:</Text> {item.email || '—'}</Text>
      <Text style={styles.cardField}><Text style={styles.label}>Phone:</Text> {item.phone_number || item.phone || '—'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lead Sync</Text>
        <View style={styles.statusRow}>
          {isConnected ? (
            <View style={styles.liveIndicator}>
              <View style={styles.pulseDot} />
              <Text style={styles.statusText}>Live</Text>
            </View>
          ) : (
            <View style={styles.connectingIndicator}>
              <ActivityIndicator size="small" color="#ff9800" />
              <Text style={styles.statusText}>Connecting...</Text>
            </View>
          )}
        </View>
      </View>
      <FlatList
        data={leads}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isConnected ? (
              <Text style={styles.empty}>Waiting for leads...</Text>
            ) : (
              <Text style={styles.empty}>Connecting to server...</Text>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  connectingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4caf50',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2e7d32',
  },
  list: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTime: {
    fontSize: 12,
    color: '#888',
  },
  cardField: {
    fontSize: 14,
    marginVertical: 2,
    color: '#333',
  },
  label: {
    fontWeight: '600',
  },
});