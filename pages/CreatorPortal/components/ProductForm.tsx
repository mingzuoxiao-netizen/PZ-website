import React, {useEffect, useState, useRef} from 'react';
import {ProductVariant,Category,ProductionSite} from '../../../types';
import PZImageManager from './PZImageManager';
import ProductSpecificationsEditor from './ProductSpecificationsEditor';
import {
  formatDimensionsForDisplay,readProductSpecifications,specificationIssues
} from '../../../utils/productSpecifications';
import LivePreview from './LivePreview';
import { publishReadinessIssues, publishReadinessLabels } from '../../../utils/publishReadiness';
import { preflightProduct } from '../../../utils/productPreflight.js';
import {changedProductFields,normalizeIssueField} from '../../../utils/reviewReturn.mjs';
import type {ReviewReturnDetails} from '../../../utils/reviewReturn.mjs';
import {useProductImageActions} from '../../../hooks/useProductImageActions';
import {Save,ArrowLeft,Info,Send,Loader2,Database,ClipboardList} from 'lucide-react';

interface ProductFormProps {
  initialData:Partial<ProductVariant>;
  categories:Category[];
  onSave:(data:any)=>void|Promise<void>;
  onSubmit?:(id:string,confirmedWarnings?:string[])=>Promise<void>;
  onSaveAndSubmit?:(data:any,confirmedWarnings?:string[])=>Promise<void>;
  onCheckSku?:(code:string)=>Promise<boolean>;
  returnReview?:ReviewReturnDetails|null;
  returnReviewError?:string;
  onSaveNext?:(data:any)=>Promise<void>;
  onDirtyChange?:(dirty:boolean)=>void;
  onBusyChange?:(busy:boolean)=>void;
  onCancel:()=>void;
  onUpload?:(file:File)=>Promise<string>;
  fixedCategoryId?:string;
  userRole:'ADMIN'|'FACTORY';
  lang:'en'|'zh';
}
const field='w-full min-w-0 rounded-sm border border-stone-300 bg-white p-3 text-sm text-stone-900 outline-none focus:border-stone-900';
const label='mb-2 block text-xs font-semibold text-stone-700';

