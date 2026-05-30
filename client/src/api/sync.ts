import axios from 'axios';
import { getUnsyncedTransactions, markTransactionSynced, upsertProduct, getProducts, getProductByBarcode } from '../database/sqlite';
import { useAuthStore } from '../store/useStore';
import { Config } from '../constants/config';

const API_URL = Config.apiUrl;

export const syncTransactions = async () => {
  const token = useAuthStore.getState().token;
  if (!token) return;

  console.log("Local syncTransactions disabled");
  return;

  /*
  const unsynced = getUnsyncedTransactions() as any[];
...
      console.log(`Synced transaction ${tx.transaction_id}`);
    } catch (error) {
      console.error(`Failed to sync transaction ${tx.transaction_id}`, error);
    }
  }
  */
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
  product_name?: string;
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
    console.error('Failed to fetch products from server', error);
    // return getProducts(); // Disabled local fallback
    return [];
  }
};

export const fetchAndSyncProducts = async () => {
  const token = useAuthStore.getState().token;
  if (!token) return []; // return getProducts(); // Disabled local fallback

  try {
    const response = await axios.get(`${API_URL}/products`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const products = response.data;
    /* Local sync disabled
    for (const p of products) {
      upsertProduct(p);
    }
    */
    console.log('Products fetched from server');
    return products;
  } catch (error) {
    console.error('Failed to fetch products from server', error);
    return []; // return getProducts(); // Disabled local fallback
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
    // After successful server upsert, update local DB - DISABLED
    // upsertProduct(product);
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

  // Fallback to local disabled
  if (!token) {
    return null; // return getProductByBarcode(barcode);
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
    console.error(`Failed to fetch product ${barcode} from server`, error);
    return null; // return getProductByBarcode(barcode);
  }
};
