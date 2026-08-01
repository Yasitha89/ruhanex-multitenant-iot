import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCompanyProfile } from "../api/companyApi";
import { useAuth } from "../auth/AuthContext";
const CompanyContext = createContext(null);
export function CompanyProvider({ children }) {
  const { isAuthenticated, tenant } = useAuth();
  const [company, setCompany] = useState(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const [companyError, setCompanyError] = useState("");
  const refreshCompany = useCallback(async () => {
    if (!isAuthenticated) { setCompany(null); return; }
    setLoadingCompany(true); setCompanyError("");
    try { const result = await getCompanyProfile(); setCompany(result.company || null); }
    catch (error) { setCompanyError(error.message || "Unable to load company profile"); }
    finally { setLoadingCompany(false); }
  }, [isAuthenticated, tenant?.id]);
  useEffect(() => { refreshCompany(); }, [refreshCompany]);
  const value = useMemo(() => ({ company, loadingCompany, companyError, setCompany, refreshCompany }), [company, loadingCompany, companyError, refreshCompany]);
  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}
export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) throw new Error("useCompany must be used inside CompanyProvider");
  return context;
}
