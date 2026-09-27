import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';

import Button from '@/components/Button';
import Screen from '@/components/Screen';
import { colors, fontSize, space } from '@/theme';

// Intro: qué es el proyecto y cómo se usa. Textos provisionales.
export default function IntroScreen() {
  return (
    <Screen>
      <Text style={styles.title}>Distrito Creativo de Usaquén</Text>
      <Text style={styles.body}>
        Una experiencia de exploración espacial y sonora. Camina, descubre y escucha el territorio.
      </Text>
      <Button label="Ver recorrido" onPress={() => router.push('/ruta/usaquen-centro')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.title, fontWeight: '700', color: colors.text, marginTop: space.xl },
  body: { fontSize: fontSize.body, lineHeight: 24, color: colors.text },
});
