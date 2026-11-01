"""Regression guard for simplified admin site settings and catalog PDF upload."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
admin = (ROOT / "pages/CreatorPortal/AdminWorkspace.tsx").read_text()
basics = (ROOT / "pages/CreatorPortal/components/SiteBasicsEditor.tsx").read_text()
media = (ROOT / "pages/CreatorPortal/components/SiteMediaManager.tsx").read_text()
category = (ROOT / "pages/CreatorPortal/components/CategoryManagement.tsx").read_text()

assert "label: '网站图片管理'" in admin
assert "label: '网站基础信息'" in admin
assert "label: '网站内容配置'" not in admin
assert "activeTab === 'config'" not in admin
assert "activeTab === 'basics'" in admin
assert "onUploadPdf={uploadCatalogPdf}" in admin
assert "adminFetch<{ url: string }>('admin/upload-pdf'" in admin
assert "admin/draft/site-config" in admin
assert "liveTitle !== baseline.title" in admin
assert "liveCatalogUrl !== baseline.catalogUrl" in admin
assert "saveDraftVersioned(next," in admin
assert "publishVersioned()" in admin

assert "首页主标题" in basics
assert "产品目录 PDF" in basics
assert "application/pdf" in basics
assert "15 * 1024 * 1024" in basics
assert "PDF 上传成功" in basics
assert "onPublish()" in basics
assert "保存草稿" in basics
assert "网站图片管理" in basics
assert "setBaseline(next)" in basics

assert "const groups = [" in media
assert "{ title: '产品分类封面'" not in media
assert "category.image ?" not in media
assert "f.type === 'image'" in media
assert "分类封面" in category
assert "onUpload={onUpload}" in category

for filename in (
    "worker-patches/staging-worker-category-changes-REVIEW.js",
    "worker-patches/production-worker-category-governance-REVIEW.js",
):
    worker = (ROOT / filename).read_text()
    marker = 'if (pathname === "/admin/upload-pdf" && request.method === "POST") {'
    assert worker.count(marker) == 1, filename
    pdf = worker.split(marker, 1)[1].split('if (pathname === "/upload-image"', 1)[0]
    assert 'authorize(request, env, ["ADMIN"])' in pdf, filename
    assert 'file.size > MAX_PDF_BYTES' in pdf, filename
    assert 'file.type !== "application/pdf"' in pdf, filename
    assert 'bytes[0] !== 37' in pdf and 'bytes[4] !== 45' in pdf, filename
    assert 'env.PRODUCT_IMAGES.put(key, buffer' in pdf, filename
    assert 'contentType: "application/pdf"' in pdf, filename
    assert 'publishVersioned' not in pdf and 'site_config_state' not in pdf, filename
    assert 'Only valid JPEG, PNG or WebP images are accepted' in worker, filename

print("Site settings navigation, concurrent-draft guard, and admin-only PDF route: OK")
