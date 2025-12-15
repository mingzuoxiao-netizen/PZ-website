
import React from 'react';
import PZImageManager from './PZImageManager';
import { FieldType, ImageValue } from '../../../utils/siteSchema';

interface FieldInputProps {
  label: string;
  type: FieldType;
  value: any;
  onChange: (val: any) => void;
  onUpload: (file: File) => Promise<string>;
  help?: string;
}

const FieldInput: React.FC<FieldInputProps> = ({ label, type, value, onChange, onUpload, help }) => {
  
  if (type === 'image' || type === 'file') {
    const imageValue = value as ImageValue; 
    const accept = type === 'file' ? 'application/pdf' : 'image/*';

    return (
      <div className="mb-6">
        <PZImageManager
          label={label}
          images={imageValue ? [imageValue] : []}
          onUpdate={(imgs) => onChange(imgs[0] || "")}
          onError={(msg) => alert(msg)}
          onUpload={onUpload}
          maxImages={1}
          className="w-full"
          accept={accept}
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
