
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
      comp1Desc: "Specializing in North American hardwoods (Walnut, White Oak, Maple) with full chain-of-custody and moisture control.",
      comp2Title: "Dual-Shore Supply",
      comp2Desc: "Seamlessly switching production between China and Cambodia to optimize for tariffs, lead times, and capacity.",
      comp3Title: "Advanced Joinery",
      comp3Desc: "Combining 5-axis CNC precision with traditional joinery techniques to create furniture that is both structurally sound and beautiful.",
      visitUs: "Visit Us",
      globalHubs: "Global Manufacturing Hubs",
      globalDesc: "Our dual-shore strategy ensures we can meet any volume or tariff requirement. Contact us to schedule a factory tour or audit.",
      chinaLoc: "HQ & Main Facility",
      cambodiaLoc: "Tariff-Free Factory",
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
        2021: { title: "Cambodia Facility", desc: "Opened factory in Kandal Province to expand capacity and offer tariff-free solutions." },
        2024: { title: "Automation", desc: "Zhaoqing HQ expansion. Focusing on sustainable mixed-materials and advanced automated finishing lines." }
      }
    },
    manufacturing: {
      title: "Advanced Manufacturing",
      subtitle: "The Art of Industry",
      intro: "We operate at the intersection of artisanal woodcraft and Industry 4.0 automation. Our facilities are designed to deliver consistent precision at volume.",
      tabs: {
        process: "Production Process",
        machinery: "Machinery & Tech",
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
        title: "Size & Technical Limits",
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
        title: "OEM & ODM Services",
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
      title: "Collections & Capabilities",
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
        matConst: "Materials & Construction",
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
      title: "Materials & Craft",
      construction: "Construction Methods & Panel Variations",
      library: "Wood Library",
      fingerJoint: "Finger Joint",
      fingerJointDesc: "Interlocking \"fingers\" cut into the ends of wood pieces to extend length. Provides immense structural strength and maximizes yield from timber. Ideal for painted frames and long countertops.",
      edgeGlue: "Edge Glue (Full Stave)",
      edgeGlueDesc: "Boards glued side-by-side running the full length of the piece. Creates a continuous, premium grain appearance. Preferred for high-end dining tables and premium visible surfaces.",
      butcherBlock: "Butcher Block",
      butcherBlockDesc: "Thick strips of wood glued together. Extremely durable and stable. Commonly used for heavy-duty workbenches, kitchen islands, and industrial style tops.",
      finishes: "Finishes & Specs",
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
      logisticsTitle: "Logistics & FOB",
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
      adminAccess: "管理员入口",
      location_cn: "中国·肇庆",
      location_kh: "柬埔寨·干拉",
      factory_01: "第一工厂"
    },
    home: {
      subtitle: "高端家具制造",
      heroTitle: "高端实木制造",
      heroSub: "PZ 精密木造",
      heroQuote: "“将全球设计美学与精密制造工艺完美融合。”",
      viewLibrary: "浏览木材库",
      factoryProfile: "工厂概况",
      factoryStrength: "工厂实力",
      strengthTitle: "专为高端零售打造",
      strengthDesc1: "PZ不仅是一家工厂；我们是一座面向未来的现代实木制造平台，能够在工业化规模下实现高标准生产。",
      strengthDesc2: "我们连接美国领先品牌所追求的精品品质，与亚洲制造体系所具备的高效率与高产能，为客户提供设计精准度、工程稳定性以及全球水准的一致性生产能力。",
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
      cambodiaLoc: "免关税工厂",
      readyToScale: "准备好扩大规模了吗？",
      exploreMfg: "探索制造工艺"
    },
    about: {
      since: "始于 2014",
      title: "全球设计品牌背后的隐形力量",
      intro: "PZ Precision Woodworks 是服务于全美前30大家具品牌的设计驱动型制造合作伙伴。从中国华南起步到拓展至柬埔寨，我们架起了现代设计美学与工业级精度之间的桥梁。",
      bannerText: "“规模化的工匠精神。”",
      storyTitle: "品牌故事",
      storyP1: "PZ成立于一个明确的目标：证明现代化工厂不仅能实现产能，更能在智能化、精密度和适应性方面达到全球水准。",
      storyP2: "随着家具市场不断演变，我们看到许多品牌在寻找兼具规模与细节把控能力的制造伙伴时屡屡受阻。大多数工厂只追求产量，少数关注改进，更少愿意建立真正的长期合作关系。",
      storyP3: "而我们选择了一条不同的道路。",
      storyP4: "从自动化生产线到数据化质量管理，从多材质实木加工到灵活的装配流程，PZ持续投入先进能力，以应对快速变化的行业需求。每一年，我们都在升级设备、拓展品类、优化工程工艺——因为客户的品牌在成长，而我们必须与之共同成长。",
      storyP5: "我们的优势不仅是设备，更是思考与执行的能力。我们倾听、分析、优化并落地，与设计师和采购团队并肩作为技术解决者，将草图与原型转化为稳定、可量产、且品质一致的产品。",
      storyP6: "从最初的作坊形态，到如今面向未来的制造平台，PZ依靠纪律、创新和长期主义不断前进。我们不仅在生产家具；我们正在构建让全球品牌放心依靠的制造未来。",

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
    manufacturing: {
      title: "先进制造",
      subtitle: "工业的艺术",
      intro: "我们在这个木工技艺与工业4.0自动化的交汇点上运营。我们的设施旨在实现大规模的一致性与高精度。",
      tabs: {
        process: "生产流程",
        machinery: "设备与技术",
        qc: "质量控制"
      },
      machinery: {
        title: "世界级设备",
        desc: "我们投资于最好的德国和意大利机械以确保一致性。我们的自动化生产线减少了批量生产中的人为错误，而五轴数控机床则实现了复杂的设计。",
        highPrecision: "高精度铣削",
        autoFinish: "自动化涂装",
        climate: "恒温恒湿车间"
      },
      qc: {
        title: "严格标准",
        desc: "质量不是事后诸葛亮；它嵌入在每一步中。我们遵循严格的 AQL 标准和美国合规法规。",
        iqc: "来料检验 (IQC)",
        iqcDesc: "木材分级、含水率检查 (8-12%) 和五金验证。",
        ipqc: "制程检验 (IPQC)",
        ipqcDesc: "首件检验、CNC 尺寸检查和砂光质量审查。",
        fqc: "最终检验 (FQC)",
        fqcDesc: "基于 AQL 2.5/4.0 的装运前检验。组装测试和纸箱跌落测试。",
        compliance: "合规性"
      }
    },
    capabilities: {
      title: "技术能力",
      subtitle: "工程化您的愿景",
      intro: "制造不仅仅是执行，更是解决问题。我们的工程团队在早期与您的设计师合作，以确保可行性、成本效益和结构完整性。",
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
        mixed: "混合材质 (金属/石材)"
      },
      oem: {
        service: "服务模式",
        title: "OEM & ODM 服务",
        desc: "无论您是拥有准备好制造的完整 CAD 图纸 (OEM)，还是需要我们从概念草图开发产品 (ODM)，我们的工程团队都会融入整个流程。",
        oemTitle: "OEM (来图加工)",
        oemDesc: "严格按照您的技术图纸执行。材质匹配和严格的公差遵守。",
        odmTitle: "ODM (设计支持)",
        odmDesc: "我们提供结构工程、价值工程和原型制作以实现您的愿景。"
      },
      compliance: {
        title: "技术合规",
        desc: "我们确保所有产品符合目标市场的监管标准，特别关注美国和欧盟市场。",
        safety: "化学安全",
        safetyDesc: "TSCA Title VI (甲醛), CA Prop 65 合规。",
        sustain: "可持续性",
        sustainDesc: "可按需提供 FSC 认证木材。符合 EUTR 采购标准。",
        pack: "包装",
        packDesc: "适用于电商耐用性的 ISTA-3A / 6A 测试。"
      },
      cta: {
        title: "有定制项目？",
        btn: "开始开发"
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
      viewOptions: "查看选项",
      // PDP
      pdp: {
        techDims: "技术尺寸",
        drawingUnavailable: "暂无数字线稿",
        ref: "编号",
        matSelection: "材质选择",
        inquireOrder: "咨询订购",
        share: "分享产品",
        description: "产品描述",
        descExtra: "专为耐用性和美学纯度而设计。这件作品体现了我们对精密制造的承诺，利用五轴数控技术和传统榫卯工艺。",
        matConst: "材质与结构",
        primaryWood: "主材",
        finish: "涂装",
        joinery: "结构",
        hardware: "五金",
        downloads: "下载资料",
        specSheet: "产品规格表 (PDF)",
        model3d: "3D 模型 (STEP)",
        related: "相关产品",
        viewDetails: "查看详情"
      }
    },
    materials: {
      title: "材质与工艺",
      construction: "结构方法与拼板工艺",
      library: "木材库",
      fingerJoint: "指接 (Finger Joint)",
      fingerJointDesc: "在木材末端切割互锁的“手指”以延长长度。提供巨大的结构强度并最大化木材利用率。非常适合涂装框架和长台面。",
      edgeGlue: "直拼 (Edge Glue)",
      edgeGlueDesc: "板材沿长度方向并排胶合。创造连续、高级的纹理外观。首选用于高端餐桌和优质可见表面。",
      butcherBlock: "层压 (Butcher Block)",
      butcherBlockDesc: "厚木条胶合在一起。极其耐用且稳定。常用于重型工作台、厨房岛台和工业风格台面。",
      finishes: "涂装与规格",
      moisture: "含水率",
      moistureDesc: "所有木材在生产前均经过窑干 (KD) 至 8-10% 以防止翘曲和开裂。通过电子水分仪监控。",
      pu: "PU 漆",
      puDesc: "聚氨酯面漆提供耐用、坚硬的外壳，耐水、耐热和耐刮擦。餐桌的理想选择。",
      nc: "NC 漆",
      ncDesc: "硝基纤维素面漆，外观自然、漆膜薄，增强木纹深度。易于修复但耐水性较差。",
      uv: "UV 涂层",
      uvDesc: "用于大批量、即时固化生产线的紫外线固化涂层。极其一致且耐化学腐蚀。",
      request: "索取样品",
      requestDesc: "我们为开发团队提供实物木材和涂装样品。",
      orderKit: "订购样品包"
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
      companyProfile: "公司简介",
      profileDesc: "下载我们全面的能力声明和工厂概况 (PDF)。",
      downloadPdf: "下载 PDF",
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
      desc: "PZ运营着战略性的双岸制造网络。在中国和柬埔寨拥有大型工厂，加上洛杉矶的国内仓库，我们提供不受单点故障影响的弹性供应链。",
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
      reOrder: "翻单生产",
      leadTimeNote: "* 交货期可能因材料供应情况和订单量而异。",
      logisticsTitle: "物流与 FOB",
      chinaOrigin: "中国原产",
      khOrigin: "柬埔寨原产",
      shippingDesc: "我们支持 FCL（整箱）和 LCL 拼箱。通过我们的美国仓库提供一件代发项目。",
      supplyChain: "供应链解决方案",
      supplyChainDesc: "我们不只是制造家具；我们交付家具。从东南亚的 FOB 制造到美国的“最后一英里”能力。",
      flexible: "灵活出口",
      flexibleDesc: "根据您的关税策略和交货期要求，在中国或柬埔寨原产地之间选择。",
      warehouse: "美国仓库 (洛杉矶)",
      warehouseDesc: "位于加州的 129,000 平方英尺仓库，支持国内补货和一件代发项目。"
    },
    studio: {
       title: "工作室",
       subtitle: "设计与精度的交汇",
       design: "设计",
       designTitle: "建筑思维",
       designDesc1: "我们将家具不仅仅视为物体，而是建筑元素。每一个曲线和连接都经过深思熟虑。",
       designDesc2: "我们的设计团队与全球合作伙伴合作，将草图变为现实。",
       eng: "工程",
       engTitle: "结构完整性",
       engDesc: "美必须是耐用的。我们的工程流程确保使用寿命。",
       raw: "原材料",
       rawTitle: "优质甄选",
       rawDesc: "我们从可持续森林采购最好的硬木。",
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
