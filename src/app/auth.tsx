import { Redirect } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

// Destino del regreso de Google (tourusaquen://auth). En la web, esta página
// se abre en la ventana emergente y le pasa la sesión a la app que la abrió.
// En el celular, si el sistema abre la app con este enlace, se vuelve a
// Ajustes (la sesión ya la tomó auth.ts).
WebBrowser.maybeCompleteAuthSession();

export default function AuthReturn() {
  return <Redirect href="/ajustes" />;
}
