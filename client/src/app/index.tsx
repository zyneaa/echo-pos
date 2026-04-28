import React, { useState } from 'react';
import { router } from 'expo-router';
import {
    StyleSheet,
    useWindowDimensions,
    View,
    Text,
    TextInput,
    Pressable,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShoppingCart, AlertCircle, WifiOff } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useAuthStore } from '@/store/useStore';

export default function HomeScreen() {
    const { height } = useWindowDimensions();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const login = useAuthStore((state) => state.login);

    const handleLogin = async () => {
        if (!username || !password) {
            setError("MISSING CREDENTIALS");
            return;
        }

        setLoading(true);
        setError('');

        try {
            await login(username, password);
            router.replace('/(main)/Home');
        } catch (err: any) {
            const backendMessage = err.response?.data?.message || err.response?.data || 'AUTHENTICATION FAILED';
            setError(backendMessage.toUpperCase());
        } finally {
            setLoading(false);
        }
    };

    const handleOfflineMode = () => {
        router.replace('/(main)/Home');
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={[styles.iconContainer, { height: height * 0.20 }]}>
                    <ShoppingCart
                        size={60}
                        color={Colors.text}
                        strokeWidth={2.5}
                    />
                    <View style={styles.titleBadge}>
                        <Text style={styles.brutalistTitle}>WELCOME BACK</Text>
                    </View>
                </View>
                <View style={[styles.cutOut, { height: height * 0.80 }]}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>LOGIN</Text>
                    </View>

                    {error ? (
                        <View style={styles.errorContainer}>
                            <AlertCircle size={20} color={Colors.white} strokeWidth={3} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    ) : null}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>USERNAME</Text>
                        <TextInput
                            style={styles.brutalistInput}
                            placeholder="OPERATOR_ID"
                            placeholderTextColor={Colors.textSecondary}
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>PASSPHRASE</Text>
                        <TextInput
                            style={styles.brutalistInput}
                            placeholder="••••••••"
                            placeholderTextColor={Colors.textSecondary}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                    <View style={styles.buttonGroup}>
                        <Pressable
                            disabled={loading}
                            style={({ pressed }) => [
                                styles.brutalistButton,
                                pressed && styles.brutalistButtonPressed,
                                loading && { opacity: 0.8 }
                            ]}
                            onPress={handleLogin}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.background} size="small" />
                            ) : (
                                <Text style={styles.buttonText}>LOGIN</Text>
                            )}
                        </Pressable>

                        <Pressable
                            style={({ pressed }) => [
                                styles.offlineButton,
                                pressed && styles.brutalistButtonPressed
                            ]}
                            onPress={handleOfflineMode}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <WifiOff size={20} color={Colors.text} strokeWidth={2.5} />
                                <Text style={styles.offlineButtonText}>ENTER OFFLINE MODE</Text>
                            </View>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: Colors.backgroundElement,
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
    },
    iconContainer: {
        flexDirection: "row",
        paddingHorizontal: 24,
        gap: 16,
        justifyContent: "flex-start",
        alignItems: "center"
    },
    titleBadge: {
        borderWidth: 4,
        borderColor: Colors.text,
        padding: 8,
        backgroundColor: Colors.background,
        borderBottomWidth: 8,
        borderRightWidth: 8,
    },
    brutalistTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 2,
    },
    cutOut: {
        backgroundColor: Colors.background,
        width: '100%',
        borderWidth: 4,
        borderColor: Colors.text,
        borderBottomWidth: 0,
        padding: 32,
        justifyContent: 'flex-start',
    },
    formHeader: {
        borderBottomWidth: 4,
        borderColor: Colors.text,
        paddingBottom: 12,
        marginBottom: 24,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: -1,
    },
    errorContainer: {
        backgroundColor: '#FF0000',
        borderWidth: 4,
        borderColor: Colors.text,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 24,
        borderBottomWidth: 8,
        borderRightWidth: 8,
    },
    errorText: {
        color: Colors.white,
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 12,
        fontWeight: '900',
        color: Colors.text,
        marginBottom: 6,
        letterSpacing: 1,
    },
    brutalistInput: {
        backgroundColor: Colors.white,
        borderWidth: 4,
        borderColor: Colors.text,
        padding: 14,
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        borderBottomWidth: 6,
        borderRightWidth: 6,
    },
    buttonGroup: {
        marginTop: 10,
        gap: 16,
    },
    brutalistButton: {
        backgroundColor: Colors.primary,
        borderWidth: 4,
        borderColor: Colors.text,
        paddingVertical: 18,
        alignItems: 'center',
        borderBottomWidth: 8,
        borderRightWidth: 8,
    },
    offlineButton: {
        backgroundColor: Colors.backgroundElement,
        borderWidth: 4,
        borderColor: Colors.text,
        paddingVertical: 18,
        alignItems: 'center',
        borderBottomWidth: 8,
        borderRightWidth: 8,
    },
    brutalistButtonPressed: {
        borderBottomWidth: 4,
        borderRightWidth: 4,
        transform: [{ translateX: 4 }, { translateY: 4 }],
    },
    buttonText: {
        color: Colors.background,
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1.5,
    },
    offlineButtonText: {
        color: Colors.text,
        fontWeight: '900',
        fontSize: 16,
        letterSpacing: 1.5,
    }
});
