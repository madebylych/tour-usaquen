import { Tabs } from 'expo-router';

import { colores } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: colores.acento }}>
      <Tabs.Screen name="index" options={{ title: 'Mapa' }} />
      <Tabs.Screen name="cerca" options={{ title: 'Cerca de ti' }} />
    </Tabs>
  );
}
