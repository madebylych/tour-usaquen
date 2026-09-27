import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import { colors, fontSize, space } from '@/theme';

// Final del recorrido: pasaporte completo y créditos del equipo (fase 5).
export default function CompleteScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Recorrido completado</Text>
      <Text style={styles.muted}>Aquí irán el pasaporte y los créditos del equipo.</Text>
      <Button label="Volver al inicio" onPress={() => router.dismissAll()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: space.xl },
  muted: { fontSize: fontSize.body, color: colors.textMuted },
});
