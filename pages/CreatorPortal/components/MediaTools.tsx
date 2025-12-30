
import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';
import { extractKeyFromUrl } from '../../../utils/getAssetUrl';

const MediaTools: React.FC = () => {
  const [urls, setUrls] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);

  const handleDelete = async () => {
    if (!urls.trim()) return;
    if (!confirm(
      "Are you sure? This will permanently delete these files from the server. This cannot be undone."
    )) return;

    setProcessing(true);
    setResult(null);

    const urlList = urls
      .split('\n')
      .map(u => u.trim())
      .filter(Boolean);

    const keys = urlList
      .map(extractKeyFromUrl)
      .filter((k): k is string => Boolean(k));

    if (keys.length === 0) {
      alert("No valid managed URLs found in the input.");
      setProcessing(false);
      return;
    }

    let successCount = 0;
    let failCount = 0;

    try {
      // ✅ Compliance with Frozen API v1.0 (Section 6):
      // Endpoint: admin/delete-image (no leading slash)
      // Payload: { key: "string" }
      for (const key of keys) {
        try {
          await adminFetch('admin/delete-image', {
            method: 'POST',
            body: JSON.stringify({ key }),
          });
          successCount++;
        } catch (e) {
          console.error(`Failed to delete key: ${key}`, e);
          failCount++;
        }
      }

      setResult({ success: successCount, failed: failCount });
      setUrls('');
    } catch (e) {
      console.error('Batch processing error:', e);
      setResult({ success: successCount, failed: keys.length - successCount });
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
          Manually delete unused images from the cloud storage. This tool performs 
          individual deletion requests to ensure compliance with the v1.0 API contract.
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
              className="w-full h-64 p-4 text-xs font-mono bg-stone-50 border border-stone-200
                         focus:border-red-500 focus:ring-1 focus:ring-red-200 outline-none resize-none mb-4"
              placeholder="https://cdn.peng-zhan.com/uploads/..."
            />

            {result && (
              <div className={`mb-4 text-sm flex items-center ${
                result.failed === 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {result.failed === 0
                  ? <CheckCircle size={16} className="mr-2" />
                  : <AlertTriangle size={16} className="mr-2" />
                }
                <span>
                  Successfully deleted {result.success} images.
                  {result.failed > 0 && ` Failed: ${result.failed}`}
                </span>
              </div>
            )}

            <button
              onClick={handleDelete}
              disabled={processing || !urls.trim()}
              className="w-full bg-red-600 text-white font-bold uppercase tracking-widest py-4
                         hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {processing ? (
                <>
                  Processing <Loader2 size={16} className="ml-3 animate-spin" />
                </>
              ) : 'Permanently Delete Images'}
            </button>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-amber-50 border border-amber-200 p-6 text-amber-900 text-sm leading-relaxed">
            <h4 className="font-bold uppercase tracking-widest mb-4 flex items-center">
              <Info size={16} className="mr-2" /> Operational Safety
            </h4>
            <ul className="list-disc pl-4 space-y-2">
              <li>Deletion is permanent and cannot be reversed.</li>
              <li>Only managed CDN URLs will be accepted.</li>
              <li>Processing many files may take a few moments.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaTools;
