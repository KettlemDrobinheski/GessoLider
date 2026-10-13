export function toCents(value: number): number | null {
  if (!Number.isFinite(value) || value < 0) return null;
  const cents = Math.round(value * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(value * 100 - cents) > Number.EPSILON * Math.max(cents, 1) * 8) return null;
  return cents;
}

export function parseCurrencyInput(value: string): number | null {
  const normalized = value.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(normalized)) return null;
  const number = Number(normalized.replace(',', '.'));
  return toCents(number) === null ? null : number;
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatCurrencyInput(value: number): string {
  return value.toFixed(2).replace('.', ',');
}
