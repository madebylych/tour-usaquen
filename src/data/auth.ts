import { useSyncExternalStore } from 'react';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './supabase';

// Cuenta del visitante. Sin sesión es "invitado": todo se guarda solo en
// este celular. Con Google, el progreso se guarda también en la cuenta
// (progressSync.ts). Si el correo está en la tabla `admins` de Supabase,
// aparece el panel de administración; la regla real está en la base de
// datos (supabase/admin.sql), esto solo decide qué se muestra.

export type AuthState =
  | { status: 'loading' }
  | { status: 'guest' }
  | { status: 'signedIn'; userId: string; email: string; name: string | null; isAdmin: boolean };

let state: AuthState = supabase ? { status: 'loading' } : { status: 'guest' };
const listeners = new Set<() => void>();

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, () => state);
}

export function getAuth(): AuthState {
  return state;
}

export function onAuthChange(listener: (state: AuthState) => void) {
  return subscribe(() => listener(state));
}

async function applySession(session: Session | null) {
  if (!session || !supabase) return setState({ status: 'guest' });
  const { user } = session;
  const base = {
    status: 'signedIn' as const,
    userId: user.id,
    email: user.email ?? '',
    name: (user.user_metadata?.full_name as string | undefined) ?? null,
  };
  setState({ ...base, isAdmin: false });
  // Sin conexión la consulta falla y simplemente no se muestra el panel.
  const { data } = await supabase.rpc('is_admin');
  const current = getAuth();
  if (current.status === 'signedIn' && current.userId === user.id) setState({ ...base, isAdmin: data === true });
}

if (supabase) {
  supabase.auth
    .getSession()
    .then(({ data }) => applySession(data.session))
    .catch(() => setState({ status: 'guest' }));
  supabase.auth.onAuthStateChange((_event, session) => {
    applySession(session);
  });
}

// Lee access_token y refresh_token de la dirección a la que Supabase
// devuelve después de Google (vienen después de "#" o de "?").
function tokensFrom(url: string) {
  const params = new URLSearchParams(url.split('#')[1] ?? url.split('?')[1] ?? '');
  return { access: params.get('access_token'), refresh: params.get('refresh_token'), error: params.get('error_description') };
}

// Entrar con Google: se abre el navegador con la página de Google y, al
// terminar, vuelve a la app (tourusaquen://auth) con la sesión.
// Devuelve un mensaje de error para mostrar, o null si salió bien o se canceló.
export async function signInWithGoogle(): Promise<string | null> {
  if (!supabase) return 'Esta versión de la app no tiene cuentas configuradas.';
  const redirectTo = Linking.createURL('auth');
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error || !data.url) return 'No se pudo abrir el inicio de sesión. Revisa tu conexión.';

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return null; // la persona cerró la ventana
  const { access, refresh, error: oauthError } = tokensFrom(result.url);
  if (oauthError) return oauthError;
  if (!access || !refresh) return 'Google no devolvió la sesión. Intenta de nuevo.';
  const { error: sessionError } = await supabase.auth.setSession({ access_token: access, refresh_token: refresh });
  return sessionError ? 'No se pudo guardar la sesión.' : null;
}

export async function signOut() {
  await supabase?.auth.signOut();
}
