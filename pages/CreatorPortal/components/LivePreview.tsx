
import React from 'react';
import { Image as ImageIcon, ArrowLeft } from 'lucide-react';

interface LivePreviewProps {
  formData: any;
}

const LivePreview: React.FC<LivePreviewProps> = ({ formData }) => {

  return (
    <div className="w-full">
      <h3 className="font-serif text-2xl text-stone-900 mb-6 border-l-4 border-[#a16207] pl-4">
        Live Preview
      </h3>

      <div className="w-full mx-auto shadow-2xl rounded-sm overflow-hidden">
        {/* Card Container */}
        <div className="group cursor-pointer flex flex-col h-full bg-white border border-stone-200">
          {/* Image Box */}
          <div className="aspect-[4/3] w-full bg-stone-50 relative overflow-hidden flex items-center justify-center p-4">
            {formData.image ? (
              <img 
                src={formData.image} 
                alt="Preview" 
                className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-stone-300">
                <ImageIcon size={48} />
              </div>
            )}
            
            <div className="absolute inset-0 bg-stone-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
              <span className="bg-white/90 backdrop-blur text-stone-900 px-4 py-2 text-[10px] font-bold uppercase tracking-widest shadow-sm">
                Quick View
              </span>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 flex flex-col flex-grow bg-white">
            <div className="mb-2">
              <h3 className="font-serif text-xl text-stone-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                {formData.name || 'Product Name'}
              </h3>
            </div>
            <p className="text-xs text-stone-500 line-clamp-3 leading-relaxed mb-4 flex-grow">
              {formData.description || "Premium solid wood construction."}
            </p>
            
            {/* Specs Preview */}
            {(formData.material || formData.dimensions) && (
              <div className="text-[10px] text-stone-400 mb-4 border-t border-stone-100 pt-3 space-y-1">
                {formData.material && <div className="flex justify-between"><span>Mat:</span> <span className="text-stone-600 font-medium">{formData.material}</span></div>}
                {formData.dimensions && <div className="flex justify-between"><span>Dim:</span> <span className="text-stone-600 font-medium">{formData.dimensions}</span></div>}
              </div>
            )}

            <div className="pt-4 border-t border-stone-100 flex justify-between items-center mt-auto">
              <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
                Made to Order
              </span>
              <ArrowLeft className="rotate-180 text-stone-300 group-hover:text-amber-700 transition-colors" size={14} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
