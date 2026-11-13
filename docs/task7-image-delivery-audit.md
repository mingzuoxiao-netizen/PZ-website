# Task 7 image delivery — release evidence and static hotlink inventory

## CDN sizing release gate

The image resolver can construct official Cloudflare Image Resizing URLs on `cdn.peng-zhan.com`, but **does not enable them by default**. First confirm the CDN zone's `/cdn-cgi/image/width=400,quality=80,format=auto/uploads/...` endpoint returns a valid image, not a 4xx/5xx or HTML error page. Confirm the Cloudflare plan, transformation permissions and billed request behavior. Only then set `VITE_PZ_CDN_RESIZE_ENABLED=true` in the Preview/Staging *build environment*, rebuild and inspect actual image requests. Keep production disabled until this passes.

Capture DevTools Network measurements for the **same** published product card on `/#/collections` before and after: URL, HTTP status, content-type, transferred bytes, intrinsic dimensions and Load/DOMContentLoaded timing (cold cache). Target ~400w for product cards, ~800w for category grids, 1200w detail hero, ~200w thumbs. Record evidence here when Staging is available; **no before/after byte saving is claimed yet**. In the event of a failed transformation, unset the flag and rebuild; original image URLs are retained in D1/R2 and never overwritten.

Below-the-fold images in About (gallery), Materials (construction and wood samples), Global Capacity (cards and map), Search Results (cards), and Portfolio (cards) use native lazy loading. About banner, Capabilities hero, modal-open image and homepage hero remain eager where appropriate.

## External direct-link image audit — report only, **do not migrate automatically**

`utils/assets.ts` (`DEFAULT_ASSETS`) references Unsplash URLs as follows. All values below are the current URL `w=` query parameter; these images do not pass through the product R2 upload pipeline.

| Width | Asset keys |
| --- | --- |
| 2670 | HOME_FACTORY_SECTION, HOME_HUB_CN, HOME_HUB_KH, CAPACITY_CN_CARD, CAPACITY_KH_CARD |
| 2574 | HOME_CTA_BG |
| 2540 | ABOUT_BANNER |
| 2532 | HOME_HERO_BG |
| 2070 | ABOUT_GALLERY_1–5, MFG_MACHINERY_HERO |
| 2069 | MFG_QC_HERO |
| 1714 | CAPACITY_LOC_ME |
| 1000 | HOME_COMP_MATERIAL, HOME_COMP_JOINERY, CATALOG_COVER, CATALOG_PAGE_VISION, CATALOG_PAGE_DESIGN, CATALOG_PAGE_MFG |
| 800 | MATERIALS_CONST_FINGER, MATERIALS_CONST_EDGE, MATERIALS_CONST_BUTCHER, MATERIALS_WOOD_MAPLE, MATERIALS_WOOD_TEAK, MATERIALS_WOOD_ACACIA, MATERIALS_WOOD_BIRCH, MATERIALS_WOOD_BAMBOO, CAPACITY_LOC_USA, CAPACITY_LOC_CAN, CAPACITY_LOC_UK, CAPACITY_LOC_DE |
| 600 | MENU_COLLECTIONS, MENU_MFG, MENU_CAPABILITIES, MENU_DEFAULT |

`data/inventory.ts` contains five category cover Unsplash URLs, all with `w=1000` (categories in file order: five direct image entries). `utils/assets.ts` also contains non-Unsplash external material images which are outside the direct Unsplash report. No URLs were moved or replaced by this task.
