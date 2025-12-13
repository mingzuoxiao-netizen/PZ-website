
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { DEFAULT_ASSETS } from '../utils/assets';
import { fetchCloudAssets } from '../utils/siteConfig';

const AssetContext = createContext<Record<string, string>>(DEFAULT_ASSETS);

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Record<string, string>>(DEFAULT_ASSETS);

  useEffect(() => {
    let mounted = true;
    
    // Fetch asset overrides from Worker -> KV
    fetchCloudAssets().then(cloudAssets => {
      if (mounted && cloudAssets) {
        setAssets(prev => ({ ...prev, ...cloudAssets }));
      }
    });

    return () => { mounted = false; };
  }, []);

  return <AssetContext.Provider value={assets}>{children}</AssetContext.Provider>;
};

export const useAssets = () => useContext(AssetContext);
