import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react';
import type { CompanyProfile } from '@/types/company-profile';
import { defaultCompanyProfile } from '@/utils/company-profile';
import { createCompanyProfileRepository } from '@/services/company-profile';

const repository = createCompanyProfileRepository(AsyncStorage);
type CompanyProfileContextValue = {
  profile: CompanyProfile; loading: boolean; saving: boolean; loadError: string | null;
  reload: () => Promise<void>; saveProfile: (draft: CompanyProfile) => Promise<void>;
};
const CompanyProfileContext = createContext<CompanyProfileContextValue | null>(null);

export function CompanyProfileProvider({ children }: PropsWithChildren) {
  const [profile, setProfile] = useState<CompanyProfile>({ ...defaultCompanyProfile });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try { setProfile(await repository.read()); }
    catch { setLoadError('Não foi possível carregar os dados da empresa. Tente novamente.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  const saveProfile = useCallback(async (draft: CompanyProfile) => {
    if (loading || loadError || savingRef.current) throw new Error('Aguarde o carregamento dos dados da empresa.');
    savingRef.current = true;
    setSaving(true);
    try { setProfile(await repository.save(draft)); }
    finally { savingRef.current = false; setSaving(false); }
  }, [loading, loadError]);
  const value = useMemo(() => ({ profile, loading, saving, loadError, reload, saveProfile }), [profile, loading, saving, loadError, reload, saveProfile]);
  return <CompanyProfileContext value={value}>{children}</CompanyProfileContext>;
}

export function useCompanyProfile() {
  const value = useContext(CompanyProfileContext);
  if (!value) throw new Error('useCompanyProfile deve ser usado dentro de CompanyProfileProvider.');
  return value;
}
