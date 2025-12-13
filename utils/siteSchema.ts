
export type FieldType = "image" | "text" | "textarea" | "url";

// NOTE: image field currently stores single image URL (string)
// Can be extended to object later without breaking schema
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
        label: "Catalog PDF URL",
        type: "url",
        path: "catalog.url",
        help: "Direct link to the hosted PDF file."
      }
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
];
