// Datos de prueba. Se reemplazan por los que genere el script a partir de
// 02_investigacion/plantilla_lugares.csv cuando el grupo llene la hoja.
// Los campos se llaman igual que las columnas de la plantilla.

export const CENTRO_USAQUEN = {
  latitude: 4.6948,
  longitude: -74.0308,
};

export const lugares = [
  {
    id: '01',
    nombre: 'Parada de prueba 1',
    categoria: 'galeria',
    direccion: 'Pendiente',
    latitud: 4.6952,
    longitud: -74.0312,
    orden_ruta: 1,
    historia: 'Texto de prueba. Aquí va la historia del lugar.',
    diseno_arquitectonico: 'Texto de prueba. Aquí va el diseño arquitectónico del lugar.',
    audio: null,
    autor_audio: '',
    foto: null,
    credito_foto: '',
  },
  {
    id: '02',
    nombre: 'Parada de prueba 2',
    categoria: 'musica',
    direccion: 'Pendiente',
    latitud: 4.6945,
    longitud: -74.0300,
    orden_ruta: 2,
    historia: 'Texto de prueba. Aquí va la historia del lugar.',
    diseno_arquitectonico: 'Texto de prueba. Aquí va el diseño arquitectónico del lugar.',
    audio: null,
    autor_audio: '',
    foto: null,
    credito_foto: '',
  },
  {
    id: '03',
    nombre: 'Parada de prueba 3',
    categoria: 'gastronomia',
    direccion: 'Pendiente',
    latitud: 4.6938,
    longitud: -74.0315,
    orden_ruta: 3,
    historia: 'Texto de prueba. Aquí va la historia del lugar.',
    diseno_arquitectonico: 'Texto de prueba. Aquí va el diseño arquitectónico del lugar.',
    audio: null,
    autor_audio: '',
    foto: null,
    credito_foto: '',
  },
];

export function buscarLugar(id) {
  return lugares.find((lugar) => lugar.id === id);
}

export const ruta = [...lugares].sort((a, b) => a.orden_ruta - b.orden_ruta);
