
import React from 'react';
import {
  Search,
  PenSquare,
  Trash2,
  Eye,
  FileText,
  Archive,
  Copy,
  ImageOff,
} from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getAssetUrl } from '../../../utils/getAssetUrl';

/* =========================
   Types
========================= */

interface ProductItem {
  id: string;
  name?: string;
  image?: string | null;
  status?: 'published' | 'draft' | 'archived';
  sub_category?: string; // Renamed
  material?: string;
  code?: string;
  size?: string; // Added size field visibility if needed
}

interface ProductListProps {
  items: ProductItem[] | null | undefined;
  onEdit: (item: ProductItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: ProductItem) => void;
  editingId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({
  items,
  onEdit,
  onDelete,
  onDuplicate,
  editingId,
  searchQuery,
  setSearchQuery,
}) => {
  const { t } = useLanguage();

  /* =========================
     Safe Guards
  ========================= */
  const safeItems = Array.isArray(items) ? items : [];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'draft':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'archived':
        return 'bg-stone-100 text-stone-500 border-stone-200';
      default:
        return 'bg-stone-100 text-stone-500 border-stone-200';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'published':
        return <Eye size={12} className="mr-1" />;
      case 'draft':
        return <FileText size={12} className="mr-1" />;
      case 'archived':
        return <Archive size={12} className="mr-1" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-stone-200 shadow-sm p-8">
      {/* ================= Header ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h3 className="font-serif text-2xl text-stone-900 flex items-center">
            {t.creator.inventory.manage}
            <span className="ml-3 text-xs text-white bg-stone-900 font-bold px-2 py-0.5 rounded-full">
              {safeItems.length}
            </span>
          </h3>
          <p className="text-stone-500 text-sm mt-1">
            {t.creator.inventory.desc}
          </p>
        </div>

        <div className="relative w-full md:w-auto md:min-w-[300px]">
          <Search
            size={16}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            placeholder={t.creator.inventory.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 pl-11 pr-4 py-3 text-sm text-stone-700 focus:outline-none focus:border-[#a16207] rounded-sm"
          />
        </div>
      </div>

      {/* ================= List ================= */}
      <div className="border border-stone-100 rounded-sm overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto bg-stone-50">
          {safeItems.length === 0 ? (
            <div className="p-12 text-center">
              <Search size={32} className="mx-auto text-stone-300 mb-3" />
              <p className="text-stone-400 text-sm">
                {t.creator.inventory.noItems}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {safeItems.map((item) => {
                const imageUrl = getAssetUrl(item.image);

                return (
                  <div
                    key={item.id}
                    className={`flex items-center p-4 bg-white hover:bg-stone-50 transition-colors
                      ${
                        editingId === item.id
                          ? 'bg-amber-50/50 border-l-4 border-amber-500'
                          : ''
                      }
                    `}
                  >
                    {/* ================= Image ================= */}
                    <div className="relative w-16 h-16 mr-6 bg-stone-100 rounded-sm overflow-hidden border border-stone-200 flex items-center justify-center">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name || 'Product image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display =
                              'none';
                          }}
                        />
                      ) : (
                        <ImageOff
                          size={20}
                          className="text-stone-400"
                        />
                      )}

                      {editingId === item.id && (
                        <div className="absolute inset-0 bg-amber-500/50 flex items-center justify-center">
                          <PenSquare size={18} className="text-white" />
                        </div>
                      )}
                    </div>

                    {/* ================= Meta ================= */}
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-bold text-stone-900 truncate">
                          {item.name || 'Untitled Product'}
                        </h4>

                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold flex items-center ${getStatusColor(
                            item.status
                          )}`}
                        >
                          {getStatusIcon(item.status)}
                          {item.status === 'published'
                            ? 'Pub'
                            : item.status === 'archived'
                            ? 'Arch'
                            : 'Draft'}
                        </span>
                      </div>

                      <div className="flex items-center text-[10px] text-stone-500 space-x-2">
                        {item.sub_category && (
                          <span className="bg-stone-100 px-2 py-0.5 rounded">
                            {item.sub_category}
                          </span>
                        )}
                        {item.material && (
                          <span className="bg-stone-100 px-2 py-0.5 rounded">
                            {item.material}
                          </span>
                        )}
                        {item.code && (
                          <span className="font-mono text-stone-400">
                            #{item.code}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ================= Actions ================= */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onDuplicate(item)}
                        className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Copy size={18} />
                      </button>

                      <button
                        onClick={() => onEdit(item)}
                        disabled={editingId === item.id}
                        className="p-2 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded disabled:opacity-50"
                      >
                        <PenSquare size={18} />
                      </button>

                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
