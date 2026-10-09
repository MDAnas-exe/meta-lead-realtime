import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
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
      setLeads([
        {
          id: Date.now().toString(),
          receivedAt: new Date().toLocaleTimeString(),
          ...newLead,
        },
        ...leads,
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
        <View style={[styles.badge, isConnected ? styles.badgeLive : styles.badgeDead]}>
          <Text style={styles.badgeText}>
            {isConnected ? 'Live' : 'Disconnected'}
          </Text>
        </View>
      </View>
      <FlatList
        data={leads}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{isConnected ? 'Waiting for leads...' : 'Connecting...'}</Text>
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
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeLive: {
    backgroundColor: '#e8f5e9',
  },
  badgeDead: {
    backgroundColor: '#fbe9e7',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  list: {
    paddingBottom: 20,
  },
  empty: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
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