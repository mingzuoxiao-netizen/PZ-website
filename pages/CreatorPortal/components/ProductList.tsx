
import React from 'react';
import { Search, PenSquare, Trash2, Eye, FileText, Archive, Copy } from 'lucide-react';

interface ProductListProps {
  items: any[];
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: any) => void;
  editingId: string | null;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ items, onEdit, onDelete, onDuplicate, editingId, searchQuery, setSearchQuery }) => {

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'published': return 'bg-green-100 text-green-700 border-green-200';
        case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200';
        case 'archived': return 'bg-stone-100 text-stone-500 border-stone-200';
        default: return 'bg-stone-100 text-stone-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
        case 'published': return <Eye size={12} className="mr-1" />;
        case 'draft': return <FileText size={12} className="mr-1" />;
        case 'archived': return <Archive size={12} className="mr-1" />;
        default: return null;
    }
  };

  return (
    <div className="bg-white border border-stone-200 shadow-sm p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h3 className="font-serif text-2xl text-stone-900 flex items-center">
            Manage Inventory
            <span className="ml-3 text-xs text-white bg-stone-900 font-sans font-bold px-2 py-0.5 rounded-full">{items?.length || 0}</span>
            </h3>
            <p className="text-stone-500 text-sm mt-1">
                Search and manage your product inventory.
            </p>
        </div>

        <div className="relative w-full md:w-auto md:min-w-[300px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
            type="text" 
            placeholder="Search inventory..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 pl-11 pr-4 py-3 text-sm text-stone-700 focus:outline-none focus:border-[#a16207] shadow-sm transition-all rounded-sm"
            />
        </div>
      </div>

      <div className="border border-stone-100 rounded-sm overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto scrollbar-thin bg-stone-50">
            {!items || items.length === 0 ? (
            <div className="p-12 text-center">
                <Search size={32} className="mx-auto text-stone-300 mb-3" />
                <p className="text-stone-400 text-sm">No items found</p>
            </div>
            ) : (
            <div className="divide-y divide-stone-100">
                {items.map((item) => (
                    <div 
                    key={item.id} 
                    className={`flex items-center p-4 transition-colors group bg-white hover:bg-stone-50
                        ${editingId === item.id ? 'bg-amber-50/50 border-l-4 border-amber-500' : ''}
                    `}
                    >
                    <div className="relative w-16 h-16 flex-shrink-0 mr-6 bg-stone-100 rounded-sm overflow-hidden border border-stone-200">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />
                        {editingId === item.id && (
                        <div className="absolute inset-0 bg-amber-500/50 flex items-center justify-center">
                            <PenSquare size={20} className="text-white" />
                        </div>
                        )}
                    </div>
                    
                    <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center mb-1 flex-wrap gap-2">
                        <h4 className={`text-sm font-bold truncate ${editingId === item.id ? 'text-amber-800' : 'text-stone-900'}`}>
                            {item.name}
                        </h4>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-bold flex items-center ${getStatusColor(item.status)}`}>
                            {getStatusIcon(item.status)}
                            {item.status === 'published' ? 'Pub' : item.status === 'archived' ? 'Arch' : 'Draft'}
                        </span>
                        </div>
                        <div className="flex items-center text-[10px] text-stone-500 space-x-3">
                        <span className="bg-stone-100 px-2 py-0.5 rounded truncate max-w-[150px] font-medium text-stone-600">{item.subCategoryName}</span>
                        {item.material && <span className="bg-stone-100 px-2 py-0.5 rounded truncate max-w-[100px] font-medium text-stone-600">{item.material}</span>}
                        {item.code && <span className="font-mono text-stone-400 tracking-wide">#{item.code}</span>}
                        </div>
                    </div>
                    
                    <div className="flex space-x-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <button 
                        onClick={() => onDuplicate(item)}
                        className="p-2 rounded transition-colors text-stone-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Duplicate / Create Variant"
                        >
                        <Copy size={18} />
                        </button>
                        <button 
                        onClick={() => onEdit(item)}
                        className={`p-2 rounded transition-colors ${editingId === item.id ? 'bg-amber-200 text-amber-800' : 'text-stone-400 hover:text-[#a16207] hover:bg-amber-50'}`}
                        title="Edit"
                        disabled={editingId === item.id}
                        >
                        <PenSquare size={18} />
                        </button>
                        <button 
                        onClick={() => onDelete(item.id)}
                        className="text-stone-400 hover:text-red-600 hover:bg-red-50 p-2 rounded transition-colors"
                        title="Delete"
                        >
                        <Trash2 size={18} />
                        </button>
                    </div>
                    </div>
                ))}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProductList;
