import type { CompanyProfile } from '../types/company-profile';
import { formatPhone, normalizePhone, validatePhone } from './client';

export const defaultCompanyProfile: Readonly<CompanyProfile> = Object.freeze({
  companyName: 'GessoLider', responsibleName: '', phone: '', city: '', state: '', serviceRegion: '', commercialNote: '', logoUri: null,
});

export function validateCompanyProfile(draft: CompanyProfile): {
  value: CompanyProfile | null; errors: Partial<Record<keyof CompanyProfile, string>>;
} {
  const value: CompanyProfile = {
    companyName: draft.companyName.trim(), responsibleName: draft.responsibleName.trim(), phone: normalizePhone(draft.phone),
    city: draft.city.trim(), state: draft.state.trim().toUpperCase(), serviceRegion: draft.serviceRegion.trim(),
    commercialNote: draft.commercialNote.trim(), logoUri: draft.logoUri?.trim() || null,
  };
  const errors: Partial<Record<keyof CompanyProfile, string>> = {};
  if (!value.companyName) errors.companyName = 'Informe o nome comercial.';
  if (!validatePhone(draft.phone)) errors.phone = 'Informe um telefone com DDD e 10 ou 11 dígitos.';
  if (value.state && !/^[A-Z]{2}$/.test(value.state)) errors.state = 'Informe a sigla da UF com 2 letras.';
  return { value: Object.keys(errors).length ? null : value, errors };
}

export function parseCompanyProfile(serialized: string): CompanyProfile | null {
  try {
    const data: unknown = JSON.parse(serialized);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    const fields = data as Record<string, unknown>;
    const textKeys = Object.keys(defaultCompanyProfile).filter((key) => key !== 'logoUri');
    if (textKeys.some((key) => typeof fields[key] !== 'string')
      || (fields.logoUri !== undefined && fields.logoUri !== null && typeof fields.logoUri !== 'string')) return null;
    const profile = Object.fromEntries(textKeys.map((key) => [key, fields[key]])) as Omit<CompanyProfile, 'logoUri'>;
    return validateCompanyProfile({ ...profile, logoUri: typeof fields.logoUri === 'string' ? fields.logoUri : null }).value;
  } catch { return null; }
}

export function formatCompanySummary(profile: CompanyProfile): string[] {
  const location = [profile.city.trim(), profile.state.trim()].filter(Boolean).join(' - ');
  return [
    profile.companyName.trim(), profile.responsibleName.trim() ? `Responsável: ${profile.responsibleName.trim()}` : '',
    profile.phone.trim() ? `WhatsApp: ${formatPhone(profile.phone)}` : '', location,
    profile.serviceRegion.trim() ? `Atendimento: ${profile.serviceRegion.trim()}` : '', profile.commercialNote.trim(),
  ].filter(Boolean);
}
