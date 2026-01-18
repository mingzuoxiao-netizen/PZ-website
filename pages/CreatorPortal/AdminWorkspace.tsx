import React, { useEffect, useState } from 'react';
import { adminFetch } from '../../utils/adminFetch';
import { normalizeProducts } from '../../utils/normalizeProduct';
import { DEFAULT_CONFIG } from '../../utils/siteConfig';
import PortalLayout from './PortalLayout';
import { 
  RefreshCw, Package, 
  LayoutGrid, Settings, Users, Activity, 
  Plus, ArrowUpCircle, Globe, Trash2
} from 'lucide-react';

// Components
import ProductList from './components/ProductList';
import ProductForm from './components/ProductForm';
import SiteConfigEditor from './components/SiteConfigEditor';
import AccountsManager from './components/AccountsManager';
import ReviewQueue from './components/ReviewQueue';
import AuditTimeline from './components/AuditTimeline';
import { extractKeyFromUrl } from '../../utils/imageResolver';

type AdminTab = 'review' | 'inventory' | 'config' | 'accounts' | 'audit';

const AdminWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('review');
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [siteConfig, setSiteConfig] = useState<any | null>(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasPendingDeploy, setHasPendingDeploy] = useState(false);

  const loadProducts = async () => {
    try {
        const res = await adminFetch<{ products: any[] }>('admin/products?limit=1000');
        setProducts(normalizeProducts(res.products || []));
    } catch (e) { console.error(e); }
  };

  const loadSiteConfig = async () => {
    try {
        const res = await adminFetch<any>('site-config');
        const remoteConfig = res.config ?? res;
        setSiteConfig({ ...DEFAULT_CONFIG, ...remoteConfig });
    } catch (e) { setSiteConfig(DEFAULT_CONFIG); }
  };

  useEffect(() => { loadProducts(); loadSiteConfig(); }, []);

  const handleSaveProduct = async (product: any) => {
    try {
        if (product.id) {
            await adminFetch(`admin/products/${product.id}`, { method: 'PUT', body: JSON.stringify(product) });
        } else {
            await adminFetch('admin/products', { method: 'POST', body: JSON.stringify(product) });
        }
        setEditingProduct(null);
        setIsCreating(false);
        setHasPendingDeploy(true);
        loadProducts();
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteImage = async (url: string) => {
      const key = extractKeyFromUrl(url);
      if (!key) return;
      try {
          await adminFetch('admin/delete-image', { method: 'POST', body: JSON.stringify({ key }) });
      } catch (e) { console.warn("Cloud cleanup failed", e); }
  };

  const handleBulkStatusChange = async (ids: string[], newStatus: string) => {
      setIsSyncing(true);
      try {
          await Promise.all(ids.map(id => 
              adminFetch(`admin/products/${id}`, { 
                  method: 'PUT', 
                  body: JSON.stringify({ status: newStatus, is_published: newStatus === 'published' ? 1 : 0 }) 
              })
          ));
          setHasPendingDeploy(true);
          loadProducts();
      } catch (e: any) { alert(`Update Error: ${e.message}`); }
      finally { setIsSyncing(false); }
  };

  const handleBulkDelete = async (ids: string[]) => {
      if (!confirm(`Permanently remove ${ids.length} entries and their associated cloud assets?`)) return;
      setIsSyncing(true);
      try {
          for (const id of ids) {
              const product = products.find(p => p.id === id);
              if (product?.images) {
                  await Promise.all(product.images.map((img: string) => handleDeleteImage(img)));
              }
              await adminFetch(`admin/products/${id}`, { method: 'DELETE' });
          }
          loadProducts();
      } catch (e: any) { alert(`Delete Error: ${e.message}`); }
      finally { setIsSyncing(false); }
  };

  const handleDeployEverything = async () => {
      if (!confirm("Initiate Global Production Deployment? This updates the public catalog.")) return;
      setIsSyncing(true);
      try {
          await adminFetch('admin/publish/products', { method: 'POST' });
          await adminFetch('admin/publish', { method: 'POST' });
          setHasPendingDeploy(false);
          alert("DEPLOYMENT SUCCESSFUL // PUBLIC SITE UPDATED");
      } catch (e: any) { alert(`Deploy Error: ${e.message}`); }
      finally { setIsSyncing(false); }
  };

  const navItems = [
    { id: 'review', label: 'Review Queue', icon: <Activity size={18} /> },
    { id: 'inventory', label: 'Master Registry', icon: <Package size={18} /> },
    { id: 'config', label: 'Site Logic', icon: <Settings size={18} /> },
    { id: 'accounts', label: 'People', icon: <Users size={18} /> },
    { id: 'audit', label: 'System Logs', icon: <LayoutGrid size={18} /> }
  ];

  return (
    <PortalLayout 
      role="ADMIN" 
      userName="System Admin" 
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={(id) => { setActiveTab(id); setEditingProduct(null); setIsCreating(false); }}
    >
      {!editingProduct && !isCreating && activeTab === 'inventory' && (
        <button 
          onClick={() => setIsCreating(true)}
          className="fixed bottom-10 right-10 bg-safety-700 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
        >
           <Plus size={32} className="group-hover:rotate-90 transition-transform" />
        </button>
      )}

      {hasPendingDeploy && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
              <div className="bg-stone-900 text-white px-8 py-4 rounded-full shadow-2xl border border-white/10 flex items-center gap-8 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] whitespace-nowrap">Uncommitted Changes</span>
                  </div>
                  <button 
                    onClick={handleDeployEverything}
                    disabled={isSyncing}
                    className="bg-white text-stone-900 px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-safety-700 hover:text-white transition-all flex items-center gap-2"
                  >
                    {isSyncing ? <RefreshCw className="animate-spin" size={14}/> : <ArrowUpCircle size={14}/>}
                    Push to Production
                  </button>
              </div>
          </div>
      )}

      <div className="pb-32">
          {activeTab === 'review' && <ReviewQueue products={products.filter(p => p.status === 'pending')} onProcess={async (id, action) => {
              await adminFetch(`admin/products/${id}`, { method: 'PUT', body: JSON.stringify({ status: action === 'approve' ? 'published' : 'rejected' }) });
              setHasPendingDeploy(true);
              loadProducts();
          }} />}

          {activeTab === 'inventory' && (
            editingProduct || isCreating ? (
                <ProductForm 
                  initialData={editingProduct || {}} 
                  categories={siteConfig?.categories || DEFAULT_CONFIG.categories}
                  onSave={handleSaveProduct}
                  onCancel={() => { setEditingProduct(null); setIsCreating(false); }}
                  onUpload={async (f) => {
                    const fd = new FormData(); fd.append('file', f);
                    const r = await adminFetch('upload-image', { method: 'POST', body: fd });
                    return r.url;
                  }}
                  userRole="ADMIN" lang="en"
                />
            ) : (
                <ProductList 
                    items={products} 
                    categories={siteConfig?.categories || DEFAULT_CONFIG.categories} 
                    onEdit={setEditingProduct} 
                    onCreate={() => setIsCreating(true)} 
                    onBack={() => {}} 
                    onBulkStatusChange={handleBulkStatusChange}
                    onBulkDelete={handleBulkDelete}
                    onDelete={async (id) => {
                        if(confirm("Delete this SKU and its media?")) {
                            const p = products.find(x => x.id === id);
                            if (p?.images) await Promise.all(p.images.map((i: string) => handleDeleteImage(i)));
                            await adminFetch(`admin/products/${id}`, { method: 'DELETE' });
                            loadProducts();
                        }
                    }}
                    lang="en" 
                />
            )
          )}

          {activeTab === 'config' && (
            <SiteConfigEditor
              config={siteConfig}
              onChange={setSiteConfig}
              onSave={async () => {
                 setIsSavingConfig(true);
                 try {
                    await adminFetch('site-config', { method: 'PUT', body: JSON.stringify(siteConfig) });
                    setHasPendingDeploy(true);
                    loadSiteConfig();
                 } catch(e: any) { alert(e.message); }
                 finally { setIsSavingConfig(false); }
              }}
              onPublish={handleDeployEverything}
              isSaving={isSavingConfig}
              onRefresh={loadSiteConfig}
              onUpload={async (f) => {
                const fd = new FormData(); fd.append('file', f);
                const r = await adminFetch('upload-image', { method: 'POST', body: fd });
                return r.url;
              }}
            />
          )}

          {activeTab === 'accounts' && <AccountsManager />}
          {activeTab === 'audit' && <AuditTimeline />}
      </div>
    </PortalLayout>
  );
};

export default AdminWorkspace;