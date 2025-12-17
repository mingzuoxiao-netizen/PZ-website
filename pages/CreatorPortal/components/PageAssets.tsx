
import React, { useState } from 'react';
import { X, Save, Ban } from 'lucide-react';
import { ASSET_GROUPS, DEFAULT_ASSETS, ASSET_KEYS } from '../../../utils/assets';
import PZImageManager from './PZImageManager';
import { useLanguage } from '../../../contexts/LanguageContext';

interface PageAssetsProps {
  customAssets: Record<string, string>;
  onAssetUpdate: (key: string, url: string) => void;
  onAssetReset: (key: string) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: (url: string) => Promise<void>;
}

const PageAssets: React.FC<PageAssetsProps> = ({ 
  customAssets, onAssetUpdate, onAssetReset, onUpload, onDelete
}) => {
  const { t } = useLanguage();
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, string>>({});

  return (
    <div className="grid grid-cols-1 gap-12 animate-fade-in">
        
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8">
        <h3 className="font-serif text-2xl text-stone-900 mb-4">{t.creator.assets.title}</h3>
        <p className="text-stone-500 text-sm max-w-3xl leading-relaxed">
          {t.creator.assets.desc}
        </p>
      </div>

      {ASSET_GROUPS?.map((group, groupIdx) => (
        <div key={groupIdx} className="mb-8">
          <h4 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-6 border-b border-stone-200 pb-2">{group.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {group.keys?.map((asset) => {
              const savedUrl = customAssets[asset.key] || DEFAULT_ASSETS[asset.key];
              const pendingUrl = pendingUpdates[asset.key];
              const currentUrl = pendingUrl !== undefined ? pendingUrl : savedUrl;
              
              const isDefault = !customAssets[asset.key];
              const isPdf = asset.key === ASSET_KEYS.CATALOG_DOCUMENT;
              const hasChanges = pendingUrl && pendingUrl !== savedUrl;

              return (
                <div key={asset.key} className={`bg-white border transition-all ${hasChanges ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-stone-200 hover:border-stone-400'}`}>
                  <PZImageManager 
                    images={currentUrl ? [currentUrl] : []}
                    onUpdate={(imgs) => setPendingUpdates(prev => ({ ...prev, [asset.key]: imgs[0] }))}
                    onUpload={onUpload}
                    onDelete={onDelete}
                    maxImages={1}
                    onError={(msg) => alert(msg)}
                    className="aspect-video w-full"
                    accept={isPdf ? "application/pdf" : "image/*"}
                    allowPhysicalDeletion={false}
                  />

                  <div className="p-4 flex justify-between items-center bg-white border-t border-stone-100">
                    <span className="text-xs font-bold text-stone-700 truncate mr-2" title={asset.label}>
                      {asset.label}
                    </span>
                    
                    <div className="flex space-x-2 items-center">
                      {hasChanges ? (
                        <>
                            <button 
                                onClick={() => {
                                    setPendingUpdates(prev => {
                                        const next = { ...prev };
                                        delete next[asset.key];
                                        return next;
                                    });
                                }}
                                className="flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-stone-200 hover:bg-stone-100 text-stone-500 rounded-sm transition-colors"
                            >
                                <Ban size={12} className="mr-1"/> {t.creator.assets.cancel}
                            </button>
                            <button 
                                onClick={() => {
                                    onAssetUpdate(asset.key, pendingUrl);
                                    setPendingUpdates(prev => {
                                        const next = { ...prev };
                                        delete next[asset.key];
                                        return next;
                                    });
                                }}
                                className="flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-amber-700 text-white hover:bg-amber-800 rounded-sm shadow-sm transition-colors"
                            >
                                <Save size={12} className="mr-1"/> {t.creator.assets.save}
                            </button>
                        </>
                      ) : (
                        <>
                            {!isDefault && (
                                <button 
                                onClick={() => onAssetReset(asset.key)}
                                className="text-stone-400 hover:text-red-600 transition-colors p-1 text-[10px] font-bold uppercase tracking-widest"
                                title={t.creator.assets.reset}
                                >
                                RESET
                                </button>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PageAssets;
