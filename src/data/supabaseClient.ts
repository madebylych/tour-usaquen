import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Cliente de Supabase con sesión: para entrar con Google, guardar el
// progreso en la cuenta y para el panel de administración. La lectura
// pública del tour sigue en remote.ts (fetch directo, sin sesión).
// Importar desde './supabase', que agrega los polyfills del celular.

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// null si la app no tiene Supabase configurado (solo datos incluidos):
// entonces no hay cuentas y todo el mundo es invitado.
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        auth: {
          storage: globalThis.localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
          // PKCE: Google devuelve un código de un solo uso que solo sirve
          // junto con un secreto guardado en este dispositivo. Si alguien
          // intercepta la dirección de regreso, no obtiene la sesión.
          flowType: 'pkce',
        },
      })
    : null;
