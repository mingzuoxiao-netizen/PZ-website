
import { useEffect, useState } from "react";
import { DEFAULT_ASSETS, ASSET_KEYS } from './assets';

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
  studio: {
    hero: string;
    design: string;
  };
  manufacturing: {
    hero_machinery: string;
    hero_qc: string;
  };
  capacity: {
    map_bg: string;
    card_cn: string;
    card_kh: string;
    loc_usa: string;
    loc_can: string;
    loc_uk: string;
    loc_de: string;
    loc_me: string;
  };
  materials: {
    const_finger: string;
    const_edge: string;
    const_butcher: string;
    wood_oak: string;
    wood_walnut: string;
    wood_rubber: string;
    wood_ash: string;
    wood_beech: string;
    wood_maple: string;
    wood_teak: string;
    wood_acacia: string;
    wood_birch: string;
    wood_bamboo: string;
  };
  menu: {
    feat_collections: string;
    feat_mfg: string;
    feat_capabilities: string;
    feat_default: string;
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
      image: DEFAULT_ASSETS[ASSET_KEYS.HOME_HERO_BG],
    },
    factory: { image: DEFAULT_ASSETS[ASSET_KEYS.HOME_FACTORY_SECTION] },
    cta: { image: DEFAULT_ASSETS[ASSET_KEYS.HOME_CTA_BG] },
    hub_cn: { image: DEFAULT_ASSETS[ASSET_KEYS.HOME_HUB_CN] },
    hub_kh: { image: DEFAULT_ASSETS[ASSET_KEYS.HOME_HUB_KH] },
  },
  about: {
    banner: DEFAULT_ASSETS[ASSET_KEYS.ABOUT_BANNER],
    gallery: {
      raw: DEFAULT_ASSETS[ASSET_KEYS.ABOUT_GALLERY_1],
      milling: DEFAULT_ASSETS[ASSET_KEYS.ABOUT_GALLERY_2],
      finishing: DEFAULT_ASSETS[ASSET_KEYS.ABOUT_GALLERY_3],
      qc: DEFAULT_ASSETS[ASSET_KEYS.ABOUT_GALLERY_4],
      automation: DEFAULT_ASSETS[ASSET_KEYS.ABOUT_GALLERY_5],
    },
  },
  catalog: {
    url: "",
  },
  studio: {
    hero: "https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?q=80&w=2564&auto=format&fit=crop",
    design: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?q=80&w=1000&auto=format&fit=crop",
  },
  manufacturing: {
    hero_machinery: DEFAULT_ASSETS[ASSET_KEYS.MFG_MACHINERY_HERO],
    hero_qc: DEFAULT_ASSETS[ASSET_KEYS.MFG_QC_HERO],
  },
  capacity: {
    map_bg: DEFAULT_ASSETS[ASSET_KEYS.CAPACITY_MAP_BG],
    card_cn: DEFAULT_ASSETS[ASSET_KEYS.CAPACITY_CN_CARD],
    card_kh: DEFAULT_ASSETS[ASSET_KEYS.CAPACITY_KH_CARD],
    loc_usa: DEFAULT_ASSETS[ASSET_KEYS.CAPACITY_LOC_USA],
    loc_can: DEFAULT_ASSETS[ASSET_KEYS.CAPACITY_LOC_CAN],
    loc_uk: DEFAULT_ASSETS[ASSET_KEYS.CAPACITY_LOC_UK],
    loc_de: DEFAULT_ASSETS[ASSET_KEYS.CAPACITY_LOC_DE],
    loc_me: DEFAULT_ASSETS[ASSET_KEYS.CAPACITY_LOC_ME],
  },
  materials: {
    const_finger: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_CONST_FINGER],
    const_edge: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_CONST_EDGE],
    const_butcher: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_CONST_BUTCHER],
    wood_oak: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_OAK],
    wood_walnut: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_WALNUT],
    wood_rubber: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_RUBBER],
    wood_ash: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_ASH],
    wood_beech: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_BEECH],
    wood_maple: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_MAPLE],
    wood_teak: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_TEAK],
    wood_acacia: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_ACACIA],
    wood_birch: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_BIRCH],
    wood_bamboo: DEFAULT_ASSETS[ASSET_KEYS.MATERIALS_WOOD_BAMBOO],
  },
  menu: {
    feat_collections: DEFAULT_ASSETS[ASSET_KEYS.MENU_COLLECTIONS],
    feat_mfg: DEFAULT_ASSETS[ASSET_KEYS.MENU_MFG],
    feat_capabilities: DEFAULT_ASSETS[ASSET_KEYS.MENU_CAPABILITIES],
    feat_default: DEFAULT_ASSETS[ASSET_KEYS.MENU_DEFAULT],
  }
};

/* =========================
   Fetchers
========================= */

// Returns either the raw config (legacy) or the Envelope (new)
export async function fetchSiteConfig(): Promise<SiteConfig | SiteConfigEnvelope | null> {
  try {
    // FIX: Ensure correct spelling of /site-config endpoint
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
  // We encourage using usePublishedSiteConfig() instead for full editability
  const [assets] = useState<Record<string, string>>(DEFAULT_ASSETS);
  return assets;
}
