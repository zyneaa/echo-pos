import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Dimensions
} from 'react-native';
import { Colors } from '@/constants/theme';
import { Scan, Save, Database } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ScannerScreen() {
    const [scannedCode, setScannedCode] = useState('321');
    const [productName, setProductName] = useState('');
    const [price, setPrice] = useState('');

    const handleSave = () => {
        console.log("Saving to DB:", { scannedCode, productName, price });
        alert("PRODUCT SAVED TO DUMMY DB");
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.scannerWrapper}>
                <View style={styles.scannerView}>
                    <View style={styles.scanLine} />
                    <Scan size={80} color={Colors.white} opacity={0.3} strokeWidth={1} />
                    <Text style={styles.scannerStatus}>READY TO SCAN</Text>
                    
                    {/* Corner accents for the "viewfinder" */}
                    <View style={[styles.corner, { top: 20, left: 20, borderLeftWidth: 6, borderTopWidth: 6 }]} />
                    <View style={[styles.corner, { top: 20, right: 20, borderRightWidth: 6, borderTopWidth: 6 }]} />
                    <View style={[styles.corner, { bottom: 20, left: 20, borderLeftWidth: 6, borderBottomWidth: 6 }]} />
                    <View style={[styles.corner, { bottom: 20, right: 20, borderRightWidth: 6, borderBottomWidth: 6 }]} />
                </View>
            </View>

            <View style={styles.formContainer}>
                <View style={styles.sectionHeader}>
                    <Database size={20} color={Colors.white} strokeWidth={3} />
                    <Text style={styles.sectionTitle}>SCANNED DATA</Text>
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

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>UNIT PRICE ($)</Text>
                    <TextInput
                        style={styles.brutalistInput}
                        placeholder="0.00"
                        placeholderTextColor={Colors.textSecondary}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="decimal-pad"
                    />
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.saveButton,
                        pressed && styles.buttonPressed
                    ]}
                    onPress={handleSave}
                >
                    <Save size={24} color={Colors.white} strokeWidth={3} />
                    <Text style={styles.saveButtonText}>STORE IN DB</Text>
                </Pressable>
            </View>
        </ScrollView>
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
        marginBottom: 32,
    },
    scannerView: {
        height: 300,
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
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: Colors.primary,
    },
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
        gap: 8,
        backgroundColor: Colors.text,
        padding: 8,
        marginHorizontal: -20,
        marginTop: -20,
        marginBottom: 24,
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
    }
});
