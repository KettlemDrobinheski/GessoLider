import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NewSavedBudget, SavedBudget, SavedBudgetUpdate } from '../types/saved-budget';
import { createSavedBudget, duplicateSavedBudget, validateSavedBudget } from '../utils/saved-budget';

export const savedBudgetsKey = 'gessolider:saved-budgets:v1';
export const budgetDraftKey = 'gessolider:active-budget-draft:v1';
export type SavedBudgetsStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
  removeItem: (key: string) => Promise<unknown>;
};
export type SavedBudgetRepositoryOptions = { createId?: () => string; now?: () => string };

type StoredBudgets = { schemaVersion: 1; records: SavedBudget[] };
export type BudgetDraft = {
  schemaVersion: 1;
  id: string;
  service: 'wall' | 'ceiling' | 'lining' | null;
  route: string;
  params: Record<string, string>;
  formData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};
const draftRoutes = new Set([
  '/orcamento/tipo-servico', '/orcamento/cliente', '/orcamento/medidas', '/orcamento/configuracao-parede',
  '/orcamento/configuracao-forro', '/orcamento/configuracao-revestimento', '/orcamento/materiais',
  '/orcamento/materiais-forro', '/orcamento/materiais-revestimento', '/orcamento/valores',
  '/orcamento/valores-forro', '/orcamento/valores-revestimento', '/orcamento/resumo',
  '/orcamento/resumo-forro', '/orcamento/resumo-revestimento',
]);

function parseDraftFormData(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const data = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  if (data.service === 'wall' || data.service === 'ceiling' || data.service === 'lining' || data.service === 'details') result.service = data.service;
  if (data.clientDraft && typeof data.clientDraft === 'object' && !Array.isArray(data.clientDraft)) {
    const client = data.clientDraft as Record<string, unknown>;
    const fields = ['name', 'phone', 'cep', 'street', 'number', 'neighborhood', 'city', 'state', 'complement', 'notes'];
    if (fields.every((key) => typeof client[key] === 'string')) result.clientDraft = Object.fromEntries(fields.map((key) => [key, client[key]]));
  }
  if (data.measurements && typeof data.measurements === 'object' && !Array.isArray(data.measurements)) {
    const measurements = data.measurements as Record<string, unknown>;
    const dimensions = measurements.dimensions;
    const openings = measurements.openings;
    const validDimensions = !!dimensions && typeof dimensions === 'object' && !Array.isArray(dimensions)
      && ['length', 'height', 'width', 'depth'].every((key) => typeof (dimensions as Record<string, unknown>)[key] === 'string');
    const validOpenings = Array.isArray(openings) && openings.every((opening) => !!opening && typeof opening === 'object'
      && typeof opening.id === 'string' && (opening.type === 'door' || opening.type === 'window')
      && typeof opening.width === 'string' && typeof opening.height === 'string' && typeof opening.quantity === 'string');
    if (validDimensions && typeof measurements.hasOpenings === 'boolean' && validOpenings) {
      result.measurements = { dimensions, hasOpenings: measurements.hasOpenings, openings };
    }
  }
  for (const key of ['wallConfiguration', 'ceilingConfiguration', 'liningConfiguration']) {
    const configuration = data[key];
    if (configuration && typeof configuration === 'object' && !Array.isArray(configuration)) result[key] = configuration;
  }
  const pricing = data.pricingDraft;
  if (pricing && typeof pricing === 'object' && !Array.isArray(pricing)) {
    const fields = pricing as Record<string, unknown>;
    if (typeof fields.laborInput === 'string' && typeof fields.materialsInput === 'string' && typeof fields.notes === 'string') result.pricingDraft = fields;
  }
  return result;
}
const writeQueues = new WeakMap<object, Promise<unknown>>();

