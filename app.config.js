// Extiende app.json con valores que no deben quedar escritos en el
// repositorio. La API key de Google Maps para Android se guarda como
// variable de entorno de EAS (entorno "preview") y se lee aquí al compilar.
//
// En Expo Go no hace falta: el mapa funciona sin key.

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    [
      'react-native-maps',
      { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY },
    ],
  ],
});
