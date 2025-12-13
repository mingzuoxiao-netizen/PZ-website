
import { useEffect, useState } from "react";
import { DEFAULT_ASSETS } from './assets';

/* =========================
   API
========================= */

// ✅ CONFIRMED: Worker URL
export const API_BASE = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

/* =========================
   Constants
========================= */

export const SITE_CONFIG_STORAGE_KEY = "SITE_CONFIG_KV";

/* =========================
   Types
========================= */

export interface SiteConfig {
  home: {
    hero: {
      title: string;
      image: string;
    };
    factory: {
      image: string;
    };
    cta: {
      image: string;
    };
    hub_cn: {
      image: string;
    };
    hub_kh: {
      image: string;
    };
  };
  about: {
    banner: string;
    gallery: {
      raw: string;
      milling: string;
      finishing: string;
      qc: string;
      automation: string;
    };
  };
  catalog: {
    url: string;
  };
}

export interface SiteMeta {
  version: string;
  published_at: string | null;
}

export interface SiteConfigEnvelope {
  version: string;
  published_at: string | null;
  config: SiteConfig;
}

/* =========================
   Defaults (SSR / Fallback)
========================= */

export const DEFAULT_CONFIG: SiteConfig = {
  home: {
    hero: {
      title: "Engineered for Scalable Manufacturing",
      image: "",
    },
    factory: { image: "" },
    cta: { image: "" },
    hub_cn: { image: "" },
    hub_kh: { image: "" },
  },
  about: {
    banner: "",
    gallery: {
      raw: "",
      milling: "",
      finishing: "",
      qc: "",
      automation: "",
    },
  },
  catalog: {
    url: "",
  },
};

/* =========================
   Fetchers
========================= */

// Returns either the raw config (legacy) or the Envelope (new)
export async function fetchSiteConfig(): Promise<SiteConfig | SiteConfigEnvelope | null> {
  try {
    const res = await fetch(`${API_BASE}/site-config`, {
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ⚠️ LEGACY APIs DEPRECATED - Returning null to prevent 404s until new Product API is ready
export async function fetchInventory(): Promise<any[] | null> {
  return null; 
}

export async function fetchStructure(): Promise<any[] | null> {
  return null;
}

export async function fetchCloudAssets(): Promise<Record<string, string> | null> {
  return null;
}

/* =========================
   React Hooks (CMS)
========================= */

export function useCloudAssets() {
  // Currently returns default assets as the Cloud Asset API is deprecated
  const [assets] = useState<Record<string, string>>(DEFAULT_ASSETS);
  return assets;
}
