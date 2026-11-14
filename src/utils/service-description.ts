import type { ClientData } from '../types/client';
import type { SavedBudget } from '../types/saved-budget';

type Service = SavedBudget['service'];

function location(client?: ClientData | null): string {
  if (!client) return '';
  const place = [client.street, client.number, client.neighborhood, client.city, client.state].filter(Boolean).join(', ');
  return place ? ` no local informado (${place})` : '';
}

export function suggestServiceDescription(service: Service, client?: ClientData | null, dimensions?: { length?: number; width?: number; height?: number }): string {
  const names: Record<Service, string> = {
    wall: 'Execução de parede de drywall',
    ceiling: 'Execução de forro de drywall',
    lining: 'Execução de revestimento em parede de madeira',
  };
  let details = '';
  if (service === 'wall' && dimensions?.length && dimensions.height) details = `, com aproximadamente ${dimensions.length} m de comprimento e ${dimensions.height} m de altura`;
  if (service === 'ceiling' && dimensions?.length && dimensions.width) details = `, com aproximadamente ${dimensions.length} m por ${dimensions.width} m`;
  if (service === 'lining' && dimensions?.width && dimensions.height) details = `, com aproximadamente ${dimensions.width} m de largura e ${dimensions.height} m de altura`;
  return `${names[service]}${details}${location(client)}.`;
}
