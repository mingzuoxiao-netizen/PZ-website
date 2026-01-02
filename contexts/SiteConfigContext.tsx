
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  fetchSiteConfig,
  fetchPreviewConfig,
  SiteConfig,
  SiteMeta,
  SiteConfigEnvelope,
  DEFAULT_CONFIG,
} from "../utils/siteConfig";

interface SiteConfigContextValue {
  config: SiteConfig | null;
  meta: SiteMeta;
  loading: boolean;
  error: boolean;
  mode: 'public' | 'preview';
  refresh: () => void;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

export function SiteConfigProvider({ 
  children, 
  mode = 'public' 
}: { 
  children?: ReactNode; 
  mode?: 'public' | 'preview' 
}) {
  const [config, setConfig] = useState<SiteConfig | null>(null);
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
      // 1. Determine Source
      const result = mode === 'preview' 
        ? await fetchPreviewConfig() 
        : await fetchSiteConfig();

      // 2. Handle failure based on mode
      if (!result) {
        if (mode === 'preview') {
            // PREVIEW RULES: No fallback to public. Show error state.
            console.error("[Preview] Fetch failed. No fallback allowed.");
            setError(true);
            setConfig(null);
            return;
        }
        // Public fallback
        setConfig(DEFAULT_CONFIG);
        setMeta({ version: "default", published_at: null });
        return;
      }

      // 3. Process Result
      if ("version" in result && "config" in result) {
        const envelope = result as SiteConfigEnvelope;
        setConfig(envelope.config);
        setMeta({
          version: envelope.version || 'legacy',
          published_at: envelope.published_at ?? null,
        });
      } else {
        setConfig(result as SiteConfig);
        setMeta({ version: "legacy", published_at: null });
      }
    } catch (e) {
      console.error("[SiteConfigProvider] load failed", e);
      if (mode === 'preview') {
          setError(true);
      } else {
          setConfig(DEFAULT_CONFIG);
          setMeta({ version: "error-fallback", published_at: null });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [mode]);

  return (
    <SiteConfigContext.Provider
      value={{
        config,
        meta,
        loading,
        error,
        mode,
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
