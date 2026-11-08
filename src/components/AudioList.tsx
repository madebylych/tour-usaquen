import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AudioPlayer from '@/components/AudioPlayer';
import { Appear } from '@/components/motion';
import Txt from '@/components/Txt';
import { makeStyles, radius, space, useTheme } from '@/theme';
import { tap } from '@/audio/haptics';
import { PlaceWithMedia } from '@/types';

// "Audios del recorrido": una fila por parada. El reproductor se monta solo en
// la fila abierta, así nunca suenan dos audios a la vez ni se cargan todos.
export default function AudioList({ places }: { places: PlaceWithMedia[] }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [openId, setOpenId] = useState<string | null>(null);
  const ready = places.filter((p) => p.media.audio !== null).length;

  return (
    <Appear style={styles.list}>
      <Txt variant="caption">
        {ready === 0 ? 'Aún no hay audios en este recorrido.' : `${ready} de ${places.length} audios disponibles`}
      </Txt>
      {places.map((place, index) => {
        const available = place.media.audio !== null;
        const open = openId === place.id;
        return (
          <View key={place.id} style={styles.item}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Parada ${index + 1}: ${place.name}${available ? '' : ', audio pendiente'}`}
              accessibilityState={{ disabled: !available, expanded: open }}
              disabled={!available}
              onPress={() => {
                tap();
                setOpenId(open ? null : place.id);
              }}
              style={styles.row}
            >
              <View style={styles.number}>
                <Txt variant="label">{index + 1}</Txt>
              </View>
              <View style={styles.grow}>
                <Txt variant="label">{place.name}</Txt>
                <Txt variant="caption">{available ? (place.audio_title ?? 'Escucha este lugar') : 'Audio pendiente'}</Txt>
              </View>
              {available ? (
                <Ionicons name={open ? 'chevron-up' : 'headset-outline'} size={20} color={colors.text} />
              ) : null}
            </Pressable>
            {open ? <AudioPlayer uri={place.media.audio} title={place.audio_title} credit={place.audio_credit} /> : null}
          </View>
        );
      })}
    </Appear>
  );
}

const useStyles = makeStyles((colors) => ({
  list: { gap: space.s + 2 },
  item: { gap: space.s, padding: space.m - 2, backgroundColor: colors.surface, borderRadius: radius.m, borderWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.m - 4 },
  number: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.panel, borderRadius: radius.pill },
  grow: { flex: 1 },
}));
