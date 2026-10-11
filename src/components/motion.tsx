// Animaciones de la app, pensadas desde la risografía: las cosas se
// "imprimen" (aparecen deslizándose como una hoja que sale de la máquina),
// se "estampan" (sellos que caen con fuerza y quedan torcidos).
// Todo usa el driver nativo y respeta "Reducir movimiento" del sistema.

import { ReactNode, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, ViewStyle } from 'react-native';

// "Reducir movimiento" del sistema: si está activo, todo aparece sin animar.
let reduceMotion = false;
const listeners = new Set<(value: boolean) => void>();
AccessibilityInfo.isReduceMotionEnabled()
  .then((value) => {
    reduceMotion = value;
    listeners.forEach((l) => l(value));
  })
  .catch(() => {});
AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
  reduceMotion = value;
  listeners.forEach((l) => l(value));
});

export function useReducedMotion(): boolean {
  const [value, setValue] = useState(reduceMotion);
  useEffect(() => {
    listeners.add(setValue);
    return () => {
      listeners.delete(setValue);
    };
  }, []);
  return value;
}

// Valor que va de 0 a 1 al montar el componente (o cuando cambia `trigger`).
function useEntrance(delay: number, trigger: unknown, animate: (v: Animated.Value) => Animated.CompositeAnimation) {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) {
      value.setValue(1);
      return;
    }
    value.setValue(0);
    const anim = Animated.sequence([Animated.delay(delay), animate(value)]);
    anim.start();
    return () => anim.stop();
    // `animate` es estable por cómo se usa; solo importa el disparador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger, reduced, delay, value]);
  return value;
}

type AppearProps = {
  children: ReactNode;
  index?: number; // posición en una lista: cada elemento sale un poco después
  delay?: number;
  from?: 'bottom' | 'right';
  style?: StyleProp<ViewStyle>;
};

// "Impresión": el elemento sale deslizándose y gana tinta (opacidad).
export function Appear({ children, index = 0, delay = 0, from = 'bottom', style }: AppearProps) {
  const v = useEntrance(delay + index * 70, null, (value) =>
    Animated.timing(value, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true })
  );
  const offset = v.interpolate({ inputRange: [0, 1], outputRange: [from === 'bottom' ? 18 : 28, 0] });
  const transform = from === 'bottom' ? [{ translateY: offset }] : [{ translateX: offset }];
  return <Animated.View style={[style, { opacity: v, transform }]}>{children}</Animated.View>;
}

type StampProps = {
  children: ReactNode;
  delay?: number;
  rotate?: string; // inclinación final del sello, por ejemplo '-6deg'
  trigger?: unknown; // al cambiar, vuelve a estampar
  style?: StyleProp<ViewStyle>;
};

// "Sello": cae grande y girado, golpea el papel y rebota un poco.
export function Stamp({ children, delay = 0, rotate = '0deg', trigger = null, style }: StampProps) {
  const v = useEntrance(delay, trigger, (value) =>
    Animated.spring(value, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true })
  );
  const final = parseFloat(rotate);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
          transform: [
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [2.2, 1] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: [`${final + 18}deg`, `${final}deg`] }) },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
