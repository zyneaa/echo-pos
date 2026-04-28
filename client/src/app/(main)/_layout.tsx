import React from 'react';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet, Pressable, View, Text } from 'react-native';
import { LayoutDashboard, ShoppingCart, Package, ScanLine, Menu } from 'lucide-react-native';
import { Colors } from '@/constants/theme';
import { useNavigation } from 'expo-router';
import { DrawerActions } from '@react-navigation/native';

function CustomHeaderTitle({ children }: { children: string }) {
    const navigation = useNavigation();
    
    return (
        <View style={styles.headerTitleContainer}>
            <Pressable 
                onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
                style={styles.drawerButton}
            >
                <Menu color={Colors.text} size={32} strokeWidth={2.5} />
            </Pressable>
            <Text style={styles.headerTitleText}>{children}</Text>
        </View>
    );
}

export default function DrawerLayout() {
    return (
        <Drawer
            screenOptions={{
                drawerActiveTintColor: Colors.background,
                drawerActiveBackgroundColor: Colors.text,
                drawerInactiveTintColor: Colors.text,
                drawerInactiveBackgroundColor: Colors.background,

                headerStyle: styles.header,
                headerShown: true,
                headerTitleAlign: 'left',

                headerTitle: (props) => <CustomHeaderTitle {...props} />,
                headerLeft: () => null,

                drawerStyle: styles.drawer,
                drawerLabelStyle: styles.drawerLabel,
                drawerItemStyle: styles.drawerItem,
            }}>
            <Drawer.Screen
                name="Home"
                options={{
                    title: 'DASHBOARD',
                    drawerLabel: 'DASHBOARD',
                    drawerIcon: ({ color }) => (
                        <LayoutDashboard color={color} size={24} strokeWidth={2.5} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Inventory"
                options={{
                    title: 'INVENTORY',
                    drawerLabel: 'INVENTORY',
                    drawerIcon: ({ color }) => (
                        <Package color={color} size={24} strokeWidth={2.5} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Scanner"
                options={{
                    title: 'SCANNER',
                    drawerLabel: 'SCANNER',
                    drawerIcon: ({ color }) => (
                        <ScanLine color={color} size={24} strokeWidth={2.5} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Checkout"
                options={{
                    title: 'CHECKOUT',
                    drawerLabel: 'CHECKOUT',
                    drawerIcon: ({ color }) => (
                        <ShoppingCart color={color} size={24} strokeWidth={2.5} />
                    ),
                }}
            />
        </Drawer>
    );
}

const styles = StyleSheet.create({
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 8,
    },
    drawerButton: {
        marginRight: 12,
        padding: 4,
    },
    headerTitleText: {
        fontSize: 24,
        fontWeight: '900',
        color: Colors.text,
        letterSpacing: 2,
    },
    drawer: {
        backgroundColor: Colors.background,
        borderRightWidth: 4,
        borderColor: Colors.text,
        width: 300,
    },
    drawerItem: {
        borderRadius: 0,
        marginVertical: 4,
        marginHorizontal: 8,
        borderWidth: 2,
        borderColor: Colors.text,
    },
    drawerLabel: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 1,
    },
    header: {
        backgroundColor: Colors.background,
        borderBottomWidth: 4,
        borderColor: Colors.text,
        elevation: 0,
        shadowOpacity: 0,
        height: 100,
    }
});
