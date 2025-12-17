
export type FieldType = "image" | "text" | "textarea" | "url" | "file";

// NOTE: image/file fields currently store single URL (string)
export type ImageValue = string; 

export interface FieldSchema {
  label: string;
  type: FieldType;
  path: string; // Corresponds to SiteConfig keys
  help?: string;
  required?: boolean; // Validation
  readonly?: boolean; // For history/system fields
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
        help: "Upload the main product catalog (PDF). Appears on Portfolio & Inquire pages."
      }
    ]
  },
  {
    section: "Navigation Menu (Featured Images)",
    fields: [
      { label: "Portfolio Menu Image", type: "image", path: "menu.feat_collections" },
      { label: "Manufacturing Menu Image", type: "image", path: "menu.feat_mfg" },
      { label: "Capabilities Menu Image", type: "image", path: "menu.feat_capabilities" },
      { label: "Default Menu Image", type: "image", path: "menu.feat_default" },
    ]
  },
  {
    section: "Home Page / Hero",
    fields: [
      {
        label: "Hero Title",
        type: "text",
        path: "home.hero.title",
        required: true,
      },
      {
        label: "Hero Background Image",
        type: "image",
        path: "home.hero.image",
        required: true,
      },
    ],
  },
  {
    section: "Home Page / Sections",
    fields: [
      {
        label: "Factory Section Image",
        type: "image",
        path: "home.factory.image",
      },
      {
        label: "Footer CTA Background",
        type: "image",
        path: "home.cta.image",
      },
    ],
  },
  {
    section: "Home Page / Global Hubs",
    fields: [
      {
        label: "China Hub Image",
        type: "image",
        path: "home.hub_cn.image",
      },
      {
        label: "Cambodia Hub Image",
        type: "image",
        path: "home.hub_kh.image",
      },
    ],
  },

  {
    section: "About Page",
    fields: [
      {
        label: "Main Cinematic Banner",
        type: "image",
        path: "about.banner",
      },
      {
        label: "Gallery: Raw Lumber",
        type: "image",
        path: "about.gallery.raw",
      },
      {
        label: "Gallery: Precision Milling",
        type: "image",
        path: "about.gallery.milling",
      },
      {
        label: "Gallery: Automation",
        type: "image",
        path: "about.gallery.automation",
      },
      {
        label: "Gallery: Hand Finishing",
        type: "image",
        path: "about.gallery.finishing",
      },
      {
        label: "Gallery: Quality Control",
        type: "image",
        path: "about.gallery.qc",
      },
    ],
  },
  {
    section: "Manufacturing Page",
    fields: [
      { label: "Machinery Hero", type: "image", path: "manufacturing.hero_machinery" },
      { label: "QC/Lab Hero", type: "image", path: "manufacturing.hero_qc" },
    ]
  },
  {
    section: "Global Capacity / Locations",
    fields: [
      { label: "World Map Background", type: "image", path: "capacity.map_bg" },
      { label: "China HQ Card", type: "image", path: "capacity.card_cn" },
      { label: "Cambodia Factory Card", type: "image", path: "capacity.card_kh" },
      { label: "Location: USA", type: "image", path: "capacity.loc_usa" },
      { label: "Location: Canada", type: "image", path: "capacity.loc_can" },
      { label: "Location: UK", type: "image", path: "capacity.loc_uk" },
      { label: "Location: Germany", type: "image", path: "capacity.loc_de" },
      { label: "Location: Middle East", type: "image", path: "capacity.loc_me" },
    ]
  },
  {
    section: "Materials / Construction",
    fields: [
      { label: "Finger Joint", type: "image", path: "materials.const_finger" },
      { label: "Edge Glue", type: "image", path: "materials.const_edge" },
      { label: "Butcher Block", type: "image", path: "materials.const_butcher" },
    ]
  },
  {
    section: "Materials / Wood Library",
    fields: [
      { label: "White Oak", type: "image", path: "materials.wood_oak" },
      { label: "Walnut", type: "image", path: "materials.wood_walnut" },
      { label: "Rubberwood", type: "image", path: "materials.wood_rubber" },
      { label: "Ash", type: "image", path: "materials.wood_ash" },
      { label: "Beech", type: "image", path: "materials.wood_beech" },
      { label: "Maple", type: "image", path: "materials.wood_maple" },
      { label: "Teak", type: "image", path: "materials.wood_teak" },
      { label: "Acacia", type: "image", path: "materials.wood_acacia" },
      { label: "Birch", type: "image", path: "materials.wood_birch" },
      { label: "Bamboo", type: "image", path: "materials.wood_bamboo" },
    ]
  },
];
