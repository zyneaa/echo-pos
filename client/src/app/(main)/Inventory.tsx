import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    Pressable,
    FlatList,
    ActivityIndicator,
    Modal,
    Dimensions
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Search, Plus, Package, RefreshCcw, Edit2, X, Info, Calendar, DollarSign, Layers } from 'lucide-react-native';
import { fetchAndSyncProducts, fetchProductsFromServer } from '@/api/sync';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const ProductCard = ({ item, onPress, onEdit }: { item: any; onPress: () => void; onEdit: () => void }) => {
    const isExhausted = item.stock_quantity === 0;
    const isAlert = item.stock_quantity <= item.alert_stock;

    const cardStyle = [
        styles.productCard,
        isAlert && { borderColor: '#FF0000' },
        isExhausted && { backgroundColor: '#FF0000', borderColor: '#FF0000' }
    ];

    const textColor = isExhausted ? Colors.white : Colors.text;
    const secondaryTextColor = isExhausted ? 'rgba(255,255,255,0.7)' : Colors.textSecondary;

    return (
        <Pressable onPress={onPress} style={cardStyle}>
            <View style={[styles.productInfo, isExhausted && { borderColor: 'rgba(255,255,255,0.3)' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.productName, { color: textColor }]}>{item.name}</Text>
                        <View style={[styles.badge, isExhausted && { backgroundColor: Colors.white }]}>
                            <Text style={[styles.badgeText, isExhausted && { color: '#FF0000' }]}>{item.barcode_id}</Text>
                        </View>
                    </View>
                    <Pressable onPress={onEdit} style={[styles.cardEditButton, isExhausted && { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: Colors.white }]}>
                        <Edit2 size={20} color={Colors.white} strokeWidth={3} />
                    </Pressable>
                </View>
            </View>
            <View style={styles.productStats}>
                <View style={[styles.statBox, isExhausted && { borderColor: 'rgba(255,255,255,0.3)' }]}>
                    <Text style={[styles.statLabel, { color: secondaryTextColor }]}>PRICE (MMK)</Text>
                    <Text style={[styles.statValue, { color: textColor }]}>{item.price_mmk.toLocaleString()}</Text>
                </View>
                <View style={[styles.statBox, { borderLeftWidth: 4 }, isExhausted && { borderColor: 'rgba(255,255,255,0.3)' }]}>
                    <Text style={[styles.statLabel, { color: secondaryTextColor }]}>STOCK</Text>
                    <Text style={[styles.statValue, { color: isExhausted ? Colors.white : (isAlert ? '#FF0000' : Colors.text) }]}>
                        {item.stock_quantity}
                    </Text>
                </View>
            </View>
        </Pressable>
    );
};

export default function InventoryScreen() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

    const loadProducts = async () => {
        setLoading(true);
        try {
            const data = await fetchProductsFromServer();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const data = await fetchAndSyncProducts();
            setProducts(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleEdit = (product: any) => {
        setSelectedProduct(null);
        router.push({
            pathname: '/Scanner',
            params: { barcode: product.barcode_id, autoEdit: 'true' }
        });
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode_id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <View style={styles.searchInputWrapper}>
                    <Search size={20} color={Colors.text} style={styles.searchIcon} strokeWidth={3} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="SEARCH"
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <Pressable onPress={handleSync} disabled={isSyncing} style={[styles.addButton, { backgroundColor: Colors.white }]}>
                    {isSyncing ? <ActivityIndicator color={Colors.text} /> : <RefreshCcw size={24} color={Colors.text} strokeWidth={3} />}
                </Pressable>
                <Pressable style={styles.addButton} onPress={() => router.push('/Scanner')}>
                    <Plus size={24} color={Colors.white} strokeWidth={4} />
                </Pressable>
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <ProductCard
                        item={item}
                        onPress={() => setSelectedProduct(item)}
                        onEdit={() => handleEdit(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshing={loading}
                onRefresh={loadProducts}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Package size={64} color={Colors.textSecondary} strokeWidth={1} />
                        <Text style={styles.emptyText}>NO PRODUCTS FOUND</Text>
                    </View>
                }
            />

            {/* Product Detail Modal */}
            <Modal
                visible={!!selectedProduct}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedProduct(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Info size={24} color={Colors.white} strokeWidth={3} />
                                <Text style={styles.modalTitle}>PRODUCT DETAILS</Text>
                            </View>
                            <Pressable onPress={() => setSelectedProduct(null)} style={styles.modalClose}>
                                <X size={24} color={Colors.white} strokeWidth={4} />
                            </Pressable>
                        </View>

                        {selectedProduct && (
                            <View style={styles.detailContainer}>
                                <View style={styles.detailHero}>
                                    <Text style={styles.detailName}>{selectedProduct.name}</Text>
                                    <View style={[styles.badge, { backgroundColor: Colors.primary, marginTop: 8 }]}>
                                        <Text style={styles.badgeText}>{selectedProduct.barcode_id}</Text>
                                    </View>
                                </View>

                                <View style={styles.detailGrid}>
                                    <View style={styles.detailItem}>
                                        <View style={styles.detailIconWrapper}>
                                            <DollarSign size={20} color={Colors.text} strokeWidth={3} />
                                        </View>
                                        <View>
                                            <Text style={styles.detailLabel}>SELL PRICE</Text>
                                            <Text style={styles.detailValue}>{selectedProduct.price_mmk.toLocaleString()} MMK</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <View style={styles.detailIconWrapper}>
                                            <Layers size={20} color={Colors.text} strokeWidth={3} />
                                        </View>
                                        <View>
                                            <Text style={styles.detailLabel}>CURRENT STOCK</Text>
                                            <Text style={[styles.detailValue, selectedProduct.stock_quantity < selectedProduct.alert_stock && { color: '#FF0000' }]}>
                                                {selectedProduct.stock_quantity} UNITS
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <View style={styles.detailIconWrapper}>
                                            <Calendar size={20} color={Colors.text} strokeWidth={3} />
                                        </View>
                                        <View>
                                            <Text style={styles.detailLabel}>EXPIRY DATE</Text>
                                            <Text style={styles.detailValue}>
                                                {selectedProduct.expire_at ? selectedProduct.expire_at.split('T')[0] : 'N/A'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <View style={styles.detailIconWrapper}>
                                            <Package size={20} color={Colors.text} strokeWidth={3} />
                                        </View>
                                        <View>
                                            <Text style={styles.detailLabel}>COST PRICE</Text>
                                            <Text style={styles.detailValue}>{selectedProduct.cost_price_mmk.toLocaleString()} MMK</Text>
                                        </View>
                                    </View>
                                </View>

                                {selectedProduct.description && (
                                    <View style={styles.descriptionBox}>
                                        <Text style={styles.detailLabel}>DESCRIPTION</Text>
                                        <Text style={styles.descriptionText}>{selectedProduct.description}</Text>
                                    </View>
                                )}

                                <Pressable
                                    style={styles.editFullButton}
                                    onPress={() => handleEdit(selectedProduct)}
                                >
                                    <Edit2 size={24} color={Colors.white} strokeWidth={3} />
                                    <Text style={styles.editFullButtonText}>EDIT PRODUCT</Text>
                                </Pressable>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundElement,
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 24,
        gap: 16,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 8,
        borderRightWidth: 8,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 50,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },
    addButton: {
        width: 58,
        height: 58,
        backgroundColor: Colors.primary,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 8,
        borderRightWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 24,
        paddingTop: 0,
        paddingBottom: 120,
    },
    productCard: {
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        marginBottom: 24,
        borderBottomWidth: 10,
        borderRightWidth: 10,
    },
    productInfo: {
        padding: 16,
        borderBottomWidth: 4,
        borderColor: Colors.text,
    },
    productName: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
        flex: 1,
        paddingRight: 1
    },
    badge: {
        backgroundColor: Colors.text,
        paddingHorizontal: 8,
        paddingVertical: 2,
        alignSelf: 'flex-start',
    },
    badgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: '900',
    },
    cardEditButton: {
        backgroundColor: Colors.text,
        padding: 8,
        borderWidth: 2,
        borderColor: Colors.text,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    productStats: {
        flexDirection: 'row',
    },
    statBox: {
        flex: 1,
        padding: 12,
        borderColor: Colors.text,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.textSecondary,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 12,
        borderRightWidth: 12,
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
        letterSpacing: 2,
    },
    modalClose: {
        padding: 4,
    },
    detailContainer: {
        padding: 20,
    },
    detailHero: {
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 2,
        borderColor: Colors.backgroundElement,
    },
    detailName: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
    },
    detailGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
    },
    detailItem: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    detailIconWrapper: {
        width: 40,
        height: 40,
        backgroundColor: Colors.backgroundElement,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.text,
    },
    detailLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
    descriptionBox: {
        backgroundColor: Colors.backgroundElement,
        padding: 16,
        borderWidth: 2,
        borderColor: Colors.text,
        marginBottom: 24,
    },
    descriptionText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.text,
        marginTop: 4,
    },
    editFullButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 16,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 8,
        borderRightWidth: 8,
    },
    editFullButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
    }
});

