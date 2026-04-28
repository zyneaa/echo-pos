import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Button, Card, Title, Paragraph, IconButton, TextInput } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCartStore } from '../store/useStore';
import { getProductByBarcode, insertTransaction } from '../database/sqlite';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function CheckoutScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { items, addItem, removeItem, clearCart, total } = useCartStore();
  const [scanned, setScanned] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const scannerInputRef = useRef<any>(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission}>Grant Permission</Button>
      </View>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    processBarcode(data);
    setTimeout(() => setScanned(false), 2000); // Wait 2s before next scan
  };

  const processBarcode = (barcode: string) => {
    const product = getProductByBarcode(barcode);
    if (product) {
      addItem(product as any);
    } else {
      Alert.alert('Not Found', `Product with barcode ${barcode} not found.`);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) return;

    const transaction = {
      transaction_id: uuidv4(),
      total_amount_mmk: total,
      payment_method: 'Cash',
      items: items.map(i => ({
        product_id: i.id,
        quantity: i.quantity,
        price_at_time_of_sale: i.price_mmk
      })),
      cashier_id: 'temp-cashier-id' // Should come from auth store
    };

    insertTransaction(transaction);
    clearCart();
    Alert.alert('Success', 'Transaction completed locally.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        <View style={styles.scannerOverlay}>
          <Text style={styles.overlayText}>Scan Barcode</Text>
        </View>
      </View>

      <View style={styles.cartContainer}>
        <Title style={styles.title}>Cart (Total: {total.toLocaleString()} MMK)</Title>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View>
                  <Text variant="titleMedium">{item.name}</Text>
                  <Text variant="bodySmall">{item.price_mmk.toLocaleString()} MMK x {item.quantity}</Text>
                </View>
                <IconButton icon="delete" onPress={() => removeItem(item.id)} />
              </Card.Content>
            </Card>
          )}
        />
        
        <View style={styles.footer}>
          <TextInput
            ref={scannerInputRef}
            label="Manual/Scanner Input"
            value={manualBarcode}
            onChangeText={setManualBarcode}
            onSubmitEditing={() => {
              processBarcode(manualBarcode);
              setManualBarcode('');
            }}
            style={styles.manualInput}
            mode="outlined"
            autoFocus
          />
          <View style={styles.buttonGroup}>
            <Button mode="outlined" onPress={clearCart} style={styles.actionButton}>Clear</Button>
            <Button mode="contained" onPress={handleCheckout} style={[styles.actionButton, { flex: 2 }]}>Checkout</Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  overlayText: {
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  cartContainer: {
    flex: 1.2,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  title: {
    marginBottom: 10,
  },
  card: {
    marginBottom: 8,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    marginTop: 10,
  },
  manualInput: {
    marginBottom: 10,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingVertical: 5,
  },
});
