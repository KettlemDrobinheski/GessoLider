export const savedBudgetPdfActionLabels = ['Visualizar orçamento', 'Gerar PDF', 'Compartilhar PDF'] as const;

export async function performBudgetPdfOperation<T>(shouldShare: boolean, operations: {
  generate: () => Promise<T>;
  share: (pdf: T) => Promise<void>;
}): Promise<T> {
  const pdf = await operations.generate();
  if (shouldShare) await operations.share(pdf);
  return pdf;
}
