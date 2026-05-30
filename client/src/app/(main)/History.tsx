import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '@/constants/theme';
import { 
  Search, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  ArrowRight,
  CreditCard,
  Banknote
} from 'lucide-react-native';
import { fetchTransactionsFromServer } from '@/api/sync';
import { globalStyle } from '@/constants/globalStyle';

const PAGE_SIZE = 10;

interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_mmk: number;
}

interface Transaction {
  id: string;
  total_amount_mmk: number;
  payment_method: string;
  items: TransactionItem[];
  created_at: string;
  cashier_id: string;
}

export default function HistoryScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [amountFilter, setAmountFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Calendar states
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());

  const loadTransactions = async (newOffset = 0) => {
    if (newOffset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const filters: any = {
        limit: PAGE_SIZE,
        offset: newOffset
      };
      if (amountFilter) filters.min_amount = parseInt(amountFilter);
      if (dateFilter) {
        filters.start = `${dateFilter}T00:00:00Z`;
        filters.end = `${dateFilter}T23:59:59Z`;
      }
      
      const data = await fetchTransactionsFromServer(filters);
      
      if (newOffset === 0) {
        setTransactions(data || []);
      } else {
        setTransactions(prev => [...prev, ...(data || [])]);
      }

      setHasMore(data && data.length === PAGE_SIZE);
      setOffset(newOffset);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadTransactions(0);
  }, [amountFilter, dateFilter]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      loadTransactions(offset + PAGE_SIZE);
    }
  };

  const handleDateSelect = (day: number) => {
    const d = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    setDateFilter(`${yyyy}-${mm}-${dd}`);
    setIsCalendarVisible(false);
  };

  const changeMonth = (offset: number) => {
    const next = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1);
    setCurrentViewDate(next);
  };

  const calendarDays = useMemo(() => {
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentViewDate]);

  const monthName = currentViewDate.toLocaleString('default', { month: 'long' }).toUpperCase();

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.transactionItem,
        globalStyle.brutalistBox,
        pressed && globalStyle.brutalistBoxPressed
      ]}
      onPress={() => setSelectedTransaction(item)}
    >
      <View style={styles.transactionHeader}>
        <View style={styles.paymentMethod}>
          {item.payment_method === 'CASH' ? (
            <Banknote size={20} color={Colors.text} />
          ) : (
            <CreditCard size={20} color={Colors.text} />
          )}
          <Text style={styles.methodText}>{item.payment_method}</Text>
        </View>
        <Text style={styles.timestampText}>{new Date(item.created_at).toLocaleString()}</Text>
      </View>
      <View style={styles.transactionBody}>
        <Text style={styles.amountText}>{item.total_amount_mmk.toLocaleString()} MMK</Text>
        <ArrowRight size={20} color={Colors.text} />
      </View>
      <Text style={styles.idText}>ID: {item.id.slice(0, 8)}...</Text>
    </Pressable>
  );

  const TransactionDetailsModal = () => {
    if (!selectedTransaction) return null;

    return (
      <Modal
        visible={!!selectedTransaction}
        transparent={true}
        animationType="none"
        onRequestClose={() => setSelectedTransaction(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, globalStyle.brutalistBox]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>TRANSACTION DETAILS</Text>
              <Pressable onPress={() => setSelectedTransaction(null)} style={styles.closeButton}>
                <X size={24} color={Colors.white} strokeWidth={4} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>TIMESTAMP</Text>
                <Text style={styles.detailValue}>{new Date(selectedTransaction.created_at).toLocaleString()}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>PAYMENT METHOD</Text>
                <Text style={styles.detailValue}>{selectedTransaction.payment_method}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>ITEMS</Text>
                {selectedTransaction.items?.map((item: any, index: number) => (
                  <View key={index} style={styles.itemRow}>
                    <Text style={styles.itemName}>{item.product_name} x {item.quantity}</Text>
                    <Text style={styles.itemPrice}>{(item.unit_price_mmk * item.quantity).toLocaleString()} MMK</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.detailSection, styles.totalSection]}>
                <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
                <Text style={styles.totalValue}>{selectedTransaction.total_amount_mmk.toLocaleString()} MMK</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>TRANSACTION ID</Text>
                <Text style={styles.detailValue}>{selectedTransaction.id}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <View style={[styles.searchBox, globalStyle.brutalistBox]}>
          <Search size={20} color={Colors.text} />
          <TextInput
            style={styles.searchInput}
            placeholder="FILTER BY MIN AMOUNT"
            keyboardType="numeric"
            value={amountFilter}
            onChangeText={setAmountFilter}
          />
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.dateButton, 
            globalStyle.brutalistBox,
            pressed && globalStyle.brutalistBoxPressed
          ]}
          onPress={() => setIsCalendarVisible(true)}
        >
          <CalendarIcon size={20} color={Colors.text} />
          <Text style={styles.dateButtonText}>
            {dateFilter || 'SELECT DATE'}
          </Text>
          {dateFilter ? (
            <Pressable onPress={(e) => { e.stopPropagation(); setDateFilter(''); }}>
              <X size={16} color={Colors.text} />
            </Pressable>
          ) : null}
        </Pressable>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={() => loadTransactions(0)}
        refreshing={loading}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => loadingMore ? (
            <View style={styles.loaderContainer}>
                <ActivityIndicator color={Colors.primary} size="large" />
            </View>
        ) : null}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>NO TRANSACTIONS FOUND</Text>
            </View>
          ) : null
        }
      />

      {/* Calendar Modal */}
      <Modal
        visible={isCalendarVisible}
        transparent={true}
        animationType="none"
        onRequestClose={() => setIsCalendarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.calendarModal, globalStyle.brutalistBox]}>
            <View style={styles.calendarHeader}>
              <Pressable onPress={() => changeMonth(-1)}><ChevronLeft size={24} color={Colors.white} /></Pressable>
              <Text style={styles.calendarTitle}>{monthName} {currentViewDate.getFullYear()}</Text>
              <Pressable onPress={() => changeMonth(1)}><ChevronRight size={24} color={Colors.white} /></Pressable>
            </View>
            
            <View style={styles.weekDays}>
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <Text key={i} style={styles.weekDayText}>{d}</Text>
              ))}
            </View>

            <View style={styles.daysGrid}>
              {calendarDays.map((day, i) => (
                <Pressable
                  key={i}
                  style={[styles.dayCell, !day && { opacity: 0 }]}
                  disabled={!day}
                  onPress={() => day && handleDateSelect(day)}
                >
                  <Text style={styles.dayText}>{day}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable 
              style={styles.closeCalendarButton}
              onPress={() => setIsCalendarVisible(false)}
            >
              <Text style={styles.closeCalendarButtonText}>CANCEL</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TransactionDetailsModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundElement,
  },
  filterContainer: {
    padding: 16,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: Colors.text,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: Colors.text,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
    gap: 16,
  },
  transactionItem: {
    backgroundColor: Colors.white,
    padding: 16,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.text,
  },
  timestampText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: 'bold',
  },
  transactionBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amountText: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.text,
  },
  idText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  loaderContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 45, 78, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    backgroundColor: Colors.text,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderColor: Colors.border,
    paddingBottom: 8,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    color: Colors.text,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  totalSection: {
    borderBottomWidth: 0,
    backgroundColor: Colors.backgroundElement,
    padding: 12,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.text,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.primary,
  },
  calendarModal: {
    backgroundColor: Colors.white,
    padding: 0,
  },
  calendarHeader: {
    backgroundColor: Colors.text,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  calendarTitle: {
    color: Colors.white,
    fontWeight: '900',
    fontSize: 14,
  },
  weekDays: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderColor: Colors.text,
    backgroundColor: Colors.backgroundElement,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    fontSize: 10,
    fontWeight: '900',
    color: Colors.text,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  dayText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  closeCalendarButton: {
    backgroundColor: Colors.backgroundElement,
    padding: 16,
    alignItems: 'center',
  },
  closeCalendarButtonText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.text,
  }
});
