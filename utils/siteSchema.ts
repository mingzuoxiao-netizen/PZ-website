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
        label: "产品目录 PDF",
        type: "file",
        path: "catalog.url",
        help: "供网站访客下载的产品目录。"
      }
    ]
  },
  {
    section: "Navigation Menu (Posters)",
    fields: [
      { label: "产品中心导航封面", type: "image", path: "menu.feat_collections" },
      { label: "生产制造导航封面", type: "image", path: "menu.feat_mfg" },
      { label: "定制能力导航封面", type: "image", path: "menu.feat_capabilities" },
      { label: "通用导航背景", type: "image", path: "menu.feat_default" },
    ]
  },
  {
    section: "Home Page / Hero",
    fields: [
      { label: "首页主标题", type: "text", path: "home.hero.title", required: true },
      { label: "首页主视觉背景图", type: "image", path: "home.hero.image", required: true },
    ],
  },
  {
    section: "Home Page / Sections",
    fields: [
      { label: "工厂展示图片", type: "image", path: "home.factory.image" },
      { label: "首页询盘背景图", type: "image", path: "home.cta.image" },
    ],
  },
  {
    section: "Home Page / Global Hubs",
    fields: [
      { label: "肇庆工厂展示图", type: "image", path: "home.hub_cn.image" },
      { label: "柬埔寨工厂展示图", type: "image", path: "home.hub_kh.image" },
    ],
  },
  {
    section: "About Page",
    fields: [
      { label: "关于我们主横幅", type: "image", path: "about.banner" },
      { label: "图片：木材干燥处理", type: "image", path: "about.gallery.raw" },
      { label: "图片：五轴数控加工", type: "image", path: "about.gallery.milling" },
      { label: "图片：自动化设备", type: "image", path: "about.gallery.automation" },
      { label: "图片：表面涂装", type: "image", path: "about.gallery.finishing" },
      { label: "图片：质量检验", type: "image", path: "about.gallery.qc" },
    ],
  },
  {
    section: "Manufacturing Page",
    fields: [
      { label: "机械设备展示图", type: "image", path: "manufacturing.hero_machinery" },
      { label: "质量检验展示图", type: "image", path: "manufacturing.hero_qc" },
    ]
  },
  {
    section: "Capabilities Page",
    fields: [
      { label: "生产能力展示图", type: "image", path: "capabilities.hero_poster" },
    ]
  },
  {
    section: "Portfolio Page",
    fields: [
      { label: "产品目录展示图", type: "image", path: "portfolio.hero_poster" },
    ]
  },
  {
    section: "Inquire Page",
    fields: [
      { label: "询盘页面主图", type: "image", path: "inquire.hero_poster" },
    ]
  },
  {
    section: "Global Capacity / Terminals",
    fields: [
      { label: "物流地图背景", type: "image", path: "capacity.map_bg" },
      { label: "肇庆基地卡片图", type: "image", path: "capacity.card_cn" },
      { label: "柬埔寨基地卡片图", type: "image", path: "capacity.card_kh" },
      { label: "美国地区图片", type: "image", path: "capacity.loc_usa" },
      { label: "加拿大地区图片", type: "image", path: "capacity.loc_can" },
      { label: "英国地区图片", type: "image", path: "capacity.loc_uk" },
      { label: "德国地区图片", type: "image", path: "capacity.loc_de" },
      { label: "中东地区图片", type: "image", path: "capacity.loc_me" },
    ]
  },
  {
    section: "Materials / Technical Construction",
    fields: [
      { label: "指接工艺图片", type: "image", path: "materials.const_finger" },
      { label: "拼板工艺图片", type: "image", path: "materials.const_edge" },
      { label: "端纹拼接图片", type: "image", path: "materials.const_butcher" },
    ]
  },
  {
    section: "Materials / Lumber Registry",
    fields: [
      { label: "白橡木样品图片", type: "image", path: "materials.wood_oak" },
      { label: "黑胡桃木样品图片", type: "image", path: "materials.wood_walnut" },
      { label: "橡胶木样品图片", type: "image", path: "materials.wood_rubber" },
      { label: "白蜡木样品图片", type: "image", path: "materials.wood_ash" },
      { label: "欧洲榉木样品图片", type: "image", path: "materials.wood_beech" },
      { label: "硬枫木样品图片", type: "image", path: "materials.wood_maple" },
      { label: "柚木样品图片", type: "image", path: "materials.wood_teak" },
      { label: "相思木样品图片", type: "image", path: "materials.wood_acacia" },
      { label: "桦木样品图片", type: "image", path: "materials.wood_birch" },
      { label: "毛竹样品图片", type: "image", path: "materials.wood_bamboo" },
    ]
  },
];