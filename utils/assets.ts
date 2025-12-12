
// Central registry for all static page assets
// This allows the Creator Portal to override these via LocalStorage

export const ASSET_KEYS = {
  // HOME PAGE
  HOME_HERO_BG: 'home_hero_bg',
  HOME_FACTORY_SECTION: 'home_factory_section',
  HOME_COMP_MATERIAL: 'home_comp_material',
  HOME_COMP_LOGISTICS: 'home_comp_logistics',
  HOME_COMP_JOINERY: 'home_comp_joinery',
  HOME_HUB_CN: 'home_hub_cn',
  HOME_HUB_KH: 'home_hub_kh',

  // ABOUT PAGE
  ABOUT_BANNER: 'about_banner',
  ABOUT_GALLERY_1: 'about_gallery_1',
  ABOUT_GALLERY_2: 'about_gallery_2',
  ABOUT_GALLERY_3: 'about_gallery_3',
  ABOUT_GALLERY_4: 'about_gallery_4',
  ABOUT_GALLERY_5: 'about_gallery_5', // New Automation Key

  // MANUFACTURING PAGE
  MFG_QC_HERO: 'mfg_qc_hero',

  // MATERIALS PAGE
  MATERIALS_CONST_FINGER: 'materials_const_finger',
  MATERIALS_CONST_EDGE: 'materials_const_edge',
  MATERIALS_CONST_BUTCHER: 'materials_const_butcher',
  MATERIALS_WOOD_OAK: 'materials_wood_oak',
  MATERIALS_WOOD_WALNUT: 'materials_wood_walnut',
  MATERIALS_WOOD_RUBBER: 'materials_wood_rubber',
  MATERIALS_WOOD_ASH: 'materials_wood_ash',
  MATERIALS_WOOD_BEECH: 'materials_wood_beech',
  MATERIALS_WOOD_MAPLE: 'materials_wood_maple',
  MATERIALS_WOOD_TEAK: 'materials_wood_teak',
  MATERIALS_WOOD_ACACIA: 'materials_wood_acacia',
  MATERIALS_WOOD_BIRCH: 'materials_wood_birch',
  MATERIALS_WOOD_BAMBOO: 'materials_wood_bamboo',

  // GLOBAL CAPACITY
  CAPACITY_CN_CARD: 'capacity_cn_card',
  CAPACITY_KH_CARD: 'capacity_kh_card',

  // CATALOG ASSETS
  CATALOG_COVER: 'catalog_cover',
  CATALOG_PAGE_VISION: 'catalog_page_vision',
  CATALOG_PAGE_DESIGN: 'catalog_page_design',
  CATALOG_PAGE_MFG: 'catalog_page_mfg',
  CATALOG_DOCUMENT: 'catalog_document', // New PDF Key

  // MEGA MENU FEATURED IMAGES
  MENU_COLLECTIONS: 'menu_collections_feat',
  MENU_MFG: 'menu_mfg_feat',
  MENU_CAPABILITIES: 'menu_capabilities_feat',
  MENU_DEFAULT: 'menu_default_feat',
};

