import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, Button, Title, HelperText } from 'react-native-paper';
import { useAuthStore } from '../store/useStore';
import axios from 'axios';

const API_URL = 'http://192.168.1.3:8080'; // Update with your server IP for physical devices

export default function LoginScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setToken = useAuthStore((state) => state.setToken);

    const handleLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.post(`${API_URL}/login`, { username, password });
            setToken(response.data.token);
        } catch (err: any) {
            setError(err.response?.data || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Title style={styles.title}>OK</Title>
            <Text className="text-xl font-bold text-blue-500">
                Welcome to Nativewind!
            </Text>
            <TextInput
                label="Username"
                value={username}
                onChangeText={setUsername}
                className="bg-blue-50 rounded border-dashed"
                mode="outlined"
            />
            <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="bg-blue-50"
                mode="outlined"
            />
            {error ? <HelperText type="error">{error}</HelperText> : null}
            <Button
                className="bg-blue-500"
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
            >
                Login
            </Button>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        backgroundColor: '#fff',
    },
    title: {
        textAlign: 'center',
        marginBottom: 30,
        fontSize: 28,
    },
    input: {
        marginBottom: 15,
    },
    button: {
        marginTop: 10,
        paddingVertical: 5,
    },
});
