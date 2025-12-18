
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

const FactoryWorkspace: React.FC = () => {
  const { language } = useLanguage();

  // Data
  const [localItems, setLocalItems] = useState<ProductVariant[]>([]);
  const categories: Category[] = staticCategories;

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
      // ✅ FIX: Contract Section 2/3 - Factory must use /factory/products
      const res = await factoryFetch<{ products?: any[] }>('factory/products?limit=500');
      const rawItems = res.products || [];
      setLocalItems(normalizeProducts(rawItems));
    } catch (e) {
      console.error("Factory load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveProduct = async (product: ProductVariant) => {
    try {
        // ✅ FIX: Implemented real API submission for Factory
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

        alert("Product submission saved for admin review.");
        setEditingItem(null);
        setIsCreating(false);
        loadData();
    } catch (e: any) {
        alert(`Failed to save: ${e.message}`);
    }
  };

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // ✅ FIX: Endpoint is POST /upload-image (Section 6)
    const data = await factoryFetch<{ url: string }>('upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!data.url) throw new Error("Upload failed: No URL returned");
    return data.url;
  };

  const filteredItems = selectedCategoryId
    ? localItems.filter(p => p.category?.toLowerCase() === selectedCategoryId.toLowerCase())
    : localItems;

  return (
    <PortalLayout
      role="FACTORY"
      userName={userName}
      navActions={
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest px-3 py-1 bg-stone-50 border border-stone-200 rounded-sm">
          Factory Inventory Portal
        </span>
      }
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-stone-400">
           <div className="w-8 h-8 border-4 border-stone-200 border-t-amber-700 rounded-full animate-spin mb-4"></div>
           <p className="text-xs font-bold uppercase tracking-widest">Synchronizing Inventory...</p>
        </div>
      ) : (
        <>
          {(isCreating || editingItem) ? (
            <ProductForm
              lang={language}
              initialData={editingItem || {}}
              categories={categories}
              fixedCategoryId={isCreating && selectedCategoryId && selectedCategoryId !== 'ALL_MASTER' ? selectedCategoryId : undefined}
              onSave={handleSaveProduct}
              onCancel={() => { setEditingItem(null); setIsCreating(false); }}
              onUpload={handleUpload}
              userRole="FACTORY"
            />
          ) : (
            <>
              {!selectedCategoryId ? (
                <CategoryGrid
                  categories={categories}
                  products={localItems}
                  onSelectCategory={setSelectedCategoryId}
                  onSelectAll={() => setSelectedCategoryId('ALL_MASTER')}
                />
              ) : (
                <ProductList
                  lang={language}
                  items={filteredItems}
                  categories={categories}
                  categoryTitle={
                    selectedCategoryId === 'ALL_MASTER'
                      ? 'Master Inventory'
                      : categories.find(c => c.id === selectedCategoryId)?.title
                  }
                  onBack={() => setSelectedCategoryId(null)}
                  onEdit={setEditingItem}
                  onCreate={() => setIsCreating(true)}
                />
              )}
            </>
          )}
        </>
      )}
    </PortalLayout>
  );
};

export default FactoryWorkspace;
