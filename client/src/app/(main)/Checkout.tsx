import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    Pressable,
    useWindowDimensions,
    Alert,
    TextInput
} from 'react-native';
import { Colors } from '@/constants/theme';
import { ShoppingCart, Trash2, CreditCard, Bluetooth, Camera as CameraIcon } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCartStore, useAuthStore } from '@/store/useStore';
import { getProductByBarcode, insertTransaction } from '@/database/sqlite';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

export default function CheckoutScreen() {
    const { height } = useWindowDimensions();
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [permission, requestPermission] = useCameraPermissions();
    const { items, addItem, removeItem, clearCart, total } = useCartStore();
    const [scanned, setScanned] = useState(false);
    const [manualBarcode, setManualBarcode] = useState('');
    const scannerInputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (isCameraActive && !permission?.granted) {
            requestPermission();
        }
    }, [isCameraActive]);

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        processBarcode(data);
        setTimeout(() => setScanned(false), 2000);
    };

    const processBarcode = (barcode: string) => {
        const product = getProductByBarcode(barcode) as any;
        if (product) {
            addItem(product);
        } else {
            Alert.alert('Not Found', `Product with barcode ${barcode} not found.`);
        }
    };

    const handleCheckout = () => {
        if (items.length === 0) return;

        const transaction = {
            transaction_id: uuidv4(),
            total_amount_mmk: total,
            payment_method: 'Cash',
            items: items.map(i => ({
                product_id: i.id,
                quantity: i.quantity,
                price_at_time_of_sale: i.price_mmk
            })),
            cashier_id: useAuthStore.getState().user?.id || 'temp-cashier'
        };

        try {
            insertTransaction(transaction);
            clearCart();
            Alert.alert('Success', 'Transaction completed locally.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to save transaction.');
        }
    };

    const CartItem = ({ item }: { item: any }) => (
        <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>{item.price_mmk.toLocaleString()} MMK x {item.quantity}</Text>
            </View>
            <View style={styles.itemTotal}>
                <Text style={styles.itemTotalText}>{(item.price_mmk * item.quantity).toLocaleString()} MMK</Text>
                <Pressable onPress={() => removeItem(item.id)} style={styles.deleteButton}>
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
                    permission?.granted ? (
                        <View style={styles.cameraPlaceholder}>
                            <CameraView
                                style={StyleSheet.absoluteFill}
                                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                            />
                            <View style={styles.scanLine} />
                            <Text style={styles.statusText}>CAMERA ACTIVE</Text>
                            <Pressable 
                                style={styles.toggleModeButton}
                                onPress={() => setIsCameraActive(false)}
                            >
                                <Bluetooth size={16} color={Colors.text} />
                                <Text style={styles.toggleModeText}>SWITCH TO MANUAL</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.cameraPlaceholder}>
                            <Text style={styles.statusText}>CAMERA PERMISSION REQUIRED</Text>
                            <Pressable onPress={requestPermission} style={styles.toggleModeButton}>
                                <Text style={styles.toggleModeText}>GRANT PERMISSION</Text>
                            </Pressable>
                        </View>
                    )
                ) : (
                    <View style={styles.btPlaceholder}>
                        <Bluetooth size={48} color={Colors.primary} />
                        <TextInput
                            ref={scannerInputRef}
                            style={styles.hiddenInput}
                            value={manualBarcode}
                            onChangeText={setManualBarcode}
                            onSubmitEditing={() => {
                                processBarcode(manualBarcode);
                                setManualBarcode('');
                            }}
                            autoFocus
                            placeholder="Type barcode or use BT scanner"
                        />
                        <Text style={styles.btStatusText}>WAITING FOR SCANNER...</Text>
                        <Pressable 
                            style={styles.toggleModeButton}
                            onPress={() => setIsCameraActive(true)}
                        >
                            <CameraIcon size={16} color={Colors.text} />
                            <Text style={styles.toggleModeText}>SWITCH TO CAMERA</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Bottom Section - Cart and Summary */}
            <View style={styles.bottomSection}>
                <View style={styles.cartHeader}>
                    <ShoppingCart size={24} color={Colors.text} strokeWidth={3} />
                    <Text style={styles.cartHeaderText}>YOUR CART ({items.length} ITEMS)</Text>
                </View>

                <FlatList
                    data={items}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => <CartItem item={item} />}
                    contentContainerStyle={styles.cartList}
                    style={styles.flatList}
                />

                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>SUBTOTAL</Text>
                        <Text style={styles.summaryValue}>{total.toLocaleString()} MMK</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>TOTAL</Text>
                        <Text style={styles.totalValue}>{total.toLocaleString()} MMK</Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable
                            style={[styles.checkoutButton, { flex: 1, backgroundColor: Colors.backgroundElement }]}
                            onPress={clearCart}
                        >
                            <Text style={[styles.checkoutButtonText, { color: Colors.text }]}>CLEAR</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.checkoutButton, { flex: 2 }]}
                            onPress={handleCheckout}
                        >
                            <CreditCard size={24} color={Colors.white} strokeWidth={3} />
                            <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                        </Pressable>
                    </View>
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
        overflow: 'hidden',
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
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
    hiddenInput: {
        borderWidth: 2,
        borderColor: Colors.text,
        width: '80%',
        padding: 8,
        marginTop: 8,
        backgroundColor: Colors.white,
        fontWeight: '900',
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
    checkoutButtonText: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: 2,
    }
});
