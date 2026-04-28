import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TextInput,
    Pressable,
    FlatList
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Search, Plus, Package } from 'lucide-react-native';

const DUMMY_PRODUCTS = [
    { id: '1', name: 'PREMIUM COFFEE BEANS', price: 25.00, stock: 45, category: 'FOOD' },
    { id: '2', name: 'MECHANICAL KEYBOARD', price: 150.00, stock: 12, category: 'ELECTRONICS' },
    { id: '3', name: 'OVERSURGED HOODIE', price: 85.00, stock: 30, category: 'CLOTHING' },
    { id: '4', name: 'ERGONOMIC MOUSE', price: 65.00, stock: 8, category: 'ELECTRONICS' },
    { id: '5', name: 'VINTAGE CAMERA', price: 210.00, stock: 3, category: 'ELECTRONICS' },
    { id: '6', name: 'DARK ROAST COFFEE', price: 18.00, stock: 100, category: 'FOOD' },
    { id: '7', name: 'DENIM JACKET', price: 120.00, stock: 15, category: 'CLOTHING' },
];

const ProductCard = ({ item }: { item: typeof DUMMY_PRODUCTS[0] }) => (
    <View style={styles.productCard}>
        <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.name}</Text>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.category}</Text>
            </View>
        </View>
        <View style={styles.productStats}>
            <View style={styles.statBox}>
                <Text style={styles.statLabel}>PRICE</Text>
                <Text style={styles.statValue}>${item.price.toFixed(2)}</Text>
            </View>
            <View style={[styles.statBox, { borderLeftWidth: 4 }]}>
                <Text style={styles.statLabel}>STOCK</Text>
                <Text style={[styles.statValue, item.stock < 10 ? { color: '#FF0000' } : {}]}>
                    {item.stock}
                </Text>
            </View>
        </View>
    </View>
);

export default function InventoryScreen() {
    const [search, setSearch] = useState('');

    const filteredProducts = DUMMY_PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
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
                <Pressable style={styles.addButton}>
                    <Plus size={24} color={Colors.white} strokeWidth={4} />
                </Pressable>
            </View>

            <FlatList
                data={filteredProducts}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <ProductCard item={item} />}
                contentContainerStyle={styles.listContent}
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
