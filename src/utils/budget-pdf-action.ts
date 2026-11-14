export const savedBudgetPdfActionLabels = ['Visualizar orçamento', 'Gerar PDF', 'Compartilhar PDF'] as const;

export async function getOrGenerateBudgetPdf<T>(platform: string, key: string, cache: { current: { key: string; pdf: T } | null }, generate: () => Promise<T>): Promise<T> {
  if (platform !== 'web' && cache.current?.key === key) return cache.current.pdf;
  const pdf = await generate();
  cache.current = platform === 'web' ? null : { key, pdf };
  return pdf;
}

export async function performBudgetPdfOperation<T>(shouldShare: boolean, operations: {
  generate: () => Promise<T>;
  share: (pdf: T) => Promise<void>;
}): Promise<T> {
  const pdf = await operations.generate();
  if (shouldShare) await operations.share(pdf);
  return pdf;
}
