import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NewSavedBudget, SavedBudget, SavedBudgetUpdate } from '../types/saved-budget';
import { createSavedBudget, duplicateSavedBudget, validateSavedBudget } from '../utils/saved-budget';

export const savedBudgetsKey = 'gessolider:saved-budgets:v1';
export type SavedBudgetsStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};
export type SavedBudgetRepositoryOptions = { createId?: () => string; now?: () => string };

type StoredBudgets = { schemaVersion: 1; records: SavedBudget[] };
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
