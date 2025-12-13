
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { fetchSiteConfig, SiteConfig, SiteMeta, DEFAULT_CONFIG } from "../utils/siteConfig";

/* =========================
   Context Types
========================= */

interface SiteConfigContextValue {
  config: SiteConfig;
  meta: SiteMeta;
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

/* =========================
   Context
========================= */

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

/* =========================
   Provider
========================= */

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  
  // Meta state for observability (Version / Published At)
  const [meta, setMeta] = useState<SiteMeta>({
    version: "0.0.0",
    published_at: null,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);

    try {
      const result = await fetchSiteConfig();
      
      if (result) {
        // Check if response is the new Envelope format
        if ('version' in result && 'config' in result) {
           setConfig(result.config);
           setMeta({
             version: result.version,
             published_at: result.published_at
           });
        } else {
           // Fallback: Legacy raw config format
           // We assign a default version to indicate it's not enveloped
           setConfig(result as SiteConfig);
           setMeta({ version: "legacy", published_at: null });
        }
      } else {
        // No data found? Stick to default, but set error flag
        setError(true);
      }
    } catch (e) {
      console.error("SiteConfigProvider load failed", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        meta,
        loading,
        error,
        refresh: load,
      }}
    >
      {children}
    </SiteConfigContext.Provider>
  );
}

/* =========================
   Hook
========================= */

export function usePublishedSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error(
      "usePublishedSiteConfig must be used within SiteConfigProvider"
    );
  }
  return ctx;
}
