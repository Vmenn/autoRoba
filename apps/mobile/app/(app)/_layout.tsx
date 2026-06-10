import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <Text style={{ fontSize: 10, color: focused ? '#1e3a5f' : '#94a3b8', fontWeight: focused ? '700' : '400', marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { height: 72, paddingBottom: 10, backgroundColor: '#fff', borderTopColor: '#e2e8f0' },
        tabBarActiveTintColor: '#1e3a5f',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Beranda" focused={focused} /> }} />
      <Tabs.Screen name="attendance" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="📍" label="Absensi" focused={focused} /> }} />
      <Tabs.Screen name="tasks" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="✅" label="Tasks" focused={focused} /> }} />
      <Tabs.Screen name="leave" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🏖" label="Cuti" focused={focused} /> }} />
      <Tabs.Screen name="reimbursement" options={{ tabBarIcon: ({ focused }) => <TabIcon emoji="🧾" label="Reimburse" focused={focused} /> }} />
    </Tabs>
  );
}
