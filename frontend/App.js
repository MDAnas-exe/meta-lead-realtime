import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

    return () => {
      socket.disconnect();
    };
  }, []);

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
      <Text style={styles.subtitle}>
        {isConnected ? 'Waiting for leads...' : 'Connecting...'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
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
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});