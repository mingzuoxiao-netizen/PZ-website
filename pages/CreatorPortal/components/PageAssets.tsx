
import React from 'react';
import { RotateCcw, History, X } from 'lucide-react';
import { ASSET_GROUPS, DEFAULT_ASSETS, ASSET_KEYS } from '../../../utils/assets';
import PZImageManager from './PZImageManager';
import { useLanguage } from '../../../contexts/LanguageContext';

interface PageAssetsProps {
  customAssets: Record<string, string>;
  assetHistory: Record<string, any[]>;
  onAssetUpdate: (key: string, url: string) => void;
  onAssetReset: (key: string) => void;
  onAssetRollback: (key: string, url: string) => void;
  viewingHistoryKey: string | null;
  setViewingHistoryKey: (key: string | null) => void;
}

const PageAssets: React.FC<PageAssetsProps> = ({ 
  customAssets, assetHistory, onAssetUpdate, onAssetReset, onAssetRollback, 
  viewingHistoryKey, setViewingHistoryKey
}) => {
  const { language } = useLanguage();

  return (
    <div className="grid grid-cols-1 gap-12 animate-fade-in">
        
      {/* History Modal */}
      {viewingHistoryKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white max-w-2xl w-full shadow-2xl border border-stone-200 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-stone-100 flex justify-between items-center">
              <h3 className="font-serif text-xl text-stone-900">{language === 'zh' ? '历史版本' : 'Asset History'}</h3>
              <button onClick={() => setViewingHistoryKey(null)} className="text-stone-400 hover:text-stone-900"><X size={20}/></button>
            </div>
            <div className="p-6 overflow-y-auto bg-stone-50 flex-grow">
              {(!assetHistory[viewingHistoryKey] || assetHistory[viewingHistoryKey].length === 0) ? (
                <p className="text-center text-stone-400 py-8">{language === 'zh' ? '暂无历史记录' : 'No history available for this asset.'}</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {assetHistory[viewingHistoryKey]?.map((item, idx) => (
                    <div key={idx} className="bg-white p-3 border border-stone-200 shadow-sm group">
                      <div className="aspect-video bg-stone-100 mb-2 relative overflow-hidden">
                        {item.url.endsWith('.pdf') ? (
                            <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-500 font-mono text-xs">PDF File</div>
                        ) : (
                            <img src={item.url} className="w-full h-full object-cover" alt="history" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            onClick={() => onAssetRollback(viewingHistoryKey, item.url)}
                            className="bg-white text-stone-900 px-3 py-1 text-xs font-bold uppercase tracking-wider hover:bg-amber-400"
                          >
                            {language === 'zh' ? '恢复' : 'Rollback'}
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-stone-500 font-mono text-center">
                        {new Date(item.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8">
        <h3 className="font-serif text-2xl text-stone-900 mb-4">{language === 'zh' ? '页面资源管理' : 'Site Assets Management'}</h3>
        <p className="text-stone-500 text-sm max-w-3xl leading-relaxed">
          {language === 'zh' 
            ? '管理网站上的静态图片和文件（如 Catalog PDF、首页横幅等）。'
            : 'Manage static website images and files here (Catalog PDF, Hero banners, Factory images, etc.).'}
        </p>
      </div>

      {ASSET_GROUPS?.map((group, groupIdx) => (
        <div key={groupIdx} className="mb-8">
          <h4 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-6 border-b border-stone-200 pb-2">{group.name}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {group.keys?.map((asset) => {
              const currentUrl = customAssets[asset.key] || DEFAULT_ASSETS[asset.key];
              const isDefault = !customAssets[asset.key];
              const hasHistory = assetHistory[asset.key] && assetHistory[asset.key].length > 0;
              const isPdf = asset.key === ASSET_KEYS.CATALOG_DOCUMENT;

              return (
                <div key={asset.key} className="bg-white border border-stone-200 transition-all hover:border-stone-400">
                  {/* Unified PZImageManager in Single Mode */}
                  <PZImageManager 
                    images={currentUrl ? [currentUrl] : []}
                    onUpdate={(imgs) => onAssetUpdate(asset.key, imgs[0])}
                    maxImages={1}
                    onError={(msg) => alert(msg)}
                    className="aspect-video w-full"
                    accept={isPdf ? "application/pdf" : "image/*"}
                  />

                  <div className="p-4 flex justify-between items-center bg-white">
                    <span className="text-xs font-bold text-stone-700 truncate mr-2" title={asset.label}>
                      {asset.label}
                    </span>
                    
                    <div className="flex space-x-2">
                      {hasHistory && (
                        <button
                          onClick={() => setViewingHistoryKey(asset.key)}
                          className="text-stone-400 hover:text-amber-700 transition-colors p-1"
                          title={language === 'zh' ? "历史记录" : "History"}
                        >
                          <History size={14}/>
                        </button>
                      )}
                      {!isDefault && (
                        <button 
                          onClick={() => onAssetReset(asset.key)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-1"
                          title={language === 'zh' ? '重置为默认' : 'Reset to Default'}
                        >
                          <RotateCcw size={14} />
                        </button>
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
