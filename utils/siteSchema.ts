export type FieldType = "image" | "text" | "textarea" | "url" | "file";

export type ImageValue = string; 

export interface FieldSchema {
  label: string;
  type: FieldType;
  path: string; 
  help?: string;
  required?: boolean; 
  readonly?: boolean; 
}

export interface SectionSchema {
  section: string;
  fields: FieldSchema[];
}

export const SITE_SCHEMA: SectionSchema[] = [
  {
    section: "Global Settings",
    fields: [
      {
        label: "Catalog PDF",
        type: "file",
        path: "catalog.url",
        help: "Primary product catalog for public download."
      }
    ]
  },
  {
    section: "Navigation Menu (Posters)",
    fields: [
      { label: "Portfolio Feature", type: "image", path: "menu.feat_collections" },
      { label: "Manufacturing Feature", type: "image", path: "menu.feat_mfg" },
      { label: "Capabilities Feature", type: "image", path: "menu.feat_capabilities" },
      { label: "Generic Background", type: "image", path: "menu.feat_default" },
    ]
  },
  {
    section: "Home Page / Hero",
    fields: [
      { label: "Hero Main Title", type: "text", path: "home.hero.title", required: true },
      { label: "Hero Background Poster", type: "image", path: "home.hero.image", required: true },
    ],
  },
  {
    section: "Home Page / Sections",
    fields: [
      { label: "Factory Overview Poster", type: "image", path: "home.factory.image" },
      { label: "CTA Background", type: "image", path: "home.cta.image" },
    ],
  },
  {
    section: "Home Page / Global Hubs",
    fields: [
      { label: "China HQ Visual", type: "image", path: "home.hub_cn.image" },
      { label: "Cambodia Hub Visual", type: "image", path: "home.hub_kh.image" },
    ],
  },
  {
    section: "About Page",
    fields: [
      { label: "About Page Main Banner", type: "image", path: "about.banner" },
      { label: "Gallery: Raw Material Curing", type: "image", path: "about.gallery.raw" },
      { label: "Gallery: 5-Axis CNC Milling", type: "image", path: "about.gallery.milling" },
      { label: "Gallery: Automated Systems", type: "image", path: "about.gallery.automation" },
      { label: "Gallery: Surface Finishing", type: "image", path: "about.gallery.finishing" },
      { label: "Gallery: QC Laboratory", type: "image", path: "about.gallery.qc" },
    ],
  },
  {
    section: "Manufacturing Page",
    fields: [
      { label: "Mechanical Engineering Poster", type: "image", path: "manufacturing.hero_machinery" },
      { label: "Quality Audit Protocols Poster", type: "image", path: "manufacturing.hero_qc" },
    ]
  },
  {
    section: "Capabilities Page",
    fields: [
      { label: "Production Capabilities Main Poster", type: "image", path: "capabilities.hero_poster" },
    ]
  },
  {
    section: "Portfolio Page",
    fields: [
      { label: "Archive Registry Main Poster", type: "image", path: "portfolio.hero_poster" },
    ]
  },
  {
    section: "Inquire Page",
    fields: [
      { label: "Inquiry Portal Main Poster", type: "image", path: "inquire.hero_poster" },
    ]
  },
  {
    section: "Global Capacity / Terminals",
    fields: [
      { label: "Logistics Map Overlay", type: "image", path: "capacity.map_bg" },
      { label: "China HQ Terminal Card", type: "image", path: "capacity.card_cn" },
      { label: "Cambodia Terminal Card", type: "image", path: "capacity.card_kh" },
      { label: "Terminal Region: USA", type: "image", path: "capacity.loc_usa" },
      { label: "Terminal Region: Canada", type: "image", path: "capacity.loc_can" },
      { label: "Terminal Region: UK", type: "image", path: "capacity.loc_uk" },
      { label: "Terminal Region: Germany", type: "image", path: "capacity.loc_de" },
      { label: "Terminal Region: Middle East", type: "image", path: "capacity.loc_me" },
    ]
  },
  {
    section: "Materials / Technical Construction",
    fields: [
      { label: "Finger Jointing Protocol", type: "image", path: "materials.const_finger" },
      { label: "Edge Gluing Protocol", type: "image", path: "materials.const_edge" },
      { label: "Cross-Grain Lamination Protocol", type: "image", path: "materials.const_butcher" },
    ]
  },
  {
    section: "Materials / Lumber Registry",
    fields: [
      { label: "White Oak Specimen", type: "image", path: "materials.wood_oak" },
      { label: "American Walnut Specimen", type: "image", path: "materials.wood_walnut" },
      { label: "Rubber Wood Specimen", type: "image", path: "materials.wood_rubber" },
      { label: "White Ash Specimen", type: "image", path: "materials.wood_ash" },
      { label: "European Beech Specimen", type: "image", path: "materials.wood_beech" },
      { label: "Hard Maple Specimen", type: "image", path: "materials.wood_maple" },
      { label: "Plantation Teak Specimen", type: "image", path: "materials.wood_teak" },
      { label: "Acacia Wood Specimen", type: "image", path: "materials.wood_acacia" },
      { label: "Yellow Birch Specimen", type: "image", path: "materials.wood_birch" },
      { label: "Moso Bamboo Specimen", type: "image", path: "materials.wood_bamboo" },
    ]
  },
];