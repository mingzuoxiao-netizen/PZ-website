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
  isFallback: boolean;
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
  // Add isFallback state to track when using static default config
  const [isFallback, setIsFallback] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    setIsFallback(false);

    try {
      const result = mode === 'preview' 
        ? await fetchPreviewConfig() 
        : await fetchSiteConfig();

      if (!result) {
        if (mode === 'preview') {
            setError(true);
            setConfig(null);
            return;
        }
        // Public fallback only if API fails completely
        setConfig(DEFAULT_CONFIG);
        setMeta({ version: "default", published_at: null });
        setIsFallback(true);
        return;
      }

      // Handle Envelope Structure { config: SiteConfig, version: string }
      if (result && typeof result === 'object' && 'config' in result) {
        const envelope = result as SiteConfigEnvelope;
        setConfig(envelope.config);
        setMeta({
          version: envelope.version || 'legacy',
          published_at: envelope.published_at ?? null,
        });
      } else {
        // Handle direct SiteConfig structure
        // Added unknown cast to fix TS error: result is inferred as SiteConfigEnvelope
        // and cannot be directly cast to SiteConfig.
        setConfig((result as unknown) as SiteConfig);
        setMeta({ version: "legacy", published_at: null });
      }
    } catch (e) {
      console.error("[SiteConfig] Load failed", e);
      if (mode === 'preview') {
          setError(true);
      } else {
          setConfig(DEFAULT_CONFIG);
          setMeta({ version: "error-fallback", published_at: null });
          setIsFallback(true);
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
        isFallback,
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
    throw new Error("usePublishedSiteConfig must be used within SiteConfigProvider");
  }
  return ctx;
}