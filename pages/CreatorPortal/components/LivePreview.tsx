
import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { ProductVariant } from '../../../types';
import { resolveImage } from '../../../utils/imageResolver';

interface LivePreviewProps {
    formData: Partial<ProductVariant>;
}

const LivePreview: React.FC<LivePreviewProps> = ({ formData }) => {
    const imageUrl =
        formData.images &&
        formData.images.length > 0
            ? resolveImage(formData.images[0])
            : null;

    return (
        <div className="sticky top-24">
            <h3 className="font-serif text-lg text-stone-900 mb-4">Live Preview</h3>
            <div className="bg-white border border-stone-200 shadow-lg group">
                <div className="aspect-[4/3] w-full bg-stone-50 relative overflow-hidden flex items-center justify-center p-4">
                    {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300"><ImageIcon size={48} /></div>
                    )}
                </div>
                <div className="p-6">
                    <h4 className="font-serif text-xl text-stone-900 mb-1">{formData.name || 'Product Name'}</h4>
                    <p className="text-stone-500 text-xs uppercase tracking-widest font-bold mb-4">{formData.code || 'CODE-000'}</p>
                    <p className="text-stone-600 text-sm line-clamp-3 mb-4">{formData.description || 'Product description will appear here...'}</p>
                    <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{formData.material || 'Material'}</span>
                        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">{formData.size || 'Dimensions'}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LivePreview;
