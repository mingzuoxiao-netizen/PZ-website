
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: any;
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
      adminAccess: "Admin Access",
      location_cn: "Zhaoqing, China",
      location_kh: "Kandal, Cambodia",
      factory_01: "Factory 01"
    },
    home: {
      subtitle: "Furniture Manufacturing",
      heroTitle: "Premium Solid Wood Manufacturing",
      heroSub: "Precision Woodworks",
      heroQuote: "\"Bridging Global Design with Precision Manufacturing.\"",
      viewLibrary: "View Wood Library",
      factoryProfile: "Factory Profile",
      factoryStrength: "Factory Strength",
      strengthTitle: "Engineered for High-End Retail.",
      strengthDesc1: "PZ is not just a factory; we are a specialized solid wood studio operating at an industrial scale. We bridge the gap between the boutique quality required by leading US brands and the volume capabilities of Asian manufacturing.",
      strengthDesc2: "We bridge the gap between the boutique-level quality demanded by leading US brands and the high-efficiency manufacturing capabilities of Asia—delivering design accuracy, engineering stability, and consistent volume at global standards.",
      stats: {
        factories: "Factories (CN + KH)",
        exp: "Years Exp.",
        partners: "US Partners"
      },
      competencies: "Core Competencies",
      comp1Title: "Material Mastery",
      comp1Desc: "Specializing in hard solid wood with full chain-of-custody and moisture control.",
      comp2Title: "Dual-Shore Supply",
      comp2Desc: "Seamlessly switching production between China and Cambodia to optimize for tariffs, lead times, and capacity.",
      comp3Title: "Advanced Joinery",
      comp3Desc: "Combining 5-axis CNC precision with traditional joinery techniques to create furniture that is both structurally sound and beautiful.",
      visitUs: "Visit Us",
      globalHubs: "Global Manufacturing Hubs",
      globalDesc: "Our dual-shore strategy ensures we can meet any volume or tariff requirement. Contact us to schedule a factory tour or audit.",
      chinaLoc: "HQ & Main Facility",
      cambodiaLoc: "Low-Tariff Factory",
      readyToScale: "Ready to Scale?",
      exploreMfg: "Explore Manufacturing"
    },
    about: {
      since: "Since 2014",
      title: "The Invisible Force Behind Global Design Brands",
      intro: "PZ Precision Woodworks is a design-led partner serving the top 30 US furniture brands. From our origins in Southern China to our expansion into Cambodia, we bridge the gap between modern design aesthetics and industrial-grade precision.",
      bannerText: "\"Craftsmanship at Scale.\"",
      storyTitle: "Our Story",
      storyP1: "PZ was built for one purpose: to prove that a modern factory can match global standards—not only in output, but in intelligence, precision, and adaptability.",
      storyP2: "As furniture markets evolved, we saw brands struggle to find manufacturing partners who could scale while still honoring detail, engineering logic, and design intent. Most factories focused on volume. Few focused on improvement. Even fewer focused on partnership.",
      storyP3: "We chose a different path.",
      storyP4: "From automated production lines to data-driven quality control, from multi-species solid wood processing to flexible assembly workflows, PZ continues to invest in capabilities that allow us to respond to a fast-changing industry. Every year, we upgrade equipment, expand categories, and refine production engineering—because the brands we serve keep growing, and we grow with them.",
      storyP5: "Our strength is not only machinery. It is our ability to listen, analyze, optimize, and execute. We collaborate with designers and buyers as technical problem-solvers, transforming sketches and prototypes into stable, repeatable, and efficiently manufactured products.",
      storyP6: "What started as a workshop has become a forward-looking manufacturing platform—built on discipline, innovation, and a commitment to long-term partnership. We are not merely producing furniture; we are building the manufacturing future that global brands can rely on.",
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
        2021: { title: "Cambodia Facility", desc: "Opened factory in Kandal Province to expand capacity and offer low-tariff solutions." },
        2024: { title: "Automation", desc: "Zhaoqing HQ expansion. Focusing on sustainable mixed-materials and advanced automated finishing lines." }
      }
    },
    manufacturing: {
      title: "Advanced Manufacturing",
      subtitle: "The Art of Industry",
      intro: "We operate at the intersection of artisanal woodcraft and Industry 4.0 automation. Our facilities are designed to deliver consistent precision at volume.",
      tabs: {
        process: "Production Process",
        machinery: "Machinery and Tech",
        qc: "Quality Control"
      },
      machinery: {
        title: "World-Class Equipment",
        desc: "We invest in the best German and Italian machinery to ensure consistency. Our automated lines reduce human error for volume production, while our 5-axis routers allow for intricate design realization.",
        highPrecision: "High-Precision Routing",
        autoFinish: "Automated Finishing",
        climate: "Climate Controlled Facility"
      },
      qc: {
        title: "Rigorous Standards",
        desc: "Quality is not an afterthought; it is embedded in every step. We follow strict AQL standards and U.S. compliance regulations.",
        iqc: "Incoming QC (IQC)",
        iqcDesc: "Lumber grading, moisture content checks (8-12%), and hardware validation.",
        ipqc: "In-Process QC (IPQC)",
        ipqcDesc: "First-article inspection, dimensional checks at CNC, and sanding quality review.",
        fqc: "Final QC (FQC)",
        fqcDesc: "Pre-shipment inspection based on AQL 2.5/4.0. Assembly testing and carton drop tests.",
        compliance: "Compliance"
      }
    },
    capabilities: {
      title: "Technical Capabilities",
      subtitle: "Engineering Your Vision",
      intro: "Manufacturing is more than just execution; it is about problem-solving. Our engineering team works upstream with your designers to ensure feasibility, cost-efficiency, and structural integrity.",
      categories: "Product Categories",
      limits: {
        title: "Size and Technical Limits",
        subtitle: "Engineering constraints for standard production lines.",
        request: "Request Custom Assessment",
        maxDim: "Max Dimensions",
        precision: "Precision",
        materials: "Materials",
        length: "Length",
        width: "Width",
        thickness: "Thickness",
        cncTol: "CNC Tolerance",
        moisture: "Moisture",
        gloss: "Gloss Level",
        solidWood: "Solid Wood",
        veneer: "Veneer",
        mixed: "Mixed (Metal/Stone)"
      },
      oem: {
        service: "Service Model",
        title: "OEM and ODM Services",
        desc: "Whether you have a completed CAD drawing ready for manufacturing (OEM) or need us to develop a product from a concept sketch (ODM), our engineering team is integrated into the process.",
        oemTitle: "OEM (Build to Print)",
        oemDesc: "Exact execution of your technical drawings. Material matching and strict tolerance adherence.",
        odmTitle: "ODM (Design Support)",
        odmDesc: "We provide structural engineering, value engineering, and prototyping to realize your vision."
      },
      compliance: {
        title: "Technical Compliance",
        desc: "We ensure all products meet the regulatory standards of the destination market, specifically focusing on the US and EU markets.",
        safety: "Chemical Safety",
        safetyDesc: "TSCA Title VI (Formaldehyde), CA Prop 65 Compliance.",
        sustain: "Sustainability",
        sustainDesc: "FSC Certified lumber available upon request. EUTR compliant sourcing.",
        pack: "Packaging",
        packDesc: "ISTA-3A / 6A testing for e-commerce durability."
      },
      cta: {
        title: "Have a custom project?",
        btn: "Start Development"
      }
    },
    collections: {
      title: "Collections and Capabilities",
      intro: "Organized by manufacturing discipline. We specialize in pure solid wood fabrication for residential and commercial applications.",
      collection: "Collection",
      viewProducts: "View Products",
      overview: "Overview",
      needCatalog: "Need a Catalog?",
      catalogDesc: "Download our full PDF specification sheet for this collection.",
      requestPdf: "Request PDF",
      availableSpecs: "Available Specifications",
      viewOptions: "View Options",
      // PDP
      pdp: {
        techDims: "Technical Dimensions",
        drawingUnavailable: "Digital Line Drawing Unavailable",
        ref: "Ref",
        matSelection: "Material Selection",
        inquireOrder: "Inquire to Order",
        share: "Share Product",
        description: "Description",
        descExtra: "Designed with durability and aesthetic purity in mind. This piece exemplifies our commitment to precision manufacturing, utilizing 5-axis CNC technology and traditional joinery.",
        matConst: "Materials and Construction",
        primaryWood: "Primary Wood",
        finish: "Finish",
        joinery: "Joinery",
        hardware: "Hardware",
        downloads: "Downloads",
        specSheet: "Product Spec Sheet (PDF)",
        model3d: "3D Model (STEP)",
        related: "Related in",
        viewDetails: "View Details"
      }
    },
    materials: {
      title: "Materials and Craft",
      construction: "Construction Methods and Panel Variations",
      library: "Wood Library",
      fingerJoint: "Finger Joint",
      fingerJointDesc: "Interlocking \"fingers\" cut into the ends of wood pieces to extend length. Provides immense structural strength and maximizes yield from timber. Ideal for painted frames and long countertops.",
      edgeGlue: "Edge Glue (Full Stave)",
      edgeGlueDesc: "Boards glued side-by-side running the full length of the piece. Creates a continuous, premium grain appearance. Preferred for high-end dining tables and premium visible surfaces.",
      butcherBlock: "Butcher Block",
      butcherBlockDesc: "Thick strips of wood glued together. Extremely durable and stable. Commonly used for heavy-duty workbenches, kitchen islands, and industrial style tops.",
      finishes: "Finishes and Specs",
      moisture: "Moisture Content",
      moistureDesc: "All lumber is Kiln Dried (KD) to 8-10% prior to production to prevent warping and cracking. Monitored via electric moisture meters.",
      pu: "PU Lacquer",
      puDesc: "Polyurethane finish providing a durable, hard shell resistant to water, heat, and scratches. Ideal for dining tables.",
      nc: "NC Lacquer",
      ncDesc: "Nitrocellulose finish for a natural, thin-film look that enhances wood grain depth. Easy to repair but less water resistant.",
      uv: "UV Coating",
      uvDesc: "Ultraviolet cured coating for high-volume, instant-cure production lines. Extremely consistent and chemically resistant.",
      request: "Request Samples",
      requestDesc: "We provide physical wood and finish samples for development teams.",
      orderKit: "Order Sample Kit"
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
      companyProfile: "Company Profile",
      profileDesc: "Download our comprehensive capability statement and factory overview (PDF).",
      downloadPdf: "Download PDF",
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
      desc: "PZ operates a strategic dual-shore manufacturing network. With massive facilities in both China and Cambodia, plus a domestic warehouse in Los Angeles, we offer a resilient supply chain immune to single-point failures.",
      clientDist: "Global Client Distribution",
      clientDesc: "We serve clients across North America, Europe, and the Middle East, with a strong concentration in the USA and Canada.",
      stats: {
        sqft: "Total Sq.Ft Capacity",
        brands: "Major US Brands",
        units: "Monthly Unit Capacity",
        logistics: "US Logistics Hub"
      },
      leadTime: "Lead Time Overview",
      sampleDev: "Sample Development",
      initProd: "Initial Production",
      reOrder: "Re-Order Production",
      leadTimeNote: "* Lead times may vary based on material availability and order volume.",
      logisticsTitle: "Logistics and FOB",
      chinaOrigin: "China Origin",
      khOrigin: "Cambodia Origin",
      shippingDesc: "We support FCL (Full Container Load) and LCL consolidation. Drop-shipping programs available via our US warehouse.",
      supplyChain: "Supply Chain Solutions",
      supplyChainDesc: "We don't just make furniture; we deliver it. From FOB manufacturing in Southeast Asia to Last-Mile capability in the United States.",
      flexible: "Flexible Export",
      flexibleDesc: "Choose between China or Cambodia origin based on your tariff strategy and lead time requirements.",
      warehouse: "US Warehouse (Los Angeles)",
      warehouseDesc: "129,000 sq.ft warehouse in California allowing for domestic replenishment and drop-ship programs."
    },
    studio: {
       title: "The Studio",
       subtitle: "Where Design Meets Precision",
       design: "Design",
       designTitle: "Architectural Thinking",
       designDesc1: "We approach furniture not just as objects, but as architectural elements. Every curve and joint is considered.",
       designDesc2: "Our design team collaborates with global partners to bring sketches to life.",
       eng: "Engineering",
       engTitle: "Structural Integrity",
       engDesc: "Beauty must be durable. Our engineering process ensures longevity.",
       raw: "Raw Materials",
       rawTitle: "Premium Selection",
       rawDesc: "We source the finest hardwoods from sustainable forests.",
       exploreMat: "Explore Materials"
    }
  },
  zh: {
    common: {
      readMore: "阅读更多",
      viewDetails: "查看详情",
      learnMore: "了解更多",
      contactUs: "联系我们",
      search: "搜索",
      searchPlaceholder: "输入以搜索产品...",
      searchRefine: "优化搜索结果...",
      backHome: "返回首页",
      loading: "加载中",
      close: "关闭",
      explore: "探索",
      connect: "建立联系",
      privacy: "隐私政策",
      terms: "服务条款",
      rights: "版权所有。",
      startProject: "开启项目",
      tradeProgram: "贸易计划",
      adminAccess: "管理员入口",
      location_cn: "中国肇庆",
      location_kh: "柬埔寨干拉",
      factory_01: "第一工厂"
    },
    home: {
      subtitle: "家具制造",
      heroTitle: "高端实木制造",
      heroSub: "PZ 精密木工",
      heroQuote: "“以精密制造连接全球设计。”",
      viewLibrary: "查看木材库",
      factoryProfile: "工厂概况",
      factoryStrength: "工厂实力",
      strengthTitle: "专为高端零售设计。",
      strengthDesc1: "PZ 不仅仅是一家工厂，我们是一个工业规模的专业实木工作室。我们弥合了美国顶级品牌所需的精品质量与亚洲制造业的大规模产能之间的差距。",
      strengthDesc2: "我们连接了美国顶级品牌所需的精品级质量与亚洲的高效制造能力——按照全球标准交付设计精确度、工程稳定性和持续的产能。",
      stats: {
        factories: "工厂 (中 + 柬)",
        exp: "年经验",
        partners: "美国伙伴"
      },
      competencies: "核心竞争力",
      comp1Title: "精通材质",
      comp1Desc: "专注于硬实木加工，具备完整的监管链和湿度控制。",
      comp2Title: "双岸供应",
      comp2Desc: "在中国和柬埔寨之间无缝切换生产，以优化关税、交货期和产能。",
      comp3Title: "先进榫卯",
      comp3Desc: "结合五轴 CNC 精度与传统榫卯技术，打造结构稳固且美观的家具。",
      visitUs: "参观我们",
      globalHubs: "全球制造中心",
      globalDesc: "我们的双岸战略确保我们能满足任何产量或关税要求。联系我们安排工厂参观或审计。",
      chinaLoc: "总部及主要设施",
      cambodiaLoc: "低关税工厂",
      readyToScale: "准备好扩大规模了吗？",
      exploreMfg: "探索制造"
    },
    about: {
      since: "始于 2014",
      title: "全球设计品牌背后的隐形力量",
      intro: "PZ Precision Woodworks 是一家以设计为导向的合作伙伴，服务于全美前30大家具品牌。从中国南方的起源到扩展至柬埔寨，我们在现代设计美学与工业级精度之间架起了桥梁。",
      bannerText: "“规模化的工匠精神。”",
      storyTitle: "我们的故事",
      storyP1: "PZ 的建立只为一个目标：证明现代工厂不仅在产量上，更在智能、精度和适应性上能够匹配全球标准。",
      storyP2: "随着家具市场的发展，我们看到品牌很难找到能够扩大规模，同时仍尊重细节、工程逻辑和设计初衷的制造合作伙伴。大多数工厂关注产量。很少有工厂关注改进。更少有工厂关注合作伙伴关系。",
      storyP3: "我们选择了一条不同的道路。",
      storyP4: "从自动化生产线到数据驱动的质量控制，从多树种实木加工到灵活的组装工作流，PZ 持续投资于让我们能够应对快速变化的行业的能力。每年，我们升级设备、扩展品类并优化生产工程——因为我们服务的品牌在不断增长，我们也随之成长。",
      storyP5: "我们的优势不仅在于机器。更在于我们倾听、分析、优化和执行的能力。我们作为技术问题解决者与设计师和买手合作，将草图和原型转化为稳定、可重复且高效制造的产品。",
      storyP6: "最初的一个车间现已成为一个具有前瞻性的制造平台——建立在纪律、创新和对长期合作伙伴关系的承诺之上。我们不仅仅是在生产家具；我们正在建立全球品牌可以信赖的制造业未来。",
      pillars: {
        elite: "精英合作伙伴",
        eliteDesc: "我们与美国家具零售界最负盛名的品牌建立了长期的 OEM/ODM 关系。我们对“高街”质量标准的理解在业内无出其右。",
        dual: "中国 + 柬埔寨",
        dualDesc: "我们在中国（肇庆）和柬埔寨（干拉）拥有全资设施，为合作伙伴提供针对关税的战略灵活性。这是一种具有韧性的“双岸”战略。",
        logistics: "美国物流",
        logisticsDesc: "我们位于洛杉矶的 129,167 平方英尺仓库支持美国国内履约和一件代发项目，确保您的产品始终触手可及。"
      },
      process: {
        label: "工艺流程",
        title: "工厂内部",
        clickExpand: "点击图片放大"
      },
      journey: "发展历程",
      milestones: {
        2014: { title: "成立", desc: "在广东东莞成立。旅程始于对纯实木工艺的专注。" },
        2018: { title: "美国扩张", desc: "启动洛杉矶仓库和履约中心，直接服务北美客户。" },
        2021: { title: "柬埔寨工厂", desc: "在干拉省开设工厂，以扩大产能并提供低关税解决方案。" },
        2024: { title: "自动化", desc: "肇庆总部扩建。专注于可持续混合材料和先进的自动化涂装线。" }
      }
    },
    manufacturing: {
      title: "先进制造",
      subtitle: "工业的艺术",
      intro: "我们在手工木艺与工业 4.0 自动化的交汇点运营。我们的设施旨在以规模化交付始终如一的精度。",
      tabs: {
        process: "生产流程",
        machinery: "机械与技术",
        qc: "质量控制"
      },
      machinery: {
        title: "世界级设备",
        desc: "我们投资于最好的德国和意大利机械以确保一致性。我们的自动化生产线减少了批量生产中的人为错误，而五轴路由器则实现了复杂的设计。",
        highPrecision: "高精度铣削",
        autoFinish: "自动化涂装",
        climate: "恒温恒湿设施"
      },
      qc: {
        title: "严格标准",
        desc: "质量不是事后诸葛亮；它嵌入在每一个步骤中。我们遵循严格的 AQL 标准和美国合规法规。",
        iqc: "进料质检 (IQC)",
        iqcDesc: "木材分级、含水率检查 (8-12%) 和五金验证。",
        ipqc: "制程质检 (IPQC)",
        ipqcDesc: "首件检验、CNC 尺寸检查和砂光质量审查。",
        fqc: "最终质检 (FQC)",
        fqcDesc: "基于 AQL 2.5/4.0 的装运前检验。组装测试和纸箱跌落测试。",
        compliance: "合规性"
      }
    },
    capabilities: {
      title: "技术能力",
      subtitle: "工程化您的愿景",
      intro: "制造不仅仅是执行；更是解决问题。我们的工程团队在早期与您的设计师合作，确保可行性、成本效益和结构完整性。",
      categories: "产品类别",
      limits: {
        title: "尺寸与技术限制",
        subtitle: "标准生产线的工程约束。",
        request: "申请定制评估",
        maxDim: "最大尺寸",
        precision: "精度",
        materials: "材质",
        length: "长度",
        width: "宽度",
        thickness: "厚度",
        cncTol: "CNC 公差",
        moisture: "含水率",
        gloss: "光泽度",
        solidWood: "实木",
        veneer: "木皮",
        mixed: "混合 (金属/石材)"
      },
      oem: {
        service: "服务模式",
        title: "OEM 与 ODM 服务",
        desc: "无论您是有准备好制造的完整 CAD 图纸 (OEM)，还是需要我们从概念草图开发产品 (ODM)，我们的工程团队都会融入整个流程。",
        oemTitle: "OEM (按图制造)",
        oemDesc: "精确执行您的技术图纸。材料匹配和严格的公差遵守。",
        odmTitle: "ODM (设计支持)",
        odmDesc: "我们提供结构工程、价值工程和原型设计以实现您的愿景。"
      },
      compliance: {
        title: "技术合规",
        desc: "我们确保所有产品符合目标市场的监管标准，特别关注美国和欧盟市场。",
        safety: "化学安全",
        safetyDesc: "TSCA Title VI (甲醛), CA Prop 65 合规。",
        sustain: "可持续性",
        sustainDesc: "可按需提供 FSC 认证木材。符合 EUTR 采购标准。",
        pack: "包装",
        packDesc: "ISTA-3A / 6A 测试，适用于电商耐用性。"
      },
      cta: {
        title: "有定制项目？",
        btn: "开始开发"
      }
    },
    collections: {
      title: "系列与能力",
      intro: "按制造学科分类。我们专注于住宅和商业应用的纯实木制造。",
      collection: "系列",
      viewProducts: "查看产品",
      overview: "概览",
      needCatalog: "需要目录？",
      catalogDesc: "下载此系列的完整 PDF 规格表。",
      requestPdf: "索取 PDF",
      availableSpecs: "可用规格",
      viewOptions: "查看选项",
      // PDP
      pdp: {
        techDims: "技术尺寸",
        drawingUnavailable: "暂无数字线条图",
        ref: "参考",
        matSelection: "材质选择",
        inquireOrder: "咨询下单",
        share: "分享产品",
        description: "描述",
        descExtra: "设计理念兼顾耐用性与美学纯粹性。这件作品体现了我们对精密制造的承诺，利用了五轴 CNC 技术和传统榫卯。",
        matConst: "材质与结构",
        primaryWood: "主要木材",
        finish: "表面处理",
        joinery: "榫卯结构",
        hardware: "五金配件",
        downloads: "下载",
        specSheet: "产品规格表 (PDF)",
        model3d: "3D 模型 (STEP)",
        related: "相关产品",
        viewDetails: "查看详情"
      }
    },
    materials: {
      title: "材质与工艺",
      construction: "结构方法与板材变体",
      library: "木材库",
      fingerJoint: "指接",
      fingerJointDesc: "在木材两端切出互锁的“手指”以延长长度。提供巨大的结构强度并最大化木材出材率。非常适合喷漆框架和长台面。",
      edgeGlue: "直拼 (全长板)",
      edgeGlueDesc: "板材并排胶合，贯穿整件作品的全长。营造连续的高级纹理外观。首选用于高端餐桌和高级可见表面。",
      butcherBlock: "层压木 (砧板结构)",
      butcherBlockDesc: "厚木条胶合在一起。极其耐用且稳定。常用于重型工作台、厨房岛台和工业风格台面。",
      finishes: "表面处理与规格",
      moisture: "含水率",
      moistureDesc: "所有木材在生产前均窑干 (KD) 至 8-10%，以防止翘曲和开裂。通过电子水分仪监控。",
      pu: "PU 漆",
      puDesc: "聚氨酯面漆，提供耐用、坚硬的外壳，防水、耐热、耐刮擦。非常适合餐桌。",
      nc: "NC 漆",
      ncDesc: "硝基纤维素面漆，外观自然、漆膜薄，增强木纹深度。易于修复但耐水性较差。",
      uv: "UV 涂层",
      uvDesc: "紫外线固化涂层，用于大批量、即时固化的生产线。极其一致且耐化学腐蚀。",
      request: "索取样品",
      requestDesc: "我们为开发团队提供实物木材和饰面样品。",
      orderKit: "订购样品包"
    },
    inquire: {
      title: "开启对话",
      desc: "无论您是寻找 ODM 合作伙伴的全球家具品牌，还是为商业项目指定规格的建筑师，我们都准备好执行您的愿景。",
      trade: "贸易计划",
      tradeDesc: "为室内设计师和建筑师提供独家定价和定制能力。",
      oem: "ODM / OEM 服务",
      oemDesc: "零售品牌的全方位制造。适用最低起订量。",
      catalog: "数字目录",
      catalogDesc: "通过表格索取我们的综合规格指南。包括完整的材料库、榫卯细节和工厂能力。",
      companyProfile: "公司简介",
      profileDesc: "下载我们的综合能力声明和工厂概览 (PDF)。",
      downloadPdf: "下载 PDF",
      form: {
        name: "姓名",
        company: "公司",
        email: "电子邮件地址",
        type: "咨询类型",
        message: "留言",
        send: "发送咨询",
        sending: "发送中",
        success: "谢谢",
        successDesc: "已收到您的咨询。我们的团队将审核您的项目需求并尽快回复。",
        again: "发送另一条消息"
      },
      types: {
        general: "一般咨询",
        catalog: "目录索取",
        trade: "贸易计划申请",
        oem: "ODM / OEM 合作伙伴关系"
      }
    },
    capacity: {
      footprint: "制造足迹",
      title: "全球规模，本地精度",
      desc: "PZ 运营着战略性的双岸制造网络。凭借在中国和柬埔寨的大型设施，加上洛杉矶的国内仓库，我们提供不受单点故障影响的弹性供应链。",
      clientDist: "全球客户分布",
      clientDesc: "我们服务于北美、欧洲和中东的客户，主要集中在美国和加拿大。",
      stats: {
        sqft: "总产能 (平方英尺)",
        brands: "主要美国品牌",
        units: "月产能 (件)",
        logistics: "美国物流中心"
      },
      leadTime: "交货期概览",
      sampleDev: "样品开发",
      initProd: "初始生产",
      reOrder: "返单生产",
      leadTimeNote: "* 交货期可能因材料供应和订单量而异。",
      logisticsTitle: "物流与 FOB",
      chinaOrigin: "中国原产",
      khOrigin: "柬埔寨原产",
      shippingDesc: "我们支持 FCL (整箱) 和 LCL 拼箱。通过我们的美国仓库提供一件代发项目。",
      supplyChain: "供应链解决方案",
      supplyChainDesc: "我们不只是制造家具；我们交付家具。从东南亚的 FOB 制造到美国的最后一英里能力。",
      flexible: "灵活出口",
      flexibleDesc: "根据您的关税策略和交货期要求，在中国或柬埔寨原产地之间选择。",
      warehouse: "美国仓库 (洛杉矶)",
      warehouseDesc: "位于加利福尼亚州的 129,000 平方英尺仓库，允许国内补货和一件代发项目。"
    },
    studio: {
       title: "工作室",
       subtitle: "设计遇见精度",
       design: "设计",
       designTitle: "建筑思维",
       designDesc1: "我们将家具不仅视为物体，更视为建筑元素。每一条曲线和接缝都经过深思熟虑。",
       designDesc2: "我们的设计团队与全球合作伙伴合作，将草图变为现实。",
       eng: "工程",
       engTitle: "结构完整性",
       engDesc: "美必须耐用。我们的工程流程确保长久的使用寿命。",
       raw: "原材料",
       rawTitle: "优质甄选",
       rawDesc: "我们从可持续森林中采购最好的硬木。",
       exploreMat: "探索材质"
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
