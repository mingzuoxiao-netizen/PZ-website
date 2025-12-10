
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Upload, Plus, Trash2, CheckCircle, Image as ImageIcon, Loader2, AlertCircle, Save, PenSquare, Search, HardDrive, X, CornerDownRight, AlertTriangle } from 'lucide-react';
import { categories as staticCategories } from '../data/inventory';
import { useLanguage } from '../contexts/LanguageContext';
import { Category, SubCategory } from '../types';

// ====== API Configuration ======
const API_BASE = "https://pz-inquiry-api.mingzuoxiao29.workers.dev";

// Helper: Convert File to Base64 (Fallback for offline mode)
const toBase64 = (file: File): Promise<string> => 
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });

// Helper: Calculate approx size of string in bytes
const getStringSize = (str: string) => new Blob([str]).size;

const CreatorPortal: React.FC = () => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [detailedError, setDetailedError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usingOfflineMode, setUsingOfflineMode] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [storageUsage, setStorageUsage] = useState(0);
  const [listSearch, setListSearch] = useState('');

  // Management State
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Structure Management State (For Custom Categories)
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
    // New Category Fields
    newCatTitle: '',
    newCatTitleZh: '',
    newCatDesc: '',
    // New SubCategory Fields
    newSubName: '',
    newSubNameZh: '',
    newSubDesc: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Initialization & Data Loading ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    try {
      // 1. Load Products
      const rawProducts = localStorage.getItem('pz_custom_inventory') || '[]';
      const items = JSON.parse(rawProducts);
      setLocalItems(items);
      
      // 2. Load Custom Structure (New Categories)
      const rawStructure = localStorage.getItem('pz_custom_structure') || '[]';
      const customStructure = JSON.parse(rawStructure);

      // 3. Merge Static + Custom Structure
      const combined = JSON.parse(JSON.stringify(staticCategories));
      
      customStructure.forEach((customCat: Category) => {
          const existingIdx = combined.findIndex((c: Category) => c.id === customCat.id);
          if (existingIdx > -1) {
              const existingCat = combined[existingIdx];
              customCat.subCategories.forEach((newSub: SubCategory) => {
                  if (!existingCat.subCategories.find((s: SubCategory) => s.name === newSub.name)) {
                      existingCat.subCategories.push(newSub);
                  }
              });
          } else {
              combined.push(customCat);
          }
      });
      setMergedCategories(combined);

      // 4. Calculate Storage
      const bytes = getStringSize(rawProducts) + getStringSize(rawStructure);
      const percent = Math.min(100, (bytes / (5 * 1024 * 1024)) * 100);
      setStorageUsage(percent);

    } catch (e) {
      console.error("Failed to load local data", e);
    }
  };

  // Filtered List
  const filteredItems = useMemo(() => {
    if (!listSearch.trim()) return localItems;
    const q = listSearch.toLowerCase();
    return localItems.filter(i => 
      i.name.toLowerCase().includes(q) || 
      (i.name_zh && i.name_zh.toLowerCase().includes(q))
    );
  }, [localItems, listSearch]);

  const activeCategory = mergedCategories.find(c => c.id === formData.categoryId) || mergedCategories[0];
  const activeSubCategories = activeCategory?.subCategories || [];

  // --- Reset SubCategory when Main Category Changes ---
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


  // --- Drag & Drop Handlers ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // --- Image Processing Logic ---
  const processFile = async (file: File) => {
    if (file.size > 20 * 1024 * 1024) { 
      setErrorMsg(language === 'zh' ? '图片太大（需小于20MB）' : 'Image too large (Max 20MB)');
      return;
    }
    setUploadingImage(true);
    setErrorMsg('');
    setDetailedError('');
    setUsingOfflineMode(false);

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    try {
      console.log(`[Upload] Attempting POST to ${API_BASE}/api/upload-image...`);
      const res = await fetch(`${API_BASE}/api/upload-image`, {
        method: 'POST',
        body: formDataObj,
        // Note: No headers for FormData (browser sets boundary)
      });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const data = await res.json();
      if (!data.url) throw new Error('No URL returned');
      setFormData(prev => ({ ...prev, image: data.url }));
    } catch (err: any) {
      console.warn("Server upload failed, switching to local Base64 mode.", err);
      setDetailedError(err.message);
      try {
        const base64 = await toBase64(file);
        setFormData(prev => ({ ...prev, image: base64 }));
        setUsingOfflineMode(true); 
      } catch (conversionErr) {
        setErrorMsg(language === 'zh' ? '图片处理失败' : 'Failed to process image');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  // --- Remove Image from Form ---
  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({ ...prev, image: '' }));
  };

  // --- Edit Mode Logic ---
  const handleEditItem = (item: any) => {
    setEditingId(item.id);
    setIsCreatingCategory(false);
    setIsCreatingSubCategory(false);
    setFormData({
      ...initialFormState,
      categoryId: item.categoryId,
      subCategoryName: item.subCategoryName,
      name: item.name,
      name_zh: item.name_zh || '',
      description: item.description,
      description_zh: item.description_zh || '',
      image: item.image
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSuccessMsg(''); 
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsCreatingCategory(false);
    setIsCreatingSubCategory(false);
  };

  // --- Submit Logic (Create or Update) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!formData.name || !formData.image) {
      setErrorMsg(language === 'zh' ? '请填写名称并上传图片' : 'Name and Image are required');
      return;
    }
    if (isCreatingCategory && !formData.newCatTitle) {
        setErrorMsg(language === 'zh' ? '请输入新分类名称' : 'New Category Name is required');
        return;
    }
    if (isCreatingSubCategory && !formData.newSubName) {
        setErrorMsg(language === 'zh' ? '请输入新子分类名称' : 'New Sub-Category Name is required');
        return;
    }

    setSubmitting(true);

    try {
        let finalCategoryId = formData.categoryId;
        let finalSubCategoryName = formData.subCategoryName;

        if (isCreatingCategory || isCreatingSubCategory) {
            const rawStructure = localStorage.getItem('pz_custom_structure') || '[]';
            const customStructure: Category[] = JSON.parse(rawStructure);
            
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
                    image: formData.image, 
                    subCategories: []
                };
                customStructure.push(newCat);
                finalSubCategoryName = formData.newSubName || "General";
                newCat.subCategories.push({
                    name: finalSubCategoryName,
                    name_zh: formData.newSubNameZh || finalSubCategoryName,
                    description: formData.newSubDesc || "",
                    image: formData.image
                });
            } 
            else if (isCreatingSubCategory) {
                let targetCat = customStructure.find(c => c.id === finalCategoryId);
                if (!targetCat) {
                     targetCat = { id: finalCategoryId, subCategories: [] } as any;
                     customStructure.push(targetCat!);
                }
                finalSubCategoryName = formData.newSubName;
                targetCat!.subCategories.push({
                    name: finalSubCategoryName,
                    name_zh: formData.newSubNameZh || finalSubCategoryName,
                    description: formData.newSubDesc || "",
                    image: formData.image
                });
            }
            localStorage.setItem('pz_custom_structure', JSON.stringify(customStructure));
        }

        const itemPayload = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            categoryId: finalCategoryId,
            subCategoryName: finalSubCategoryName,
            name: formData.name,
            name_zh: formData.name_zh,
            description: formData.description,
            description_zh: formData.description_zh,
            image: formData.image,
            date: editingId ? localItems.find(i => i.id === editingId)?.date : new Date().toLocaleDateString()
        };

        if (!usingOfflineMode && !editingId) {
           try {
              const apiPayload = {
                name: formData.name,
                category: finalSubCategoryName, 
                description: formData.description,
                cover_image_url: formData.image,
                meta: { 
                    name_zh: formData.name_zh, 
                    description_zh: formData.description_zh,
                    categoryId: finalCategoryId 
                }
              };
              await fetch(`${API_BASE}/api/products`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify(apiPayload),
              });
           } catch (e) {
              setUsingOfflineMode(true);
           }
        }

        let updatedList;
        if (editingId) {
            updatedList = localItems.map(item => item.id === editingId ? itemPayload : item);
            setSuccessMsg(language === 'zh' ? '产品已更新' : 'Product Updated');
        } else {
            updatedList = [itemPayload, ...localItems];
            setSuccessMsg(language === 'zh' ? '产品已发布' : 'Product Published');
        }
        
        localStorage.setItem('pz_custom_inventory', JSON.stringify(updatedList));
        setLocalItems(updatedList);
        loadData();
        
        setEditingId(null);
        setFormData(initialFormState);
        setIsCreatingCategory(false);
        setIsCreatingSubCategory(false);
        
    } catch(e) {
        console.error(e);
        setErrorMsg(language === 'zh' ? '保存失败' : 'Save failed');
    } finally {
        setSubmitting(false);
        setTimeout(() => setSuccessMsg(''), 5000);
    }
  };

  // --- Deletion Logic ---
  
  const triggerDelete = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    
    const id = itemToDelete;
    const deletedItem = localItems.find(item => item.id === id);

    try {
        // 1. Attempt API Delete (if connected)
        if (!usingOfflineMode) {
            try {
                await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
            } catch (e) {
                console.warn("API delete failed or not implemented", e);
            }
        }

        // 2. Remove from List
        const updatedList = localItems.filter(item => item.id !== id);
        setLocalItems(updatedList);
        localStorage.setItem('pz_custom_inventory', JSON.stringify(updatedList));

        // 3. Smart Cleanup: Remove Empty Custom Categories
        if (deletedItem) {
            const { categoryId, subCategoryName } = deletedItem;
            const rawStruct = localStorage.getItem('pz_custom_structure') || '[]';
            let customStruct = JSON.parse(rawStruct);
            let structChanged = false;

            const catIndex = customStruct.findIndex((c: any) => c.id === categoryId);
            if (catIndex > -1) {
                const cat = customStruct[catIndex];
                // Check if any *other* items use this subcategory
                const othersInSub = updatedList.filter(i => i.categoryId === categoryId && i.subCategoryName === subCategoryName);
                
                if (othersInSub.length === 0) {
                    // Remove subcategory
                    const originalSubLength = cat.subCategories.length;
                    cat.subCategories = cat.subCategories.filter((s: any) => s.name !== subCategoryName);
                    if (cat.subCategories.length !== originalSubLength) {
                        structChanged = true;
                    }
                    
                    // If category has no more subcategories, remove category
                    if (cat.subCategories.length === 0) {
                        customStruct.splice(catIndex, 1);
                        structChanged = true;
                    }
                }
            }
            
            if (structChanged) {
                localStorage.setItem('pz_custom_structure', JSON.stringify(customStruct));
            }
        }

        loadData();
        if (editingId === id) cancelEdit();
        setItemToDelete(null);
        setSuccessMsg(language === 'zh' ? '产品已删除' : 'Product Deleted');
        setTimeout(() => setSuccessMsg(''), 3000);

    } catch (e) {
        setErrorMsg(language === 'zh' ? '删除失败' : 'Delete failed');
    } finally {
        setIsDeleting(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm(language === 'zh' ? '确定清除所有数据（包括自定义分类）吗？' : 'Clear all data (including custom categories)?')) {
      localStorage.removeItem('pz_custom_inventory');
      localStorage.removeItem('pz_custom_structure');
      window.location.reload();
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      
      {/* --- Delete Confirmation Modal --- */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-8 md:p-10 max-w-sm w-full shadow-2xl border border-stone-200 text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 {isDeleting ? (
                     <Loader2 size={32} className="text-red-500 animate-spin" />
                 ) : (
                     <AlertTriangle size={32} className="text-red-500" />
                 )}
              </div>
              <h3 className="font-serif text-2xl text-stone-900 mb-2">
                 {language === 'zh' ? '确认删除' : 'Confirm Deletion'}
              </h3>
              <p className="text-stone-500 text-sm mb-8 leading-relaxed">
                 {language === 'zh' 
                   ? '您确定要删除此产品吗？此操作无法撤销。' 
                   : 'Are you sure you want to delete this product? This action cannot be undone.'}
              </p>
              <div className="flex space-x-4">
                 <button 
                    onClick={() => setItemToDelete(null)}
                    disabled={isDeleting}
                    className="flex-1 py-3 border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-widest hover:bg-stone-50 transition-colors disabled:opacity-50"
                 >
                    {language === 'zh' ? '取消' : 'Cancel'}
                 </button>
                 <button 
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-colors shadow-md disabled:bg-stone-400"
                 >
                    {isDeleting ? (language === 'zh' ? '删除中...' : 'Deleting...') : (language === 'zh' ? '删除' : 'Delete')}
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="container mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-900 flex items-center">
              {language === 'zh' ? '创造者模式' : 'Creator Mode'}
              {editingId && (
                 <span className="ml-4 text-sm bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-sans font-bold uppercase tracking-wider">
                    {language === 'zh' ? '编辑中' : 'Editing'}
                 </span>
              )}
            </h1>
            <p className="text-stone-500 mt-2">
              {language === 'zh'
                ? '工厂操作员入口：上传、管理新产品及分类'
                : 'Factory Operator Portal: Manage products & categories'}
            </p>
          </div>

          <div className="flex items-center space-x-6">
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
                <Trash2 size={14} className="mr-2" /> {language === 'zh' ? '全部重置' : 'Reset All'}
              </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Input Form */}
          <div className={`bg-white p-8 md:p-12 border ${editingId ? 'border-amber-500 ring-4 ring-amber-500/10' : 'border-stone-200'} shadow-xl relative h-fit transition-all duration-300`}>
            
            {submitting && (
                <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-[#a16207] animate-spin mb-4" />
                    <span className="text-stone-900 font-bold uppercase tracking-widest">
                        {language === 'zh' ? '正在保存...' : 'Saving...'}
                    </span>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-stone-900 uppercase tracking-widest text-sm">
                    {editingId ? (language === 'zh' ? '编辑产品' : 'Edit Product') : (language === 'zh' ? '添加新产品' : 'Add New Product')}
                </h3>
                {editingId && (
                    <button onClick={cancelEdit} className="text-xs text-stone-400 hover:text-stone-900 underline">
                        {language === 'zh' ? '取消' : 'Cancel'}
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* === Dynamic Category Section === */}
              <div className="space-y-4 bg-stone-50 p-6 rounded-sm border border-stone-100">
                  <div className="flex justify-between items-end mb-2">
                     <label className="text-xs uppercase tracking-wider text-stone-500 font-bold flex items-center">
                        {language === 'zh' ? '一级主分类' : 'Main Category'}
                     </label>
                     {!editingId && (
                         <button 
                            type="button"
                            onClick={() => {
                                setIsCreatingCategory(!isCreatingCategory);
                                setIsCreatingSubCategory(false);
                            }}
                            className={`text-[10px] uppercase font-bold tracking-widest flex items-center ${isCreatingCategory ? 'text-red-500' : 'text-amber-700'}`}
                         >
                            {isCreatingCategory ? (language === 'zh' ? '取消新建' : 'Cancel New') : (language === 'zh' ? '+ 新建分类' : '+ Create New')}
                         </button>
                     )}
                  </div>

                  {isCreatingCategory ? (
                      <div className="space-y-3 animate-fade-in-up">
                          <input 
                            type="text"
                            placeholder={language === 'zh' ? "新分类名称 (英文)" : "New Category Name (EN)"}
                            className="w-full bg-white border border-amber-300 text-stone-900 px-4 py-2 text-sm focus:border-[#a16207] outline-none"
                            value={formData.newCatTitle}
                            onChange={e => setFormData(prev => ({...prev, newCatTitle: e.target.value}))}
                          />
                          <input 
                            type="text"
                            placeholder={language === 'zh' ? "新分类名称 (中文)" : "New Category Name (ZH)"}
                            className="w-full bg-white border border-amber-300 text-stone-900 px-4 py-2 text-sm focus:border-[#a16207] outline-none"
                            value={formData.newCatTitleZh}
                            onChange={e => setFormData(prev => ({...prev, newCatTitleZh: e.target.value}))}
                          />
                      </div>
                  ) : (
                      <select
                        value={formData.categoryId}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
                      >
                        {mergedCategories.map(c => (
                          <option key={c.id} value={c.id}>
                            {language === 'zh' ? (c.title_zh || c.title) : c.title}
                          </option>
                        ))}
                      </select>
                  )}

                  <div className="mt-6">
                      <div className="flex justify-between items-end mb-2 pl-4 border-l-2 border-stone-200">
                         <label className="text-xs uppercase tracking-wider text-stone-500 font-bold flex items-center">
                            <CornerDownRight size={12} className="mr-2" /> {language === 'zh' ? '二级子分类' : 'Sub-Category'}
                         </label>
                         {!editingId && !isCreatingCategory && (
                             <button 
                                type="button"
                                onClick={() => setIsCreatingSubCategory(!isCreatingSubCategory)}
                                className={`text-[10px] uppercase font-bold tracking-widest flex items-center ${isCreatingSubCategory ? 'text-red-500' : 'text-amber-700'}`}
                             >
                                {isCreatingSubCategory ? (language === 'zh' ? '取消新建' : 'Cancel New') : (language === 'zh' ? '+ 新建子分类' : '+ Create New')}
                             </button>
                         )}
                      </div>

                      {isCreatingCategory || isCreatingSubCategory ? (
                          <div className="space-y-3 pl-4 border-l-2 border-amber-200 animate-fade-in-up">
                              <input 
                                type="text"
                                placeholder={language === 'zh' ? "新子分类名称 (英文)" : "New Sub-Category (EN)"}
                                className="w-full bg-white border border-amber-300 text-stone-900 px-4 py-2 text-sm focus:border-[#a16207] outline-none"
                                value={formData.newSubName}
                                onChange={e => setFormData(prev => ({...prev, newSubName: e.target.value}))}
                              />
                              <input 
                                type="text"
                                placeholder={language === 'zh' ? "新子分类名称 (中文)" : "New Sub-Category (ZH)"}
                                className="w-full bg-white border border-amber-300 text-stone-900 px-4 py-2 text-sm focus:border-[#a16207] outline-none"
                                value={formData.newSubNameZh}
                                onChange={e => setFormData(prev => ({...prev, newSubNameZh: e.target.value}))}
                              />
                          </div>
                      ) : (
                          <div className="pl-4 border-l-2 border-stone-200">
                            <select
                                value={formData.subCategoryName}
                                onChange={(e) => setFormData(prev => ({ ...prev, subCategoryName: e.target.value }))}
                                className="w-full bg-white border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
                            >
                                {activeSubCategories.map((sc, idx) => (
                                <option key={idx} value={sc.name}>
                                    {language === 'zh' ? (sc.name_zh || sc.name) : sc.name}
                                </option>
                                ))}
                            </select>
                          </div>
                      )}
                  </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                    Product Name (EN) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
                    placeholder="e.g., Walnut Side Table"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                    产品名称 (中文)
                  </label>
                  <input
                    type="text"
                    value={formData.name_zh}
                    onChange={(e) => setFormData(prev => ({ ...prev, name_zh: e.target.value }))}
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
                    placeholder="例如：黑胡桃边几"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                    Description (EN)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, description: e.target.value }))
                    }
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
                    placeholder="Short description..."
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                    产品描述 (中文)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description_zh}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, description_zh: e.target.value }))
                    }
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
                    placeholder="简短描述..."
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <div className="flex justify-between items-center mb-2">
                   <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold">
                     {language === 'zh' ? '产品图片' : 'Product Image'} <span className="text-red-400">*</span>
                   </label>
                </div>

                <div
                  className={`
                    border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 relative group/upload
                    ${isDragging ? 'border-[#a16207] bg-amber-50 scale-[1.02]' : formData.image ? 'border-[#a16207] bg-amber-50/10' : 'border-stone-300 bg-stone-50 hover:border-[#a16207]'}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                >
                  {formData.image ? (
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                         <img
                            src={formData.image}
                            alt="Preview"
                            className="h-40 object-contain mb-4 shadow-sm border border-stone-200"
                         />
                         {/* NEW: Direct Delete Image Button */}
                         <button
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-colors z-20"
                            title="Remove Image"
                         >
                            <X size={12} />
                         </button>

                         <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-white font-bold uppercase text-xs tracking-widest">Change</span>
                         </div>
                      </div>
                      
                      <span className="text-xs text-[#a16207] font-bold uppercase tracking-wide flex items-center">
                        {uploadingImage
                          ? (language === 'zh' ? '上传中...' : 'Uploading...')
                          : (language === 'zh' ? '点击或拖拽更换图片' : 'Click or Drag to Replace')}
                         {usingOfflineMode && !uploadingImage && <span className="ml-2 px-1 bg-stone-200 text-stone-600 rounded text-[10px]">LOCAL</span>}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-stone-400">
                       {uploadingImage ? (
                           <Loader2 size={32} className="animate-spin text-[#a16207] mb-2" />
                       ) : (
                           <div className={`transition-transform duration-300 ${isDragging ? 'scale-125 text-[#a16207]' : ''}`}>
                               <Upload size={32} className="mb-2" />
                           </div>
                       )}
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {uploadingImage
                          ? (language === 'zh' ? '上传中...' : 'Uploading...')
                          : (isDragging ? (language === 'zh' ? '释放图片以上传' : 'Drop to Upload') : (language === 'zh' ? '点击或拖拽上传 (最大 20MB)' : 'Click or Drag to upload (Max 20MB)'))}
                      </span>
                    </div>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Messages */}
              {errorMsg && (
                 <div className="p-4 bg-red-50 text-red-600 text-sm border border-red-100 flex items-center animate-fade-in-up">
                    <AlertCircle size={16} className="mr-2" /> {errorMsg}
                 </div>
              )}
              
              {successMsg && (
                <div className="p-4 bg-green-50 text-green-700 text-sm border border-green-200 flex items-center animate-fade-in-up">
                  <CheckCircle size={16} className="mr-2" />
                  {successMsg}
                </div>
              )}
              
              <div className="flex space-x-4">
                  {editingId && (
                      <button
                        type="button"
                        onClick={() => triggerDelete(editingId)}
                        className="flex-none w-14 bg-red-100 text-red-600 font-bold uppercase tracking-widest py-4 hover:bg-red-200 transition-colors flex justify-center items-center rounded-sm"
                        title={language === 'zh' ? '删除此产品' : 'Delete Product'}
                      >
                          <Trash2 size={18} />
                      </button>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || uploadingImage || !formData.image}
                    className={`flex-1 text-white font-bold uppercase tracking-widest py-4 transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg
                        ${editingId ? 'bg-amber-700 hover:bg-amber-800' : 'bg-[#281815] hover:bg-[#a16207]'}
                    `}
                  >
                    {submitting ? (
                        language === 'zh' ? '处理中...' : 'Processing...'
                    ) : (
                        <>
                           {editingId ? (language === 'zh' ? '更新产品' : 'Update Product') : (language === 'zh' ? '发布产品' : 'Publish Product')}
                           {editingId ? <Save size={16} className="ml-2" /> : <Plus size={16} className="ml-2 group-hover:rotate-90 transition-transform" />}
                        </>
                    )}
                  </button>
              </div>

            </form>
          </div>

          {/* Right: Live Preview & Management List */}
          <div className="hidden lg:block space-y-8">
            
            {/* 1. Live Preview Card */}
            <div className="sticky top-32">
              <h3 className="font-serif text-2xl text-stone-900 mb-6 border-l-4 border-[#a16207] pl-4">
                {language === 'zh' ? '实时预览' : 'Live Preview'}
              </h3>

              <div className="bg-white group border border-stone-100 shadow-xl max-w-md mx-auto mb-8">
                <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100 relative">
                  {formData.image ? (
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300 bg-stone-100">
                      <ImageIcon size={48} />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#a16207] shadow-sm">
                    New Arrival
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl text-stone-900 mb-2">
                    {language === 'zh' ? formData.name_zh || '产品名称' : formData.name || 'Product Name'}
                  </h3>
                  <div className="text-[10px] font-bold uppercase text-stone-400 mb-2">
                      {isCreatingCategory ? formData.newCatTitle : (activeCategory?.title || '')} / {isCreatingSubCategory ? formData.newSubName : formData.subCategoryName}
                  </div>
                  <p className="text-stone-500 text-sm leading-relaxed mb-4 line-clamp-2">
                    {language === 'zh' ? formData.description_zh || '描述内容...' : formData.description || 'Description goes here...'}
                  </p>
                </div>
              </div>

              {/* 2. Manage Uploads List */}
              <div className="border-t border-stone-200 pt-8">
                    <div className="flex justify-between items-center mb-4 pl-4 border-l-4 border-stone-300">
                        <h3 className="font-serif text-2xl text-stone-900">
                           {language === 'zh' ? '管理已上传' : 'Manage Uploads'}
                        </h3>
                        <span className="text-xs text-stone-400 font-sans font-normal bg-stone-100 px-2 py-1 rounded-full">{localItems.length}</span>
                    </div>

                    <div className="relative mb-4">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                        <input 
                            type="text" 
                            placeholder={language === 'zh' ? "搜索产品..." : "Search items..."}
                            value={listSearch}
                            onChange={(e) => setListSearch(e.target.value)}
                            className="w-full bg-white border border-stone-200 pl-9 pr-4 py-2 text-sm text-stone-700 focus:outline-none focus:border-[#a16207]"
                        />
                    </div>

                    <div className="bg-white border border-stone-200 shadow-sm max-h-[350px] overflow-y-auto rounded-sm scrollbar-thin">
                        {filteredItems.length === 0 ? (
                            <div className="p-8 text-center text-stone-400 text-sm">
                                {language === 'zh' ? '暂无内容' : 'No items found'}
                            </div>
                        ) : (
                            filteredItems.map((item) => (
                                <div 
                                    key={item.id} 
                                    className={`flex items-center p-3 border-b border-stone-100 transition-colors
                                        ${editingId === item.id ? 'bg-amber-50 border-amber-100' : 'hover:bg-stone-50'}
                                    `}
                                >
                                    <div className="relative w-12 h-12 flex-shrink-0 mr-4">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-sm border border-stone-200" />
                                        {editingId === item.id && (
                                            <div className="absolute inset-0 bg-amber-500/50 flex items-center justify-center">
                                                <PenSquare size={12} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 mr-2">
                                        <h4 className={`text-sm font-bold truncate ${editingId === item.id ? 'text-amber-800' : 'text-stone-900'}`}>
                                            {language === 'zh' ? (item.name_zh || item.name) : item.name}
                                        </h4>
                                        <div className="flex items-center text-[10px] text-stone-500 space-x-2">
                                            <span className="truncate max-w-[80px]">{item.subCategoryName}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex space-x-1">
                                        <button 
                                            onClick={() => handleEditItem(item)}
                                            className={`p-2 rounded transition-colors ${editingId === item.id ? 'bg-amber-200 text-amber-800' : 'text-stone-400 hover:text-[#a16207] hover:bg-amber-50'}`}
                                            title={language === 'zh' ? '编辑' : 'Edit'}
                                            disabled={editingId === item.id}
                                        >
                                            <PenSquare size={14} />
                                        </button>
                                        <button 
                                            onClick={() => triggerDelete(item.id)}
                                            className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                                            title={language === 'zh' ? '删除' : 'Delete'}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorPortal;
