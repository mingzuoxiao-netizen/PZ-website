import React, { useEffect, useState } from 'react';
import { factoryFetch } from '../../utils/factoryFetch';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory';
import { useLanguage } from '../../contexts/LanguageContext';
import PortalLayout from './PortalLayout';

// Sub-components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import CategoryGrid from './components/CategoryGrid';

// Fixed incomplete component and added missing export default
const FactoryWorkspace: React.FC = () => {
  const { language } = useLanguage();

  // Data
  const [localItems, setLocalItems] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>(staticCategories);

  // UI
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // UI display only
  const userName = sessionStorage.getItem('pz_user_name') || 'Factory User';

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Products
      const res = await factoryFetch<{ products?: any[] }>('factory/products?limit=500');
      const rawItems = res.products || [];
      setLocalItems(normalizeProducts(rawItems));

      // 2. Try to get categories from site-config for consistency
      const configRes = await fetch('https://pz-inquiry-api.mingzuoxiao29.workers.dev/site-config');
      if (configRes.ok) {
          const json = await configRes.json();
          const remoteConfig = json.config ?? json;
          if (remoteConfig.categories && remoteConfig.categories.length > 0) {
              setCategories(remoteConfig.categories);
          }
      }
    } catch (e) {
      console.error("Factory load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Implementation of handleSaveProduct for factory users
  const handleSaveProduct = async (product: ProductVariant) => {
    try {
      if (product.id) {
        await factoryFetch(`factory/products/${product.id}`, {
          method: 'PUT',
          body: JSON.stringify(product),
        });
      } else {
        await factoryFetch('factory/products', {
          method: 'POST',
          body: JSON.stringify(product),
        });
      }
      setEditingItem(null);
      setIsCreating(false);
      loadData();
    } catch (e: any) {
      alert(`Error saving product: ${e.message}`);
    }
  };

  // Implementation of handleUpload for factory users
  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await factoryFetch<{ url: string }>('upload-image', {
      method: 'POST',
      body: formData,
    });
    return res.url;
  };

  const filteredItems = selectedCategoryId === 'all' 
    ? localItems 
    : localItems.filter(item => item.category?.toLowerCase() === (selectedCategoryId || '').toLowerCase());

  if (loading && localItems.length === 0) {
    return (
      <PortalLayout role="FACTORY" userName={userName}>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-stone-200 border-t-amber-700 rounded-full animate-spin mb-4"></div>
          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Loading factory data...</p>
        </div>
      </PortalLayout>
    );
  }

  return (
    <PortalLayout 
      role="FACTORY" 
      userName={userName}
    >
      {editingItem || isCreating ? (
        <ProductForm
          initialData={editingItem || {}}
          categories={categories}
          onSave={handleSaveProduct}
          onCancel={() => {
            setEditingItem(null);
            setIsCreating(false);
          }}
          onUpload={handleUpload}
          fixedCategoryId={selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : undefined}
          userRole="FACTORY"
          lang={language}
        />
      ) : selectedCategoryId ? (
        <ProductList
          lang={language}
          items={filteredItems}
          categories={categories}
          categoryTitle={selectedCategoryId === 'all' ? "Master List" : (categories.find(c => c.id === selectedCategoryId)?.title || selectedCategoryId)}
          onEdit={setEditingItem}
          onCreate={() => setIsCreating(true)}
          onBack={() => setSelectedCategoryId(null)}
        />
      ) : (
        <CategoryGrid
          categories={categories}
          products={localItems}
          onSelectCategory={setSelectedCategoryId}
          onSelectAll={() => setSelectedCategoryId('all')}
        />
      )}
    </PortalLayout>
  );
};

export default FactoryWorkspace;