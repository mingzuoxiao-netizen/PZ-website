import React, { useEffect, useState, useMemo } from 'react';
import { factoryFetch } from '../../utils/factoryFetch';
import { ProductVariant, Category } from '../../types';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { categories as staticCategories } from '../../data/inventory';
import PortalLayout from './PortalLayout';
import { Package, ChevronLeft, LayoutGrid, ClipboardList, AlertCircle, Clock } from 'lucide-react';

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

  const userName = sessionStorage.getItem('pz_user_name') || '工厂操作员';

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

  // 统计数据
  const stats = useMemo(() => ({
      pending: products.filter(p => p.status === 'pending').length,
      rejected: products.filter(p => p.status === 'rejected').length,
      total: products.length
  }), [products]);

  const handleSave = async (product: ProductVariant) => {
    try {
      const method = product.id ? 'PUT' : 'POST';
      const url = product.id ? `factory/products/${product.id}` : 'factory/products';
      await factoryFetch(url, { method, body: JSON.stringify(product) });
      
      // 保存成功后返回列表页
      setEditingItem(null);
      setIsCreating(false);
      loadData();
      alert("记录已提交审核。");
    } catch (e: any) { alert(e.message); }
  };

  // 统一的返回处理函数
  const handleBack = () => {
      if (isCreating || editingItem) {
          setIsCreating(false);
          setEditingItem(null);
      } else if (selectedCategoryId) {
          setSelectedCategoryId(null);
      }
  };

  const navItems = [
    { id: 'inventory', label: '生产注册表', icon: <Package size={18} /> }
  ];

  return (
    <PortalLayout 
      role="FACTORY" 
      userName={userName} 
      navItems={navItems}
      activeTab="inventory"
      onTabChange={() => {}}
    >
      <div className="mb-8 animate-fade-in">
          {/* 导航面包屑与返回键 */}
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                  {(selectedCategoryId || isCreating || editingItem) && (
                      <button 
                        onClick={handleBack}
                        className="p-2 bg-white border border-stone-200 rounded-full hover:border-stone-900 transition-colors shadow-sm group"
                        title="返回上级"
                      >
                          <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                      </button>
                  )}
                  <div>
                      <h1 className="text-2xl font-serif text-stone-900">
                          {isCreating ? '创建新 SKU' : editingItem ? `编辑: ${editingItem.name}` : selectedCategoryId ? '系列明细' : '生产看板'}
                      </h1>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400 mt-1">
                          <span>生产终端</span>
                          <span>/</span>
                          <span className="text-stone-900">{selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.title : '全量概览'}</span>
                      </div>
                  </div>
              </div>

              {/* 顶部简易看板 (仅在非编辑状态显示) */}
              {!isCreating && !editingItem && (
                  <div className="hidden md:flex gap-6">
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3">
                          <Clock size={16} className="text-amber-500" />
                          <div>
                              <div className="text-[10px] text-stone-400 font-bold uppercase">待审核</div>
                              <div className="text-sm font-bold text-stone-900">{stats.pending}</div>
                          </div>
                      </div>
                      <div className="bg-white border border-stone-100 px-4 py-2 rounded shadow-sm flex items-center gap-3">
                          <AlertCircle size={16} className="text-red-500" />
                          <div>
                              <div className="text-[10px] text-stone-400 font-bold uppercase">需修改</div>
                              <div className="text-sm font-bold text-stone-900">{stats.rejected}</div>
                          </div>
                      </div>
                  </div>
              )}
          </div>

          <div className="h-px bg-stone-200 w-full mb-8"></div>
      </div>

      {loading && products.length === 0 ? (
        <div className="py-40 flex flex-col items-center justify-center text-stone-400">
           <Package className="animate-bounce mb-4 opacity-20" size={48} />
           <span className="text-xs font-bold font-mono tracking-widest uppercase">同步工厂实时数据中...</span>
        </div>
      ) : editingItem || isCreating ? (
            <ProductForm
              initialData={editingItem || {}}
              categories={categories}
              onSave={handleSave}
              onCancel={handleBack}
              onUpload={async (f) => {
                const fd = new FormData(); fd.append('file', f);
                const r = await factoryFetch('upload-image', { method: 'POST', body: fd });
                return r.url;
              }}
              fixedCategoryId={selectedCategoryId && selectedCategoryId !== 'all' ? selectedCategoryId : undefined}
              userRole="FACTORY"
              lang="zh"
            />
          ) : selectedCategoryId ? (
            <div className="space-y-6">
                <div className="flex justify-end">
                    <button 
                        onClick={() => setIsCreating(true)}
                        className="bg-stone-900 text-white px-6 py-3 text-xs font-bold uppercase tracking-widest hover:bg-safety-700 transition-colors shadow-lg flex items-center gap-2"
                    >
                        <ClipboardList size={16} /> 录入新产品
                    </button>
                </div>
                <ProductList
                  lang="zh"
                  items={selectedCategoryId === 'all' ? products : products.filter(i => i.category === selectedCategoryId)}
                  categories={categories}
                  onEdit={setEditingItem}
                  onCreate={() => setIsCreating(true)}
                  onRefresh={loadData}
                  onBack={handleBack}
                />
            </div>
          ) : (
            <div className="space-y-8">
                {/* 欢迎语 */}
                <div className="bg-stone-900 rounded-sm p-10 text-white relative overflow-hidden mb-8">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-serif mb-2">您好，{userName}</h2>
                        <p className="text-stone-400 text-sm max-w-lg leading-relaxed">
                            请通过下方分类进入产品注册表，录入新的生产记录或查看审核状态。所有提交的内容将进入管理员审核流程。
                        </p>
                    </div>
                    <LayoutGrid className="absolute right-[-20px] bottom-[-20px] text-white opacity-5 w-64 h-64 rotate-12" />
                </div>

                <CategoryGrid
                  categories={categories}
                  products={products}
                  onSelectCategory={setSelectedCategoryId}
                  onSelectAll={() => setSelectedCategoryId('all')}
                  onCreateCategory={() => alert("工厂账号暂无权限创建新系列，请联系管理员。")}
                />
            </div>
          )}
    </PortalLayout>
  );
};

export default FactoryWorkspace;