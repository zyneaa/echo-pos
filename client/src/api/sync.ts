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
      // items are stored as JSON string in SQLite in the local format:
      // { id, name, quantity, price_mmk }
      const rawItems = JSON.parse(tx.items || '[]');

      // Map local transaction shape to server Transaction / TransactionItem models
      const payload = {
        id: tx.transaction_id,
        total_amount_mmk: tx.total_amount_mmk,
        payment_method: tx.payment_method,
        cashier_id: tx.cashier_id,
        items: rawItems.map((item: any) => ({
          id: item.id,
          transaction_id: tx.transaction_id,
          product_id: item.id,
          quantity: item.quantity,
          unit_price_mmk: item.price_mmk,
        })),
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

export const fetchProductTypesFromServer = async () => {
  const token = useAuthStore.getState().token;
  try {
    const response = await axios.get(`${API_URL}/product-types`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch product types', error);
    return [];
  }
};

export const fetchProductsFromServer = async (filters?: {
  name?: string;
  type_id?: string;
  min_stock?: number;
  max_stock?: number;
  min_price?: number;
  max_price?: number;
  min_cost?: number;
  max_cost?: number;
  limit?: number;
  offset?: number;
}) => {
  const token = useAuthStore.getState().token;

  try {
    let url = `${API_URL}/products`;
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
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

  // Support both local (transaction_id + items with price_mmk) and
  // already-normalized shapes (id + items with unit_price_mmk)
  const id = transaction.id ?? transaction.transaction_id;
  const cashierId = transaction.cashier_id;
  const items = (transaction.items || []).map((item: any) => ({
    id: item.id,
    transaction_id: id,
    product_id: item.product_id ?? item.id,
    quantity: item.quantity,
    unit_price_mmk: item.unit_price_mmk ?? item.price_mmk,
  }));

  const payload = {
    id,
    total_amount_mmk: transaction.total_amount_mmk,
    payment_method: transaction.payment_method,
    cashier_id: cashierId,
    items,
  };

  try {
    await axios.post(`${API_URL}/transactions`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log(`Transaction ${id} created on server`);
  } catch (error) {
    console.error(`Failed to create transaction ${id} on server`, error);
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

export const fetchTransactionsFromServer = async (filters?: {
  start?: string;
  end?: string;
  min_amount?: number;
  limit?: number;
  offset?: number;
}) => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No auth token found');

  try {
    let url = `${API_URL}/transactions`;
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch transactions from server', error);
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
