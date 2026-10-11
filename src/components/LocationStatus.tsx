import { ComponentProps } from 'react';
import { Linking, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Appear, Breathe } from '@/components/motion';
import Txt from '@/components/Txt';
import { UserLocation } from '@/geo/useLocation';
import { line, makeStyles, space, useTheme } from '@/theme';

type Props = {
  location: UserLocation;
  onLongPress: () => void; // activa / desactiva el modo simulación
};

// Píldora sobre el mapa que explica el estado del GPS en lenguaje claro.
// Pulsación larga: modo simulación (escondido a propósito).
export default function LocationStatus({ location, onLongPress }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const { icon, text, highlight } = describe(location);
  const denied = location.status === 'denied';
  const unavailable = location.status === 'unavailable';

  return (
    <Pressable
      onLongPress={onLongPress}
      delayLongPress={800}
      // Sin permiso, un toque lleva a los ajustes del celular para darlo.
      // Con el GPS apagado, un toque vuelve a intentar (tras encenderlo).
      // En la web no hay "Ajustes de la app" que abrir: se reintenta.
      onPress={
        denied && Platform.OS !== 'web' ? () => Linking.openSettings() : denied || unavailable ? location.retry : undefined
      }
      accessibilityRole={denied || unavailable ? 'button' : 'text'}
      accessibilityHint="Mantén presionado para activar o desactivar el modo simulación"
      style={styles.anchor}
    >
      {/* Cada cambio de estado entra de nuevo; mientras busca, el ícono respira. */}
      <Appear key={location.status} style={[styles.pill, highlight && styles.highlight]}>
        {location.status === 'requesting' ? (
          <Breathe amount={0.25}>
            <Ionicons name={icon} size={16} color={colors.primary} />
          </Breathe>
        ) : (
          <Ionicons name={icon} size={16} color={highlight ? colors.onAccent : colors.primary} />
        )}
        <Txt variant="label" color={highlight ? colors.onAccent : colors.text} style={styles.text}>
          {text}
        </Txt>
      </Appear>
    </Pressable>
  );
}

function describe(location: UserLocation): {
  icon: ComponentProps<typeof Ionicons>['name'];
  text: string;
  highlight: boolean;
} {
  switch (location.status) {
    case 'requesting':
      return { icon: 'locate-outline', text: 'Buscando tu ubicación…', highlight: false };
    case 'active':
      return {
        icon: 'locate',
        text: location.accuracy != null ? `Ubicación activa ±${Math.round(location.accuracy)} m` : 'Ubicación activa',
        highlight: false,
      };
    case 'denied':
      return { icon: 'alert-circle-outline', text: 'Sin permiso de ubicación. Toca para activarlo', highlight: false };
    case 'unavailable':
      return { icon: 'alert-circle-outline', text: 'GPS apagado o sin señal. Enciéndelo y toca aquí', highlight: false };
    case 'simulated':
      return { icon: 'flask', text: 'Simulación: toca el mapa para moverte', highlight: true };
  }
}

const useStyles = makeStyles((colors) => ({
  anchor: { position: 'absolute', top: space.m, alignSelf: 'center', maxWidth: '90%' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs + 2,
    paddingVertical: space.s,
    paddingHorizontal: space.m - 2,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
  },
  highlight: { backgroundColor: colors.accent },
  text: { fontSize: 13, flexShrink: 1 },
}));
