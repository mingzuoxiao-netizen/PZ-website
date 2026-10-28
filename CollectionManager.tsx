
import React, { useState } from 'react';
import { Edit2, Save, X, LayoutGrid, Trash2 } from 'lucide-react';
import { Category } from '../../../types';
import PZImageManager from './PZImageManager';

interface CollectionManagerProps {
  categories: Category[];
  onUpdate: (cat: Category) => void;
  onDelete: (id: string) => void;
  onUpload: (file: File) => Promise<string>;
}

const CollectionManager: React.FC<CollectionManagerProps> = ({ categories, onUpdate, onDelete, onUpload }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Category>>({});

  const handleEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm({ ...cat });
  };

  const handleSave = () => {
    if (editingId && editForm.id) {
      onUpdate(editForm as Category);
      setEditingId(null);
      setEditForm({});
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8">
        <h3 className="font-serif text-2xl text-stone-900 mb-2 flex items-center">
           <LayoutGrid className="mr-3 text-amber-700" size={24} />
           Collection Management
        </h3>
        <p className="text-stone-500 text-sm max-w-3xl leading-relaxed">
          Manage titles, descriptions, and cover images for your collections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {categories.map((cat) => {
          const isEditing = editingId === cat.id;

          return (
            <div 
              key={cat.id} 
              className={`bg-white border transition-all duration-300 flex flex-col
                ${isEditing ? 'border-amber-500 ring-4 ring-amber-500/10 shadow-xl z-10' : 'border-stone-200 hover:border-stone-400 shadow-sm'}
              `}
            >
              {/* Image Section */}
              <div className="aspect-[4/3] w-full bg-stone-100 relative overflow-hidden group">
                 {isEditing ? (
                    <div className="w-full h-full p-2 bg-stone-50">
                        <PZImageManager 
                            images={editForm.image ? [editForm.image] : []}
                            onUpdate={(imgs) => setEditForm(prev => ({...prev, image: imgs[0]}))}
                            onError={(msg) => alert(msg)}
                            onUpload={onUpload}
                            maxImages={1}
                            aspectRatio={4/3}
                            className="w-full h-full"
                        />
                    </div>
                 ) : (
                    <>
                        <img src={cat.image} alt={cat.title} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button 
                            onClick={() => handleEdit(cat)}
                            className="bg-white text-stone-900 px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors flex items-center"
                            >
                            <Edit2 size={14} className="mr-2" /> Edit Collection
                            </button>
                        </div>
                    </>
                 )}
              </div>

              {/* Content Section */}
              <div className="p-6 flex-grow flex flex-col">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Title</label>
                      <input 
                        type="text" 
                        value={editForm.title || ''}
                        onChange={e => setEditForm(prev => ({...prev, title: e.target.value}))}
                        className="w-full border border-stone-200 px-3 py-2 text-sm font-serif focus:border-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-stone-400 mb-1">Description</label>
                      <textarea 
                        rows={3}
                        value={editForm.description || ''}
                        onChange={e => setEditForm(prev => ({...prev, description: e.target.value}))}
                        className="w-full border border-stone-200 px-3 py-2 text-xs focus:border-amber-500 outline-none resize-none"
                      />
                    </div>
                    
                    <div className="flex space-x-2 pt-2">
                      <button 
                        onClick={handleSave}
                        className="flex-1 bg-amber-700 text-white py-2 text-xs font-bold uppercase tracking-widest hover:bg-amber-800 flex items-center justify-center"
                      >
                        <Save size={14} className="mr-2" /> Save
                      </button>
                      <button 
                        onClick={() => setEditingId(null)}
                        className="flex-none px-3 border border-stone-200 text-stone-500 hover:text-stone-900"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="font-serif text-xl text-stone-900 mb-1">{cat.title}</h3>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">{cat.subtitle}</p>
                    <p className="text-stone-500 text-xs leading-relaxed line-clamp-3 mb-4">
                      {cat.description}
                    </p>
                    <div className="mt-auto pt-4 border-t border-stone-100 flex justify-between items-center">
                       <span className="text-[10px] text-stone-400 uppercase font-bold tracking-widest">{cat.subCategories?.length || 0} Sub-categories</span>
                       
                       <button 
                         onClick={() => {
                           if(confirm('Are you sure you want to delete this collection? Products in it will remain but may be hidden.')) onDelete(cat.id);
                         }}
                         className="text-red-400 hover:text-red-600 p-1 bg-red-50 rounded-sm hover:bg-red-100 transition-colors"
                         title="Delete Collection"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollectionManager;
