import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // Data
  const [localItems, setLocalItems] = useState<ProductVariant[]>([]);
  // Factory uses STATIC categories only - strictly decoupled from dynamic site config
  const categories: Category[] = staticCategories;

  // UI
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // UI display only
  const userName = sessionStorage.getItem('pz_user_name') || 'Factory';

  const loadData = async () => {
    setLoading(true);
    try {
      /**
       * ✅ IMPORTANT:
       * Backend does NOT provide /factory/products.
       * Factory must call the authenticated endpoint that exists: /admin/products
       * Backend is responsible for enforcing role restrictions.
       */
      const res = await factoryFetch<{ products?: any[] }>('/admin/products?limit=500');
      const rawItems = res.products || [];
      setLocalItems(normalizeProducts(rawItems));
    } catch (e) {
      console.error("Factory load error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

const handleSaveProduct = async (_product: ProductVariant) => {
  alert("Images uploaded successfully. Admin will review and publish.");
  setEditingItem(null);
  setIsCreating(false);
};

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    // ✅ Upload endpoint exists on backend
    const data = await factoryFetch<{ url: string }>('/upload-image', {
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
        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest px-3 py-1 bg-stone-100 rounded">
          Inventory Mode
        </span>
      }
    >
      {loading ? (
        <div className="text-center py-20 text-stone-400">Loading Factory Portal...</div>
      ) : (
        <>
          {(isCreating || editingItem) ? (
            <ProductForm
              lang={language}
              initialData={editingItem || {}}
              categories={categories}
              fixedCategoryId={isCreating && selectedCategoryId ? selectedCategoryId : undefined}
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
                      ? 'Inventory List'
                      : categories.find(c => c.id === selectedCategoryId)?.title
                  }
                  onBack={() => setSelectedCategoryId(null)}
                  onEdit={setEditingItem}
                  // onDelete restricted (Prop intentionally omitted)
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

