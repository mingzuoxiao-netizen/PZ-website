
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Trash2, ShoppingBag, LayoutTemplate, AlertTriangle, Loader2, CheckCircle, AlertCircle, LayoutGrid, ArrowLeft, ImageMinus, Download, Upload, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { categories as staticCategories } from '../../data/inventory';
import { useLanguage } from '../../contexts/LanguageContext';
import { Category, SubCategory } from '../../types';
import { CDN_DOMAIN } from '../../utils/imageHelpers';
import { adminFetch } from '../../utils/adminFetch';
import { Link } from 'react-router-dom';
import { DEFAULT_CONFIG, fetchSiteConfig, SITE_CONFIG_STORAGE_KEY, SiteConfig, SiteMeta } from '../../utils/siteConfig';

import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import LivePreview from './components/LivePreview';
import SiteConfigEditor from './components/SiteConfigEditor'; // New
import CollectionManager from './components/CollectionManager';
import MediaTools from './components/MediaTools';

const CreatorPortal: React.FC = () => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode Switching
  const [activeTab, setActiveTab] = useState<'products' | 'collections' | 'config' | 'media'>('products');

  // UI States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Separation of Concerns: Split submitting states
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isPublishingConfig, setIsPublishingConfig] = useState(false);

  const [listSearch, setListSearch] = useState('');
  
  // Cloud Sync States
  const [cloudStatus, setCloudStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [isSyncing, setIsSyncing] = useState(false);

  // Data State
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [mergedCategories, setMergedCategories] = useState<Category[]>([]);
  
  // Site Config State (Structured)
  const [siteConfigData, setSiteConfigData] = useState<SiteConfig>(DEFAULT_CONFIG);
  const [siteMeta, setSiteMeta] = useState<SiteMeta | null>(null);

  // Management State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingSubCategory, setIsCreatingSubCategory] = useState(false);

  // Form Data State
  const initialFormState = {
    categoryId: staticCategories[0].id,
    subCategoryName: staticCategories[0].subCategories[0].name,
    name: '',
    name_zh: '',
    description: '',
    description_zh: '',
    image: '',
    images: [] as string[],
    material: '',
    dimensions: '',
    code: '',
    status: 'published' as 'published' | 'draft' | 'archived',
    newCatTitle: '',
    newCatTitleZh: '',
    newCatDesc: '',
    newSubName: '',
    newSubNameZh: '',
    newSubDesc: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- CLOUD SYNC HELPERS ---
  const saveToCloud = async (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
    
    // NOTE: Legacy Key-Value Storage is deprecated on backend.
    // Saving locally only for now until Product API is ready.
    // Cloud sync check skipped to avoid 404s.
    return true;
  };

  // Dedicated Save for Site Config (Structured JSON POST with Envelope)
  const saveSiteConfigToCloud = async (config: SiteConfig) => {
      setIsPublishingConfig(true);
      try {
          const newMeta: SiteMeta = {
              version: crypto.randomUUID().split('-')[0], // Short hash
              published_at: new Date().toISOString()
          };

          const envelope = {
              ...newMeta,
              config: config
          };

          // 1. Update Local Cache (Save Envelope)
          localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(envelope));

          // 2. Post to Cloud (Full Overwrite with Envelope)
          await adminFetch('/site-config', {
              method: 'POST',
              body: JSON.stringify(envelope)
          });

          // 3. Update Local State
          setSiteMeta(newMeta);
          setSuccessMsg("Site Configuration Published Successfully!");
      } catch (e) {
          console.error("Config save failed", e);
          setErrorMsg("Failed to publish configuration.");
      } finally {
          setIsPublishingConfig(false);
          setTimeout(() => setSuccessMsg(''), 3000);
      }
  };

  const loadFromCloud = async () => {
      setIsSyncing(true);
      try {
          // Fetch Site Config Only (Legacy storage endpoints removed)
          const siteConfigRes = await fetchSiteConfig();

          // Process Site Config
          let config = DEFAULT_CONFIG;
          let meta = null;

          if (siteConfigRes) {
              const data = siteConfigRes;
              
              if ('version' in data && 'config' in data) {
                  // It's an Envelope
                  config = { ...DEFAULT_CONFIG, ...data.config };
                  meta = { version: data.version, published_at: data.published_at };
              } else {
                  // Legacy Format
                  config = { ...DEFAULT_CONFIG, ...data };
              }
              
              localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(siteConfigRes));
          } else {
              // Fallback to local
              const localRaw = localStorage.getItem(SITE_CONFIG_STORAGE_KEY);
              if (localRaw) {
                  const data = JSON.parse(localRaw);
                  if ('version' in data && 'config' in data) {
                      config = { ...DEFAULT_CONFIG, ...data.config };
                      meta = { version: data.version, published_at: data.published_at };
                  } else {
                      config = { ...DEFAULT_CONFIG, ...data };
                  }
              }
          }

          // Load Inventory/Structure from LocalStorage ONLY (Legacy API Deprecated)
          const inventory = JSON.parse(localStorage.getItem('pz_custom_inventory') || '[]');
          const structure = JSON.parse(localStorage.getItem('pz_custom_structure') || '[]');

          setCloudStatus('connected');
          return { inventory, structure, config, meta };

      } catch (e) {
          console.warn("Cloud load failed, falling back to local", e);
          setCloudStatus('offline');
          
          const localRaw = localStorage.getItem(SITE_CONFIG_STORAGE_KEY);
          let config = DEFAULT_CONFIG;
          let meta = null;
          if (localRaw) {
              const data = JSON.parse(localRaw);
              if ('version' in data && 'config' in data) {
                  config = { ...DEFAULT_CONFIG, ...data.config };
                  meta = { version: data.version, published_at: data.published_at };
              } else {
                  config = { ...DEFAULT_CONFIG, ...data };
              }
          }

          return {
              inventory: JSON.parse(localStorage.getItem('pz_custom_inventory') || '[]'),
              structure: JSON.parse(localStorage.getItem('pz_custom_structure') || '[]'),
              config,
              meta
          };
      } finally {
          setIsSyncing(false);
      }
  };

  // --- Initialization ---
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
      const data = await loadFromCloud();
      
      // 1. Inventory
      let items = Array.isArray(data.inventory) ? data.inventory : [];
      const normalizedItems = items.map((i: any) => ({ 
          ...i, 
          status: i.status || 'published',
          images: Array.isArray(i.images) ? i.images : (i.image ? [i.image] : [])
      }));
      setLocalItems(normalizedItems);

      // 2. Structure
      let customStructure = Array.isArray(data.structure) ? data.structure : [];
      const combined = JSON.parse(JSON.stringify(staticCategories));
      customStructure.forEach((customCat: Category) => {
          const existingIdx = combined.findIndex((c: Category) => c.id === customCat.id);
          if (existingIdx > -1) {
              const existingCat = combined[existingIdx];
              if(customCat.image) existingCat.image = customCat.image;
              if(customCat.title) existingCat.title = customCat.title;
              if(customCat.description) existingCat.description = customCat.description;
              if(customCat.subtitle) existingCat.subtitle = customCat.subtitle;

              const subs = Array.isArray(customCat.subCategories) ? customCat.subCategories : [];
              subs.forEach((newSub: SubCategory) => {
                  if (!existingCat.subCategories.find((s: SubCategory) => s.name === newSub.name)) {
                      existingCat.subCategories.push(newSub);
                  }
              });
          } else {
              combined.push(customCat);
          }
      });
      setMergedCategories(combined);

      // 3. Site Config
      setSiteConfigData(data.config);
      setSiteMeta(data.meta);
  };

  // --- HANDLERS ---

  const handleCategoryUpdate = async (updatedCat: Category) => {
    try {
        const rawStructure = localStorage.getItem('pz_custom_structure') || '[]';
        const customStructure: Category[] = JSON.parse(rawStructure);
        const index = customStructure.findIndex(c => c.id === updatedCat.id);
        
        if (index > -1) {
            customStructure[index] = { ...customStructure[index], ...updatedCat };
        } 
        
        await saveToCloud('pz_custom_structure', customStructure);
        setSuccessMsg('Collection Info Updated (Local Only)');
        setTimeout(() => setSuccessMsg(''), 3000);
        initData();
    } catch (e) {
        console.error(e);
        setErrorMsg('Failed to update category');
    }
  };

  const handleEditItem = (item: any) => {
    setEditingId(item.id);
    setActiveTab('products');
    setIsCreatingCategory(false);
    setIsCreatingSubCategory(false);
    const itemImages = Array.isArray(item.images) && item.images.length > 0 ? item.images : (item.image ? [item.image] : []);
    setFormData({
      ...initialFormState,
      categoryId: item.categoryId,
      subCategoryName: item.subCategoryName,
      name: item.name,
      name_zh: item.name_zh || '',
      description: item.description,
      description_zh: item.description_zh || '',
      image: itemImages[0] || '',
      images: itemImages,
      material: item.material || '',
      dimensions: item.dimensions || '',
      code: item.code || '',
      status: item.status || 'published'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDuplicateItem = (item: any) => {
    setEditingId(null);
    setActiveTab('products');
    setFormData({
      ...initialFormState,
      categoryId: item.categoryId,
      subCategoryName: item.subCategoryName,
      name: item.name,
      name_zh: item.name_zh || '',
      description: item.description,
      description_zh: item.description_zh || '',
      image: '', 
      images: [],
      material: '', 
      dimensions: item.dimensions || '',
      code: '', 
      status: 'draft' 
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSuccessMsg('Product duplicated. Please upload new images.');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsCreatingCategory(false);
    setIsCreatingSubCategory(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.name || formData.images.length === 0) {
      setErrorMsg('Name and at least one Image are required');
      return;
    }
    setIsSavingProduct(true);

    try {
        let finalCategoryId = formData.categoryId;
        let finalSubCategoryName = formData.subCategoryName;
        let structureUpdated = false;
        
        const rawStructure = localStorage.getItem('pz_custom_structure') || '[]';
        const customStructure: Category[] = JSON.parse(rawStructure);

        if (isCreatingCategory) {
            finalCategoryId = `custom_${Date.now()}`;
            const newCat: Category = {
                id: finalCategoryId,
                title: formData.newCatTitle,
                subtitle: "Custom Collection",
                description: formData.newCatDesc || "New custom collection.",
                image: formData.images[0],
                subCategories: []
            };
            customStructure.push(newCat);
            finalSubCategoryName = formData.newSubName || "General";
            newCat.subCategories.push({
                name: finalSubCategoryName,
                description: formData.newSubDesc || "",
                image: formData.images[0]
            });
            structureUpdated = true;
        } else if (isCreatingSubCategory) {
            let targetCat = customStructure.find(c => c.id === finalCategoryId);
            if (!targetCat) {
                 const staticCat = staticCategories.find(c => c.id === finalCategoryId);
                 if (staticCat) {
                     targetCat = { ...staticCat, subCategories: [] };
                     customStructure.push(targetCat);
                 }
            }
            if (targetCat) {
                targetCat.subCategories.push({
                    name: formData.newSubName,
                    description: formData.newSubDesc || "",
                    image: formData.images[0]
                });
                structureUpdated = true;
            }
        }

        const itemPayload = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            categoryId: finalCategoryId,
            subCategoryName: finalSubCategoryName,
            name: formData.name,
            name_zh: formData.name_zh,
            description: formData.description,
            description_zh: formData.description_zh,
            image: formData.images[0],
            images: formData.images,
            material: formData.material,
            dimensions: formData.dimensions,
            code: formData.code,
            status: formData.status,
            date: editingId ? localItems.find(i => i.id === editingId)?.date : new Date().toLocaleDateString()
        };

        let updatedList;
        if (editingId) {
            updatedList = localItems.map(item => item.id === editingId ? itemPayload : item);
        } else {
            updatedList = [itemPayload, ...localItems];
        }
        
        if (structureUpdated) await saveToCloud('pz_custom_structure', customStructure);
        await saveToCloud('pz_custom_inventory', updatedList);

        setLocalItems(updatedList);
        setSuccessMsg(editingId ? 'Product Updated' : 'Product Saved');
        initData();
        setEditingId(null);
        setFormData(initialFormState);
        setIsCreatingCategory(false);
        setIsCreatingSubCategory(false);
        
    } catch(e) {
        console.error(e);
        setErrorMsg('Save failed');
    } finally {
        setIsSavingProduct(false);
    }
  };

  const triggerDelete = (id: string) => setItemToDelete(id);

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const id = itemToDelete;
    const deletedItem = localItems.find(item => item.id === id);

    try {
        if (deletedItem && Array.isArray(deletedItem.images)) {
            const keys = deletedItem.images.map((url: string) => url.replace(CDN_DOMAIN, "").replace(/^\/+/, ""));
            // Delete images from cloud still works as that endpoint exists
            await adminFetch('/delete-images', { method: "POST", body: JSON.stringify({ keys }) });
        }
        const updatedList = localItems.filter(item => item.id !== id);
        setLocalItems(updatedList);
        await saveToCloud('pz_custom_inventory', updatedList);
        setSuccessMsg('Product Deleted');
    } catch (err) {
        setErrorMsg('Delete failed');
    } finally {
        setIsDeleting(false);
        setItemToDelete(null);
    }
  };

  const filteredItems = useMemo(() => {
    if (!listSearch.trim()) return localItems || [];
    const q = listSearch.toLowerCase();
    return (localItems || []).filter(i => 
      i.name.toLowerCase().includes(q) || (i.code && i.code.toLowerCase().includes(q))
    );
  }, [localItems, listSearch]);

  const activeCategory = mergedCategories.find(c => c.id === formData.categoryId) || mergedCategories[0];
  const activeSubCategories = activeCategory?.subCategories || [];

  const generateProductCode = () => {
    const catPrefix = activeCategory?.title ? activeCategory.title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') : 'GEN';
    const newCode = `PZ-${catPrefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData(prev => ({ ...prev, code: newCode }));
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        {/* Status Banner */}
        <div className={`border-l-4 p-4 mb-8 flex justify-between items-center transition-colors ${
            cloudStatus === 'connected' ? 'bg-green-50 border-green-500' : 'bg-amber-50 border-amber-500'
        }`}>
            <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                    {cloudStatus === 'connected' ? <Wifi size={20} className="text-green-600" /> : <WifiOff size={20} className="text-amber-600" />}
                </div>
                <div className="ml-3">
                    <h3 className={`text-sm font-bold uppercase tracking-widest ${cloudStatus === 'connected' ? 'text-green-800' : 'text-amber-800'}`}>
                        {cloudStatus === 'connected' ? 'Site Config Connected' : 'Local Mode'}
                    </h3>
                </div>
            </div>
            {isSyncing && <div className="flex items-center text-stone-500 text-xs font-bold uppercase tracking-widest"><RefreshCw size={14} className="animate-spin mr-2" /> Syncing...</div>}
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <h1 className="font-serif text-3xl md:text-4xl text-stone-900 flex items-center">
            Creator Mode {editingId && <span className="ml-4 text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-sans font-bold uppercase tracking-wider">Editing</span>}
          </h1>
          <Link to="/admin-pzf-2025" className="text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-widest flex items-center transition-colors">
             <ArrowLeft size={14} className="mr-2" /> Admin Dashboard
          </Link>
        </div>

        {/* --- TAB NAVIGATION --- */}
        <div className="flex border-b border-stone-200 mb-10 overflow-x-auto">
            <button onClick={() => setActiveTab('products')} className={`px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center transition-all ${activeTab === 'products' ? 'border-b-2 border-amber-700 text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>
                <ShoppingBag size={16} className="mr-2" /> Inventory
            </button>
            <button onClick={() => setActiveTab('collections')} className={`px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center transition-all ${activeTab === 'collections' ? 'border-b-2 border-amber-700 text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>
                <LayoutGrid size={16} className="mr-2" /> Collections
            </button>
            <button onClick={() => setActiveTab('config')} className={`px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center transition-all ${activeTab === 'config' ? 'border-b-2 border-amber-700 text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>
                <LayoutTemplate size={16} className="mr-2" /> Site Config
            </button>
            <button onClick={() => setActiveTab('media')} className={`px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center transition-all ${activeTab === 'media' ? 'border-b-2 border-amber-700 text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}>
                <ImageMinus size={16} className="mr-2" /> Media
            </button>
        </div>

        {errorMsg && <div className="p-4 bg-red-50 text-red-600 text-sm border border-red-100 flex items-center mb-6"><AlertCircle size={16} className="mr-2" /> {errorMsg}</div>}
        {successMsg && <div className="p-4 bg-green-50 text-green-700 text-sm border border-green-200 flex items-center mb-6"><CheckCircle size={16} className="mr-2" /> {successMsg}</div>}

        {/* --- VIEW: PRODUCT INVENTORY --- */}
        {activeTab === 'products' && (
            <div className="flex flex-col gap-20 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  <div className="lg:col-span-8">
                      <ProductForm 
                        formData={formData} setFormData={setFormData} onSubmit={handleSubmit}
                        isCreatingCategory={isCreatingCategory} setIsCreatingCategory={setIsCreatingCategory}
                        isCreatingSubCategory={isCreatingSubCategory} setIsCreatingSubCategory={setIsCreatingSubCategory}
                        mergedCategories={mergedCategories} activeSubCategories={activeSubCategories}
                        submitting={isSavingProduct} editingId={editingId} cancelEdit={cancelEdit}
                        triggerDelete={triggerDelete} generateProductCode={generateProductCode} onError={setErrorMsg}
                      />
                  </div>
                  <div className="hidden lg:block lg:col-span-4 sticky top-32">
                      <LivePreview formData={formData} />
                  </div>
              </div>
              <ProductList 
                  items={filteredItems} onEdit={handleEditItem} onDelete={triggerDelete}
                  onDuplicate={handleDuplicateItem} editingId={editingId}
                  searchQuery={listSearch} setSearchQuery={setListSearch}
              />
            </div>
        )}

        {/* --- VIEW: COLLECTIONS MANAGER --- */}
        {activeTab === 'collections' && (
          <CollectionManager categories={mergedCategories} onUpdate={handleCategoryUpdate} />
        )}

        {/* --- VIEW: SITE CONFIG (NEW) --- */}
        {activeTab === 'config' && (
          <SiteConfigEditor 
            config={siteConfigData} 
            meta={siteMeta}
            onChange={setSiteConfigData} 
            onSave={() => saveSiteConfigToCloud(siteConfigData)}
            isSaving={isPublishingConfig}
            onRefresh={initData}
          />
        )}

        {/* --- VIEW: MEDIA TOOLS --- */}
        {activeTab === 'media' && <MediaTools />}

      </div>
    </div>
  );
};

export default CreatorPortal;
