import { ReactNode, useEffect, useState } from 'react';
import { Alert, Animated, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import * as Application from 'expo-application';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { setPlayerVolume } from '@/audio/volume';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { Appear, useReducedMotion } from '@/components/motion';
import Txt from '@/components/Txt';
import { signInWithGoogle, signOut, useAuth } from '@/data/auth';
import { deleteAllDownloads, downloadsSize } from '@/data/cleanup';
import { useDownloads } from '@/data/downloads';
import { settings, toVolume, useSettings, VOLUME_STEPS } from '@/data/settings';
import { line, makeStyles, space, ThemeMode, useTheme } from '@/theme';

const DISCOVERY_SOUND = require('../../assets/sounds/ui/discovery.wav');

const THEMES: { mode: ThemeMode; label: string; icon: 'sunny' | 'moon' | 'phone-portrait-outline' }[] = [
  { mode: 'light', label: 'Claro', icon: 'sunny' },
  { mode: 'dark', label: 'Oscuro', icon: 'moon' },
  { mode: 'system', label: 'Dispositivo', icon: 'phone-portrait-outline' },
];

// Ajustes: tema, sonido, vibración, cuenta y almacenamiento.
export default function SettingsScreen() {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { colors, mode, setMode } = useTheme();
  const current = useSettings();
  const auth = useAuth();
  const downloaded = useDownloads();
  const [busy, setBusy] = useState(false);
  const preview = useAudioPlayer(DISCOVERY_SOUND);

  // Al cambiar el volumen de la app, suena el aviso con el nivel nuevo.
  const setUiVolume = (step: number) => {
    settings.update({ uiVolume: step });
    if (step === 0) return;
    setPlayerVolume(preview, step);
    preview.seekTo(0).then(() => preview.play()).catch(() => {});
  };

  const setHaptics = (on: boolean) => {
    settings.update({ haptics: on });
    if (on) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  };

  const login = async () => {
    setBusy(true);
    const error = await signInWithGoogle().catch(() => 'No se pudo iniciar sesión.');
    setBusy(false);
    if (error) Alert.alert('Iniciar sesión', error);
  };

  const routesCount = Object.keys(downloaded).length;
  const freeSpace = () =>
    Alert.alert('Liberar espacio', 'Se borran los recorridos descargados. Podrás volver a descargarlos con conexión.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: deleteAllDownloads },
    ]);

  return (
    <View style={styles.screen}>
      <BackButton />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xl + space.l, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        <Txt variant="title" color={colors.primary}>
          Ajustes
        </Txt>

        <Section index={0} title="Tema">
          <View style={styles.segmented} accessibilityRole="radiogroup">
            {THEMES.map((t) => (
              <Option key={t.mode} selected={mode === t.mode} onPress={() => setMode(t.mode)} label={t.label} icon={t.icon} />
            ))}
          </View>
        </Section>

        <Section index={1} title="Sonido">
          <Volume
            label="Audios de las paradas"
            value={current.placeVolume}
            onChange={(step) => settings.update({ placeVolume: step })}
          />
          <Volume label="Sonidos de la app" value={current.uiVolume} onChange={setUiVolume} />
        </Section>

        <Section index={2} title="Vibración">
          <Toggle label="Vibrar al descubrir una parada" value={current.haptics} onChange={setHaptics} />
        </Section>

        <Section index={3} title="Cuenta">
          {auth.status === 'signedIn' ? (
            <>
              <Txt variant="label">{auth.name ?? auth.email}</Txt>
              <Txt variant="caption">
                {auth.email}. Tu progreso se guarda en tu cuenta y en este celular.
              </Txt>
              {auth.isAdmin ? (
                <Button label="Panel de administración" icon="construct" onPress={() => router.push('/admin')} />
              ) : null}
              <Button label="Cerrar sesión" variant="secondary" icon="log-out-outline" onPress={() => signOut()} />
            </>
          ) : (
            <>
              <Txt variant="label">{auth.status === 'loading' ? 'Revisando sesión…' : 'Estás como invitado'}</Txt>
              <Txt variant="caption">
                Como invitado tu progreso se guarda solo en este celular. Con tu cuenta de Google lo conservas si
                cambias de celular.
              </Txt>
              <Button
                label={busy ? 'Abriendo Google…' : 'Entrar con Google'}
                icon="logo-google"
                onPress={busy ? () => {} : login}
              />
            </>
          )}
        </Section>

        <Section index={4} title="Almacenamiento">
          <Txt variant="caption">
            {routesCount === 0
              ? 'No hay recorridos descargados.'
              : `${routesCount} recorrido${routesCount === 1 ? '' : 's'} descargado${routesCount === 1 ? '' : 's'}, ${formatBytes(downloadsSize())}.`}{' '}
            Al actualizar la app o un recorrido, la versión anterior se borra sola.
          </Txt>
          {routesCount > 0 ? <Button label="Liberar espacio" variant="secondary" icon="trash-outline" onPress={freeSpace} /> : null}
        </Section>

        <Txt variant="caption" style={styles.version}>
          Tour Usaquén {Application.nativeApplicationVersion ?? ''}
        </Txt>
      </ScrollView>
    </View>
  );
}

