import { StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

import Screen from '@/components/Screen';
import { colors, fontSize } from '@/theme';

// Ficha del lugar: imagen, consigna de observación, audio, historia, arquitectura (fase 1).
export default function PlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <Screen>
      <Text style={styles.title}>Parada: {id}</Text>
      <Text style={styles.muted}>Aquí irán la imagen, el audio y los textos del lugar.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text },
  muted: { fontSize: fontSize.body, color: colors.textMuted },
});
