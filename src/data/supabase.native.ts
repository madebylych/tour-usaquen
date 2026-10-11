// Cliente de Supabase en el celular: polyfills que pide Supabase para Expo
// (URL y localStorage sobre SQLite, donde se guarda la sesión).
import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

export { supabase } from './supabaseClient';
