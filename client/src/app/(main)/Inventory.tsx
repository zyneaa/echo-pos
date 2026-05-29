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
    Dimensions,
    ScrollView
} from 'react-native';
import { Colors } from '@/constants/theme';
import {
    Search,
    Plus,
    Package,
    RefreshCcw,
    Edit2,
    X,
    Info,
    Calendar,
    DollarSign,
    Layers,
    Filter,
} from 'lucide-react-native';
import { fetchAndSyncProducts, fetchProductsFromServer, fetchProductTypesFromServer } from '@/api/sync';
import { useRouter } from 'expo-router';
import { globalStyle } from '@/constants/globalStyle';

const { height } = Dimensions.get('window');
const PAGE_SIZE = 10;

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
    const [loadingMore, setLoadingMore] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // Filter States
    const [isFilterVisible, setIsFilterVisible] = useState(false);
    const [productTypes, setProductTypes] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        type_id: '',
        min_stock: '',
        max_stock: '',
        min_price: '',
        max_price: '',
    });
    const [activeFilters, setActiveFilters] = useState<any>({});

    const loadProducts = async (newOffset = 0, currentFilters = activeFilters) => {
        if (newOffset === 0) setLoading(true);
        else setLoadingMore(true);

        try {
            const data = await fetchProductsFromServer({
                name: search,
                limit: PAGE_SIZE,
                offset: newOffset,
                ...currentFilters
            });

            if (newOffset === 0) {
                setProducts(data || []);
            } else {
                setProducts(prev => [...prev, ...(data || [])]);
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

    const loadProductTypes = async () => {
        const data = await fetchProductTypesFromServer();
        setProductTypes(data || []);
    };

    useEffect(() => {
        loadProductTypes();
        loadProducts(0);
    }, []);

    // Re-load when search changes
    useEffect(() => {
        const timeout = setTimeout(() => {
            loadProducts(0);
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await fetchAndSyncProducts();
            loadProducts(0);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore && !loading) {
            loadProducts(offset + PAGE_SIZE);
        }
    };

    const applyFilters = () => {
        const newFilters: any = {};
        if (filters.type_id) newFilters.type_id = filters.type_id;
        if (filters.min_stock) newFilters.min_stock = parseInt(filters.min_stock);
        if (filters.max_stock) newFilters.max_stock = parseInt(filters.max_stock);
        if (filters.min_price) newFilters.min_price = parseInt(filters.min_price);
        if (filters.max_price) newFilters.max_price = parseInt(filters.max_price);

        setActiveFilters(newFilters);
        setIsFilterVisible(false);
        loadProducts(0, newFilters);
    };

    const resetFilters = () => {
        const emptyFilters = {
            type_id: '',
            min_stock: '',
            max_stock: '',
            min_price: '',
            max_price: '',
        };
        setFilters(emptyFilters);
        setActiveFilters({});
        setIsFilterVisible(false);
        loadProducts(0, {});
    };

    const handleEdit = (product: any) => {
        setSelectedProduct(null);
        router.push({
            pathname: '/Scanner',
            params: { barcode: product.barcode_id, autoEdit: 'true' }
        });
    };

    const FilterModal = () => (
        <Modal
            visible={isFilterVisible}
            transparent={true}
            animationType="none"
            onRequestClose={() => setIsFilterVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, globalStyle.brutalistBox]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>ADVANCED FILTERS</Text>
                        <Pressable onPress={() => setIsFilterVisible(false)}>
                            <X size={24} color={Colors.white} strokeWidth={4} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <Text style={styles.filterLabel}>PRODUCT TYPE</Text>
                        <View style={styles.typeGrid}>
                            <Pressable
                                style={[styles.typeItem, filters.type_id === '' && styles.typeItemActive]}
                                onPress={() => setFilters(prev => ({ ...prev, type_id: '' }))}
                            >
                                <Text style={[styles.typeText, filters.type_id === '' && styles.typeTextActive]}>ALL</Text>
                            </Pressable>
                            {productTypes.map(t => (
                                <Pressable
                                    key={t.id}
                                    style={[styles.typeItem, filters.type_id === t.id && styles.typeItemActive]}
                                    onPress={() => setFilters(prev => ({ ...prev, type_id: t.id }))}
                                >
                                    <Text style={[styles.typeText, filters.type_id === t.id && styles.typeTextActive]}>{t.type_name}</Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={styles.filterLabel}>STOCK QUANTITY</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.filterInput, { flex: 1 }]}
                                placeholder="MIN"
                                keyboardType="numeric"
                                value={filters.min_stock}
                                onChangeText={text => setFilters(prev => ({ ...prev, min_stock: text }))}
                            />
                            <Text style={styles.inputSeparator}>-</Text>
                            <TextInput
                                style={[styles.filterInput, { flex: 1 }]}
                                placeholder="MAX"
                                keyboardType="numeric"
                                value={filters.max_stock}
                                onChangeText={text => setFilters(prev => ({ ...prev, max_stock: text }))}
                            />
                        </View>

                        <Text style={styles.filterLabel}>SELL PRICE (MMK)</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.filterInput, { flex: 1 }]}
                                placeholder="MIN"
                                keyboardType="numeric"
                                value={filters.min_price}
                                onChangeText={text => setFilters(prev => ({ ...prev, min_price: text }))}
                            />
                            <Text style={styles.inputSeparator}>-</Text>
                            <TextInput
                                style={[styles.filterInput, { flex: 1 }]}
                                placeholder="MAX"
                                keyboardType="numeric"
                                value={filters.max_price}
                                onChangeText={text => setFilters(prev => ({ ...prev, max_price: text }))}
                            />
                        </View>
                    </ScrollView>

                    <View style={styles.modalFooter}>
                        <Pressable style={styles.resetButton} onPress={resetFilters}>
                            <Text style={styles.resetButtonText}>RESET</Text>
                        </Pressable>
                        <Pressable style={styles.applyButton} onPress={applyFilters}>
                            <Text style={styles.applyButtonText}>APPLY</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.searchRow}>
                    <View style={styles.searchInputWrapper}>
                        <Search size={20} color={Colors.text} style={styles.searchIcon} strokeWidth={3} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="SEARCH PRODUCTS..."
                            placeholderTextColor={Colors.textSecondary}
                            value={search}
                            onChangeText={setSearch}
                        />
                    </View>
                    <Pressable
                        style={[styles.actionButton, activeFilters && Object.keys(activeFilters).length > 0 && { backgroundColor: '#FFFF00' }]}
                        onPress={() => setIsFilterVisible(true)}
                    >
                        <Filter size={24} color={Colors.text} strokeWidth={3} />
                    </Pressable>
                </View>

                <View style={styles.actionsRow}>
                    <Pressable onPress={handleSync} disabled={isSyncing} style={[styles.secondaryButton, { flex: 1 }]}>
                        {isSyncing ? <ActivityIndicator color={Colors.text} /> : (
                            <>
                                <RefreshCcw size={20} color={Colors.text} strokeWidth={3} />
                                <Text style={styles.buttonText}>SYNC SERVER</Text>
                            </>
                        )}
                    </Pressable>
                    <Pressable style={[styles.primaryButton, { flex: 1 }]} onPress={() => router.push('/Scanner')}>
                        <Plus size={20} color={Colors.white} strokeWidth={4} />
                        <Text style={[styles.buttonText, { color: Colors.white }]}>ADD NEW</Text>
                    </Pressable>
                </View>
            </View>

            <FlatList
                data={products}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <ProductCard
                        item={item}
                        onPress={() => setSelectedProduct(item)}
                        onEdit={() => handleEdit(item)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                onRefresh={() => loadProducts(0)}
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
                        <View style={styles.emptyState}>
                            <Package size={64} color={Colors.textSecondary} strokeWidth={1} />
                            <Text style={styles.emptyText}>NO PRODUCTS FOUND</Text>
                        </View>
                    ) : null
                }
            />

            <FilterModal />

            {/* Product Detail Modal */}
            <Modal
                visible={!!selectedProduct}
                transparent={true}
                animationType="none"
                onRequestClose={() => setSelectedProduct(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, globalStyle.brutalistBox]}>
                        <View style={styles.modalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Info size={24} color={Colors.white} strokeWidth={3} />
                                <Text style={styles.modalTitle}>PRODUCT DETAILS</Text>
                            </View>
                            <Pressable onPress={() => setSelectedProduct(null)}>
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
                                            <Text style={[styles.detailValue, selectedProduct.stock_quantity <= selectedProduct.alert_stock && { color: '#FF0000' }]}>
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
    header: {
        padding: 24,
        paddingBottom: 0,
        gap: 16,
    },
    searchRow: {
        flexDirection: 'row',
        gap: 12,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
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
        height: 58,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
    actionButton: {
        width: 58,
        height: 58,
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 8,
        borderRightWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButton: {
        height: 50,
        backgroundColor: Colors.primary,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 6,
        borderRightWidth: 6,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    secondaryButton: {
        height: 50,
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 6,
        borderRightWidth: 6,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
    },
    listContent: {
        padding: 24,
        paddingTop: 16,
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
        marginTop: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '900',
        color: Colors.textSecondary,
    },
    loaderContainer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(17, 45, 78, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: Colors.white,
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
    modalBody: {
        padding: 20,
        maxHeight: height * 0.6,
    },
    filterLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 12,
        marginTop: 16,
        textDecorationLine: 'underline',
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    typeItem: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: Colors.backgroundElement,
        borderWidth: 3,
        borderColor: Colors.text,
    },
    typeItemActive: {
        backgroundColor: Colors.primary,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.text,
    },
    typeTextActive: {
        color: Colors.white,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    filterInput: {
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderColor: Colors.text,
        padding: 10,
        fontSize: 14,
        fontWeight: '900',
    },
    inputSeparator: {
        fontWeight: '900',
        fontSize: 18,
    },
    modalFooter: {
        flexDirection: 'row',
        borderTopWidth: 4,
        borderColor: Colors.text,
    },
    resetButton: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.backgroundElement,
        alignItems: 'center',
    },
    applyButton: {
        flex: 2,
        padding: 16,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        borderLeftWidth: 4,
        borderColor: Colors.text,
    },
    resetButtonText: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
    applyButtonText: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.white,
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
