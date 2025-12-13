
import React from 'react';
import PZImageManager from './PZImageManager';
import { FieldType, ImageValue } from '../../../utils/siteSchema';

interface FieldInputProps {
  label: string;
  type: FieldType;
  value: any;
  onChange: (val: any) => void;
  help?: string;
}

const FieldInput: React.FC<FieldInputProps> = ({ label, type, value, onChange, help }) => {
  
  if (type === 'image') {
    // NOTE: image field currently stores single image URL (string)
    // Can be extended to object/array later without breaking schema
    const imageValue = value as ImageValue; 

    return (
      <div className="mb-6">
        <PZImageManager
          label={label}
          images={imageValue ? [imageValue] : []}
          onUpdate={(imgs) => onChange(imgs[0] || "")}
          onError={(msg) => alert(msg)}
          maxImages={1}
          className="w-full"
        />
        {help && <p className="text-[10px] text-stone-400 mt-1">{help}</p>}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <label className="block text-xs uppercase tracking-wider text-stone-500 font-bold mb-2">
        {label}
      </label>
      {type === 'textarea' ? (
        <textarea
          className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none text-sm min-h-[100px]"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="w-full bg-stone-50 border border-stone-200 text-stone-900 px-4 py-3 focus:border-[#a16207] outline-none text-sm"
          value={value || ""}
          placeholder={type === 'url' ? 'https://...' : ''}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {help && <p className="text-[10px] text-stone-400 mt-1">{help}</p>}
    </div>
  );
};

export default FieldInput;
