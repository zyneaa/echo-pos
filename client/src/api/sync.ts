import axios from 'axios';
import { getUnsyncedTransactions, markTransactionSynced, upsertProduct, getProducts, getProductByBarcode } from '../database/sqlite';
import { useAuthStore } from '../store/useStore';
import { Config } from '../constants/config';

const API_URL = Config.apiUrl;

export const syncTransactions = async () => {
  const token = useAuthStore.getState().token;
  if (!token) return;

  const unsynced = getUnsyncedTransactions() as any[];
  for (const tx of unsynced) {
    try {
      // items are stored as JSON string in SQLite
      const payload = {
        ...tx,
        items: JSON.parse(tx.items),
      };

      await axios.post(`${API_URL}/transactions`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      markTransactionSynced(tx.transaction_id);
      console.log(`Synced transaction ${tx.transaction_id}`);
    } catch (error) {
      console.error(`Failed to sync transaction ${tx.transaction_id}`, error);
    }
  }
};

export const fetchProductsFromServer = async () => {
  const token = useAuthStore.getState().token;
  
  // Fallback to local if not logged in
  if (!token) {
    console.log('No token, returning local products');
    return getProducts();
  }

  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch products from server, falling back to local', error);
    return getProducts();
  }
};

export const fetchAndSyncProducts = async () => {
  const token = useAuthStore.getState().token;
  if (!token) return getProducts();

  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const products = response.data;
    // Local sync re-enabled after fixing schema errors
    for (const p of products) {
      upsertProduct(p);
    }
    console.log('Products synced from server');
    return products;
  } catch (error) {
    console.error('Failed to fetch and sync products from server', error);
    return getProducts();
  }
};

export const createTransactionOnServer = async (transaction: any) => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token found');

  try {
    await axios.post(`${API_URL}/transactions`, transaction, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`Transaction ${transaction.transaction_id} created on server`);
  } catch (error) {
    console.error(`Failed to create transaction ${transaction.transaction_id} on server`, error);
    throw error;
  }
};

export const upsertProductToServer = async (product: any) => {
  const token = useAuthStore.getState().token;
  if (!token) {
    throw new Error('No auth token found');
  }

  try {
    await axios.post(`${API_URL}/products`, product, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`Product ${product.barcode_id} upserted to server`);
    // After successful server upsert, update local DB
    upsertProduct(product);
  } catch (error) {
    console.error(`Failed to upsert product ${product.barcode_id} to server`, error);
    throw error;
  }
};

export const fetchProductByBarcodeFromServer = async (barcode: string) => {
  const token = useAuthStore.getState().token;
  
  // Fallback to local if no token
  if (!token) {
    return getProductByBarcode(barcode);
  }

  try {
    const response = await axios.get(`${API_URL}/products/${barcode}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error(`Failed to fetch product ${barcode} from server, trying local`, error);
    return getProductByBarcode(barcode);
  }
};
