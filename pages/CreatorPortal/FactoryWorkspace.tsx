
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

  // We use sessionStorage for UI display only. Security is handled by AdminGuard wrapper + API Token.
  const userName = sessionStorage.getItem('pz_user_name') || 'Factory';

  const loadData = async () => {
    setLoading(true);
    try {
      // SECURITY: Use factoryFetch for safe access
      // Factory fetches products via /products (public/shared endpoint), NOT /admin/products
      // Explicitly uses factoryFetch to ensure correct token usage and endpoint targeting
      const res = await factoryFetch<{ products?: any[], data?: any[] }>('/products?limit=500');
      const rawItems = res.products || res.data || [];
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
      if (product.id) {
        await factoryFetch(`/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });
      } else {
        await factoryFetch('/products', { method: 'POST', body: JSON.stringify(product) });
      }
      setEditingItem(null);
      setIsCreating(false);
      loadData(); 
      alert("Product Submitted.");
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    // Reverted to /upload-image (no /admin prefix)
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
        {loading ? <div className="text-center py-20 text-stone-400">Loading Factory Portal...</div> : (
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
                                categoryTitle={selectedCategoryId === 'ALL_MASTER' ? 'Inventory List' : categories.find(c=>c.id===selectedCategoryId)?.title}
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
