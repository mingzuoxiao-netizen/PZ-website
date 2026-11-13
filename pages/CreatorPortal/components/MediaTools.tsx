
import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react';
import { adminFetch } from '../../../utils/adminFetch';
import { extractKeyFromUrl } from '../../../utils/imageResolver';
import {useBackofficeConfirm} from '../ui/useBackofficeConfirm';
import {Toast,Button} from '../ui/BackofficeComponents';

const MediaTools: React.FC = () => {
  const {ask,confirmationDialog}=useBackofficeConfirm();
  const [urls, setUrls] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number } | null>(null);
  const [error,setError]=useState('');

  const handleDelete = async () => {
    if (!urls.trim()) return;
    if (!await ask({title:'彻底删除云端图片',description:'确认永久删除这些 R2 图片吗？此操作无法恢复，可能造成引用它们的产品失去图片。',danger:true,
      requiredText:'彻底删除',confirmLabel:'彻底删除'})) return;
    setProcessing(true);
    setResult(null);
    const urlList = urls.split('\n').map(u => u.trim()).filter(Boolean);
    const keys = urlList.map(extractKeyFromUrl).filter((k): k is string => Boolean(k));
    if (keys.length === 0) { setError('未找到有效的托管图片地址，请核对 URL。'); setProcessing(false); return; }
    let successCount = 0;
    let failCount = 0;
    for (const key of keys) {
      try {
        await adminFetch('admin/delete-image', { method: 'POST', body: JSON.stringify({ key }) });
        successCount++;
      } catch (e) { failCount++; }
    }
    setResult({ success: successCount, failed: failCount });
    setUrls('');
    setProcessing(false);
  };

  return (
    <div className="animate-fade-in">
      {confirmationDialog}
      {error&&<Toast variant="error" message={error} onClose={()=>setError('')}/>}
      <div className="mb-8 border border-stone-200 bg-white p-6">
        <h3 className="mb-3 flex items-center font-serif text-2xl text-stone-900"><Trash2 className="mr-3 text-red-700" size={24}/>云端图片清理</h3>
        <p className="text-sm leading-6 text-stone-600">只清理确认不再被引用的图片。彻底删除前请核对全部产品的图片引用。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="min-w-0 md:col-span-2"><div className="space-y-4 border border-stone-200 bg-white p-5">
          <label className="block text-sm font-semibold text-stone-700" htmlFor="pz-media-cleanup-urls">图片地址（每行一个）</label>
          <textarea id="pz-media-cleanup-urls" value={urls} onChange={e=>setUrls(e.target.value)}
            className="h-48 w-full min-w-0 resize-y rounded border border-stone-300 bg-stone-50 p-3 text-sm"
            placeholder="https://cdn.peng-zhan.com/uploads/..."/>
          {result&&<Toast variant={result.failed?'error':'success'} message={'已彻底删除 '+result.success+' 张图片；失败 '+result.failed+' 张。'}/>}
          <Button type="button" variant="danger" disabled={processing||!urls.trim()} loading={processing} onClick={()=>void handleDelete()} className="w-full">
            <Trash2 size={16}/>彻底删除图片
          </Button>
        </div></div>
        <aside className="min-w-0 border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950 md:col-span-1">
          <h4 className="mb-3 flex items-center gap-2 font-semibold"><Info size={16}/>操作安全提醒</h4>
          <ul className="list-disc space-y-2 pl-5"><li>图片删除不可恢复。</li><li>仅接受受管 CDN 地址。</li><li>操作可能需要数秒。</li></ul>
        </aside>
      </div>
    </div>
  );
};

export default MediaTools;
