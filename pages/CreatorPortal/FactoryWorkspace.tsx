import React, { useEffect, useState } from 'react';
import { factoryFetch } from '../../utils/factoryFetch';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory';
import PortalLayout from './PortalLayout';
import { Package } from 'lucide-react';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import CategoryGrid from './components/CategoryGrid';

const FactoryWorkspace: React.FC = () => {
  const [products, setProducts] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>(staticCategories);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ProductVariant | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const userName = sessionStorage.getItem('pz_user_name') || 'Factory Operator';

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
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
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

  const navItems = [
    { id: 'inventory', label: 'Production Registry', icon: <Package size={18} /> }
  ];

  return (
    <PortalLayout 
      role="FACTORY" 
      userName={userName} 
      navItems={navItems}
      activeTab="inventory"
      onTabChange={() => {}}
    >
      {loading && products.length === 0 ? (
        <div className="py-20 text-center text-stone-400 font-mono text-xs animate-pulse uppercase tracking-[0.2em]">
           Synchronizing Production Data...
        </div>
      ) : editingItem || isCreating ? (
            <ProductForm
              initialData={editingItem || {}}
              categories={categories}
              onSave={handleSave}
              onCancel={() => { setEditingItem(null); setIsCreating(false); }}
              onUpload={async (f) => {
                const fd = new FormData(); fd.append('file', f);
                const r = await factoryFetch('upload-image', { method: 'POST', body: fd });
                return r.url;
              }}
              fixedCategoryId={selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : undefined}
              userRole="FACTORY"
              lang="en"
            />
          ) : selectedCategoryId ? (
            <ProductList
              lang="en"
              items={selectedCategoryId === 'all' ? products : products.filter(i => i.category === selectedCategoryId)}
              categories={categories}
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
          )}
    </PortalLayout>
  );
};

export default FactoryWorkspace;