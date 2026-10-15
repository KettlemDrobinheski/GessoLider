import type { CompanyProfile } from '../types/company-profile';
import { defaultCompanyProfile, parseCompanyProfile, validateCompanyProfile } from '../utils/company-profile';

export const companyProfileKey = 'gessolider:company-profile:v1';
export type CompanyProfileStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<unknown>;
};

export function createCompanyProfileRepository(storage: CompanyProfileStorage) {
  return {
    async read(): Promise<CompanyProfile> {
      const saved = await storage.getItem(companyProfileKey);
      if (saved === null) return { ...defaultCompanyProfile };
      const profile = parseCompanyProfile(saved);
      if (!profile) throw new Error('Os dados salvos da empresa não puderam ser lidos.');
      return profile;
    },
    async save(draft: CompanyProfile): Promise<CompanyProfile> {
      const profile = validateCompanyProfile(draft).value;
      if (!profile) throw new Error('Revise os dados da empresa antes de salvar.');
      await storage.setItem(companyProfileKey, JSON.stringify(profile));
      return profile;
    },
  };
}