export const DEFAULT_ASSETS: Record<string, string> = {
  // REPLACED: Broken GitHub Links -> Stable Unsplash Links
  [ASSET_KEYS.HOME_HERO_BG]: "https://images.unsplash.com/photo-1622372738946-62e02505feb3?q=80&w=2532&auto=format&fit=crop", // Dark industrial wood workshop
  [ASSET_KEYS.HOME_FACTORY_SECTION]: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=2670&auto=format&fit=crop", // Industrial machinery/automation
  [ASSET_KEYS.HOME_COMP_MATERIAL]: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=1000&auto=format&fit=crop", // Raw lumber/wood texture
  [ASSET_KEYS.HOME_COMP_LOGISTICS]: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/World_map_with_nations.svg/1200px-World_map_with_nations.svg.png",
  [ASSET_KEYS.HOME_COMP_JOINERY]: "https://images.unsplash.com/photo-1674488972166-5e580cb2b083?q=80&w=1000&auto=format&fit=crop", // CNC / Precision tool
  [ASSET_KEYS.HOME_HUB_CN]: "https://images.unsplash.com/photo-1565120130296-fcbd2b2f0b6f?q=80&w=2670&auto=format&fit=crop", // Modern factory exterior (China vibe)
  [ASSET_KEYS.HOME_HUB_KH]: "https://images.unsplash.com/photo-1605218427306-633ba87c9759?q=80&w=2670&auto=format&fit=crop", // Large manufacturing facility

  [ASSET_KEYS.ABOUT_BANNER]: "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?q=80&w=2540&auto=format&fit=crop",
  [ASSET_KEYS.ABOUT_GALLERY_1]: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=2070&auto=format&fit=crop",
  [ASSET_KEYS.ABOUT_GALLERY_2]: "https://images.unsplash.com/photo-1620283085068-5aab84e2db8e?q=80&w=2070&auto=format&fit=crop",
  [ASSET_KEYS.ABOUT_GALLERY_3]: "https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?q=80&w=2070&auto=format&fit=crop",
  [ASSET_KEYS.ABOUT_GALLERY_4]: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop",
  [ASSET_KEYS.ABOUT_GALLERY_5]: "https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=2070&auto=format&fit=crop", // Automation / Robotics

  [ASSET_KEYS.MFG_QC_HERO]: "https://images.unsplash.com/photo-1581093458791-9f302e683800?q=80&w=2069&auto=format&fit=crop",

  // CATALOG DEFAULTS (Placeholders based on the user's PDF style)
  [ASSET_KEYS.CATALOG_COVER]: "https://images.unsplash.com/photo-1631679706909-1844bbd0d978?q=80&w=1000&auto=format&fit=crop",
  [ASSET_KEYS.CATALOG_PAGE_VISION]: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1000&auto=format&fit=crop",
  [ASSET_KEYS.CATALOG_PAGE_DESIGN]: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1000&auto=format&fit=crop",
  [ASSET_KEYS.CATALOG_PAGE_MFG]: "https://images.unsplash.com/photo-1565514020125-63b7e43d2266?q=80&w=1000&auto=format&fit=crop",
  [ASSET_KEYS.CATALOG_DOCUMENT]: "", // No default PDF

  // MATERIALS DEFAULTS
  [ASSET_KEYS.MATERIALS_CONST_FINGER]: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop",
  [ASSET_KEYS.MATERIALS_CONST_EDGE]: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=800&auto=format&fit=crop",
  [ASSET_KEYS.MATERIALS_CONST_BUTCHER]: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?q=80&w=800&auto=format&fit=crop",
  [ASSET_KEYS.MATERIALS_WOOD_OAK]: "https://www.wood-database.com/wp-content/uploads/white-oak.jpg",
  [ASSET_KEYS.MATERIALS_WOOD_WALNUT]: "https://realcraft.com/cdn/shop/files/old_master_stain_black_walnut_06_old_fashioned_nougat_fefca478-f54d-4cbb-a824-04afbc0d0471.jpg?v=1738354800&width=2048",
  [ASSET_KEYS.MATERIALS_WOOD_RUBBER]: "https://5.imimg.com/data5/SELLER/Default/2023/2/PH/OC/LB/35417618/rubber-wood-furniture-500x500.jpeg",
  [ASSET_KEYS.MATERIALS_WOOD_ASH]: "https://cdn11.bigcommerce.com/s-4aaphn/images/stencil/1280x1280/products/57/2826/ash-brown-quart_2__04637.1636784337.jpg?c=2",
  [ASSET_KEYS.MATERIALS_WOOD_BEECH]: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTMFbbBEdRAxFOZ7IRsZ4y9Q56uqzIXl-GO3A&s",
  [ASSET_KEYS.MATERIALS_WOOD_MAPLE]: "https://images.unsplash.com/photo-1601058268499-e52642d15d31?q=80&w=800&auto=format&fit=crop",
  [ASSET_KEYS.MATERIALS_WOOD_TEAK]: "https://images.unsplash.com/photo-1611311020087-0b157793d406?q=80&w=800&auto=format&fit=crop",
  [ASSET_KEYS.MATERIALS_WOOD_ACACIA]: "https://images.unsplash.com/photo-1627932824345-236ee3646549?q=80&w=800&auto=format&fit=crop",
  [ASSET_KEYS.MATERIALS_WOOD_BIRCH]: "https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?q=80&w=800&auto=format&fit=crop",
  [ASSET_KEYS.MATERIALS_WOOD_BAMBOO]: "https://images.unsplash.com/photo-1605648916361-9bc12ad6a569?q=80&w=800&auto=format&fit=crop",

  [ASSET_KEYS.CAPACITY_CN_CARD]: "https://images.unsplash.com/photo-1565120130296-fcbd2b2f0b6f?q=80&w=2670&auto=format&fit=crop", // Replaced broken link
  [ASSET_KEYS.CAPACITY_KH_CARD]: "https://images.unsplash.com/photo-1605218427306-633ba87c9759?q=80&w=2670&auto=format&fit=crop", // Replaced broken link

  [ASSET_KEYS.MENU_COLLECTIONS]: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=600&auto=format&fit=crop",
  [ASSET_KEYS.MENU_MFG]: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?q=80&w=600&auto=format&fit=crop",
  [ASSET_KEYS.MENU_CAPABILITIES]: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop",
  [ASSET_KEYS.MENU_DEFAULT]: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=600&auto=format&fit=crop",
};