const ProductForm:React.FC<ProductFormProps>=({
  initialData,categories,onSave,onSubmit,onSaveAndSubmit,onSaveNext,onCheckSku,returnReview,returnReviewError,onDirtyChange,onBusyChange,onCancel,fixedCategoryId,userRole,lang='en'
})=>{
  const T=(en:string,zh:string)=>lang==='zh'?zh:en;
  const [formData,setFormData]=useState<Partial<ProductVariant>>(initialData);
  const [submitting,setSubmitting]=useState(false);
  const [isPromoting,setIsPromoting]=useState(false);
  const [dirty,setDirty]=useState(false);
  const [formError,setFormError]=useState('');
  const [errorField,setErrorField]=useState('');
  const [skuProbe,setSkuProbe]=useState<{code:string;existing:boolean;error:boolean}>({code:'',existing:false,error:false});
  const [confirmedWarningSignature,setConfirmedWarningSignature]=useState('');
  const formRef=useRef<HTMLFormElement>(null);
  const issue=(message:string,field='')=>{setFormError(message);setErrorField(field);formRef.current?.querySelector<HTMLElement>('[name="'+field+'"]')?.focus();};
  useEffect(()=>{formRef.current?.parentElement?.scrollIntoView({block:'start'});},[initialData.id]);
  const saveIntent=useRef<'draft'|'submit'|'next'>('draft');
  useEffect(()=>{onDirtyChange?.(dirty);return ()=>onDirtyChange?.(false);},[dirty,onDirtyChange]);
  useEffect(()=>{onBusyChange?.(submitting||isPromoting);return ()=>onBusyChange?.(false);},[submitting,isPromoting,onBusyChange]);
  useEffect(()=>{
    if(!dirty||typeof window==='undefined')return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};
    window.addEventListener('beforeunload',warn);return ()=>window.removeEventListener('beforeunload',warn);
  },[dirty]);

  useEffect(()=>{
    setFormData(fixedCategoryId&&!initialData.id
      ? {...initialData,category:fixedCategoryId}:initialData);
    setDirty(false);
  },[initialData.id,fixedCategoryId]);
  const handleChange=(key:keyof ProductVariant,value:any)=>{
    setDirty(true);
    setFormData(prev=>({...prev,[key]:value}));
  };
  const currentCategory=fixedCategoryId||formData.category||'';
  const selectedCategory=categories.find(c=>c.id===currentCategory);
  const categoryLabel=[currentCategory,selectedCategory?.title||'',selectedCategory?.title_cn||''].join(' ');
  const specs=readProductSpecifications(formData.specifications);
  const normalizedSku=String(formData.code||'').trim().toUpperCase();
  const originalSku=String(initialData.code||'').trim().toUpperCase();
  const skuNeedsCheck=!!onCheckSku&&/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(normalizedSku) &&
    (!initialData.id||normalizedSku!==originalSku);
  useEffect(()=>{
    if(!skuNeedsCheck){setSkuProbe({code:'',existing:false,error:false});return;}
    let current=true;
    const handle=setTimeout(()=>{
      onCheckSku!(normalizedSku).then(existing=>{
        if(current)setSkuProbe({code:normalizedSku,existing,error:false});
      }).catch(()=>{
        if(current)setSkuProbe({code:normalizedSku,existing:false,error:true});
      });
    },400);
    return()=>{current=false;clearTimeout(handle);};
  },[normalizedSku,skuNeedsCheck,onCheckSku]);
  const previewSpecifications={
    ...specs, media_roles:{...(specs.media_roles||{}),
      ...(formData.images?.[0]?{[formData.images[0]]:'main' as const}:{})}
  };
  const preflight=preflightProduct({...formData,specifications:previewSpecifications,category:currentCategory,code:normalizedSku},{
    existingSku:skuNeedsCheck&&skuProbe.code===normalizedSku&&skuProbe.existing
  });
  const warningSignature=JSON.stringify({
    warnings:preflight.warnings.map(x=>x.code+':'+x.field).sort(),
    values:[formData.name,specs.dimensions_cm,specs.attributes,formData.images]
  });
  const warningsAcknowledged=preflight.warnings.length===0||confirmedWarningSignature===warningSignature;
  const warningCodes=preflight.warnings.map(x=>x.code);
  const changesSinceReturn=returnReview?.baseline&&Object.keys(returnReview.baseline).length?
    changedProductFields(returnReview.baseline,{...formData,specifications:previewSpecifications}):[];
  const hasReturnChange=(field:string)=>changesSinceReturn.some(key=>
    key===field||key.startsWith(field+'.')||field==='images'&&key.startsWith('media_roles.'));
  const jumpToField=(raw:string)=>{
    const fieldName=normalizeIssueField(raw);
    let target=formRef.current?.querySelector<HTMLElement>('[name="'+fieldName+'"]')||
      formRef.current?.querySelector<HTMLElement>('[data-preflight-field="'+fieldName+'"]');
    if(!target&&fieldName.startsWith('media_roles'))target=formRef.current?.querySelector<HTMLElement>('[data-preflight-field="images"]');
    const collapsible=target?.closest('details') as HTMLDetailsElement|null;
    if(collapsible)collapsible.open=true;
    target?.focus();target?.scrollIntoView({block:'center',behavior:'smooth'});
  };
  const sizePreview=formatDimensionsForDisplay(specs,categoryLabel)||formData.size||'';
  const changeSpecs=(next:typeof specs)=>{
    setDirty(true);
    setFormData(prev=>{
      const prior=readProductSpecifications(prev.specifications);
      const hadStructured=!!formatDimensionsForDisplay(prior,categoryLabel);
      const derived=formatDimensionsForDisplay(next,categoryLabel);
      return {...prev,specifications:next,size:derived??(hadStructured?'':prev.size||'')};
    });
  };
  const toggleProductionSite=(site:ProductionSite)=>{
    setDirty(true);
    setFormData(prev=>{
      const selected=prev.production_sites||[];
      return {...prev,production_sites:selected.includes(site)
        ?selected.filter(v=>v!==site):[...selected,site]};
    });
  };
  const {removeImage,reorderImages,setMainImage,uploadImage}=useProductImageActions({
    images:formData.images||[],
    setImages:(images)=>{
      setDirty(true);
      setFormData(previous=>{
        const previousSpecs=readProductSpecifications(previous.specifications);
        const roles={...(previousSpecs.media_roles||{})};
        const first=images[0];
        if(first){
          for(const key of Object.keys(roles))if(key!==first&&roles[key]==='main')delete roles[key];
          roles[first]='main';
        }
        return {...previous,images,specifications:{...previousSpecs,media_roles:roles}};
      });
    }
  });
  const save=async(e:React.FormEvent)=>{
    e.preventDefault();
    const intent=saveIntent.current;saveIntent.current='draft';
    if(submitting||isPromoting)return;
    setFormError('');setErrorField('');
    const code=String(formData.code||'').trim().toUpperCase();
    const categoryId=currentCategory;
    if(!formData.id&&(!categoryId||!categories.some(c=>c.id===categoryId))){
      issue(T('Select a valid category.','请选择有效的产品分类。'),'category');return;
    }
    if(!String(formData.name||'').trim()){
      issue(T('An English product name is required.','请填写产品英文名称。'),'name');return;
    }
    if(!formData.id&&!code){
      issue(T('SKU is required.','新建产品必须填写 SKU。'),'code');return;
    }
    if(code&&!/^PZ-[A-Z0-9][A-Z0-9_-]{1,39}$/.test(code)){
      issue(T('SKU must begin with PZ- and use 2–40 letters/numbers/hyphens.','SKU 必须以 PZ- 开头，后续使用 2–40 位字母、数字、横线或下划线。'),'code');return;
    }
    if(intent==='submit'){
      if(preflight.errors.length){
        issue(T('Resolve preflight errors: ','请先修正预检错误：')+
          preflight.errors.map(x=>x[lang]).join(lang==='zh'?'；':'; '),preflight.errors[0].field);
        return;
      }
      if(!warningsAcknowledged){
        issue(T('Confirm the listed warnings before submitting.','提交前请确认预检提醒。'));
        return;
      }
      if(skuNeedsCheck){
        try{
          if(await onCheckSku!(code)){issue(T('SKU already exists.','SKU 已存在。'),'code');return;}
        }catch{issue(T('SKU lookup unavailable; submission blocked.','SKU 查重不可用，已阻止提交。'),'code');return;}
      }
      const missing=publishReadinessIssues({...formData,category:categoryId,code},categoryLabel);
      if(missing.length){
        issue(T('Cannot submit for review. Complete: ','提交审核前请补全：')+
          missing.map(key=>publishReadinessLabels[key][lang]).join(lang==='zh'?'、':', '));
        return;
      }
    }
    const validation=specificationIssues(specs);
    if(validation.length){
      issue(T('Correct the technical data: ','请修正技术数据：')+validation.join('；'));return;
    }
    setSubmitting(true);
    try{
      const finalStatus=formData.status||'draft';
      const persist=intent==='submit'&&onSaveAndSubmit?onSaveAndSubmit:intent==='next'&&onSaveNext?onSaveNext:onSave;
      const record={
        ...formData,category:categoryId,code,
        size:formatDimensionsForDisplay(specs,categoryLabel)||sizePreview,
        specifications:previewSpecifications,status:finalStatus,
        is_published:finalStatus==='published'?1:0
      };
      if(intent==='submit'&&onSaveAndSubmit)await onSaveAndSubmit(record,warningCodes);
      else await persist(record);
      setDirty(false);
    }catch(error:any){
      issue(T('Operation incomplete: ','操作未完成：')+(error?.message||T('Unknown error','未知错误')));
    }finally{setSubmitting(false);}
  };
  const submitReview=async()=>{
    if(!formData.id||!onSubmit||dirty)return;
    if(preflight.errors.length){
      issue(T('Resolve preflight errors: ','请先修正预检错误：')+
        preflight.errors.map(x=>x[lang]).join(lang==='zh'?'；':'; '),preflight.errors[0].field);
      return;
    }
    if(!warningsAcknowledged){issue(T('Confirm the warnings before submission.','请先确认预检提醒。'));return;}
    if(skuNeedsCheck){
      try{if(await onCheckSku!(normalizedSku)){issue(T('SKU already exists.','SKU 已存在。'),'code');return;}}
      catch{issue(T('SKU lookup unavailable; submission blocked.','SKU 查重不可用，已阻止提交。'),'code');return;}
    }
    const missing=publishReadinessIssues({...formData,category:currentCategory},categoryLabel);
    if(missing.length){
      const fields=missing.map(key=>publishReadinessLabels[key][lang]).join(lang==='zh'?'、':', ');
      issue(T('Cannot submit for review. Complete: ','提交审核前请补全：')+fields);
      return;
    }
    if(!window.confirm(T('Submit this saved draft for supervisor review?','确认将已保存的草稿提交主管初审吗？')))return;
    setIsPromoting(true);
    try{await onSubmit(formData.id,warningCodes);}
    catch(error:any){issue(T('Submission failed: ','提交失败：')+(error?.message||''));}
    finally{setIsPromoting(false);}
  };
  const canPromote=userRole==='FACTORY'&&!!onSubmit&&!!formData.id&&
    ['draft','rejected','returned_to_uploader'].includes(formData.status||'');
  const mediaRoles=previewSpecifications.media_roles||{};
  const changeRole=(url:string,role:string)=>changeSpecs({
    ...specs,media_roles:{...mediaRoles,[url]:role as typeof mediaRoles[string]}
  });
  const sectionTitle=(number:string,en:string,zh:string,helper?:string)=>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-stone-100 text-xs font-bold">{number}</span>
        <h4 className="text-sm font-bold text-stone-900">{T(en,zh)}</h4>
      </div>
      {helper&&<span className="text-xs text-stone-500">{helper}</span>}
    </div>;

  return <div className="grid grid-cols-1 gap-8 pb-20 lg:grid-cols-12">
    <div className="lg:col-span-8">
      <div className="overflow-hidden rounded-sm border border-stone-200 bg-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3"><ClipboardList size={18}/>
            <h3 className="text-sm font-semibold">{T('Product editor','产品资料编辑')}</h3>
          </div>
          <span className="text-xs text-stone-300">{T('Save first · submit for review second','保存草稿，或保存后提交主管初审')}</span>
        </div>
        <form ref={formRef} onSubmit={save} className="space-y-8 px-5 py-7 md:px-8">
          {formError&&<div role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">
            {formError}
            {errorField&&<button type="button" onClick={()=>formRef.current?.querySelector<HTMLElement>('[name="'+errorField+'"]')?.focus()}
              className="ml-3 underline">定位需修改字段</button>}
          </div>}
          {returnReviewError&&<div role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{returnReviewError}</div>}
          {returnReview&&<section aria-label="字段退回修改要求" className="rounded border border-amber-300 bg-amber-50 p-4" data-testid="field-return-panel">
            <h4 className="font-semibold text-amber-950">本次退回需要修改的字段</h4>
            {!!returnReview.return_reason&&<p className="mt-1 text-sm text-amber-900">整体备注：{returnReview.return_reason}</p>}
            {returnReview.issues.length? <ul className="mt-3 space-y-2">
              {returnReview.issues.map((item,i)=><li key={item.field+'-'+i}>
                <button type="button" onClick={()=>jumpToField(item.field)}
                  className="text-left text-sm text-amber-950 underline">
                  {item.field}：{item.message}
                </button>
                {hasReturnChange(item.field)&&<span className="ml-2 rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">已修改</span>}
              </li>)}
            </ul> : <p className="mt-2 text-sm text-amber-900">历史退回记录仅有文字说明，请按照备注修改。</p>}
            {changesSinceReturn.length>0&&<div className="mt-3 text-xs text-emerald-900">
              自退回后已变更：{changesSinceReturn.join('、')}
            </div>}
          </section>}
          {userRole==='FACTORY'&&<section aria-label={T('Machine preflight','机器预检')} className="rounded border border-stone-200 bg-stone-50 p-4" data-testid="pz-preflight-panel">
            <h4 className="text-sm font-bold">{T('Machine preflight','机器预检')}</h4>
            <p className="mt-1 text-xs text-stone-600">{T('Drafts can be saved incomplete. Clear hard errors before review submission.','草稿可以不完整保存，提交审核前必须修正全部错误。')}</p>
            {skuNeedsCheck&&skuProbe.code===normalizedSku&&skuProbe.error&&<p className="mt-2 text-xs text-red-700">{T('SKU lookup unavailable; submissions will be blocked.','SKU 查重不可用，提交将被阻止。')}</p>}
            {preflight.errors.length===0&&<p className="mt-2 text-xs text-green-800">{T('No required-field issues.','必填项已通过。')}</p>}
            <ul className="mt-2 space-y-1">{preflight.errors.map((item,i)=>
              <li key={item.code+'-'+item.field+'-'+i}>
                <button type="button" className="text-left text-xs text-red-800 underline"
                  onClick={()=>{
                    jumpToField(item.field);
                  }}>
                  {item[lang]}
                </button>
              </li>)}</ul>
            {preflight.warnings.length>0&&<div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-900">{T('Warnings (confirm before submitting)','预警（提交前需要确认）')}</p>
              <ul className="mt-2 space-y-1">{preflight.warnings.map((item,i)=>
                <li key={item.code+'-'+i} className="text-xs text-amber-900">{item[lang]}</li>)}</ul>
              <button type="button" onClick={()=>setConfirmedWarningSignature(warningSignature)}
                className="mt-3 rounded border border-amber-700 px-3 py-1.5 text-xs text-amber-900">
                {warningsAcknowledged?T('Warnings confirmed','已确认预警'):T('Confirm and continue','确认并继续')}
              </button>
            </div>}
          </section>}
          <section aria-label={T('Basic information','基本信息')}>
            {sectionTitle('01','Basic product information','产品基本信息',T('Core product record','产品基础档案'))}
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block"><span className={label}>{T('Product category *','产品分类 *')}</span>
                {fixedCategoryId
                  ?<div className={field+' bg-stone-100'}>{selectedCategory?(lang==='zh'?(selectedCategory.title_cn||selectedCategory.title_zh||selectedCategory.title):selectedCategory.title):currentCategory}</div>
                  :<select name="category" required className={field} value={formData.category||''} onChange={e=>handleChange('category',e.target.value)}>
                    <option value="">{T('Select category','请选择分类')}</option>
                    {categories.map(c=><option key={c.id} value={c.id}>
                      {lang==='zh'?(c.title_cn||c.title_zh||c.title):c.title}
                    </option>)}
                  </select>}
              </label>
              <label className="block"><span className={label}>{T('Subcategory / product series','子分类 / 产品系列')}</span>
                <input name="sub_category" className={field+(hasReturnChange('sub_category')?' ring-2 ring-emerald-400':'')} value={formData.sub_category||''}
                  onChange={e=>handleChange('sub_category',e.target.value)}
                  placeholder={T('e.g. Marlow','例如：Marlow 系列')}/>
              </label>
              <label className="block"><span className={label}>{T('SKU *','SKU 编号 *')}</span>
                <div className="flex">
                  <span className="flex items-center border border-r-0 border-stone-300 bg-stone-100 px-3 text-xs font-bold text-stone-600">PZ-</span>
                  <input name="code" className={field+' rounded-l-none font-mono'} value={(formData.code||'').replace(/^PZ-/,'')}
                    onChange={e=>handleChange('code','PZ-'+e.target.value.toUpperCase())}
                    placeholder="DINING-001"/>
                </div>
              </label>
              <label className="block"><span className={label}>{T('Color / color code','颜色 / 色号')}</span>
                <input className={field} value={specs.color||''}
                  onChange={e=>changeSpecs({...specs,color:e.target.value})}
                  placeholder={T('Natural Oak','原木色')}/>
              </label>
              <label className="block"><span className={label}>{T('English product name *','产品英文名称 *')}</span>
                <input name="name" className={field+(hasReturnChange('name')?' ring-2 ring-emerald-400':'')} required value={formData.name||''}
                  onChange={e=>handleChange('name',e.target.value)}
                  placeholder="Marlow Solid Oak Dining Table"/>
              </label>
              <label className="block"><span className={label}>{T('Chinese product name','产品中文名称')}</span>
                <input name="name_cn" className={field} value={formData.name_cn||''}
                  onChange={e=>handleChange('name_cn',e.target.value)}/>
              </label>
              <label className="block"><span className={label}>{T('Primary material','主要材料')}</span>
                <input name="material" className={field+(hasReturnChange('material')?' ring-2 ring-emerald-400':'')} value={formData.material||''}
                  onChange={e=>handleChange('material',e.target.value)}
                  placeholder={T('Solid white oak','白橡木实木')}/>
              </label>
              <label className="block"><span className={label}>{T('Surface finish','表面处理')}</span>
                <input name="finish" className={field+(hasReturnChange('finish')?' ring-2 ring-emerald-400':'')} value={formData.finish||''}
                  onChange={e=>handleChange('finish',e.target.value)}
                  placeholder={T('Water-based matte lacquer','水性哑光漆')}/>
              </label>
            </div>
            <fieldset className="mt-5 rounded border border-stone-200 bg-stone-50 p-4">
              <legend className="px-1 text-xs font-semibold">{T('Available production sites','可生产工厂')}</legend>
              <div className="flex flex-wrap gap-6">
                {([['zhaoqing','肇庆 · 中国'],['cambodia','干丹 · 柬埔寨']] as const).map(([site,name])=>
                  <label key={site} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={(formData.production_sites||[]).includes(site)}
                      onChange={()=>toggleProductionSite(site)}/>{name}
                  </label>)}
              </div>
            </fieldset>
            <details className="mt-5 rounded border border-stone-200 p-4">
              <summary className="cursor-pointer text-sm font-semibold">{T('Product descriptions (English / Chinese)','产品描述（中英文，可展开填写）')}</summary>
              <div className="mt-4 space-y-3">
                <label className="block"><span className={label}>{T('English description','英文描述')}</span>
                  <textarea name="description" className={field+(hasReturnChange('description')?' ring-2 ring-emerald-400':'')} rows={3} value={formData.description||''}
                    onChange={e=>handleChange('description',e.target.value)}
                    placeholder={T('Briefly describe product design and benefits.','简洁描述产品外观、功能及特点。')}/>
                </label>
                <label className="block"><span className={label}>{T('Chinese description','中文描述')}</span>
                  <textarea name="description_cn" className={field} rows={3} value={formData.description_cn||''}
                    onChange={e=>handleChange('description_cn',e.target.value)}/>
                </label>
              </div>
            </details>
          </section>

          <div className="border-t border-stone-200 pt-7">
            <ProductSpecificationsEditor category={categoryLabel}
              value={specs} onChange={changeSpecs} lang={lang}/>
            <div className="mt-4 rounded bg-stone-50 px-4 py-3 text-xs text-stone-600">
              <span className="font-semibold">{T('Website size display: ','网站尺寸展示：')}</span>
              {sizePreview||T('Enter dimensions above','请在上方填写尺寸')}
              {!formatDimensionsForDisplay(specs,categoryLabel)&&formData.size&&
                <span className="ml-2 text-amber-700">{T('(legacy text; enter numeric dimensions to replace it)','（旧版文字尺寸，填写标准尺寸后自动替换）')}</span>}
            </div>
          </div>

          <section data-preflight-field="images" tabIndex={-1} className={'border-t border-stone-200 pt-7 '+(hasReturnChange('images')?'ring-2 ring-emerald-300':'')}>
            {sectionTitle('03','Product images','产品图片',T('Existing R2 upload','沿用现有图片上传'))}
            <p className="mb-4 text-xs text-stone-600" role="note">{T(
              'Image additions, removals and ordering are draft changes. Click Save draft to persist them. Removing an image does not delete its R2 file.',
              '图片新增、移除及排序仅修改当前草稿；请点击“保存草稿”才会写入产品记录。移除图片不会删除 R2 原文件。'
            )}</p>
            <PZImageManager lang={lang} images={formData.images||[]}
              onUpdate={reorderImages} onDelete={removeImage}
              onUpload={uploadImage} onSetMain={setMainImage} onError={message=>issue(String(message))}/>
            {(formData.images||[]).length>0&&<div className="mt-5 rounded border border-stone-200 bg-stone-50 p-4">
              <h4 className="text-sm font-semibold text-stone-800">
                {T('Required: image role labels','必填：图片用途标签')}
              </h4>
              <p className="mb-4 text-xs text-stone-500">{T(
                'The first image is always the main image; change its order above.',
                '第 1 张图自动是主图；想换主图请在上方图片管理器调整顺序。')}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(formData.images||[]).map((url,i)=>
                  <div key={url} className="flex min-w-0 items-center gap-3 rounded border border-stone-200 bg-white p-2">
                    <img src={url} alt="" className="h-14 w-14 shrink-0 rounded object-cover"/>
                    <label className="min-w-0 flex-1">
                      <span className={label}>{T('Image','图片')} {i+1}</span>
                      <select className={field} disabled={i===0}
                        value={i===0?'main':(mediaRoles[url]||'')}
                        onChange={e=>changeRole(url,e.target.value)}>
                        <option value="">{T('Choose role','选择用途')}</option>
                        {i===0&&<option value="main">{T('Main','主图')}</option>}
                        <option value="lifestyle">{T('Lifestyle','场景图')}</option>
                        <option value="detail">{T('Detail','细节图')}</option>
                        <option value="dimension">{T('Dimension diagram','尺寸图')}</option>
                        <option value="material">{T('Material','材质图')}</option>
                        <option value="packaging">{T('Packaging','包装图')}</option>
                      </select>
                    </label>
                  </div>)}
              </div>
            </div>}
          </section>

          <details className="border-t border-stone-200 pt-7">
            <summary className="cursor-pointer rounded border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-800">
              {T('Additional: packaging, assembly and care','补充信息：包装、组装与保养（按需展开）')}
            </summary>
            <div className="pt-4">
              <ProductSpecificationsEditor mode="factory"
                category={categoryLabel} value={specs} onChange={changeSpecs} lang={lang}/>
            </div>
          </details>
          <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-6">
            <button type="button" disabled={submitting||isPromoting} onClick={()=>{if(!onDirtyChange&&dirty&&!window.confirm(T('Leave without saving?','当前资料尚未保存，确认离开吗？')))return;onCancel();}}
              className="flex items-center gap-2 rounded border border-stone-300 px-4 py-3 text-sm">
              <ArrowLeft size={16}/>{T('Back','返回')}
            </button>
            <button type="submit" onClick={()=>{saveIntent.current='draft';}} disabled={submitting||isPromoting}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-stone-900 px-5 py-3 font-semibold text-white disabled:opacity-50">
              {submitting?<Loader2 className="animate-spin" size={16}/>:<Save size={16}/>}
              {T('Save draft','保存草稿')}
            </button>
            {userRole==='FACTORY'&&onSaveAndSubmit&&<button type="submit" disabled={submitting||isPromoting||preflight.errors.length>0||!warningsAcknowledged}
              onClick={()=>{saveIntent.current='submit';}} className="rounded bg-amber-800 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40">
              保存并提交审核
            </button>}
            {userRole==='FACTORY'&&onSaveNext&&<button type="submit" disabled={submitting||isPromoting}
              onClick={()=>{saveIntent.current='next';}} className="rounded border border-stone-300 px-5 py-3 text-sm disabled:opacity-40">
              保存并新建下一款
            </button>}
            {canPromote&&!onSaveAndSubmit&&<button type="button" disabled={submitting||isPromoting||dirty||preflight.errors.length>0||!warningsAcknowledged}
              onClick={submitReview}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-amber-800 px-5 py-3 font-semibold text-white disabled:opacity-40">
              {isPromoting?<Loader2 className="animate-spin" size={16}/>:<Send size={16}/>}
              {T('Submit for review','提交审核')}
            </button>}
            {dirty&&canPromote&&!onSaveAndSubmit&&<p className="w-full text-xs text-amber-700">
              {T('You have unsaved changes. Save the draft before submitting.',
                '你修改了资料，请保存草稿，或保存后提交主管初审。')}</p>}
            {userRole==='FACTORY'&&!formData.id&&!onSaveAndSubmit&&<p className="w-full text-xs text-stone-500">
              {T('For a new SKU, save the draft first and then submit it from the product list.',
                '新建产品请先保存草稿，再从产品列表提交审核。')}</p>}
          </div>
        </form>
      </div>
    </div>

    <aside className="lg:col-span-4">
      <div className="sticky top-20">
        <div className="flex items-center gap-2 bg-stone-900 px-5 py-3 text-sm font-semibold text-white">
          <Database size={16}/>{T('Product preview','产品预览')}
        </div>
        <div className="border border-stone-200 bg-stone-50 p-2">
          <LivePreview formData={{...formData,size:sizePreview}} lang={lang}/>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded border border-stone-200 bg-stone-50 p-4">
          <Info size={17} className="mt-0.5 shrink-0 text-stone-500"/>
          <p className="text-xs leading-5 text-stone-600">{T(
            'Factory packing data and technical details are internal. Public information is released only after normal supervisor/admin approval and explicit publication.',
            '包装与技术内部资料不会自动公开。公开产品信息仍须经过主管初审、管理员终审及独立发布。')}</p>
        </div>
      </div>
    </aside>
  </div>;
};
export default ProductForm;

