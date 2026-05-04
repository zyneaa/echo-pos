import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import React from 'react';
import { useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initDB } from '@/database/sqlite';
import { useEffect } from 'react';

export default function RootLayout() {
    const colorScheme = useColorScheme();

    useEffect(() => {
        initDB(); // Re-enabled local database after fixing schema migration
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(main)" />
                </Stack>
                <AnimatedSplashOverlay />
            </ThemeProvider>
        </GestureHandlerRootView>
    );
}
