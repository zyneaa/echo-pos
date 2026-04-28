import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Title, Button, Text } from 'react-native-paper';
import { useAuthStore } from '../store/useStore';
import { syncTransactions, fetchAndSyncProducts } from '../api/sync';

export default function HomeScreen() {
  const setToken = useAuthStore((state) => state.setToken);
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncTransactions();
      await fetchAndSyncProducts();
      Alert.alert('Success', 'Sync completed.');
    } catch (error) {
      Alert.alert('Error', 'Sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <View className="flex-1 p-5 justify-center items-center bg-gray-100">
      <Title>Modern POS Dashboard</Title>
      <Text style={styles.subtitle}>Welcome back!</Text>
      
      <Button
        mode="contained"
        onPress={handleSync}
        loading={syncing}
        disabled={syncing}
        style={styles.button}
      >
        Sync with Server
      </Button>

      <Button mode="outlined" onPress={() => setToken(null)} style={styles.button}>
        Logout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginBottom: 30,
  },
  button: {
    marginTop: 10,
    width: '100%',
  },
});
