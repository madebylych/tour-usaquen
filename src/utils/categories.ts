import { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

// Ícono por categoría de lugar. Las categorías vienen del contenido;
// si llega una desconocida se usa un pin genérico.
const ICONS: Record<string, IconName> = {
  galería: 'color-palette',
  música: 'musical-notes',
  arquitectura: 'business',
  gastronomía: 'restaurant',
  patrimonio: 'library',
  arte: 'brush',
};

export function categoryIcon(category: string): IconName {
  return ICONS[category.trim().toLowerCase()] ?? 'location';
}
