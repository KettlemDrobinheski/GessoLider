import type { RecentBudget } from '@/components/home/recent-budget-card';

// Temporary visual fixtures only. No persistence or real customer data.
export const mockRecentBudgets: RecentBudget[] = [
  { id: 'mock-martins', title: 'Residência Martins', service: 'Parede - Sala', dateLabel: '12/09/2026', amountLabel: 'R$ 1.650,00', status: 'Em edição' },
  { id: 'mock-souza', title: 'Comercial Souza', service: 'Forro - Escritório', dateLabel: '08/09/2026', amountLabel: 'R$ 950,00', status: 'Enviado' },
  { id: 'mock-lima', title: 'Apartamento Lima', service: 'Revestimento - Quarto', dateLabel: '05/09/2026', amountLabel: 'R$ 1.200,00', status: 'Concluído' },
];
