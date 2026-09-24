import type { SymbolViewProps } from 'expo-symbols';

export type ServiceType = 'wall' | 'ceiling' | 'lining' | 'details';

export type ServiceOption = {
  id: ServiceType;
  title: string;
  description: string;
  icon: SymbolViewProps['name'];
};

export const serviceOptions: readonly ServiceOption[] = [
  {
    id: 'wall',
    title: 'Parede',
    description: 'Divisórias e paredes em drywall',
    icon: { ios: 'rectangle.split.3x1', android: 'view_column', web: 'view_column' },
  },
  {
    id: 'ceiling',
    title: 'Forro',
    description: 'Forros e rebaixamentos',
    icon: { ios: 'square.grid.2x2', android: 'grid_view', web: 'grid_view' },
  },
  {
    id: 'lining',
    title: 'Revestimento',
    description: 'Revestimento de paredes',
    icon: { ios: 'square.stack.3d.up', android: 'layers', web: 'layers' },
  },
  {
    id: 'details',
    title: 'Nichos e Detalhes',
    description: 'Projetos personalizados em drywall',
    icon: { ios: 'square.grid.3x3', android: 'dashboard', web: 'dashboard' },
  },
];
