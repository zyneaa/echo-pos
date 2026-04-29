import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TextInput,
    Pressable,
    FlatList,
    ActivityIndicator
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Search, Plus, Package, RefreshCcw } from 'lucide-react-native';
import { getProducts } from '@/database/sqlite';
import { fetchAndSyncProducts } from '@/api/sync';

const ProductCard = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
        <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.barcode_id}</Text>
            </View>
        </View>
        <View style={styles.productStats}>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>PRICE (MMK)</Text>
                <Text style={styles.statValue}>{item.price_mmk.toLocaleString()}</Text>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 4 }]}>
                <Text style={styles.statLabel}>STOCK</Text>
                <Text style={[styles.statValue, item.stock_quantity < item.alert_stock ? { color: '#FF0000' } : {}]}>
                    {item.stock_quantity}
                </Text>
            </View>
        </View>
    </View>
);

export default function InventoryScreen() {
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    const loadProducts = () => {
        const data = getProducts() as any[];
        setProducts(data);
        setLoading(false);
    };

    useEffect(() => {
        loadProducts();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await fetchAndSyncProducts();
            loadProducts();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
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
                        placeholder="SEARCH INVENTORY..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
                <Pressable onPress={handleSync} disabled={isSyncing} style={[styles.addButton, { backgroundColor: Colors.white }]}>
                    {isSyncing ? <ActivityIndicator color={Colors.text} /> : <RefreshCcw size={24} color={Colors.text} strokeWidth={3} />}
                </Pressable>
                <Pressable style={styles.addButton}>
                    <Plus size={24} color={Colors.white} strokeWidth={4} />
                </Pressable>
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <ProductCard item={item} />}
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
    }
});
