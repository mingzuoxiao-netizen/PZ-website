
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  fetchSiteConfig,
  SiteConfig,
  SiteMeta,
  DEFAULT_CONFIG,
} from "../utils/siteConfig";

interface SiteConfigContextValue {
  config: SiteConfig | null;
  meta: SiteMeta; // Never null
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export function SiteConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  
  // Initialize meta with a safe default object to prevent null access
  const [meta, setMeta] = useState<SiteMeta>({
    version: 'legacy',
    published_at: null
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);

    try {
      const result = await fetchSiteConfig();

      if (!result) {
        throw new Error("No published site config");
      }

      // Check if result matches Envelope structure
      if ("version" in result && "config" in result) {
        setConfig(result.config);
        setMeta({
          version: result.version || 'legacy',
          published_at: result.published_at ?? null,
        });
      } else {
        // Legacy format fallback
        setConfig(result as SiteConfig);
        setMeta({ version: "legacy", published_at: null });
      }
    } catch (e) {
      console.error("[SiteConfigProvider] load failed", e);
      setConfig(null);
      // Ensure meta remains a valid object even on error
      setMeta({ version: "legacy", published_at: null });
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

export function usePublishedSiteConfig() {
  const ctx = useContext(SiteConfigContext);
  if (!ctx) {
    throw new Error(
      "usePublishedSiteConfig must be used within SiteConfigProvider"
    );
  }
  return ctx;
}
