import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Title, Card } from 'react-native-paper';
import { upsertProduct } from '../database/sqlite';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function InventoryScreen() {
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState('');
  const [price, setPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [alertStock, setAlertStock] = useState('');
  const [expireAt, setExpireAt] = useState(new Date().toISOString());
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    if (!barcode || !name || !price || !stock || !costPrice) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const product = {
        id: uuidv4(),
        barcode_id: barcode,
        name,
        description,
        type_id: typeId,
        price_mmk: parseInt(price),
        cost_price_mmk: parseInt(costPrice),
        stock_quantity: parseInt(stock),
        alert_stock: parseInt(alertStock) || 0,
        expire_at: expireAt,
        image_url: '', // Add image upload later
      };

      upsertProduct(product);
      Alert.alert('Success', 'Product saved locally.');
      clearForm();
    } catch (error) {
      Alert.alert('Error', 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setBarcode('');
    setName('');
    setDescription('');
    setTypeId('');
    setPrice('');
    setCostPrice('');
    setStock('');
    setAlertStock('');
    setExpireAt(new Date().toISOString());
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Manage Inventory</Title>
          <TextInput
            label="Barcode ID"
            value={barcode}
            onChangeText={setBarcode}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Product Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            mode="outlined"
            multiline
          />
          <TextInput
            label="Type ID"
            value={typeId}
            onChangeText={setTypeId}
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Sale Price (MMK)"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Cost Price (MMK)"
            value={costPrice}
            onChangeText={setCostPrice}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Stock Quantity"
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Alert Stock Level"
            value={alertStock}
            onChangeText={setAlertStock}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Expire At (ISO Date)"
            value={expireAt}
            onChangeText={setExpireAt}
            style={styles.input}
            mode="outlined"
          />
          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            style={styles.button}
          >
            Save Product
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  card: {
    padding: 10,
  },
  input: {
    marginBottom: 10,
  },
  button: {
    marginTop: 10,
    paddingVertical: 5,
  },
});
