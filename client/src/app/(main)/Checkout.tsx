import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    FlatList,
    Pressable,
    useWindowDimensions,
    Alert,
    TextInput,
    Animated,
    Vibration
} from 'react-native';
import { Colors } from '@/constants/theme';
import { ShoppingCart, Trash2, CreditCard, Bluetooth, Camera as CameraIcon, Plus, Minus } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCartStore, useAuthStore } from '@/store/useStore';
import { fetchProductByBarcodeFromServer, createTransactionOnServer } from '@/api/sync';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

export default function CheckoutScreen() {
    const { height } = useWindowDimensions();
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [permission, requestPermission] = useCameraPermissions();
    const { items, addItem, removeItem, updateQuantity, clearCart, total } = useCartStore();
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

    const processBarcode = async (barcode: string) => {
        try {
            const product = await fetchProductByBarcodeFromServer(barcode);
            if (product) {
                addItem(product);
            } else {
                Alert.alert('Not Found', `Product with barcode ${barcode} not found.`);
            }
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to fetch product from server.');
        }
    };

    const handleCheckout = async () => {
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
            await createTransactionOnServer(transaction);
            clearCart();
            Alert.alert('Success', 'Transaction completed on server.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to complete transaction on server.');
        }
    };

    const CartItem = ({ item }: { item: any }) => {
        const translateX = useRef(new Animated.Value(0)).current;

        const onGestureEvent = Animated.event(
            [{ nativeEvent: { translationX: translateX } }],
            { useNativeDriver: false } // Need false for background color interpolation
        );

        const onHandlerStateChange = (event: any) => {
            if (event.nativeEvent.state === State.END) {
                const { translationX } = event.nativeEvent;
                if (translationX > 80) {
                    // Swipe Right -> Increase
                    updateQuantity(item.id, item.quantity + 1);
                    Vibration.vibrate(20);
                } else if (translationX < -80) {
                    // Swipe Left -> Decrease
                    updateQuantity(item.id, item.quantity - 1);
                    Vibration.vibrate(20);
                }
                Animated.spring(translateX, {
                    toValue: 0,
                    useNativeDriver: false,
                }).start();
            }
        };

        const backgroundColor = translateX.interpolate({
            inputRange: [-150, 0, 150],
            outputRange: ['rgba(255, 0, 0, 0.4)', 'rgba(0,0,0,0)', 'rgba(0, 255, 0, 0.4)'],
            extrapolate: 'clamp',
        });

        return (
            <PanGestureHandler
                onGestureEvent={onGestureEvent}
                onHandlerStateChange={onHandlerStateChange}
            >
                <Animated.View style={[styles.cartItem, { backgroundColor: Colors.text }]}>
                    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor, zIndex: 0 }]} />
                    <Animated.View style={[styles.nestedCard, { transform: [{ translateX }], zIndex: 1 }]}>
                        <View style={styles.itemMainInfo}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemPrice}>{item.price_mmk.toLocaleString()} MMK</Text>
                            </View>
                            <View style={styles.itemTotal}>
                                <Text style={styles.itemTotalText}>{(item.price_mmk * item.quantity).toLocaleString()} MMK</Text>
                            </View>
                        </View>

                        <View style={styles.itemControls}>
                            <View style={styles.qtyContainer}>
                                <Pressable 
                                    onPress={() => {
                                        updateQuantity(item.id, item.quantity - 1);
                                        Vibration.vibrate(10);
                                    }}
                                    style={styles.qtyButton}
                                >
                                    <Minus size={16} color={Colors.text} strokeWidth={4} />
                                </Pressable>
                                <View style={styles.qtyDisplay}>
                                    <Text style={styles.qtyText}>{item.quantity}</Text>
                                </View>
                                <Pressable 
                                    onPress={() => {
                                        updateQuantity(item.id, item.quantity + 1);
                                        Vibration.vibrate(10);
                                    }}
                                    style={styles.qtyButton}
                                >
                                    <Plus size={16} color={Colors.text} strokeWidth={4} />
                                </Pressable>
                            </View>

                            <Pressable 
                                onPress={() => {
                                    removeItem(item.id);
                                    Vibration.vibrate([0, 20, 50, 20]); // Double pulse for deletion
                                }}
                                style={styles.itemTrashButton}
                            >
                                <Trash2 size={18} color={Colors.white} strokeWidth={3} />
                            </Pressable>
                        </View>
                    </Animated.View>
                </Animated.View>
            </PanGestureHandler>
        );
    };

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
                        <Bluetooth size={32} color={Colors.primary} />
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
                            placeholder="TYPE OR SCAN..."
                            placeholderTextColor={Colors.textSecondary}
                        />
                        <Text style={styles.btStatusText}>READY FOR SCANNER</Text>
                        <Pressable 
                            style={styles.toggleModeButton}
                            onPress={() => setIsCameraActive(true)}
                        >
                            <CameraIcon size={14} color={Colors.text} />
                            <Text style={styles.toggleModeText}>CAMERA</Text>
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
        height: 180,
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
        fontSize: 10,
        marginTop: 4,
        letterSpacing: 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    btPlaceholder: {
        flex: 1,
        backgroundColor: Colors.backgroundElement,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
    },
    btStatusText: {
        color: Colors.text,
        fontWeight: '900',
        fontSize: 10,
        marginTop: 8,
        letterSpacing: 1,
    },
    hiddenInput: {
        borderWidth: 3,
        borderColor: Colors.text,
        width: '90%',
        padding: 10,
        marginTop: 4,
        backgroundColor: Colors.white,
        fontSize: 14,
        fontWeight: '900',
    },
    toggleModeButton: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        padding: 6,
        borderWidth: 2,
        borderColor: Colors.text,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    toggleModeText: {
        fontSize: 9,
        fontWeight: '900',
        color: Colors.text,
    },
    bottomSection: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    flatList: {
        flex: 1,
    },
    cartHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 4,
        borderColor: Colors.text,
        backgroundColor: Colors.white,
    },
    cartHeaderText: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 1,
    },
    cartList: {
        padding: 16,
    },
    cartItem: {
        backgroundColor: Colors.text,
        marginBottom: 12,
        borderBottomWidth: 6,
        borderRightWidth: 6,
        borderColor: Colors.text,
    },
    nestedCard: {
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderColor: Colors.text,
        padding: 12,
        margin: -2,
    },
    itemMainInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
        borderBottomWidth: 2,
        borderColor: Colors.backgroundElement,
        paddingBottom: 8,
    },
    itemControls: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    qtyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.backgroundElement,
        borderWidth: 2,
        borderColor: Colors.text,
    },
    qtyButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    qtyDisplay: {
        minWidth: 40,
        alignItems: 'center',
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderColor: Colors.text,
        paddingHorizontal: 8,
    },
    qtyText: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },
    itemTrashButton: {
        backgroundColor: Colors.text,
        padding: 8,
        borderWidth: 2,
        borderColor: Colors.text,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    itemName: {
        fontSize: 15,
        fontWeight: '900',
        color: Colors.text,
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    itemTotalText: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.primary,
    },
    summaryContainer: {
        backgroundColor: Colors.white,
        borderTopWidth: 4,
        borderColor: Colors.text,
        padding: 16,
        paddingBottom: 110,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '900',
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '900',
        color: Colors.text,
    },
    totalRow: {
        marginTop: 6,
        paddingTop: 6,
        borderTopWidth: 2,
        borderColor: Colors.text,
        borderStyle: 'dashed',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: '900',
        color: Colors.primary,
    },
    checkoutButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 14,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 8,
        borderRightWidth: 8,
        marginTop: 12,
    },
    checkoutButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
    }
});
