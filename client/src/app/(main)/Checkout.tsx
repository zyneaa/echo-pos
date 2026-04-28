import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    Pressable,
    useWindowDimensions
} from 'react-native';
import { Colors } from '@/constants/theme';
import { ShoppingCart, Trash2, CreditCard, Bluetooth, Camera } from 'lucide-react-native';

const DUMMY_CART = [
    { id: '1', name: 'PREMIUM COFFEE BEANS', price: 25.00, qty: 2 },
    { id: '2', name: 'MECHANICAL KEYBOARD', price: 150.00, qty: 1 },
    { id: '3', name: 'DARK ROAST COFFEE', price: 18.00, qty: 3 },
];

export default function CheckoutScreen() {
    const { height } = useWindowDimensions();
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [cart, setCart] = useState(DUMMY_CART);

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    const CartItem = ({ item }: { item: typeof DUMMY_CART[0] }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)} x {item.qty}</Text>
            </View>
            <View style={styles.itemTotal}>
                <Text style={styles.itemTotalText}>${(item.price * item.qty).toFixed(2)}</Text>
                <Pressable style={styles.deleteButton}>
                    <Trash2 size={18} color={Colors.text} />
                </Pressable>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Top Section - Camera or Scan Selector */}
            <View style={styles.topSection}>
                {isCameraActive ? (
                    <View style={styles.cameraPlaceholder}>
                        <View style={styles.scanLine} />
                        <Camera size={48} color={Colors.white} opacity={0.5} />
                        <Text style={styles.statusText}>CAMERA ACTIVE</Text>
                        <Pressable 
                            style={styles.toggleModeButton}
                            onPress={() => setIsCameraActive(false)}
                        >
                            <Bluetooth size={16} color={Colors.text} />
                            <Text style={styles.toggleModeText}>SWITCH TO BT</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.btPlaceholder}>
                        <Bluetooth size={48} color={Colors.primary} />
                        <Text style={styles.btStatusText}>WAITING FOR BT SCANNER...</Text>
                        <Pressable 
                            style={styles.toggleModeButton}
                            onPress={() => setIsCameraActive(true)}
                        >
                            <Camera size={16} color={Colors.text} />
                            <Text style={styles.toggleModeText}>SWITCH TO CAMERA</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Bottom Section - Cart and Summary */}
            <View style={styles.bottomSection}>
                <View style={styles.cartHeader}>
                    <ShoppingCart size={24} color={Colors.text} strokeWidth={3} />
                    <Text style={styles.cartHeaderText}>YOUR CART ({cart.length} ITEMS)</Text>
                </View>

                <FlatList
                    data={cart}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <CartItem item={item} />}
                    contentContainerStyle={styles.cartList}
                    style={styles.flatList}
                />

                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>SUBTOTAL</Text>
                        <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>TAX (8%)</Text>
                        <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.checkoutButton,
                            pressed && styles.buttonPressed
                        ]}
                        onPress={() => alert("CHECKOUT SUCCESSFUL")}
                    >
                        <CreditCard size={24} color={Colors.white} strokeWidth={3} />
                        <Text style={styles.checkoutButtonText}>PAY NOW</Text>
                    </Pressable>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    topSection: {
        flex: 2,
        backgroundColor: Colors.text,
        borderBottomWidth: 4,
        borderColor: Colors.text,
    },
    cameraPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 2,
        backgroundColor: Colors.primary,
        top: '50%',
        zIndex: 5,
    },
    statusText: {
        color: Colors.white,
        fontWeight: '900',
        fontSize: 12,
        marginTop: 12,
        letterSpacing: 2,
    },
    btPlaceholder: {
        flex: 1,
        backgroundColor: Colors.backgroundElement,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btStatusText: {
        color: Colors.text,
        fontWeight: '900',
        fontSize: 12,
        marginTop: 12,
        letterSpacing: 1,
    },
    toggleModeButton: {
        position: 'absolute',
        bottom: 16,
        right: 16,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        borderWidth: 2,
        borderColor: Colors.text,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    toggleModeText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.text,
    },
    bottomSection: {
        flex: 5,
        backgroundColor: Colors.background,
    },
    flatList: {
        flex: 1,
    },
    cartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 20,
        borderBottomWidth: 4,
        borderColor: Colors.text,
    },
    cartHeaderText: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 1,
    },
    cartList: {
        padding: 20,
    },
    cartItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderColor: Colors.text,
        padding: 12,
        marginBottom: 12,
        borderBottomWidth: 6,
        borderRightWidth: 6,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    itemTotal: {
        alignItems: 'flex-end',
        gap: 8,
    },
    itemTotalText: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },
    deleteButton: {
        padding: 4,
    },
    summaryContainer: {
        backgroundColor: Colors.white,
        borderTopWidth: 4,
        borderColor: Colors.text,
        padding: 20,
        paddingBottom: 120,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '900',
        color: Colors.text,
    },
    totalRow: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 2,
        borderColor: Colors.text,
        borderStyle: 'dashed',
    },
    totalLabel: {
        fontSize: 20,
        fontWeight: '900',
        color: Colors.text,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.primary,
    },
    checkoutButton: {
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
        marginTop: 16,
    },
    buttonPressed: {
        borderBottomWidth: 4,
        borderRightWidth: 4,
        transform: [{ translateX: 4 }, { translateY: 4 }],
    },
    checkoutButtonText: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
    }
});
