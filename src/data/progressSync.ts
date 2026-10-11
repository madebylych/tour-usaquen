import { AuthState, getAuth, onAuthChange } from './auth';
import { progress, subscribeProgress } from './progress';
import { supabase } from './supabase';

// Con sesión iniciada, el progreso del celular y el de la cuenta se juntan:
// al entrar se suman los dos, y cada parada nueva se guarda en la cuenta.
// Sin conexión no pasa nada malo: queda en el celular y se sube la próxima
// vez que se entre o se descubra algo con señal.
// Solo se suben ids de paradas del servidor (uuid); las de los datos
// incluidos en la app no existen en la base de datos.

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let synced: Set<string> = new Set();
let currentUser: string | null = null;

async function pull(userId: string) {
  if (!supabase) return;
  const { data, error } = await supabase.from('user_progress').select('place_id, discovered_at');
  if (error || currentUser !== userId) return;
  const remote: Record<string, number> = {};
  data.forEach((row) => (remote[row.place_id] = Date.parse(row.discovered_at)));
  synced = new Set(Object.keys(remote));
  progress.merge(remote);
  await push(userId);
}

async function push(userId: string) {
  if (!supabase) return;
  const discovered = progress.discovered();
  const rows = Object.entries(discovered)
    .filter(([id]) => UUID.test(id) && !synced.has(id))
    .map(([place_id, at]) => ({ place_id, discovered_at: new Date(at).toISOString() }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('user_progress').upsert(rows, { onConflict: 'user_id,place_id' });
  if (!error && currentUser === userId) rows.forEach((r) => synced.add(r.place_id));
}

// "Reiniciar recorrido" con sesión: también se borra de la cuenta.
export async function forgetRemote(placeIds: string[]) {
  const ids = placeIds.filter((id) => UUID.test(id));
  if (!supabase || !currentUser || ids.length === 0) return;
  ids.forEach((id) => synced.delete(id));
  await supabase.from('user_progress').delete().in('place_id', ids);
}

function handleAuth(auth: AuthState) {
  const userId = auth.status === 'signedIn' ? auth.userId : null;
  if (userId === currentUser) return;
  currentUser = userId;
  synced = new Set();
  if (userId) pull(userId).catch(() => {});
}

export function startProgressSync() {
  handleAuth(getAuth());
  onAuthChange(handleAuth);
  subscribeProgress(() => {
    if (currentUser) push(currentUser).catch(() => {});
  });
}
