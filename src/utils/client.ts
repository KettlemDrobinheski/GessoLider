import type { ClientData } from '../types/client';

export const emptyClient: ClientData = {
  name: '', phone: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '', notes: '',
};
export const normalizePhone = (value: string) => value.replace(/\D/g, '');
export const normalizeCep = (value: string) => value.replace(/\D/g, '');

export function validatePhone(value: string): boolean {
  const phone = value.trim();
  return !phone || (/^[\d\s()+-]+$/.test(phone) && /^[1-9]{2}\d{8,9}$/.test(normalizePhone(phone)));
}

export function formatPhone(value: string): string {
  const digits = normalizePhone(value);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  const local = digits.slice(2);
  const split = digits.length > 10 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${local.slice(0, split)}${local.length > split ? `-${local.slice(split)}` : ''}`;
}

export function formatCep(value: string): string {
  const digits = normalizeCep(value);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

export function validateClient(draft: ClientData): { value: ClientData | null; errors: Partial<Record<keyof ClientData, string>> } {
  const value = Object.fromEntries(Object.entries(draft).map(([key, text]) => [key, text.trim()])) as ClientData;
  const errors: Partial<Record<keyof ClientData, string>> = {};
  if (!value.name) errors.name = 'Informe o nome do cliente.';
  if (!validatePhone(value.phone)) {
    errors.phone = 'Informe um telefone com DDD e 10 ou 11 dígitos.';
  }
  if (value.cep && (!/^[\d\s-]+$/.test(value.cep) || normalizeCep(value.cep).length !== 8)) errors.cep = 'Informe um CEP com 8 dígitos.';
  value.phone = normalizePhone(value.phone);
  value.cep = normalizeCep(value.cep);
  value.state = value.state.toUpperCase();
  return { value: Object.keys(errors).length ? null : value, errors };
}

export function parseClientData(parameter: string | string[] | undefined): ClientData | null {
  if (typeof parameter !== 'string') return null;
  try {
    const data: unknown = JSON.parse(parameter);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const fields = data as Record<string, unknown>;
    if (Object.keys(emptyClient).some((key) => typeof fields[key] !== 'string')) return null;
    const client = Object.fromEntries(Object.keys(emptyClient).map((key) => [key, fields[key]])) as ClientData;
    return validateClient(client).value;
  } catch { return null; }
}

export function formatClientAddress(client: ClientData): string[] {
  return [
    [client.street.trim(), client.number.trim()].filter(Boolean).join(', '),
    client.neighborhood.trim(),
    [client.city.trim(), client.state.trim()].filter(Boolean).join(' - '),
    client.cep ? `CEP ${formatCep(client.cep)}` : '',
  ].filter(Boolean);
}

export function withClient<T extends Record<string, unknown>>(params: T, client: ClientData): T & { cliente: string } {
  return { ...params, cliente: JSON.stringify(client) };
}

export function clientRouteKeys(routes: readonly { name: string; key: string }[]): string[] {
  let start = 0;
  routes.forEach((route, index) => { if (route.name === 'orcamento/tipo-servico') start = index + 1; });
  return routes.slice(start).filter((route) => route.name.startsWith('orcamento/')).map((route) => route.key);
}