function Section({ title, index, children }: { title: string; index: number; children: ReactNode }) {
  const styles = useStyles();
  return (
    <Appear index={index} style={styles.section}>
      <Txt variant="overline">{title.toUpperCase()}</Txt>
      {children}
    </Appear>
  );
}

function Option({
  selected,
  onPress,
  label,
  icon,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
  icon: (typeof THEMES)[number]['icon'];
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const color = selected ? colors.onAccent : colors.text;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.option, selected && styles.optionSelected]}
    >
      <Ionicons name={icon} size={18} color={color} />
      <Txt variant="label" color={color}>
        {label}
      </Txt>
    </Pressable>
  );
}

// Volumen en bloques de tinta: 0 (silencio) a VOLUME_STEPS.
function Volume({ label, value, onChange }: { label: string; value: number; onChange: (step: number) => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.volume}>
      <View style={styles.volumeHeader}>
        <Txt variant="label">{label}</Txt>
        <Txt variant="caption">{value === 0 ? 'Silencio' : `${Math.round(toVolume(value) * 100)} %`}</Txt>
      </View>
      <View
        style={styles.blocks}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min: 0, max: VOLUME_STEPS, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) =>
          onChange(Math.min(VOLUME_STEPS, Math.max(0, value + (e.nativeEvent.actionName === 'increment' ? 1 : -1))))
        }
      >
        <Pressable onPress={() => onChange(0)} hitSlop={6} style={styles.mute} accessibilityLabel="Silenciar">
          <Ionicons name={value === 0 ? 'volume-mute' : 'volume-low'} size={20} color={colors.text} />
        </Pressable>
        {Array.from({ length: VOLUME_STEPS }, (_, i) => i + 1).map((step) => (
          <Pressable
            key={step}
            onPress={() => onChange(step)}
            hitSlop={4}
            style={[styles.block, { height: 14 + step * 5 }, step <= value ? styles.blockOn : styles.blockOff]}
          />
        ))}
      </View>
    </View>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (on: boolean) => void }) {
  const styles = useStyles();
  const reduced = useReducedMotion();
  const [x] = useState(() => new Animated.Value(value ? 1 : 0));
  // La perilla se desliza (con resorte) en vez de saltar.
  useEffect(() => {
    if (reduced) x.setValue(value ? 1 : 0);
    else Animated.spring(x, { toValue: value ? 1 : 0, friction: 6, tension: 180, useNativeDriver: true }).start();
  }, [value, reduced, x]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={styles.toggleRow}
    >
      <Txt variant="label" style={styles.grow}>
        {label}
      </Txt>
      <View style={[styles.track, value && styles.trackOn]}>
        <Animated.View
          style={[
            styles.knob,
            value && styles.knobOn,
            { transform: [{ translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 26] }) }] },
          ]}
        />
      </View>
    </Pressable>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const useStyles = makeStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.m + 6, gap: space.m },
  section: {
    gap: space.m - 4,
    padding: space.m + 2,
    backgroundColor: colors.surface,
    borderWidth: line,
    borderColor: colors.border,
  },
  segmented: { flexDirection: 'row', gap: space.s },
  option: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.m - 4,
    borderWidth: line,
    borderColor: colors.border,
  },
  optionSelected: { backgroundColor: colors.accent },
  volume: { gap: space.s },
  volumeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  blocks: { flexDirection: 'row', alignItems: 'flex-end', gap: space.s, height: 44 },
  mute: { width: 32, height: 40, alignItems: 'center', justifyContent: 'center' },
  block: { flex: 1, borderWidth: line, borderColor: colors.border },
  blockOn: { backgroundColor: colors.primary },
  blockOff: { backgroundColor: colors.background },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: space.m },
  grow: { flex: 1 },
  track: {
    width: 56,
    height: 30,
    padding: 3,
    borderWidth: line,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  trackOn: { backgroundColor: colors.primary },
  knob: { width: 21, height: 21, backgroundColor: colors.border },
  knobOn: { backgroundColor: colors.accent },
  version: { textAlign: 'center', marginTop: space.s },
}));
