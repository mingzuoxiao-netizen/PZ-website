
import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { CDN_DOMAIN } from '../../../utils/imageHelpers';
import { adminFetch } from '../../../utils/adminFetch';

const MediaTools: React.FC = () => {
  const [urls, setUrls] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const handleDelete = async () => {
    if (!urls.trim()) return;
    if (!confirm("Are you sure? This will permanently delete these files from the server. This cannot be undone.")) return;

    setProcessing(true);
    setResult(null);

    const urlList = urls.split('\n').map(u => u.trim()).filter(u => u);
    const keysToDelete: string[] = [];

    // Filter valid CDN URLs and extract keys
    urlList.forEach(url => {
        if (url.includes(CDN_DOMAIN)) {
            const key = url.replace(CDN_DOMAIN, "").replace(/^\/+/, "");
            keysToDelete.push(key);
        }
    });

    if (keysToDelete.length === 0) {
        alert("No valid CDN URLs found.");
        setProcessing(false);
        return;
    }

    try {
        await adminFetch('/delete-images', {
            method: "POST",
            body: JSON.stringify({ keys: keysToDelete })
        });
        setResult({ success: keysToDelete.length, failed: 0 });
        setUrls('');
    } catch (e) {
        console.error(e);
        setResult({ success: 0, failed: keysToDelete.length });
        alert("Failed to delete images.");
    } finally {
        setProcessing(false);
    }
  };

  return (
    <div className="animate-fade-in">
        <div className="bg-white p-8 border border-stone-200 shadow-sm mb-8">
            <h3 className="font-serif text-2xl text-stone-900 mb-4 flex items-center">
                <Trash2 className="mr-3 text-red-600" size={24} />
                Media Cleanup Tool
            </h3>
            <p className="text-stone-500 text-sm max-w-3xl leading-relaxed">
                Manually delete unused images from the cloud storage. Use this to clean up files that are no longer linked to any product or page.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
                <div className="bg-white border border-stone-200 p-6 shadow-sm">
                    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">
                        Image URLs (One per line)
                    </label>
                    <textarea 
                        value={urls}
                        onChange={(e) => setUrls(e.target.value)}
                        className="w-full h-64 p-4 text-xs font-mono bg-stone-50 border border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-200 outline-none resize-none mb-4"
                        placeholder={`https://cdn.peng-zhan.com/image1.jpg\nhttps://cdn.peng-zhan.com/image2.jpg`}
                    />
                    
                    {result && (
                        <div className={`mb-4 text-sm flex items-center ${result.success > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {result.success > 0 ? <CheckCircle size={16} className="mr-2"/> : <AlertTriangle size={16} className="mr-2"/>}
                            <span>Successfully deleted {result.success} images. {result.failed > 0 && `Failed: ${result.failed}`}</span>
                        </div>
                    )}

                    <button 
                        onClick={handleDelete}
                        disabled={processing || !urls.trim()}
                        className="w-full bg-red-600 text-white font-bold uppercase tracking-widest py-4 hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {processing ? 'Processing...' : 'Permanently Delete Images'}
                    </button>
                </div>
            </div>

            <div className="md:col-span-1">
                <div className="bg-amber-50 border border-amber-200 p-6 text-amber-900 text-sm leading-relaxed">
                    <h4 className="font-bold uppercase tracking-widest mb-4 flex items-center">
                        <Info size={16} className="mr-2"/> Important Note
                    </h4>
                    <p className="mb-4">
                        This tool deletes files directly from the Content Delivery Network (CDN).
                    </p>
                    <ul className="list-disc pl-4 space-y-2">
                        <li>Broken images will appear if you delete a file that is still being used on the website.</li>
                        <li>Only URLs starting with <strong>{CDN_DOMAIN}</strong> will be processed.</li>
                        <li>This action cannot be undone.</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MediaTools;
