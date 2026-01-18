import React, { useEffect, useState } from 'react';
import { factoryFetch } from '../../utils/factoryFetch';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory';
import PortalLayout from './PortalLayout';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import CategoryGrid from './components/CategoryGrid';
import MediaTools from './components/MediaTools';

type FactoryTab = 'inventory' | 'media';

const FactoryWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<FactoryTab>('inventory');
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const userName = sessionStorage.getItem('pz_user_name') || '工厂用户';

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await factoryFetch<{ products?: any[] }>('factory/products?limit=500');
      setProducts(normalizeProducts(res.products || []));

      const configRes = await fetch('/api/site-config');
      if (configRes.ok) {
          const json = await configRes.json();
          const remoteConfig = json.config ?? json;
          if (remoteConfig.categories?.length > 0) setCategories(remoteConfig.categories);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async (product: ProductVariant) => {
    try {
      const method = product.id ? 'PUT' : 'POST';
      const url = product.id ? `factory/products/${product.id}` : 'factory/products';
      await factoryFetch(url, { method, body: JSON.stringify(product) });
      setEditingItem(null);
      setIsCreating(false);
      loadData();
    } catch (e: any) { alert(e.message); }
  };

  const handleUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await factoryFetch<{ url: string }>('upload-image', { method: 'POST', body: formData });
    return res.url;
  };

  const filteredItems = selectedCategoryId === 'all' 
    ? products 
    : products.filter(item => item.category?.toLowerCase() === (selectedCategoryId || '').toLowerCase());

  const navActions = (
    <>
      {[
        { id: 'inventory', label: '我的库存' },
        { id: 'media', label: '媒体资源' }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => { setActiveTab(tab.id as FactoryTab); setEditingItem(null); setIsCreating(false); }}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm
            ${activeTab === tab.id ? 'bg-blue-800 text-white' : 'text-stone-400 hover:text-stone-200'}
          `}
        >
          {tab.label}
        </button>
      ))}
    </>
  );

  return (
    <PortalLayout role="FACTORY" userName={userName} navActions={navActions}>
      {loading && products.length === 0 ? (
        <div className="py-20 text-center text-stone-400 font-mono text-xs animate-pulse uppercase">
           Syncing Factory Workspace...
        </div>
      ) : activeTab === 'inventory' ? (
          editingItem || isCreating ? (
            <ProductForm
              initialData={editingItem || {}}
              categories={categories}
              onSave={handleSave}
              onCancel={() => { setEditingItem(null); setIsCreating(false); }}
              onUpload={handleUpload}
              fixedCategoryId={selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : undefined}
              userRole="FACTORY"
              lang="zh"
            />
          ) : selectedCategoryId ? (
            <ProductList
              lang="zh"
              items={filteredItems}
              categories={categories}
              categoryTitle={selectedCategoryId === 'all' ? "全部产品" : categories.find(c => c.id === selectedCategoryId)?.title}
              onEdit={setEditingItem}
              onCreate={() => setIsCreating(true)}
              onBack={() => setSelectedCategoryId(null)}
            />
          ) : (
            <CategoryGrid
              categories={categories}
              products={products}
              onSelectCategory={setSelectedCategoryId}
              onSelectAll={() => setSelectedCategoryId('all')}
            />
          )
      ) : (
          <MediaTools />
      )}
    </PortalLayout>
  );
};

export default FactoryWorkspace;