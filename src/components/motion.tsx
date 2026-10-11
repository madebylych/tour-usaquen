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

// --- Movimiento continuo y respuesta al toque -------------------------------

// Valor que va y viene entre 0 y 1 sin parar (suave, con seno). Quieto en 0
// con "Reducir movimiento".
export function useLoop(duration: number, delay = 0) {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) {
      value.setValue(0);
      return;
    }
    const half = (toValue: number) =>
      Animated.timing(value, { toValue, duration: duration / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true });
    const loop = Animated.sequence([Animated.delay(delay), Animated.loop(Animated.sequence([half(1), half(0)]))]);
    loop.start();
    return () => loop.stop();
  }, [reduced, value, duration, delay]);
  return value;
}

type LoopProps = { children: ReactNode; style?: StyleProp<ViewStyle>; delay?: number };

// "Respira": crece un poco y vuelve. Para lo que pide atención (siguiente parada).
export function Breathe({ children, style, delay = 0, amount = 0.06 }: LoopProps & { amount?: number }) {
  const v = useLoop(2200, delay);
  const scale = v.interpolate({ inputRange: [0, 1], outputRange: [1, 1 + amount] });
  return <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>;
}

// "Se mece": un sticker pegado que se mueve con el viento.
export function Wobble({ children, style, delay = 0, from = '-6deg', to = '-2deg' }: LoopProps & { from?: string; to?: string }) {
  const v = useLoop(3200, delay);
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: [from, to] });
  return <Animated.View style={[style, { transform: [{ rotate }] }]}>{children}</Animated.View>;
}

// "Empuja": una flecha que invita a seguir (se corre unos píxeles y vuelve).
export function Nudge({ children, style, delay = 0, distance = 5 }: LoopProps & { distance?: number }) {
  const v = useLoop(1400, delay);
  const translateX = v.interpolate({ inputRange: [0, 1], outputRange: [0, distance] });
  return <Animated.View style={[style, { transform: [{ translateX }] }]}>{children}</Animated.View>;
}

// Rebote al tocar: el elemento se hunde un poco y vuelve con resorte.
// Uso: const press = usePressSpring(); <Pressable onPressIn={press.in} onPressOut={press.out}>
//        <Animated.View style={{ transform: [{ scale: press.scale }] }}>...
export function usePressSpring(depth = 0.96) {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const to = (toValue: number) => {
    if (reduced) return;
    Animated.spring(scale, { toValue, friction: 5, tension: 300, useNativeDriver: true }).start();
  };
  return { scale, in: () => to(depth), out: () => to(1) };
}

// Palabras que entran una por una (titulares).
export function Words({ text, render, delay = 0 }: { text: string; render: (word: string) => ReactNode; delay?: number }) {
  return (
    <>
      {text.split(' ').map((word, i) => (
        <Appear key={`${word}-${i}`} delay={delay + i * 110} style={{ marginRight: 10 }}>
          {render(word)}
        </Appear>
      ))}
    </>
  );
}

// Foto que se acerca lentamente (efecto "Ken Burns"): la imagen nunca está
// del todo quieta.
export function useDrift() {
  const v = useLoop(16000);
  return v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
}

// Parallax de la foto principal: al bajar, la foto se queda un poco atrás;
// al estirar hacia arriba, crece.
export function useParallax(height: number) {
  const [scrollY] = useState(() => new Animated.Value(0));
  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true });
  const heroStyle = {
    transform: [
      { translateY: scrollY.interpolate({ inputRange: [-height, 0, height], outputRange: [-height / 2, 0, height * 0.45], extrapolateRight: 'clamp' as const }) },
      { scale: scrollY.interpolate({ inputRange: [-height, 0], outputRange: [1.6, 1], extrapolateRight: 'clamp' as const }) },
    ],
  };
  return { onScroll, heroStyle };
}

// Hover: 0 -> 1 al pasar el mouse (web, tablets con mouse) y también al
// presionar, para que en el celular (sin mouse) se vea el mismo efecto.
// Uso: const hover = useHover(); <Pressable {...hover.handlers}> y
// hover.value.interpolate(...) en los estilos.
export function useHover() {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(0));
  const to = (toValue: number) => {
    if (reduced) return value.setValue(toValue);
    Animated.spring(value, { toValue, friction: 7, tension: 160, useNativeDriver: true }).start();
  };
  const on = () => to(1);
  const off = () => to(0);
  return { value, handlers: { onHoverIn: on, onHoverOut: off, onPressIn: on, onPressOut: off } };
}
