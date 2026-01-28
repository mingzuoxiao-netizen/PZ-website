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
        help: "主要产品目录（供下载）。"
      }
    ]
  },
  {
    section: "Navigation Menu (Posters)",
    fields: [
      { label: "作品集导航特写", type: "image", path: "menu.feat_collections" },
      { label: "制造系统导航特写", type: "image", path: "menu.feat_mfg" },
      { label: "生产能力导航特写", type: "image", path: "menu.feat_capabilities" },
      { label: "通用背景特写", type: "image", path: "menu.feat_default" },
    ]
  },
  {
    section: "Home Page / Hero",
    fields: [
      { label: "首屏主标题", type: "text", path: "home.hero.title", required: true },
      { label: "首屏背景海报", type: "image", path: "home.hero.image", required: true },
    ],
  },
  {
    section: "Home Page / Sections",
    fields: [
      { label: "工厂概览海报", type: "image", path: "home.factory.image" },
      { label: "底部行动号召背景", type: "image", path: "home.cta.image" },
    ],
  },
  {
    section: "Home Page / Global Hubs",
    fields: [
      { label: "中国总部展示图", type: "image", path: "home.hub_cn.image" },
      { label: "柬埔寨工厂展示图", type: "image", path: "home.hub_kh.image" },
    ],
  },
  {
    section: "About Page",
    fields: [
      { label: "关于页主视觉横幅", type: "image", path: "about.banner" },
      { label: "画廊：原材料仓", type: "image", path: "about.gallery.raw" },
      { label: "画廊：数控铣削", type: "image", path: "about.gallery.milling" },
      { label: "画廊：自动化系统", type: "image", path: "about.gallery.automation" },
      { label: "画廊：表面处理", type: "image", path: "about.gallery.finishing" },
      { label: "画廊：质检实验室", type: "image", path: "about.gallery.qc" },
    ],
  },
  {
    section: "Manufacturing Page",
    fields: [
      { label: "机械工程板块海报", type: "image", path: "manufacturing.hero_machinery" },
      { label: "质检规程板块海报", type: "image", path: "manufacturing.hero_qc" },
    ]
  },
  {
    section: "Capabilities Page",
    fields: [
      { label: "生产能力主海报", type: "image", path: "capabilities.hero_poster" },
    ]
  },
  {
    section: "Portfolio Page",
    fields: [
      { label: "作品集主海报", type: "image", path: "portfolio.hero_poster" },
    ]
  },
  {
    section: "Inquire Page",
    fields: [
      { label: "询盘页面主海报", type: "image", path: "inquire.hero_poster" },
    ]
  },
  {
    section: "Global Capacity / Terminals",
    fields: [
      { label: "物流地图覆盖层", type: "image", path: "capacity.map_bg" },
      { label: "中国总部概览", type: "image", path: "capacity.card_cn" },
      { label: "柬埔寨枢纽概览", type: "image", path: "capacity.card_kh" },
      { label: "终端区域：美国", type: "image", path: "capacity.loc_usa" },
      { label: "终端区域：加拿大", type: "image", path: "capacity.loc_can" },
      { label: "终端区域：英国", type: "image", path: "capacity.loc_uk" },
      { label: "终端区域：德国", type: "image", path: "capacity.loc_de" },
      { label: "终端区域：中东", type: "image", path: "capacity.loc_me" },
    ]
  },
  {
    section: "Materials / Technical Construction",
    fields: [
      { label: "指接工艺图", type: "image", path: "materials.const_finger" },
      { label: "直拼工艺图", type: "image", path: "materials.const_edge" },
      { label: "横向纹理结构图", type: "image", path: "materials.const_butcher" },
    ]
  },
  {
    section: "Materials / Lumber Registry",
    fields: [
      { label: "白橡木纹理", type: "image", path: "materials.wood_oak" },
      { label: "北美黑胡桃纹理", type: "image", path: "materials.wood_walnut" },
      { label: "橡胶木纹理", type: "image", path: "materials.wood_rubber" },
      { label: "白蜡木纹理", type: "image", path: "materials.wood_ash" },
      { label: "欧洲榉木纹理", type: "image", path: "materials.wood_beech" },
      { label: "硬枫木纹理", type: "image", path: "materials.wood_maple" },
      { label: "人工林柚木纹理", type: "image", path: "materials.wood_teak" },
      { label: "相思木纹理", type: "image", path: "materials.wood_acacia" },
      { label: "黄桦木纹理", type: "image", path: "materials.wood_birch" },
      { label: "重竹纹理", type: "image", path: "materials.wood_bamboo" },
    ]
  },
];
