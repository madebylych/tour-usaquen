import { ReactNode } from 'react';
import { Animated, Pressable, View } from 'react-native';

import { useHover } from '@/components/motion';
import Txt from '@/components/Txt';
import { fonts, line, makeStyles, space, useTheme } from '@/theme';

const IMAGE_HEIGHT = 210;
const DEPTH = 6; // sombra dura de la postal

type Props = {
  uri: string | null; // foto; sin foto se ve la trama
  label: string; // descripción para lectores de pantalla
  caption: string; // pie de la postal ("Saludos desde Usaquén")
  onPress?: () => void;
  children?: ReactNode; // lo que va encima de la foto (el sticker del recorrido)
};

// Portada del inicio como postal: marco blanco, estampilla y pie. Quieta
// está un poco torcida; con hover (o al mantenerla presionada en el
// celular) se endereza, se levanta y la foto se acerca.
export default function Postcard({ uri, label, caption, onPress, children }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const hover = useHover();
  const v = hover.value;

  const card = {
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) },
      { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '0deg'] }) },
    ],
  };
  const photo = { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] };
  const shadow = {
    transform: [
      { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [DEPTH, DEPTH + 4] }) },
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [DEPTH, DEPTH + 4] }) },
      { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-1.5deg', '0deg'] }) },
    ],
  };
  // La estampilla se tuerce un poco más al pasar el mouse, como si se despegara.
  const stamp = { transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['4deg', '10deg'] }) }] };

  return (
    <Pressable onPress={onPress} {...hover.handlers} accessibilityRole={onPress ? 'button' : 'image'} accessibilityLabel={label}>
      <View style={styles.wrap}>
        <Animated.View style={[styles.shadow, shadow]} />
        <Animated.View style={[styles.card, card]}>
          <View style={styles.photoBox}>
            <Animated.Image
              source={uri ? { uri } : require('../../assets/images/trama.png')}
              style={[styles.photo, photo]}
              resizeMode="cover"
            />
            {children}
          </View>
          <View style={styles.footer}>
            <Txt variant="label" style={styles.caption} color={colors.text}>
              {caption}
            </Txt>
            <Txt variant="caption">Bogotá, Colombia</Txt>
          </View>
          {/* Estampilla: amarilla, con borde perforado. */}
          <Animated.View style={[styles.stamp, stamp]}>
            <View style={styles.stampInner}>
              <Txt variant="caption" color={colors.onAccent} style={styles.stampSmall}>
                USAQUÉN
              </Txt>
              <Txt variant="heading" color={colors.onAccent} style={styles.stampBig}>
                01
              </Txt>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { marginRight: DEPTH, marginBottom: DEPTH },
  shadow: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.border },
  card: {
    padding: space.s + 2,
    paddingBottom: 0,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
  },
  photoBox: { height: IMAGE_HEIGHT, overflow: 'hidden', backgroundColor: colors.primarySoft },
  photo: { width: '100%', height: '100%' },
  footer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: space.s + 2,
    paddingHorizontal: space.xs,
  },
  caption: { fontFamily: fonts.display, fontSize: 17 },
  stamp: {
    position: 'absolute',
    top: -10,
    right: 14,
    padding: 3,
    backgroundColor: colors.accent,
  },
  stampInner: {
    width: 54,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.onAccent,
  },
  stampSmall: { fontFamily: fonts.bold, fontSize: 8, lineHeight: 10, letterSpacing: 1 },
  stampBig: { fontSize: 22, lineHeight: 24 },
}));
