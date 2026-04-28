import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import InventoryScreen from '../screens/InventoryScreen';
import { useAuthStore } from '../store/useStore';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarStyle: {
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 20,
            height: 80,
            backgroundColor: '#F9F7F7',
            borderWidth: 4,
            borderTopWidth: 4,
            borderColor: '#112D4E',
            elevation: 0,
            shadowOpacity: 0,
            borderRadius: 0,
            paddingBottom: 0,
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          if (route.name === 'Dashboard') iconName = 'view-dashboard';
          else if (route.name === 'Checkout') iconName = 'cash-register';
          else if (route.name === 'Inventory') iconName = 'package-variant-closed';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={HomeScreen} />
      <Tab.Screen name="Checkout" component={CheckoutScreen} />
      <Tab.Screen name="Inventory" component={InventoryScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const token = useAuthStore((state) => state.token);

  return (
    <Stack.Navigator>
      {token ? (
        <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}
