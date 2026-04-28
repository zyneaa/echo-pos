import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { initDB } from './src/database/sqlite';
import { Button, TextInput, Text } from 'react-native-paper';
import { cssInterop } from 'nativewind';

import "./global.css"

// Enable NativeWind for React Native Paper components
cssInterop(Button, { className: 'style' });
cssInterop(TextInput, { className: 'style' });
cssInterop(Text, { className: 'style' });

export default function App() {
  useEffect(() => {
    try {
      initDB();
      console.log('Database initialized');
    } catch (error) {
      console.error('Failed to initialize database', error);
    }
  }, []);

  return (
    <PaperProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
