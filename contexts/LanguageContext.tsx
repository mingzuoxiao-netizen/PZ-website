import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any; // Using any for dictionary flexibility, strictly typed in a larger app
}

const translations = {
  en: {
    common: {
      readMore: "Read More",
      viewDetails: "View Details",
      learnMore: "Learn More",
      contactUs: "Contact Us",
      search: "Search",
      searchPlaceholder: "Type to search products...",
      searchRefine: "Refine your search...",
      backHome: "Back Home",
      loading: "Loading",
      close: "Close",
      explore: "Explore",
      connect: "Connect",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      rights: "All rights reserved.",
      startProject: "Start a Project",
      tradeProgram: "Trade Program",
      adminAccess: "Admin Access"
    },
    home: {
      subtitle: "Furniture Manufacturing",
      heroQuote: "\"Bridging California Design with Precision Manufacturing.\"",
      viewLibrary: "View Wood Library",
      factoryProfile: "Factory Profile",
      factoryStrength: "Factory Strength",
      strengthTitle: "Engineered for High-End Retail.",
      strengthDesc1: "Peng Zhan is not just a factory; we are a specialized solid wood studio operating at an industrial scale. We bridge the gap between the boutique quality required by leading US brands and the volume capabilities of Asian manufacturing.",
      strengthDesc2: "From our signature Butcher Block surfaces to intricate mortise-and-tenon joinery, our output is defined by warmth, depth, and precision.",
      stats: {
        factories: "Factories (CN + KH)",
        exp: "Years Exp.",
        partners: "US Partners"
      },
      competencies: "Core Competencies",
      comp1Title: "Material Mastery",
      comp1Desc: "Specializing in North American hardwoods (Walnut, White Oak, Maple) with full chain-of-custody and moisture control.",
      comp2Title: "Dual-Shore Supply",
      comp2Desc: "Seamlessly switching production between China and Cambodia to optimize for tariffs, lead times, and capacity.",
      comp3Title: "Advanced Joinery",
      comp3Desc: "Combining 5-axis CNC precision with traditional joinery techniques to create furniture that is both structurally sound and beautiful.",
      visitUs: "Visit Us",
      globalHubs: "Global Manufacturing Hubs",
      globalDesc: "Our dual-shore strategy ensures we can meet any volume or tariff requirement. Contact us to schedule a factory tour or audit.",
      chinaLoc: "HQ & Main Facility",
      cambodiaLoc: "Tariff-Free Factory"
    },
    about: {
      since: "Since 2014",
      title: "The Invisible Force Behind Global Design Brands",
      intro: "Peng Zhan Furniture Studio is a design-led manufacturing partner serving the top 30 US furniture brands. From our origins in Southern China to our expansion into Cambodia, we bridge the gap between California design aesthetics and industrial-grade precision.",
      bannerText: "\"Craftsmanship at Scale.\"",
      pillars: {
        elite: "Elite Partnerships",
        eliteDesc: "We have established long-term OEM/ODM relationships with the most prestigious names in American furniture retail. Our understanding of 'High Street' quality standards is unmatched in the region.",
        dual: "China + Cambodia",
        dualDesc: "With fully owned facilities in both China (Zhaoqing) and Cambodia (Kandal), we offer our partners strategic flexibility against tariffs. A resilient 'Dual-Shore' strategy.",
        logistics: "US Logistics",
        logisticsDesc: "Our 129,167 sq.ft Los Angeles warehouse enables American Domestic Fulfillment and drop-ship programs, ensuring your products are always within reach of the customer."
      },
      process: {
        label: "The Process",
        title: "Inside the Factory",
        clickExpand: "Click images to expand"
      },
      journey: "Our Journey",
      milestones: {
        2014: { title: "Foundation", desc: "Established in Dongguan, Guangdong. The journey began with a focus on pure solid wood craftsmanship." },
        2018: { title: "US Expansion", desc: "Launched Los Angeles warehouse and fulfillment center to serve North American clients directly." },
        2021: { title: "Cambodia Facility", desc: "Opened factory in Kandal Province to expand capacity and offer tariff-free solutions." },
        2024: { title: "Automation", desc: "Zhaoqing HQ expansion. Focusing on sustainable mixed-materials and advanced automated finishing lines." }
      }
    },
    collections: {
      title: "Collections & Capabilities",
      intro: "Organized by manufacturing discipline. We specialize in pure solid wood fabrication for residential and commercial applications.",
      collection: "Collection",
      viewProducts: "View Products",
      overview: "Overview",
      needCatalog: "Need a Catalog?",
      catalogDesc: "Download our full PDF specification sheet for this collection.",
      requestPdf: "Request PDF",
      availableSpecs: "Available Specifications",
      viewOptions: "View Options"
    },
    materials: {
      title: "Materials & Craft",
      precision: "Precision meets Handcraft",
      precisionDesc1: "We believe that the soul of furniture lies in the material. Our sourcing process is rigorous, ensuring that every board of lumber meets our standards for sustainability and durability.",
      precisionDesc2: "Our 'Surface Program' (kitchen islands, cutting boards) utilizes food-safe finishes and robust construction methods designed to last generations.",
      library: "Wood Library"
    },
    inquire: {
      title: "Start a Conversation",
      desc: "Whether you are a global furniture brand looking for an ODM partner, or an architect specifying for a commercial project, we are ready to execute your vision.",
      trade: "Trade Program",
      tradeDesc: "Exclusive pricing and custom capabilities for interior designers and architects.",
      oem: "ODM / OEM Services",
      oemDesc: "Full-scale manufacturing for retail brands. Minimum order quantities apply.",
      catalog: "Digital Catalog",
      catalogDesc: "Request our comprehensive specification guide via the form. Includes full material library, joinery details, and factory capabilities.",
      form: {
        name: "Name",
        company: "Company",
        email: "Email Address",
        type: "Inquiry Type",
        message: "Message",
        send: "Send Inquiry",
        sending: "Sending",
        success: "Thank you",
        successDesc: "Your inquiry has been received. Our team will review your project requirements and respond shortly.",
        again: "Send another message"
      },
      types: {
        general: "General Inquiry",
        catalog: "Catalog Request",
        trade: "Trade Program Application",
        oem: "ODM / OEM Partnership"
      }
    },
    capacity: {
      footprint: "Manufacturing Footprint",
      title: "Global Scale, Local Precision",
      desc: "Peng Zhan operates a strategic dual-shore manufacturing network. With massive facilities in both China and Cambodia, plus a domestic warehouse in Los Angeles, we offer a resilient supply chain immune to single-point failures.",
      clientDist: "Global Client Distribution",
      clientDesc: "We serve clients across North America, Europe, and the Middle East, with a strong concentration in the USA and Canada.",
      stats: {
        sqft: "Total Sq.Ft Capacity",
        brands: "Major US Brands",
        units: "Monthly Unit Capacity",
        logistics: "US Logistics Hub"
      },
      supplyChain: "Supply Chain Solutions",
      supplyChainDesc: "We don't just make furniture; we deliver it. From FOB manufacturing in Southeast Asia to Last-Mile capability in the United States.",
      flexible: "Flexible Export",
      flexibleDesc: "Choose between China or Cambodia origin based on your tariff strategy and lead time requirements.",
      warehouse: "US Warehouse (Los Angeles)",
      warehouseDesc: "129,000 sq.ft warehouse in California allowing for domestic replenishment and drop-ship programs."
    },
    studio: {
      title: "The Studio",
      subtitle: "Where Engineering Meets Artistry",
      design: "Design & R&D",
      designTitle: "Original Design Capability",
      designDesc1: "Peng Zhan is distinguished by a high degree of automation paired with a robust self-research and design capability. We maintain stable cooperation with American design teams.",
      designDesc2: "Our process bridges the gap between conceptual sketches and mass production, optimizing for cost without sacrificing the integrity of the design.",
      eng: "Engineering",
      engTitle: "Material Expertise",
      engDesc: "We excel in complex material integration. From our signature Butcher Block solid wood surfaces to mixed-material pieces combining powder-coated metals and natural timber.",
      raw: "Raw Materials",
      rawTitle: "Sourcing the World's Best Timber",
      rawDesc: "Our studio works exclusively with premium hardwoods sourced from sustainable forests in the world. Understanding the distinct properties of each species is crucial.",
      exploreMat: "Explore Material Library"
    }
  },
  zh: {
    common: {
      readMore: "阅读更多",
      viewDetails: "查看详情",
      learnMore: "了解更多",
      contactUs: "联系我们",
      search: "搜索",
      searchPlaceholder: "输入关键词搜索产品...",
      searchRefine: "筛选搜索结果...",
      backHome: "返回首页",
      loading: "加载中",
      close: "关闭",
      explore: "探索",
      connect: "建立连接",
      privacy: "隐私政策",
      terms: "服务条款",
      rights: "版权所有",
      startProject: "启动项目",
      tradeProgram: "贸易计划",
      adminAccess: "管理员入口"
    },
    home: {
      subtitle: "高端家具制造",
      heroQuote: "“将加州设计美学与精密制造工艺完美融合。”",
      viewLibrary: "浏览木材库",
      factoryProfile: "工厂概况",
      factoryStrength: "工厂实力",
      strengthTitle: "专为高端零售打造",
      strengthDesc1: "鹏展不仅仅是一家工厂，我们是一个具备工业化规模的实木制造工作室。我们连接了美国顶尖品牌所需的精品质量与亚洲制造的量产能力。",
      strengthDesc2: "从我们标志性的实木层压台面到复杂的榫卯结构，我们的产品以温暖、深度和精确著称。",
      stats: {
        factories: "两大生产基地",
        exp: "年行业经验",
        partners: "美国合作伙伴"
      },
      competencies: "核心竞争力",
      comp1Title: "材质掌控",
      comp1Desc: "专注于北美硬木（黑胡桃、白橡、硬枫），拥有完整的监管链和湿度控制体系。",
      comp2Title: "双岸供应",
      comp2Desc: "在中国和柬埔寨之间无缝切换生产，以优化关税、交货期和产能。",
      comp3Title: "先进工艺",
      comp3Desc: "结合五轴数控机床的精密与传统榫卯技术，创造出结构稳固且美观的家具。",
      visitUs: "参观工厂",
      globalHubs: "全球制造中心",
      globalDesc: "我们的双岸战略确保能满足任何产量或关税要求。联系我们安排工厂参观或验厂。",
      chinaLoc: "总部及主工厂",
      cambodiaLoc: "免关税工厂"
    },
    about: {
      since: "始于 2014",
      title: "全球设计品牌背后的隐形力量",
      intro: "鹏展家具工作室是服务于全美前30大家具品牌的设计驱动型制造合作伙伴。从中国华南起步到拓展至柬埔寨，我们架起了加州设计美学与工业级精度之间的桥梁。",
      bannerText: "“规模化的工匠精神。”",
      pillars: {
        elite: "精英合作伙伴",
        eliteDesc: "我们与美国最负盛名的家具零售商建立了长期的 OEM/ODM 关系。我们对“高街”质量标准的理解在区域内无出其右。",
        dual: "中国 + 柬埔寨",
        dualDesc: "我们在中国（肇庆）和柬埔寨（干拉省）拥有全资工厂，为合作伙伴提供应对关税的战略灵活性。这是一个极具韧性的“双岸”战略。",
        logistics: "美国物流",
        logisticsDesc: "我们位于洛杉矶的 129,167 平方英尺仓库支持美国国内履约和一件代发项目，确保您的产品始终触手可及。"
      },
      process: {
        label: "制造工艺",
        title: "工厂内部",
        clickExpand: "点击图片放大"
      },
      journey: "发展历程",
      milestones: {
        2014: { title: "成立", desc: "在广东东莞成立。从专注于纯实木工艺起步，奠定品质基础。" },
        2018: { title: "美国扩张", desc: "启动洛杉矶仓库及履约中心，直接服务北美客户。" },
        2021: { title: "柬埔寨工厂", desc: "在干拉省开设工厂以扩大产能并提供免关税解决方案。" },
        2024: { title: "自动化", desc: "肇庆总部扩建。专注于可持续混合材料和先进的自动化涂装线。" }
      }
    },
    collections: {
      title: "产品系列与能力",
      intro: "按制造工艺分类。我们专注于住宅和商业应用的纯实木制造。",
      collection: "系列",
      viewProducts: "查看产品",
      overview: "概览",
      needCatalog: "需要产品目录？",
      catalogDesc: "下载该系列的完整 PDF 规格表。",
      requestPdf: "获取 PDF",
      availableSpecs: "可选规格",
      viewOptions: "查看选项"
    },
    materials: {
      title: "材质与工艺",
      precision: "精密遇上手工",
      precisionDesc1: "我们坚信家具的灵魂在于材质。我们的采购过程严苛，确保每一块木材都符合我们对可持续性和耐用性的标准。",
      precisionDesc2: "我们的“表面计划”（厨房岛台、砧板）采用食品级涂层和坚固的结构方法，旨在世代相传。",
      library: "木材库"
    },
    inquire: {
      title: "开启合作",
      desc: "无论您是寻找 ODM 合作伙伴的全球家具品牌，还是为商业项目进行规范的设计师，我们都准备好实现您的愿景。",
      trade: "贸易计划",
      tradeDesc: "为室内设计师和建筑师提供独家定价和定制能力。",
      oem: "ODM / OEM 服务",
      oemDesc: "面向零售品牌的全规模制造。适用最低起订量。",
      catalog: "电子目录",
      catalogDesc: "通过表格索取我们要全面的规格指南。包含完整材质库、榫卯细节和工厂能力。",
      form: {
        name: "姓名",
        company: "公司",
        email: "电子邮箱",
        type: "咨询类型",
        message: "留言内容",
        send: "发送咨询",
        sending: "发送中",
        success: "谢谢",
        successDesc: "您的咨询已收到。我们的团队将审核您的项目需求并尽快回复。",
        again: "发送另一条消息"
      },
      types: {
        general: "一般咨询",
        catalog: "索取目录",
        trade: "申请贸易计划",
        oem: "ODM / OEM 合作"
      }
    },
    capacity: {
      footprint: "制造足迹",
      title: "全球规模，本地精度",
      desc: "鹏展运营着战略性的双岸制造网络。在中国和柬埔寨拥有大型工厂，加上洛杉矶的国内仓库，我们提供不受单点故障影响的弹性供应链。",
      clientDist: "全球客户分布",
      clientDesc: "我们服务于北美、欧洲和中东的客户，主要集中在美国和加拿大。",
      stats: {
        sqft: "总产能 (平方英尺)",
        brands: "主要美国品牌",
        units: "月产能 (件)",
        logistics: "美国物流中心"
      },
      supplyChain: "供应链解决方案",
      supplyChainDesc: "我们不只是制造家具；我们交付家具。从东南亚的 FOB 制造到美国的“最后一英里”能力。",
      flexible: "灵活出口",
      flexibleDesc: "根据您的关税策略和交货期要求，在中国或柬埔寨原产地之间选择。",
      warehouse: "美国仓库 (洛杉矶)",
      warehouseDesc: "位于加州的 129,000 平方英尺仓库，支持国内补货和一件代发项目。"
    },
    studio: {
      title: "设计工作室",
      subtitle: "工程与艺术的交汇",
      design: "设计与研发",
      designTitle: "原创设计能力",
      designDesc1: "鹏展以高度自动化与强大的自主研发设计能力而著称。我们与美国设计团队保持稳定的合作。",
      designDesc2: "我们的流程架起了概念草图与大规模生产之间的桥梁，在不牺牲设计完整性的前提下优化成本。",
      eng: "工程技术",
      engTitle: "材料专长",
      engDesc: "我们擅长复杂的材料整合。从标志性的实木层压台面到结合粉末喷涂金属和天然木材的混合材质作品。",
      raw: "原材料",
      rawTitle: "采购全球最佳木材",
      rawDesc: "我们的工作室仅使用来自北美和欧洲可持续森林的优质硬木。了解每种树种的独特性质至关重要。",
      exploreMat: "探索材质库"
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};