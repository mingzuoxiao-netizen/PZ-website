"""Regression gate for simplified no-duplicate PZ product editor, no network."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
form=(root/'pages/CreatorPortal/components/ProductForm.tsx').read_text()
spec=(root/'pages/CreatorPortal/components/ProductSpecificationsEditor.tsx').read_text()
preview=(root/'pages/CreatorPortal/components/LivePreview.tsx').read_text()
utils=(root/'utils/productSpecifications.ts').read_text()
public=(root/'worker-patches/production-worker-category-governance-REVIEW.js').read_text()

assert 'formatDimensionsForDisplay(specs,categoryLabel)' in form
assert "handleChange('size'" not in form, "Two editable product size sources"
assert "onChange={e=>handleChange('material'" in form
assert "onChange={e=>handleChange('finish'" in form
assert 'onChange={e=>changeSpecs({...specs,color:e.target.value})}' in form
assert 'onChange={e=>handleChange(\'sub_category\'' in form
assert "series_id" not in spec, "Redundant second product-series field"
assert "selling_points_en" not in spec, "Redundant second marketing description"
assert 'dimensionFieldsForCategory(category)' in spec
assert 'isSurfacePanelCategory(category)' in spec
assert 'spec.materials||[]' in spec, "Part-level detail remains available"
assert 'mode=\'factory\'' in form or 'mode="factory"' in form, "Factory section must be separate"
assert form.index('PZImageManager lang=') < form.index('mode="factory"')
assert form.index('ProductSpecificationsEditor category=') < form.index('PZImageManager lang=')
assert 'mediaRoles[url]' in form and 'PZImageManager' in form
assert "media_roles" not in spec, "Image classification must live alongside image manager"
assert "可选公开" not in spec+form
assert "建议公开" not in spec+form
assert "添加附件" not in spec+form
assert "添加验证项目" not in spec+form
assert "Net weight" in spec and "Gross weight" in spec
assert 'factoryPrice' not in form and '零售价' not in form
assert 'const PZ_PUBLIC_COLUMNS' not in public or 'specs_json' not in public.split('var PZ_PUBLIC_COLUMNS = ',1)[1].split(';',1)[0]
assert 'formatDimensionsForDisplay' in utils
assert "Packing, assembly and product care" in spec
assert "包装毛重" in spec and "使用警告 / 使用限制" in spec
assert "附件上传" not in spec and "lab reports" not in spec
assert 'role="tablist"' in preview and "mode==='factory'" in preview
assert "specs.packaging" in preview and "specs.warnings_en" in preview
# Public customer preview must use the exact website component, not a duplicated mock layout.
assert 'ProductDetailModal' in preview and 'displayMode="inline"' in preview
assert "not the current public website" not in preview
assert "ProductDetailModal" in (root/'components/catalog/ProductDetailModal.tsx').read_text()
assert 'specs.packaging' in preview and "mode==='factory'" in preview, "Packing remains internal only"

print("PASS: editor is four-stage, no duplicate size/series/marketing inputs, no fake public documents, safe API")