export const ASSET_GROUPS = [
  {
    name: "Documents (PDF)",
    keys: [
      { key: ASSET_KEYS.CATALOG_DOCUMENT, label: "Full 2024 Catalog (PDF)" },
    ]
  },
  {
    name: "Home Page",
    keys: [
      { key: ASSET_KEYS.HOME_HERO_BG, label: "Hero Banner Background" },
      { key: ASSET_KEYS.HOME_FACTORY_SECTION, label: "Industrial Strength Section" },
      { key: ASSET_KEYS.HOME_COMP_MATERIAL, label: "Competency: Material" },
      { key: ASSET_KEYS.HOME_COMP_LOGISTICS, label: "Competency: Logistics" },
      { key: ASSET_KEYS.HOME_COMP_JOINERY, label: "Competency: Joinery" },
      { key: ASSET_KEYS.HOME_HUB_CN, label: "Global Hub: China Image" },
      { key: ASSET_KEYS.HOME_HUB_KH, label: "Global Hub: Cambodia Image" },
    ]
  },
  {
    name: "Catalog Viewer",
    keys: [
      { key: ASSET_KEYS.CATALOG_COVER, label: "Catalog: Cover Image" },
      { key: ASSET_KEYS.CATALOG_PAGE_VISION, label: "Catalog: Vision/Design Page" },
      { key: ASSET_KEYS.CATALOG_PAGE_DESIGN, label: "Catalog: Engineering Page" },
      { key: ASSET_KEYS.CATALOG_PAGE_MFG, label: "Catalog: Manufacturing Page" },
    ]
  },
  {
    name: "Materials Page",
    keys: [
      { key: ASSET_KEYS.MATERIALS_CONST_FINGER, label: "Construction: Finger Joint" },
      { key: ASSET_KEYS.MATERIALS_CONST_EDGE, label: "Construction: Edge Glue" },
      { key: ASSET_KEYS.MATERIALS_CONST_BUTCHER, label: "Construction: Butcher Block" },
      { key: ASSET_KEYS.MATERIALS_WOOD_OAK, label: "Wood: White Oak" },
      { key: ASSET_KEYS.MATERIALS_WOOD_WALNUT, label: "Wood: Walnut" },
      { key: ASSET_KEYS.MATERIALS_WOOD_RUBBER, label: "Wood: Rubberwood" },
      { key: ASSET_KEYS.MATERIALS_WOOD_ASH, label: "Wood: Ash" },
      { key: ASSET_KEYS.MATERIALS_WOOD_BEECH, label: "Wood: Beech" },
      { key: ASSET_KEYS.MATERIALS_WOOD_MAPLE, label: "Wood: Maple" },
      { key: ASSET_KEYS.MATERIALS_WOOD_BIRCH, label: "Wood: Birch" },
      { key: ASSET_KEYS.MATERIALS_WOOD_TEAK, label: "Wood: Teak" },
      { key: ASSET_KEYS.MATERIALS_WOOD_ACACIA, label: "Wood: Acacia" },
      { key: ASSET_KEYS.MATERIALS_WOOD_BAMBOO, label: "Wood: Bamboo" },
    ]
  },
  {
    name: "Mega Menu",
    keys: [
      { key: ASSET_KEYS.MENU_COLLECTIONS, label: "Menu: Collections Featured" },
      { key: ASSET_KEYS.MENU_MFG, label: "Menu: Manufacturing Featured" },
      { key: ASSET_KEYS.MENU_CAPABILITIES, label: "Menu: Capabilities Featured" },
      { key: ASSET_KEYS.MENU_DEFAULT, label: "Menu: Default Featured" },
    ]
  },
  {
    name: "About: Factory Gallery",
    keys: [
      { key: ASSET_KEYS.ABOUT_GALLERY_1, label: "Process 1: Raw Lumber" },
      { key: ASSET_KEYS.ABOUT_GALLERY_2, label: "Process 2: Precision Milling" },
      { key: ASSET_KEYS.ABOUT_GALLERY_3, label: "Process 3: Hand Finishing" },
      { key: ASSET_KEYS.ABOUT_GALLERY_4, label: "Process 4: Quality Control" },
      { key: ASSET_KEYS.ABOUT_GALLERY_5, label: "Process 5: Automation" }, // New Entry
    ]
  },
  {
    name: "About & Others",
    keys: [
      { key: ASSET_KEYS.ABOUT_BANNER, label: "About: Cinematic Banner" },
      { key: ASSET_KEYS.MFG_QC_HERO, label: "Manufacturing: QC Lab" },
      { key: ASSET_KEYS.CAPACITY_CN_CARD, label: "Capacity: China Facility Card" },
      { key: ASSET_KEYS.CAPACITY_KH_CARD, label: "Capacity: Cambodia Facility Card" },
    ]
  }
];

export const getAsset = (key: string): string => {
  try {
    const customAssets = localStorage.getItem('pz_site_assets');
    if (customAssets) {
      const parsed = JSON.parse(customAssets);
      if (parsed[key]) return parsed[key];
    }
  } catch (e) {
    console.warn("Error reading assets", e);
  }
  return DEFAULT_ASSETS[key] || "";
};
