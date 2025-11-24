import React, { useState, useRef } from 'react';
import { Upload, Plus, Trash2, CheckCircle, Image as ImageIcon, Loader2, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { categories } from '../data/inventory';
import { useLanguage } from '../contexts/LanguageContext';

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

const CreatorPortal: React.FC = () => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI States
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [detailedError, setDetailedError] = useState(''); // For debugging
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usingOfflineMode, setUsingOfflineMode] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    categoryId: categories[0].id,
    subCategoryName: categories[0].subCategories[0].name,
    name: '',
    name_zh: '',
    description: '',
    description_zh: '',
    image: '' // Stores the URL (Remote or Base64)
  });

  // Helper: Get available subcategories based on selected main category
  const selectedCategory = categories.find(c => c.id === formData.categoryId) || categories[0];
  const subCategories = selectedCategory.subCategories;

  // 1. Handle Image Upload (With Offline Fallback)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side size check (20MB)
    if (file.size > 20 * 1024 * 1024) { 
      setErrorMsg(language === 'zh' ? '图片太大（需小于20MB）' : 'Image too large (Max 20MB)');
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append('file', file);

    setUploadingImage(true);
    setErrorMsg('');
    setDetailedError('');
    // Optimistically try online mode first
    setUsingOfflineMode(false);

    try {
      // Attempt Server Upload
      console.log(`[Upload] Attempting POST to ${API_BASE}/api/upload-image...`);
      const res = await fetch(`${API_BASE}/api/upload-image`, {
        method: 'POST',
        body: formDataObj,
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (!data.url) throw new Error('No URL returned from server');

      setFormData(prev => ({ ...prev, image: data.url }));

    } catch (err: any) {
      console.warn("Server upload failed, switching to local Base64 mode.", err);
      setDetailedError(err.message || 'Unknown Error');
      
      // Fallback: Convert to Base64
      try {
        const base64 = await toBase64(file);
        setFormData(prev => ({ ...prev, image: base64 }));
        setUsingOfflineMode(true); // Switch to offline mode
      } catch (conversionErr) {
        setErrorMsg(language === 'zh' ? '图片处理失败' : 'Failed to process image');
      }
    } finally {
      setUploadingImage(false);
    }
  };

  // 2. Handle Product Submission (With Offline Fallback)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Validation
    if (!formData.name || !formData.image) {
      setErrorMsg(language === 'zh' ? '请填写名称并上传图片' : 'Name and Image are required');
      return;
    }

    setSubmitting(true);

    // Construct Data
    const payload = {
      name: formData.name,
      category: formData.subCategoryName || formData.categoryId,
      description: formData.description,
      cover_image_url: formData.image,
      meta: {
          name_zh: formData.name_zh,
          description_zh: formData.description_zh
      }
    };

    // Construct Local Storage Item
    const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        categoryId: formData.categoryId,
        subCategoryName: formData.subCategoryName,
        name: formData.name,
        name_zh: formData.name_zh,
        description: formData.description,
        description_zh: formData.description_zh,
        image: formData.image
    };

    try {
      if (usingOfflineMode) {
          throw new Error("Already in offline mode, skipping API call.");
      }

      // Attempt Server API
      console.log(`[Submit] Attempting POST to ${API_BASE}/api/products...`);
      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`API Error ${res.status}: ${res.statusText}`);

      setSuccessMsg(language === 'zh' ? '产品发布成功！(云端)' : 'Product Published Successfully! (Cloud)');
    } catch (err) {
      console.warn("API unavailable, saving locally only:", err);
      setUsingOfflineMode(true);
      setSuccessMsg(language === 'zh' ? '已保存至本地演示库 (Local Demo)' : 'Saved to Local Demo Cache');
    }

    // Always Update Local Storage (Visual Feedback for Demo)
    try {
        const existing = JSON.parse(localStorage.getItem('pz_custom_inventory') || '[]');
        localStorage.setItem('pz_custom_inventory', JSON.stringify([newItem, ...existing]));
    } catch(e) {
        console.error("Local storage error", e);
    }

    // Reset Form
    setSubmitting(false);
    setFormData(prev => ({
        ...prev,
        name: '',
        name_zh: '',
        description: '',
        description_zh: '',
        image: '',
    }));
    
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleClearHistory = () => {
    if (confirm(language === 'zh' ? '确定清除本地缓存吗？' : 'Clear local cache?')) {
      localStorage.removeItem('pz_custom_inventory');
      window.location.reload();
    }
  };

  return (
    <div className="bg-stone-50 min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-6 md:px-12">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="font-serif text-3xl md:text-4xl text-stone-900">
              {language === 'zh' ? '创造者模式' : 'Creator Mode'}
            </h1>
            <p className="text-stone-500 mt-2">
              {language === 'zh'
                ? '工厂操作员入口：上传新产品至前台展示'
                : 'Factory Operator Portal: Upload new products to catalog'}
            </p>
          </div>

          <button
            onClick={handleClearHistory}
            className="text-stone-400 text-xs font-bold uppercase tracking-widest hover:text-red-700 flex items-center transition-colors"
          >
            <Trash2 size={14} className="mr-2" /> {language === 'zh' ? '清除本地缓存' : 'Clear Local Cache'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left: Input Form */}
          <div className="bg-white p-8 md:p-12 border border-stone-200 shadow-xl relative">
            
            {/* Loading Overlay */}
            {submitting && (
                <div className="absolute inset-0 bg-white/80 z-20 flex flex-col items-center justify-center">
                    <Loader2 size={48} className="text-[#a16207] animate-spin mb-4" />
                    <span className="text-stone-900 font-bold uppercase tracking-widest">
                        {language === 'zh' ? '正在发布...' : 'Publishing...'}
                    </span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Category Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                    {language === 'zh' ? '主分类' : 'Category'}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData(prev => ({
                        ...prev,
                        categoryId: e.target.value,
                        subCategoryName:
                          categories.find(c => c.id === e.target.value)?.subCategories[0].name || ''
                      }))
                    }
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>
                        {language === 'zh' ? c.title_zh : c.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                    {language === 'zh' ? '子分类' : 'Sub-Category'}
                  </label>
                  <select
                    value={formData.subCategoryName}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, subCategoryName: e.target.value }))
                    }
                    className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none"
                  >
                    {subCategories.map((sc, idx) => (
                      <option key={idx} value={sc.name}>
                        {language === 'zh' ? sc.name_zh : sc.name}
                      </option>
                    ))}
                  </select>
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
                <label className="block text-xs uppercase tracking-wider text-stone-500 mb-2 font-bold">
                  {language === 'zh' ? '产品图片' : 'Product Image'} <span className="text-red-400">*</span>
                </label>

                {/* Clickable Area */}
                <div
                  className={`border-2 border-dashed ${formData.image ? 'border-[#a16207] bg-amber-50/20' : 'border-stone-300 bg-stone-50'} p-8 text-center cursor-pointer hover:border-[#a16207] transition-all`}
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                >
                  {formData.image ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={formData.image}
                        alt="Preview"
                        className="h-40 object-contain mb-4 shadow-sm border border-stone-200"
                      />
                      <span className="text-xs text-[#a16207] font-bold uppercase tracking-wide flex items-center">
                        {uploadingImage
                          ? (language === 'zh' ? '上传中...' : 'Uploading...')
                          : (language === 'zh' ? '点击更换图片' : 'Click to Change Image')}
                         {usingOfflineMode && !uploadingImage && <span className="ml-2 px-1 bg-stone-200 text-stone-600 rounded text-[10px]">LOCAL</span>}
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-stone-400">
                       {uploadingImage ? (
                           <Loader2 size={32} className="animate-spin text-[#a16207] mb-2" />
                       ) : (
                           <Upload size={32} className="mb-2" />
                       )}
                      <span className="text-xs font-bold uppercase tracking-wider">
                        {uploadingImage
                          ? (language === 'zh' ? '上传中...' : 'Uploading...')
                          : 'Click to upload (Max 20MB)'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hidden Input outside of clickable div */}
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

              <button
                type="submit"
                disabled={submitting || uploadingImage || !formData.image}
                className="w-full bg-[#281815] text-white font-bold uppercase tracking-widest py-4 hover:bg-[#a16207] transition-colors flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {submitting ? (
                    language === 'zh' ? '发布中...' : 'Publishing...'
                ) : (
                    <>
                       {language === 'zh' ? '发布产品' : 'Publish Product'}
                       <Plus size={16} className="ml-2 group-hover:rotate-90 transition-transform" />
                    </>
                )}
              </button>

            </form>
          </div>

          {/* Right: Live Preview */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <h3 className="font-serif text-2xl text-stone-900 mb-6 border-l-4 border-[#a16207] pl-4">
                {language === 'zh' ? '实时预览' : 'Live Preview'}
              </h3>

              {/* Simulated Card from Collections Page */}
              <div className="bg-white group border border-stone-100 shadow-xl max-w-md mx-auto">
                <div className="aspect-[4/3] w-full overflow-hidden bg-stone-100 relative">
                  {formData.image ? (
                    <img
                      src={formData.image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
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
                    {language === 'zh'
                      ? formData.name_zh || '产品名称'
                      : formData.name || 'Product Name'}
                  </h3>
                  <p className="text-stone-500 text-sm leading-relaxed mb-4">
                    {language === 'zh'
                      ? formData.description_zh || '描述内容...'
                      : formData.description || 'Description goes here...'}
                  </p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-stone-100 border border-stone-200 rounded text-sm text-stone-600">
                <strong className="text-[#a16207] uppercase text-xs tracking-wider block mb-3">System Status:</strong>
                <div className="flex items-center space-x-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${usingOfflineMode ? 'bg-orange-500' : 'bg-green-500'} animate-pulse`}></span>
                    <span className="font-bold">{usingOfflineMode ? 'Local Demo Mode' : 'Cloud Connected'}</span>
                </div>
                {usingOfflineMode && (
                  <div className="text-xs text-stone-500 ml-4 border-l-2 border-stone-300 pl-2">
                    <p className="mb-1">Server connection failed. Using browser storage.</p>
                    {detailedError && <p className="text-red-400 font-mono text-[10px]">Error: {detailedError}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorPortal;