"""Static regression checks for Chinese management UI and category inheritance.

Run with: python3 worker-patches/test_admin_chinese_category_entry.py
This supplements TypeScript and live Staging UI testing. It does not mutate data.
"""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
def read(relative: str) -> str:
    return (root / relative).read_text()

factory = read("pages/CreatorPortal/FactoryWorkspace.tsx")
form = read("pages/CreatorPortal/components/ProductForm.tsx")
batch = read("pages/CreatorPortal/components/BatchCreator.tsx")
product_list = read("pages/CreatorPortal/components/ProductList.tsx")
admin = read("pages/CreatorPortal/AdminWorkspace.tsx")
media = read("pages/CreatorPortal/components/SiteMediaManager.tsx")
basics = read("pages/CreatorPortal/components/SiteBasicsEditor.tsx")
schema = read("utils/siteSchema.ts")

assert factory.count("fixedCategoryId={selectedCategoryId && selectedCategoryId !== 'all'") == 1, "Batch category not inherited"
assert factory.count("fixedCategoryId={isCreating && selectedCategoryId && selectedCategoryId !== 'all'") == 1, "Single-product category not inherited"
assert "category: categoryId" in form and "const categoryId = fixedCategoryId || formData.category" in form
assert "{fixedCategoryId ? (" in form, "Single-product selector must become a read-only category"
assert "category: fixedCategoryId || selectedCategory" in batch, "Batch creation must enforce parent category"
assert "{fixedCategoryId ? (" in batch, "Batch selector must become a read-only category"
assert 'lang="zh"' in factory and 'lang="en"' not in factory, "Factory UI must use Chinese"
assert 'lang="zh"' in admin, "Admin product form/list must use Chinese"
assert "保存草稿" in form and "提交审核" in form
assert "BIRCH-001" in form and 'placeholder="PZ-XXX-000"' not in form
assert "批量发布" in product_list and "批量删除" in product_list
assert "lang=\"zh\"" in media and "lang=\"zh\"" in read("pages/CreatorPortal/components/FieldInput.tsx")
assert "网站基础信息" in basics and "首页主标题" in basics and "产品目录 PDF" in basics
assert "网站图片管理" in media and "fields.map(field" in media
assert 'label: "产品目录 PDF"' in schema
assert "暂无法读取真实操作日志" in read("pages/CreatorPortal/components/AuditTimeline.tsx")
print("PASS: nested category creation, admin Chinese labels, and UI guardrails")
