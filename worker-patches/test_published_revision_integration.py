"""Phase 3 static release gate. Does not connect to Cloudflare or modify D1."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
source=(root/'worker-patches/publishedProductRevisionsCore.mjs').read_text()
migration=(root/'worker-patches/migrations/012_published_product_revisions_STAGING_REVIEW.sql').read_text()
for which in ('staging-worker-category-changes-REVIEW.js',
              'production-worker-category-governance-REVIEW.js'):
    candidate=(root/'worker-patches'/which).read_text()
    assert 'function pzPublishedProductRevisionsFetch' in candidate
    assert 'index_default.fetch = pzPublishedProductRevisionsFetch(' in candidate
    assert "validateSpecs:pzValidateTechnicalSpecs" in candidate
    assert 'imageBase:pzConfiguredImageBase' in candidate
    assert "PZ_PRODUCT_REVISIONS_ENABLED" in candidate
    assert "Revision route restricted to its configured runtime" in candidate
    expected="'staging'" if which.startswith('staging') else "'production'"
    assert "expectedRuntime:"+expected in candidate
    assert "pz_published_product_revisions" in candidate
    assert "until a separately authorized publish" in candidate
    for critical in (
        "Only the product owner can request revisions",
        "Cannot revise protected or unknown field",
        "revision is stale",
        "New image not found in R2",
        "Self-approval prohibited",
        "status='published' AND updated_at",
        "catalog refresh failed",
    ):
        assert critical.lower() in candidate.lower(), (which,critical)
    assert candidate.count("index_default.fetch = pzPublishedProductRevisionsFetch(")==1
    assert candidate.index("index_default.fetch = pzTwoStageReviewFetch(") < candidate.index(
        "index_default.fetch = pzPublishedProductRevisionsFetch(")
    # Never add the revision content to public product columns.
    part=candidate.split('var PZ_PUBLIC_COLUMNS = ',1)
    if len(part)>1: assert 'draft_json' not in part[1].split(';',1)[0]
assert "ALTER TABLE products" not in migration
assert "CREATE TABLE IF NOT EXISTS pz_published_product_revisions" in migration
assert "WHERE status NOT IN ('published','canceled')" in migration
assert "BEFORE UPDATE OF status" in migration
assert "BEFORE UPDATE OF draft_json" in migration
assert "PZ_PRODUCT_REVISIONS_ENABLED!=='true'" in source
assert "originalFetch.call(this,republish,env,ctx)" in source
print("PASS: additive Phase 3 migration, revision routes isolated, disabled by default")