function parseCollection(serialized: string | null): StoredBudgets {
  if (serialized === null) return { schemaVersion: 1, records: [] };
  let data: unknown;
  try { data = JSON.parse(serialized); } catch { throw new Error('O histórico salvo está corrompido e não foi alterado.'); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('O histórico salvo está inválido e não foi alterado.');
  const collection = data as Record<string, unknown>;
  if (collection.schemaVersion !== 1 || !Array.isArray(collection.records)) throw new Error('A versão do histórico salvo não é compatível.');
  const records = collection.records.map(validateSavedBudget);
  if (records.some((record) => !record) || new Set(records.map((record) => record?.id)).size !== records.length) {
    throw new Error('Há orçamentos inválidos no histórico salvo; os dados não foram alterados.');
  }
  return { schemaVersion: 1, records: records as SavedBudget[] };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseDraft(serialized: string | null): BudgetDraft | null {
  if (serialized === null) return null;
  let value: unknown;
  try { value = JSON.parse(serialized); } catch { throw new Error('O rascunho salvo está corrompido e não foi alterado.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('O rascunho salvo é inválido e não foi alterado.');
  const draft = value as Partial<BudgetDraft>;
  const validService = draft.service === null || draft.service === 'wall' || draft.service === 'ceiling' || draft.service === 'lining';
  const validParams = !!draft.params && typeof draft.params === 'object' && !Array.isArray(draft.params)
    && Object.entries(draft.params).every(([key, item]) => key !== 'cliente' && typeof item === 'string');
  if (draft.schemaVersion !== 1 || typeof draft.id !== 'string' || !draft.id.trim() || !validService
    || typeof draft.route !== 'string' || !draftRoutes.has(draft.route)
    || !validParams || !draft.formData || typeof draft.formData !== 'object' || Array.isArray(draft.formData)
    || typeof draft.createdAt !== 'string' || !Number.isFinite(Date.parse(draft.createdAt))
    || typeof draft.updatedAt !== 'string' || !Number.isFinite(Date.parse(draft.updatedAt))) {
    throw new Error('O rascunho salvo é inválido e não foi alterado.');
  }
  return { ...draft as BudgetDraft, formData: parseDraftFormData(draft.formData) };
}

function queueWrite<T>(storage: SavedBudgetsStorage, operation: () => Promise<T>): Promise<T> {
  const identity = storage as object;
  const previous = writeQueues.get(identity) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(operation);
  writeQueues.set(identity, current);
  void current.finally(() => { if (writeQueues.get(identity) === current) writeQueues.delete(identity); }).catch(() => undefined);
  return current;
}

export function createSavedBudgetsRepository(storage: SavedBudgetsStorage, options: SavedBudgetRepositoryOptions = {}) {
  const createId = options.createId ?? (() => `budget-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);
  const now = options.now ?? (() => new Date().toISOString());

  async function readCollection(): Promise<StoredBudgets> {
    return parseCollection(await storage.getItem(savedBudgetsKey));
  }

  async function writeCollection(records: SavedBudget[]): Promise<void> {
    await storage.setItem(savedBudgetsKey, JSON.stringify({ schemaVersion: 1, records } satisfies StoredBudgets));
  }

  return {
    async getDraft(): Promise<BudgetDraft | null> {
      return clone(parseDraft(await storage.getItem(budgetDraftKey)));
    },
    async saveDraft(input: { route: string; params?: Record<string, string>; service?: BudgetDraft['service']; formData?: Record<string, unknown> }): Promise<BudgetDraft> {
      return queueWrite(storage, async () => {
        if (!draftRoutes.has(input.route)) throw new Error('A etapa do rascunho não é válida.');
        const current = parseDraft(await storage.getItem(budgetDraftKey));
        const params = { ...(input.params ?? current?.params ?? {}) };
        delete params.cliente;
        const timestamp = now();
        const next: BudgetDraft = {
          schemaVersion: 1,
          id: current?.id ?? createId(),
          service: input.service === undefined ? current?.service ?? null : input.service,
          route: input.route,
          params,
          formData: { ...(current?.formData ?? {}), ...(input.formData ?? {}) },
          createdAt: current?.createdAt ?? timestamp,
          updatedAt: timestamp,
        };
        await storage.setItem(budgetDraftKey, JSON.stringify(next));
        return clone(next);
      });
    },
    async discardDraft(expectedId?: string): Promise<boolean> {
      return queueWrite(storage, async () => {
        const serialized = await storage.getItem(budgetDraftKey);
        if (serialized === null) return false;
        let current: BudgetDraft | null;
        try { current = parseDraft(serialized); }
        catch (error) {
          if (expectedId) throw error;
          await storage.removeItem(budgetDraftKey);
          return true;
        }
        if (!current || (expectedId && current.id !== expectedId)) return false;
        await storage.removeItem(budgetDraftKey);
        return true;
      });
    },
    async clearDraft(): Promise<boolean> {
      return queueWrite(storage, async () => {
        const current = parseDraft(await storage.getItem(budgetDraftKey));
        if (!current) return false;
        await storage.removeItem(budgetDraftKey);
        return true;
      });
    },
    async list(): Promise<SavedBudget[]> {
      const { records } = await readCollection();
      return clone(records.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || b.id.localeCompare(a.id)));
    },
    async getById(id: string): Promise<SavedBudget | null> {
      const { records } = await readCollection();
      const record = records.find((item) => item.id === id);
      return record ? clone(record) : null;
    },
    async create(input: NewSavedBudget): Promise<SavedBudget> {
      return queueWrite(storage, async () => {
        const collection = await readCollection();
        let id = createId();
        while (collection.records.some((record) => record.id === id)) id = createId();
        const record = createSavedBudget(input, { id, now: now() });
        await writeCollection([...collection.records, record]);
        return clone(record);
      });
    },
    async update(id: string, changes: SavedBudgetUpdate): Promise<SavedBudget> {
      return queueWrite(storage, async () => {
        const collection = await readCollection();
        const index = collection.records.findIndex((record) => record.id === id);
        if (index < 0) throw new Error('O orçamento não foi encontrado.');
        const original = collection.records[index];
        if (changes.budget && 'service' in changes.budget && changes.budget.service !== original.service) {
          throw new Error('Não é possível alterar o tipo de serviço de um orçamento existente.');
        }
        const candidate = validateSavedBudget({ ...original, ...changes, service: original.service, id,
          createdAt: original.createdAt, updatedAt: now(), schemaVersion: 1 });
        if (!candidate) throw new Error('As alterações do orçamento são inválidas.');
        const records = [...collection.records];
        records[index] = candidate;
        await writeCollection(records);
        return clone(candidate);
      });
    },
    async duplicate(id: string): Promise<SavedBudget> {
      return queueWrite(storage, async () => {
        const collection = await readCollection();
        const original = collection.records.find((record) => record.id === id);
        if (!original) throw new Error('O orçamento não foi encontrado.');
        let newId = createId();
        while (collection.records.some((record) => record.id === newId)) newId = createId();
        const duplicate = duplicateSavedBudget(original, { id: newId, now: now() });
        await writeCollection([...collection.records, duplicate]);
        return clone(duplicate);
      });
    },
    async delete(id: string): Promise<boolean> {
      return queueWrite(storage, async () => {
        const collection = await readCollection();
        const records = collection.records.filter((record) => record.id !== id);
        if (records.length === collection.records.length) return false;
        await writeCollection(records);
        return true;
      });
    },
  };
}

export const savedBudgetsRepository = createSavedBudgetsRepository(AsyncStorage);
