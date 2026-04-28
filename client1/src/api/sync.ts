import axios from 'axios';
import { getUnsyncedTransactions, markTransactionSynced, upsertProduct } from '../database/sqlite';
import { useAuthStore } from '../store/useStore';

const API_URL = 'http://192.168.1.3:8080';

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

export const fetchAndSyncProducts = async () => {
  const token = useAuthStore.getState().token;
  if (!token) return;

  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const products = response.data;
    for (const p of products) {
      upsertProduct(p);
    }
    console.log('Products synced from server');
  } catch (error) {
    console.error('Failed to fetch products from server', error);
  }
};
