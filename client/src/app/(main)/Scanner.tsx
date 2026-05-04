import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Dimensions,
    Alert,
    ActivityIndicator,
    Modal
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Scan, Save, Database, Bluetooth, Camera as CameraIcon, AlertTriangle, FileText, Calendar, ChevronLeft, ChevronRight, X, Search, CheckCircle, XCircle, Plus, Edit2, ArrowRight } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { upsertProductToServer, fetchProductByBarcodeFromServer } from '@/api/sync';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ScannerScreen() {
    const params = useLocalSearchParams();
    const [permission, requestPermission] = useCameraPermissions();
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [scanned, setScanned] = useState(false);
    
    // UI State
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [scanStatus, setScanStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
    const [foundProduct, setFoundProduct] = useState<any | null>(null);

    const [productId, setProductId] = useState('');
    const [scannedCode, setScannedCode] = useState('');
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [stock, setStock] = useState('0');
    const [alertStock, setAlertStock] = useState('5');
    const [description, setDescription] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isCheckingServer, setIsCheckingServer] = useState(false);
    const [isUpdateMode, setIsUpdateMode] = useState(false);

    // Notification State
    const [notification, setNotification] = useState<{ visible: boolean; type: 'success' | 'error'; message: string }>({
        visible: false,
        type: 'success',
        message: ''
    });

    useEffect(() => {
        if (params.barcode) {
            loadProductByBarcode(params.barcode as string);
            if (params.autoEdit === 'true') {
                setIsFormVisible(true);
            }
        }
    }, [params.barcode]);

    const resetForm = () => {
        setProductId('');
        setScannedCode('');
        setProductName('');
        setPrice('');
        setCostPrice('');
        setStock('0');
        setAlertStock('5');
        setDescription('');
        setExpiryDate('');
        setIsUpdateMode(false);
        setScanStatus('idle');
        setFoundProduct(null);
        setIsFormVisible(false);
    };

    const showNotification = (type: 'success' | 'error', message: string) => {
        setNotification({ visible: true, type, message });
        setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
    };

    // Calendar State
    const [isCalendarVisible, setIsCalendarVisible] = useState(false);
    const [currentViewDate, setCurrentViewDate] = useState(new Date());

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

    const handleDateSelect = (day: number) => {
        const d = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        setExpiryDate(`${yyyy}-${mm}-${dd}`);
        setIsCalendarVisible(false);
    };

    const changeMonth = (offset: number) => {
        const next = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + offset, 1);
        setCurrentViewDate(next);
    };

    const btInputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (isCameraActive && !permission?.granted) {
            requestPermission();
        }
    }, [isCameraActive]);

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);
        loadProductByBarcode(data);
        setTimeout(() => setScanned(false), 2000);
    };

    const loadProductByBarcode = async (barcode: string) => {
        setScannedCode(barcode);
        setIsCheckingServer(true);
        setIsFormVisible(false); // Hide form while checking
        
        try {
            const serverProduct = await fetchProductByBarcodeFromServer(barcode);
            if (serverProduct) {
                setFoundProduct(serverProduct);
                setScanStatus('found');
                applyProductData(serverProduct);
            } else {
                setScanStatus('not_found');
                setFoundProduct(null);
                // Pre-fill barcode for new product
                setProductId(uuidv4());
                setProductName('');
                setPrice('');
                setCostPrice('');
                setStock('0');
                setAlertStock('5');
                setDescription('');
                setExpiryDate('');
                setIsUpdateMode(false);
            }
        } catch (error) {
            console.error("Server check failed", error);
            showNotification('error', "SERVER CHECK FAILED");
        } finally {
            setIsCheckingServer(false);
        }
    };

    const applyProductData = (product: any) => {
        setProductId(product.id);
        setProductName(product.name);
        setPrice(product.price_mmk.toString());
        setCostPrice(product.cost_price_mmk.toString());
        setStock(product.stock_quantity.toString());
        setAlertStock(product.alert_stock.toString());
        setDescription(product.description || '');
        setExpiryDate(product.expire_at ? product.expire_at.split('T')[0] : '');
        setIsUpdateMode(true);
    };

    const handleSave = async () => {
        if (!scannedCode || !productName || !price || !costPrice) {
            showNotification('error', "MISSING INFORMATION");
            return;
        }

        setIsSaving(true);
        let finalExpiry = new Date().toISOString();
        if (expiryDate) {
            const parsedDate = new Date(expiryDate);
            if (!isNaN(parsedDate.getTime())) {
                finalExpiry = parsedDate.toISOString();
            }
        }

        try {
            const product = {
                id: productId || uuidv4(),
                barcode_id: scannedCode,
                name: productName,
                price_mmk: parseInt(price) || 0,
                cost_price_mmk: parseInt(costPrice) || 0,
                stock_quantity: parseInt(stock) || 0,
                alert_stock: parseInt(alertStock) || 5,
                image_url: '',
                description: description,
                type_id: 'default',
                expire_at: finalExpiry,
                created_at: new Date().toISOString()
            };

            await upsertProductToServer(product);
            showNotification('success', isUpdateMode ? "PRODUCT UPDATED" : "PRODUCT REGISTERED");
            resetForm();
        } catch (error) {
            console.error(error);
            showNotification('error', "SERVER UPDATE FAILED");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.scannerWrapper}>
                {isCameraActive ? (
                    <View style={styles.scannerView}>
                        {permission?.granted ? (
                            <CameraView
                                style={StyleSheet.absoluteFill}
                                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                            />
                        ) : (
                            <View style={[StyleSheet.absoluteFill, { justifyContent: 'center', alignItems: 'center' }]}>
                                <Text style={{ color: Colors.white }}>PERMISSION REQUIRED</Text>
                                <Pressable onPress={requestPermission} style={{ marginTop: 10, backgroundColor: Colors.primary, padding: 8 }}>
                                    <Text style={{ color: Colors.white }}>GRANT</Text>
                                </Pressable>
                            </View>
                        )}
                        <View style={styles.scanLine} />
                        <Text style={styles.scannerStatus}>CAMERA ACTIVE</Text>
                        
                        <Pressable 
                            style={styles.toggleModeButton}
                            onPress={() => setIsCameraActive(false)}
                        >
                            <Bluetooth size={16} color={Colors.text} />
                            <Text style={styles.toggleModeText}>BT SCANNER</Text>
                        </Pressable>

                        <View style={[styles.corner, { top: 20, left: 20, borderLeftWidth: 6, borderTopWidth: 6 }]} />
                        <View style={[styles.corner, { top: 20, right: 20, borderRightWidth: 6, borderTopWidth: 6 }]} />
                        <View style={[styles.corner, { bottom: 20, left: 20, borderLeftWidth: 6, borderBottomWidth: 6 }]} />
                        <View style={[styles.corner, { bottom: 20, right: 20, borderRightWidth: 6, borderBottomWidth: 6 }]} />
                    </View>
                ) : (
                    <View style={[styles.scannerView, { backgroundColor: Colors.backgroundElement }]}>
                        <Bluetooth size={80} color={Colors.primary} opacity={0.3} strokeWidth={1} />
                        <TextInput
                            ref={btInputRef}
                            style={styles.hiddenInput}
                            autoFocus
                            placeholder="WAITING FOR SCAN..."
                            onSubmitEditing={(e) => {
                                loadProductByBarcode(e.nativeEvent.text);
                                btInputRef.current?.clear();
                            }}
                        />
                        <Text style={[styles.scannerStatus, { color: Colors.text }]}>READY FOR BT SCAN</Text>
                        
                        <Pressable 
                            style={styles.toggleModeButton}
                            onPress={() => setIsCameraActive(true)}
                        >
                            <CameraIcon size={16} color={Colors.text} />
                            <Text style={styles.toggleModeText}>CAMERA</Text>
                        </Pressable>
                    </View>
                )}
            </View>

            {/* Scan Results Section */}
            {!isFormVisible && (
                <View style={styles.resultContainer}>
                    {isCheckingServer ? (
                        <View style={styles.statusBox}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.statusText}>CHECKING DATABASE...</Text>
                        </View>
                    ) : scanStatus === 'found' && foundProduct ? (
                        <Pressable 
                            style={styles.productSummaryCard}
                            onPress={() => setIsFormVisible(true)}
                        >
                            <View style={styles.summaryHeader}>
                                <CheckCircle size={24} color="#00FF00" strokeWidth={3} />
                                <Text style={styles.summaryTitle}>PRODUCT FOUND</Text>
                            </View>
                            <View style={styles.summaryInfo}>
                                <Text style={styles.summaryName}>{foundProduct.name}</Text>
                                <Text style={styles.summaryBarcode}>{foundProduct.barcode_id}</Text>
                                <View style={styles.summaryGrid}>
                                    <View>
                                        <Text style={styles.summaryLabel}>PRICE</Text>
                                        <Text style={styles.summaryValue}>{foundProduct.price_mmk.toLocaleString()} MMK</Text>
                                    </View>
                                    <View>
                                        <Text style={styles.summaryLabel}>STOCK</Text>
                                        <Text style={styles.summaryValue}>{foundProduct.stock_quantity} UNITS</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.summaryAction}>
                                <Edit2 size={20} color={Colors.white} />
                                <Text style={styles.summaryActionText}>PRESS TO EDIT</Text>
                            </View>
                        </Pressable>
                    ) : scanStatus === 'not_found' ? (
                        <View style={styles.notFoundCard}>
                            <XCircle size={48} color="#FF0000" strokeWidth={2} />
                            <Text style={styles.notFoundTitle}>NOT REGISTERED</Text>
                            <Text style={styles.notFoundSubtitle}>Barcode: {scannedCode}</Text>
                            <Pressable 
                                style={styles.registerButton}
                                onPress={() => setIsFormVisible(true)}
                            >
                                <Plus size={24} color={Colors.white} strokeWidth={3} />
                                <Text style={styles.registerButtonText}>REGISTER NEW PRODUCT</Text>
                            </Pressable>
                        </View>
                    ) : (
                        <View style={styles.idleCard}>
                            <Scan size={64} color={Colors.textSecondary} strokeWidth={1} />
                            <Text style={styles.idleText}>SCAN A PRODUCT TO BEGIN</Text>
                        </View>
                    )}
                </View>
            )}

            {isFormVisible && (
                <View style={styles.formContainer}>
                    <View style={styles.sectionHeader}>
                        <Pressable onPress={() => setIsFormVisible(false)} style={styles.backButton}>
                            <X size={20} color={Colors.white} strokeWidth={3} />
                        </Pressable>
                        <Text style={styles.sectionTitle}>
                            {isUpdateMode ? 'UPDATE PRODUCT' : 'REGISTER NEW'}
                        </Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>BARCODE / QR</Text>
                        <View style={styles.scannedValueBox}>
                            <Text style={styles.scannedValueText}>{scannedCode}</Text>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PRODUCT NAME</Text>
                        <TextInput
                            style={styles.brutalistInput}
                            placeholder="ENTER NAME..."
                            placeholderTextColor={Colors.textSecondary}
                            value={productName}
                            onChangeText={setProductName}
                        />
                    </View>

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>BUY PRICE (MMK)</Text>
                            <TextInput
                                style={styles.brutalistInput}
                                placeholder="0"
                                placeholderTextColor={Colors.textSecondary}
                                value={costPrice}
                                onChangeText={setCostPrice}
                                keyboardType="decimal-pad"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>SELL PRICE (MMK)</Text>
                            <TextInput
                                style={styles.brutalistInput}
                                placeholder="0"
                                placeholderTextColor={Colors.textSecondary}
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="decimal-pad"
                            />
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>STOCK QTY</Text>
                            <TextInput
                                style={styles.brutalistInput}
                                placeholder="0"
                                placeholderTextColor={Colors.textSecondary}
                                value={stock}
                                onChangeText={setStock}
                                keyboardType="numeric"
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1 }]}>
                            <Text style={styles.label}>ALERT AT</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TextInput
                                    style={[styles.brutalistInput, { flex: 1 }]}
                                    placeholder="5"
                                    placeholderTextColor={Colors.textSecondary}
                                    value={alertStock}
                                    onChangeText={setAlertStock}
                                    keyboardType="numeric"
                                />
                                <View style={{ position: 'absolute', right: 12 }}>
                                    <AlertTriangle size={18} color={Colors.primary} />
                                </View>
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>EXPIRY DATE (YYYY-MM-DD)</Text>
                        <Pressable 
                            style={[styles.brutalistInput, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                            onPress={() => setIsCalendarVisible(true)}
                        >
                            <Text style={[styles.scannedValueText, !expiryDate && { color: Colors.textSecondary }]}>
                                {expiryDate || 'SELECT DATE...'}
                            </Text>
                            <Calendar size={20} color={expiryDate ? Colors.primary : Colors.textSecondary} strokeWidth={3} />
                        </Pressable>
                    </View>

                    {/* Calendar Modal */}
                    <Modal
                        visible={isCalendarVisible}
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setIsCalendarVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>EXPIRY DATE SELECTOR</Text>
                                    <Pressable onPress={() => setIsCalendarVisible(false)} style={styles.modalClose}>
                                        <X size={24} color={Colors.white} strokeWidth={4} />
                                    </Pressable>
                                </View>

                                <View style={styles.calendarContainer}>
                                    <View style={styles.calendarHeader}>
                                        <Pressable onPress={() => changeMonth(-1)} style={styles.navButton}>
                                            <ChevronLeft size={24} color={Colors.white} strokeWidth={3} />
                                        </Pressable>
                                        <Text style={styles.calendarTitle}>{monthName} {currentViewDate.getFullYear()}</Text>
                                        <Pressable onPress={() => changeMonth(1)} style={styles.navButton}>
                                            <ChevronRight size={24} color={Colors.white} strokeWidth={3} />
                                        </Pressable>
                                    </View>
                                    
                                    <View style={styles.weekDays}>
                                        {['S','M','T','W','T','F','S'].map((d, i) => (
                                            <Text key={`${d}-${i}`} style={styles.weekDayText}>{d}</Text>
                                        ))}
                                    </View>

                                    <View style={styles.daysGrid}>
                                        {calendarDays.map((day, i) => (
                                            <Pressable
                                                key={i}
                                                style={[
                                                    styles.dayCell, 
                                                    !day && { opacity: 0 },
                                                    expiryDate === `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` && styles.selectedDay
                                                ]}
                                                disabled={!day}
                                                onPress={() => day && handleDateSelect(day)}
                                            >
                                                <Text style={[
                                                    styles.dayText,
                                                    expiryDate === `${currentViewDate.getFullYear()}-${String(currentViewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` && styles.selectedDayText
                                                ]}>
                                                    {day}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>

                                <Pressable 
                                    style={styles.closeModalButton} 
                                    onPress={() => setIsCalendarVisible(false)}
                                >
                                    <Text style={styles.closeModalButtonText}>CANCEL</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Modal>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>DESCRIPTION (OPTIONAL)</Text>
                        <TextInput
                            style={[styles.brutalistInput, { height: 100, textAlignVertical: 'top' }]}
                            placeholder="ENTER DESCRIPTION..."
                            placeholderTextColor={Colors.textSecondary}
                            value={description}
                            onChangeText={setDescription}
                            multiline
                        />
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            styles.saveButton,
                            (pressed || isSaving) && styles.buttonPressed
                        ]}
                        onPress={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <>
                                {isUpdateMode ? (
                                    <Database size={24} color={Colors.white} strokeWidth={3} />
                                ) : (
                                    <Save size={24} color={Colors.white} strokeWidth={3} />
                                )}
                                <Text style={styles.saveButtonText}>
                                    {isUpdateMode ? 'UPDATE PRODUCT' : 'INSERT NEW PRODUCT'}
                                </Text>
                            </>
                        )}
                    </Pressable>
                    
                    <Pressable 
                        style={styles.cancelFormButton}
                        onPress={resetForm}
                    >
                        <Text style={styles.cancelFormText}>CANCEL & RESET</Text>
                    </Pressable>
                </View>
            )}
        </ScrollView>

        {/* Custom Brutalist Notification */}
        {notification.visible && (
            <View style={[
                styles.notificationContainer,
                notification.type === 'success' ? styles.successNotification : styles.errorNotification
            ]}>
                {notification.type === 'success' ? (
                    <CheckCircle size={24} color={Colors.white} strokeWidth={3} />
                ) : (
                    <XCircle size={24} color={Colors.white} strokeWidth={3} />
                )}
                <Text style={styles.notificationText}>{notification.message}</Text>
            </View>
        )}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundElement,
    },
    content: {
        padding: 24,
        paddingBottom: 120,
    },
    scannerWrapper: {
        marginBottom: 24,
    },
    scannerView: {
        height: 250,
        backgroundColor: Colors.text,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 12,
        borderRightWidth: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
    },
    scanLine: {
        position: 'absolute',
        width: '100%',
        height: 4,
        backgroundColor: Colors.primary,
        top: '50%',
        zIndex: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
    },
    scannerStatus: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 4,
        marginTop: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 4,
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: Colors.primary,
    },
    toggleModeButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: Colors.white,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 8,
        borderWidth: 2,
        borderColor: Colors.text,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        zIndex: 20,
    },
    toggleModeText: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.text,
    },
    hiddenInput: {
        position: 'absolute',
        opacity: 0,
        width: 1,
        height: 1,
    },
    // Result Styles
    resultContainer: {
        gap: 24,
    },
    statusBox: {
        padding: 40,
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 12,
        borderRightWidth: 12,
        alignItems: 'center',
        gap: 16,
    },
    statusText: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 2,
    },
    productSummaryCard: {
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 12,
        borderRightWidth: 12,
        overflow: 'hidden',
    },
    summaryHeader: {
        backgroundColor: Colors.text,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
    },
    summaryTitle: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    summaryInfo: {
        padding: 20,
        borderBottomWidth: 4,
        borderColor: Colors.text,
    },
    summaryName: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 4,
    },
    summaryBarcode: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 16,
    },
    summaryGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    summaryLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: Colors.textSecondary,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },
    summaryAction: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 12,
    },
    summaryActionText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    notFoundCard: {
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 12,
        borderRightWidth: 12,
        padding: 32,
        alignItems: 'center',
    },
    notFoundTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#FF0000',
        marginTop: 16,
    },
    notFoundSubtitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 24,
    },
    registerButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 24,
        paddingVertical: 16,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 8,
        borderRightWidth: 8,
    },
    registerButtonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '900',
    },
    idleCard: {
        padding: 60,
        alignItems: 'center',
        opacity: 0.5,
    },
    idleText: {
        marginTop: 16,
        fontSize: 14,
        fontWeight: '900',
        color: Colors.textSecondary,
        textAlign: 'center',
        letterSpacing: 2,
    },
    // Form Styles
    formContainer: {
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        padding: 20,
        borderBottomWidth: 12,
        borderRightWidth: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: Colors.text,
        padding: 12,
        marginHorizontal: -20,
        marginTop: -20,
        marginBottom: 24,
    },
    backButton: {
        padding: 4,
    },
    sectionTitle: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 2,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 8,
    },
    scannedValueBox: {
        backgroundColor: Colors.backgroundElement,
        padding: 16,
        borderWidth: 2,
        borderColor: Colors.text,
        borderStyle: 'dashed',
    },
    scannedValueText: {
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 2,
    },
    brutalistInput: {
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        padding: 16,
        fontSize: 18,
        fontWeight: '900',
        color: Colors.text,
    },
    saveButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingVertical: 20,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 8,
        borderRightWidth: 8,
        marginTop: 10,
    },
    buttonPressed: {
        borderBottomWidth: 4,
        borderRightWidth: 4,
        transform: [{ translateX: 4 }, { translateY: 4 }],
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: 2,
    },
    cancelFormButton: {
        marginTop: 16,
        padding: 12,
        alignItems: 'center',
    },
    cancelFormText: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.textSecondary,
        textDecorationLine: 'underline',
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
    calendarContainer: {
        padding: 16,
    },
    calendarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.text,
        padding: 12,
        marginBottom: 8,
    },
    calendarTitle: {
        color: Colors.white,
        fontWeight: '900',
        fontSize: 14,
    },
    navButton: {
        padding: 4,
    },
    weekDays: {
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderColor: Colors.text,
        backgroundColor: Colors.backgroundElement,
        marginBottom: 8,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        paddingVertical: 8,
        fontSize: 12,
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
        borderWidth: 1,
        borderColor: Colors.backgroundElement,
    },
    dayText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: Colors.text,
    },
    selectedDay: {
        backgroundColor: Colors.primary,
        borderColor: Colors.text,
    },
    selectedDayText: {
        color: Colors.white,
    },
    closeModalButton: {
        backgroundColor: Colors.backgroundElement,
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 4,
        borderColor: Colors.text,
    },
    closeModalButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: Colors.text,
    },
    notificationContainer: {
        position: 'absolute',
        bottom: 100,
        left: 24,
        right: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 10,
        borderRightWidth: 10,
        zIndex: 1000,
    },
    successNotification: {
        backgroundColor: '#00FF00',
    },
    errorNotification: {
        backgroundColor: '#FF0000',
    },
    notificationText: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    }
});

