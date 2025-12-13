
import React, { useState, useEffect, useMemo } from 'react';
import { Trash2, HardDrive, ShoppingBag, LayoutTemplate, AlertTriangle, Loader2, CheckCircle, AlertCircle, LayoutGrid, ArrowLeft, ImageMinus } from 'lucide-react';
import { categories as staticCategories } from '../../data/inventory';
import { useLanguage } from '../../contexts/LanguageContext';
import { Category, SubCategory } from '../../types';
import { ASSET_GROUPS } from '../../utils/assets';
import { CDN_DOMAIN } from '../../utils/imageHelpers';
import { adminFetch } from '../../utils/adminFetch';
import { Link } from 'react-router-dom';

import ProductForm from './components/ProductForm';
import ProductList from './components/ProductList';
import LivePreview from './components/LivePreview';
import PageAssets from './components/PageAssets';
import CollectionManager from './components/CollectionManager';
import MediaTools from './components/MediaTools';

// Helper: Calculate approx size of string in bytes
const getStringSize = (str: string) => new Blob([str]).size;

interface AssetHistoryItem {
  url: string;
  timestamp: number;
}

const CreatorPortal: React.FC = () => {
  const { language } = useLanguage();

  // Mode Switching
  const [activeTab, setActiveTab] = useState<'products' | 'collections' | 'assets' | 'media'>('products');

  // UI States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [storageUsage, setStorageUsage] = useState(0);
  const [listSearch, setListSearch] = useState('');

  // Management State
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Asset Management State
  const [customAssets, setCustomAssets] = useState<Record<string, string>>({});
  const [assetHistory, setAssetHistory] = useState<Record<string, AssetHistoryItem[]>>({});
  const [viewingHistoryKey, setViewingHistoryKey] = useState<string | null>(null);

  // Structure Management State
  const [mergedCategories, setMergedCategories] = useState<Category[]>([]);
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
    images: [] as string[], // New Array for multi-images
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

  // --- Helper: Safe Local Storage Set ---
  const safeSetLocalStorage = (key: string, value: string) => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e: any) {
      console.error("Storage Error", e);
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
        const msg = 'Storage Limit Reached! Please delete old items or ensure API upload is working to avoid saving large raw images locally.';
        setErrorMsg(msg);
      } else {
        setErrorMsg('Save Failed: Storage Error');
      }
      return false;
    }
  };

  // --- Initialization & Data Loading ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      const rawProducts = localStorage.getItem('pz_custom_inventory') || '[]';
      let items: any[] = [];
      try { items = JSON.parse(rawProducts); } catch(e) { items = []; }
      if (!Array.isArray(items)) items = [];
      
      const normalizedItems = items.map((i: any) => ({ 
          ...i, 
          status: i.status || 'published',
          // Backward compatibility: If images array missing, create from single image
          images: Array.isArray(i.images) ? i.images : (i.image ? [i.image] : [])
      }));
      setLocalItems(normalizedItems);
      
      const rawStructure = localStorage.getItem('pz_custom_structure') || '[]';
      let customStructure: Category[] = [];
      try { customStructure = JSON.parse(rawStructure); } catch(e) { customStructure = []; }
      if (!Array.isArray(customStructure)) customStructure = [];

      const rawAssets = localStorage.getItem('pz_site_assets') || '{}';
      let parsedAssets = {};
      try { parsedAssets = JSON.parse(rawAssets); } catch(e) { parsedAssets = {}; }
      setCustomAssets(parsedAssets);
      
      const rawHistory = localStorage.getItem('pz_assets_history') || '{}';
      let parsedHistory = {};
      try { parsedHistory = JSON.parse(rawHistory); } catch(e) { parsedHistory = {}; }
      setAssetHistory(parsedHistory);

      // Merge Static + Custom (Overrides)
      const combined = JSON.parse(JSON.stringify(staticCategories));
      customStructure.forEach((customCat: Category) => {
          const existingIdx = combined.findIndex((c: Category) => c.id === customCat.id);
          if (existingIdx > -1) {
              const existingCat = combined[existingIdx];
              
              // Override Main Properties if present in customCat
              if(customCat.image) existingCat.image = customCat.image;
              if(customCat.title) existingCat.title = customCat.title;
              if(customCat.title_zh) existingCat.title_zh = customCat.title_zh;
              if(customCat.description) existingCat.description = customCat.description;
              if(customCat.description_zh) existingCat.description_zh = customCat.description_zh;
              if(customCat.subtitle) existingCat.subtitle = customCat.subtitle;
              if(customCat.subtitle_zh) existingCat.subtitle_zh = customCat.subtitle_zh;

              // Merge Subcategories
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

      const bytes = getStringSize(rawProducts) + getStringSize(rawStructure) + getStringSize(rawAssets) + getStringSize(rawHistory);
      const percent = Math.min(100, (bytes / (5 * 1024 * 1024)) * 100);
      setStorageUsage(percent);

    } catch (e) {
      console.error("Failed to load local data", e);
    }
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    if (!listSearch.trim()) return localItems || [];
    const q = listSearch.toLowerCase();
    return (localItems || []).filter(i => 
      i.name.toLowerCase().includes(q) || 
      (i.name_zh && i.name_zh.toLowerCase().includes(q)) ||
      (i.code && i.code.toLowerCase().includes(q))
    );
  }, [localItems, listSearch]);

  const activeCategory = mergedCategories.find(c => c.id === formData.categoryId) || mergedCategories[0];
  const activeSubCategories = activeCategory?.subCategories || [];

  // Reset SubCategory when Main Category Changes
  useEffect(() => {
      if (!isCreatingSubCategory && activeCategory && activeSubCategories.length > 0) {
          const isValid = activeSubCategories.find(s => s.name === formData.subCategoryName);
          if (!isValid) {
              setFormData(prev => ({ ...prev, subCategoryName: activeSubCategories[0].name }));
          }
      }
      if (activeCategory && activeSubCategories.length === 0 && !isCreatingSubCategory) {
          setIsCreatingSubCategory(true);
      }
  }, [formData.categoryId, activeCategory, isCreatingSubCategory]);

  const generateProductCode = () => {
    const catPrefix = activeCategory?.title ? activeCategory.title.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X') : 'GEN';
    const year = new Date().getFullYear();
    const random = Math.floor(1000 + Math.random() * 9000);
    const newCode = `PZ-${catPrefix}-${year}-${random}`;
    setFormData(prev => ({ ...prev, code: newCode }));
  };

  const handleAssetUpdate = (key: string, url: string) => {
    const oldUrl = customAssets[key];
    if (oldUrl) {
       const currentHistory = assetHistory[key] || [];
       const newHistory = [{ url: oldUrl, timestamp: Date.now() }, ...currentHistory].slice(0, 5);
       const historyMap = { ...assetHistory, [key]: newHistory };
       setAssetHistory(historyMap);
       safeSetLocalStorage('pz_assets_history', JSON.stringify(historyMap));
    }

    const newAssets = { ...customAssets, [key]: url };
    if (safeSetLocalStorage('pz_site_assets', JSON.stringify(newAssets))) {
        setCustomAssets(newAssets);
        setSuccessMsg('Page Asset Updated');
        setTimeout(() => setSuccessMsg(''), 3000);
        loadData();
    }
  };

  const handleAssetReset = (key: string) => {
      const newAssets = { ...customAssets };
      delete newAssets[key];
      if (safeSetLocalStorage('pz_site_assets', JSON.stringify(newAssets))) {
          setCustomAssets(newAssets);
          loadData();
      }
  };

  const handleAssetRollback = (key: string, url: string) => {
     const newAssets = { ...customAssets, [key]: url };
     if (safeSetLocalStorage('pz_site_assets', JSON.stringify(newAssets))) {
         setCustomAssets(newAssets);
         setViewingHistoryKey(null);
         setSuccessMsg('Rolled back to previous version');
         setTimeout(() => setSuccessMsg(''), 3000);
         loadData();
     }
  };

  const handleCategoryUpdate = (updatedCat: Category) => {
    try {
        const rawStructure = localStorage.getItem('pz_custom_structure') || '[]';
        const customStructure: Category[] = JSON.parse(rawStructure);
        
        const index = customStructure.findIndex(c => c.id === updatedCat.id);
        
        if (index > -1) {
            customStructure[index] = {
                ...customStructure[index],
                title: updatedCat.title,
                title_zh: updatedCat.title_zh,
                subtitle: updatedCat.subtitle,
                subtitle_zh: updatedCat.subtitle_zh,
                description: updatedCat.description,
                description_zh: updatedCat.description_zh,
                image: updatedCat.image
            };
        } else {
            const newOverride = {
                id: updatedCat.id,
                title: updatedCat.title,
                title_zh: updatedCat.title_zh,
                subtitle: updatedCat.subtitle,
                subtitle_zh: updatedCat.subtitle_zh,
                description: updatedCat.description,
                description_zh: updatedCat.description_zh,
                image: updatedCat.image,
                subCategories: []
            };
            customStructure.push(newOverride as Category);
        }

        if (safeSetLocalStorage('pz_custom_structure', JSON.stringify(customStructure))) {
            setSuccessMsg('Collection Info Updated');
            setTimeout(() => setSuccessMsg(''), 3000);
            loadData();
        }
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
    
    const itemImages = Array.isArray(item.images) && item.images.length > 0 
        ? item.images 
        : (item.image ? [item.image] : []);

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
    setSuccessMsg(''); 
  };

  // DUPLICATE FUNCTION
  const handleDuplicateItem = (item: any) => {
    setEditingId(null); // We are creating NEW, not editing
    setActiveTab('products');
    setIsCreatingCategory(false);
    setIsCreatingSubCategory(false);

    setFormData({
      ...initialFormState,
      categoryId: item.categoryId,
      subCategoryName: item.subCategoryName,
      name: item.name, // Keep exact name for linking
      name_zh: item.name_zh || '',
      description: item.description,
      description_zh: item.description_zh || '',
      image: '', // Clear images
      images: [],
      material: '', // Clear material
      dimensions: item.dimensions || '',
      code: '', // Clear code
      status: 'draft' // Start as draft
    });
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSuccessMsg('Product info duplicated. Please upload new material images.');
  }

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
    
    setSubmitting(true);

    try {
        let finalCategoryId = formData.categoryId;
        let finalSubCategoryName = formData.subCategoryName;
        let structureUpdated = false;
        
        const rawStructure = localStorage.getItem('pz_custom_structure') || '[]';
        const customStructure: Category[] = JSON.parse(rawStructure);

        if (isCreatingCategory || isCreatingSubCategory) {
            if (isCreatingCategory) {
                finalCategoryId = `custom_${Date.now()}`;
                const newCat: Category = {
                    id: finalCategoryId,
                    title: formData.newCatTitle,
                    title_zh: formData.newCatTitleZh || formData.newCatTitle,
                    subtitle: "Custom Collection",
                    subtitle_zh: "自定义系列",
                    description: formData.newCatDesc || "New custom collection.",
                    description_zh: "新的自定义系列。",
                    image: formData.images[0], // Use primary image for category cover
                    subCategories: []
                };
                customStructure.push(newCat);
                finalSubCategoryName = formData.newSubName || "General";
                newCat.subCategories.push({
                    name: finalSubCategoryName,
                    name_zh: formData.newSubNameZh || finalSubCategoryName,
                    description: formData.newSubDesc || "",
                    image: formData.images[0]
                });
                structureUpdated = true;
            } 
            else if (isCreatingSubCategory) {
                let targetCat = customStructure.find(c => c.id === finalCategoryId);
                if (!targetCat) {
                     const staticCat = staticCategories.find(c => c.id === finalCategoryId);
                     if (staticCat) {
                         targetCat = { ...staticCat, subCategories: [] };
                         customStructure.push(targetCat);
                     } else {
                         targetCat = { id: finalCategoryId, subCategories: [] } as any;
                         customStructure.push(targetCat!);
                     }
                }
                finalSubCategoryName = formData.newSubName;
                targetCat!.subCategories.push({
                    name: finalSubCategoryName,
                    name_zh: formData.newSubNameZh || finalSubCategoryName,
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
            image: formData.images[0], // Main cover image
            images: formData.images, // Full gallery
            material: formData.material, // Important for variant linking
            dimensions: formData.dimensions,
            code: formData.code,
            status: formData.status,
            date: editingId ? localItems.find(i => i.id === editingId)?.date : new Date().toLocaleDateString()
        };

        if (!editingId) {
           try {
              const apiPayload = {
                name: formData.name,
                category: finalSubCategoryName, 
                description: formData.description,
                cover_image_url: formData.images[0],
                meta: { 
                    name_zh: formData.name_zh, 
                    description_zh: formData.description_zh,
                    categoryId: finalCategoryId,
                    material: formData.material,
                    dimensions: formData.dimensions,
                    code: formData.code,
                    status: formData.status,
                    images: formData.images 
                }
              };
              // ✅ Unified adminFetch Call
              await adminFetch('/products', {
                 method: 'POST',
                 body: JSON.stringify(apiPayload),
              });
           } catch (e) {
              console.warn("API Create failed, using local only", e);
           }
        }

        let updatedList;
        if (editingId) {
            updatedList = localItems.map(item => item.id === editingId ? itemPayload : item);
        } else {
            updatedList = [itemPayload, ...localItems];
        }
        
        let success = true;
        if (structureUpdated) {
            if (!safeSetLocalStorage('pz_custom_structure', JSON.stringify(customStructure))) {
                success = false;
            }
        }
        
        if (success) {
            if (safeSetLocalStorage('pz_custom_inventory', JSON.stringify(updatedList))) {
                setLocalItems(updatedList);
                setSuccessMsg(editingId ? 'Product Updated' : 'Product Saved');
                loadData();
                setEditingId(null);
                setFormData(initialFormState);
                setIsCreatingCategory(false);
                setIsCreatingSubCategory(false);
            }
        }
        
    } catch(e) {
        console.error(e);
        setErrorMsg('Save failed');
    } finally {
        setSubmitting(false);
        setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  const triggerDelete = (id: string) => setItemToDelete(id);

  const confirmDelete = async () => {
  if (!itemToDelete) return;
  setIsDeleting(true);

  const id = itemToDelete;
  const deletedItem = localItems.find(item => item.id === id);

  try {
    // 1) --- Auto delete images in R2 using adminFetch ---
    if (deletedItem && Array.isArray(deletedItem.images)) {
        // Convert CDN URL → R2 storage key
        const keys = deletedItem.images.map((url: string) =>
            url.replace(CDN_DOMAIN, "").replace(/^\/+/, "")
        );

        await adminFetch('/delete-images', {
            method: "POST",
            body: JSON.stringify({ keys })
        });

        console.log("[R2] Deleted keys via Admin:", keys);
    }

    // 2) --- Backend delete (optional) using adminFetch ---
    try {
      await adminFetch(`/products/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("API Delete failed (ignored):", err);
    }

    // 3) --- Local delete ---
    const updatedList = localItems.filter(item => item.id !== id);
    localStorage.setItem('pz_custom_inventory', JSON.stringify(updatedList));
    setLocalItems(updatedList);

    if (editingId === id) cancelEdit();

    setSuccessMsg('Product Deleted');
    
  } catch (err) {
    console.error(err);
    setErrorMsg('Delete failed');
  } finally {
    setIsDeleting(false);
    setItemToDelete(null);
  }
};


  const handleClearHistory = () => {
    if (confirm('Clear all data (including custom categories)?')) {
      localStorage.removeItem('pz_custom_inventory');
      localStorage.removeItem('pz_custom_structure');
      localStorage.removeItem('pz_site_assets');
      localStorage.removeItem('pz_assets_history');
      window.location.reload();
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      
      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-8 md:p-10 max-w-sm w-full shadow-2xl border border-stone-200 text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 {isDeleting ? <Loader2 size={32} className="text-red-500 animate-spin" /> : <AlertTriangle size={32} className="text-red-500" />}
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-2">
                 Confirm Deletion
              </h3>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed">
                 Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                 <button onClick={() => setItemToDelete(null)} disabled={isDeleting} className="flex-1 py-3 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors disabled:opacity-50">
                    Cancel
                 </button>
                 <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-md disabled:bg-stone-400">
                    {isDeleting ? 'Deleting...' : 'Delete'}
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-900 flex items-center">
              Creator Mode
              {editingId && (
                 <span className="ml-4 text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-sans font-bold uppercase tracking-wider">
                    Editing
                 </span>
              )}
            </h1>
            <p className="text-stone-500 mt-2">
              Factory Operator Portal: Manage products & site assets
            </p>
          </div>

          <div className="flex items-center space-x-6">
             {/* Updated Link to Secret Admin Path */}
             <Link to="/admin-pzf-2025" className="text-stone-400 hover:text-stone-600 text-xs font-bold uppercase tracking-widest flex items-center transition-colors">
                <ArrowLeft size={14} className="mr-2" /> Admin Dashboard
             </Link>

             <div className="flex flex-col items-end">
                <div className="flex items-center text-xs font-bold uppercase tracking-widest text-stone-400 mb-1">
                   <HardDrive size={12} className="mr-2" /> Storage
                </div>
                <div className="w-32 h-2 bg-stone-200 rounded-full overflow-hidden">
                   <div 
                     className={`h-full transition-all duration-500 ${storageUsage > 90 ? 'bg-red-500' : storageUsage > 70 ? 'bg-amber-500' : 'bg-green-500'}`} 
                     style={{ width: `${storageUsage}%` }}
                   ></div>
                </div>
             </div>
             
             <button
                onClick={handleClearHistory}
                className="text-stone-400 text-xs font-bold uppercase tracking-widest hover:text-red-700 flex items-center transition-colors border-l pl-6 border-stone-200"
              >
                <Trash2 size={14} className="mr-2" /> Reset All
              </button>
          </div>
        </div>

        {/* --- TAB NAVIGATION --- */}
        <div className="flex border-b border-stone-200 mb-10 overflow-x-auto">
            <button
                onClick={() => setActiveTab('products')}
                className={`px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center transition-all whitespace-nowrap ${activeTab === 'products' ? 'border-b-2 border-amber-700 text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <ShoppingBag size={16} className="mr-2" /> Inventory
            </button>
            <button
                onClick={() => setActiveTab('collections')}
                className={`px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center transition-all whitespace-nowrap ${activeTab === 'collections' ? 'border-b-2 border-amber-700 text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <LayoutGrid size={16} className="mr-2" /> Collections
            </button>
            <button
                onClick={() => setActiveTab('assets')}
                className={`px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center transition-all whitespace-nowrap ${activeTab === 'assets' ? 'border-b-2 border-amber-700 text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <LayoutTemplate size={16} className="mr-2" /> Assets
            </button>
            <button
                onClick={() => setActiveTab('media')}
                className={`px-8 py-4 font-bold uppercase tracking-widest text-xs flex items-center transition-all whitespace-nowrap ${activeTab === 'media' ? 'border-b-2 border-amber-700 text-amber-700' : 'text-stone-400 hover:text-stone-600'}`}
            >
                <ImageMinus size={16} className="mr-2" /> Media Tools
            </button>
        </div>

        {/* Global Messages */}
        {errorMsg && (
            <div className="p-4 bg-red-50 text-red-600 text-sm border border-red-100 flex items-center animate-fade-in-up mb-6">
            <AlertCircle size={16} className="mr-2" /> {errorMsg}
            </div>
        )}
        
        {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 text-sm border border-green-200 flex items-center animate-fade-in-up mb-6">
            <CheckCircle size={16} className="mr-2" />
            {successMsg}
        </div>
        )}

        {/* --- VIEW: PRODUCT INVENTORY --- */}
        {activeTab === 'products' && (
            <div className="flex flex-col gap-20 animate-fade-in">
              
              {/* Top: Editor & Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                  {/* Left: Input Form (Takes up more space) */}
                  <div className="lg:col-span-8">
                      <ProductForm 
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={handleSubmit}
                        isCreatingCategory={isCreatingCategory}
                        setIsCreatingCategory={setIsCreatingCategory}
                        isCreatingSubCategory={isCreatingSubCategory}
                        setIsCreatingSubCategory={setIsCreatingSubCategory}
                        mergedCategories={mergedCategories}
                        activeSubCategories={activeSubCategories}
                        submitting={submitting}
                        editingId={editingId}
                        cancelEdit={cancelEdit}
                        triggerDelete={triggerDelete}
                        generateProductCode={generateProductCode}
                        onError={setErrorMsg}
                      />
                  </div>

                  {/* Right: Sticky Live Preview */}
                  <div className="hidden lg:block lg:col-span-4 sticky top-32">
                      <LivePreview formData={formData} />
                  </div>
              </div>

              {/* Bottom: Management List (Full Width) */}
              <div className="w-full">
                <ProductList 
                  items={filteredItems}
                  onEdit={handleEditItem}
                  onDelete={triggerDelete}
                  onDuplicate={handleDuplicateItem}
                  editingId={editingId}
                  searchQuery={listSearch}
                  setSearchQuery={setListSearch}
                />
              </div>
            </div>
        )}

        {/* --- VIEW: COLLECTIONS MANAGER --- */}
        {activeTab === 'collections' && (
          <CollectionManager 
            categories={mergedCategories}
            onUpdate={handleCategoryUpdate}
          />
        )}

        {/* --- VIEW: PAGE ASSETS --- */}
        {activeTab === 'assets' && (
          <PageAssets 
            customAssets={customAssets}
            assetHistory={assetHistory}
            onAssetUpdate={handleAssetUpdate}
            onAssetReset={handleAssetReset}
            onAssetRollback={handleAssetRollback}
            viewingHistoryKey={viewingHistoryKey}
            setViewingHistoryKey={setViewingHistoryKey}
          />
        )}

        {/* --- VIEW: MEDIA TOOLS --- */}
        {activeTab === 'media' && (
          <MediaTools />
        )}

      </div>
    </div>
  );
};

export default CreatorPortal;
