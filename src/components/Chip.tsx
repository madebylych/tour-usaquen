import { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Txt from '@/components/Txt';
import { colors, radius, space } from '@/theme';

type Props = {
  label: string;
  icon?: ComponentProps<typeof Ionicons>['name'];
  active?: boolean;
  onPress?: () => void;
};

// Píldora pequeña: filtros (con onPress) o datos informativos (sin onPress).
export default function Chip({ label, icon, active = false, onPress }: Props) {
  const color = active ? colors.onPrimary : colors.primary;
  const content = (
    <>
      {icon ? <Ionicons name={icon} size={16} color={color} /> : null}
      <Txt variant="label" color={color} style={styles.label}>
        {label}
      </Txt>
    </>
  );
  const style = [styles.chip, active ? styles.active : styles.inactive];

  if (!onPress) return <View style={style}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={style}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.s - 1,
    paddingHorizontal: space.m - 2,
    borderRadius: radius.pill,
  },
  active: { backgroundColor: colors.primary },
  inactive: { backgroundColor: colors.primarySoft },
  label: { fontSize: 13 },
});
