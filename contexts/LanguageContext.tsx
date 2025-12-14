
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
    // ... (Existing Nav/Home/etc translations kept implicitly)
    nav: {
      header: {
        home: "Home",
        capabilities: "Capabilities",
        manufacturing: "Manufacturing",
        materials: "Materials",
        portfolio: "Portfolio",
        capacity: "Global Capacity",
        about: "About",
        inquire: "Inquire"
      },
      mega: {
        solidWoodProjects: "Solid Wood Projects",
        diningTables: "Dining Tables",
        butcherBlock: "Butcher Block",
        solidComponents: "Solid Components",
        seatingProjects: "Seating Projects",
        diningChairs: "Dining Chairs",
        accentChairs: "Accent Chairs",
        barStools: "Bar Stools",
        metalMixed: "Metal & Mixed",
        metalBases: "Metal Bases",
        mixedMaterials: "Mixed Materials",
        customFabrication: "Custom Fabrication",
        casegoods: "Casegoods",
        mediaConsoles: "Media Consoles",
        nightstands: "Nightstands",
        storageUnits: "Storage Units",
        process: "Process",
        lumberPrep: "Lumber Prep",
        cnc5Axis: "5-Axis CNC",
        autoFinishing: "Auto-Finishing",
        standards: "Standards",
        incomingQC: "Incoming QC",
        inProcessQC: "In-Process QC",
        finalInspection: "Final Inspection",
        services: "Services",
        oemProduction: "OEM Production",
        odmDesign: "ODM Design",
        valueEngineering: "Value Engineering",
        compliance: "Compliance",
        tscaTitleVI: "TSCA Title VI",
        fscCertification: "FSC Certification",
        istaPackaging: "ISTA Packaging",
        focusSolid: "Solid Wood",
        focusPrecision: "Precision",
        focusEng: "Engineering",
        focusLogistics: "Logistics"
      }
    },
    home: {
      subtitle: "Furniture Manufacturing",
      heroTitle: "Engineered for Scalable Manufacturing",
      heroSub: "PZ",
      heroQuote: "\"Bridging Global Design with Precision Manufacturing.\"",
      heroBtnPrimary: "Factory Capabilities",
      heroBtnSecondary: "Production Process",
      heroBtnTertiary: "Material & Wood Library",
      viewLibrary: "View Wood Library",
      factoryProfile: "Factory Profile",
      factoryStrength: "Factory Strength",
      strengthTitle: "Engineered for High-End Retail.",
      strengthDesc1: "PZ is a solid wood manufacturing partner serving design-driven brands. We focus on material control, precise execution, and stable production at scale—supporting programs that require consistency, not just one-off builds.",
      strengthDesc2: "We bridge the gap between the boutique-level quality demanded by leading US brands and the high-efficiency manufacturing capabilities of Asia—delivering design accuracy, engineering stability, and consistent volume at global standards.",
      strengthSection: {
        autoFinishDesc: "Integrated finishing workflows combining automated coating, controlled curing, and skilled manual intervention to ensure surface consistency across production runs.",
        highPrecisionDesc: "Precision CNC machining systems supporting complex joinery, curved profiles, and tight dimensional tolerances for solid wood and mixed-material components.",
        climateDesc: "Climate-controlled workshops and centralized dust extraction systems designed to maintain material stability throughout milling, assembly, and finishing stages."
      },
      stats: {
        factories: "Factories (CN + CAM)",
        exp: "Years Exp.",
        partners: "US Partners"
      },
      competencies: "Core Competencies",
      comp1Title: "Material Mastery",
      comp1Desc: "Focused on solid hardwood processing with controlled sourcing, moisture management, and material consistency across production batches.",
      comp2Title: "Dual-Shore Supply",
      comp2Desc: "Operating production capabilities in both China and Cambodia, allowing flexible origin planning based on tariffs, lead times, and order scale.",
      comp3Title: "Advanced Joinery",
      comp3Desc: "Combining CNC machining with proven joinery methods to produce structurally reliable furniture components with consistent fit and finish.",
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
      title: "Where Engineering Turns Ideas into Production",
      intro: "PZ is an engineering-driven solid wood manufacturer operating at industrial scale. By aligning material science, production systems, and process control, we turn concepts into reliable, repeatable manufacturing outcomes.",
      bannerText: "\"Craftsmanship at Scale.\"",
      storyTitle: "Our Story",
      storyP1: "PZ was built to demonstrate that a modern solid wood factory can deliver both scale and control—without treating quality as an exception.",
      storyP2: "As brands grew, we saw recurring gaps between design intent and manufacturing reality. Many factories were optimized for output, but not for refinement, engineering feedback, or long-term partnership.",
      storyP3: "We structured PZ around process clarity, repeatability, and collaboration—so improvement is continuous, not reactive.",
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
      galleryItems: {
        raw: { title: "Raw Lumber Selection", desc: "We source primarily FAS-grade hardwood lumber, focusing on consistent grain, controlled moisture content, and suitability for furniture and architectural applications." },
        milling: { title: "Precision Milling", desc: "CNC-based milling processes are used to achieve accurate joinery, smooth profiles, and repeatable part geometry prior to assembly." },
        automation: { title: "Production Automation", desc: "Selective automation is applied in machining and finishing stages to improve consistency and throughput, while retaining flexibility for custom and mixed-order production." },
        finishing: { title: "Hand Finishing", desc: "Manual sanding and finishing are applied where required to refine surfaces, edges, and transitions that benefit from human inspection and adjustment." },
        qc: { title: "Quality Control", desc: "Quality checks are integrated across key production stages, including material intake, machining, finishing, and final inspection, to support durability and visual consistency." }
      },
      journey: "Our Journey",
      milestones: {
        2014: { 
          title: "PZ Origins", 
          desc: "Established in Dongguan, Guangdong. The journey began with a focus on pure solid wood craftsmanship." 
        },
        2018: { 
          title: "Scaling Capability", 
          desc: "Relocated manufacturing operations from Dongguan to Zhaoqing to scale capacity, alongside launching the Los Angeles warehouse for US fulfillment." 
        },
        2021: { 
          title: "Supply Chain & Risk Engineering", 
          desc: "Opened our first overseas facility in Sihanoukville to engineer low-tariff production pathways. This allowed us to test cross-border supply chain control, workforce training, and quality consistency outside China." 
        },
        2024: { 
          title: "Manufacturing System Upgrade", 
          desc: "Zhaoqing HQ expansion with a focus on automation and process stability. Investment in advanced finishing lines, controlled environments, and repeatable production systems to reduce variability at scale." 
        },
        2025: { 
          title: "China + 1 Strategy", 
          desc: "Strategic re-entry into Cambodia to establish a China + 1 manufacturing structure. By operating parallel production systems across China and Southeast Asia, PZ is engineered to adapt to global policy shifts, tariff changes, and supply chain uncertainty—without compromising quality or delivery reliability." 
        }
      }
    },
    manufacturing: {
      title: "Engineered Manufacturing Systems",
      subtitle: "The Art of Industry",
      intro: "We design and operate integrated manufacturing systems that prioritize precision, repeatability, and scalable output—built for long production runs and complex solid wood programs.",
      tabs: {
        process: "Production Process",
        machinery: "Machinery and Tech",
        qc: "Quality Control"
      },
      machinery: {
        title: "Production Consistency by Design",
        desc: "Our manufacturing infrastructure is engineered to minimize variation across materials, processes, and production volumes. By combining CNC-based machining, automated finishing workflows, and tightly controlled environmental conditions, we ensure stable output for both standardized programs and design-driven components.",
        highPrecision: "High-Precision Routing",
        autoFinish: "Automated Finishing",
        climate: "Controlled Infrastructure"
      },
      qc: {
        title: "Rigorous Standards",
        desc: "Quality is not an afterthought; it is embedded in every step. We follow strict AQL standards and U.S. compliance regulations.",
        iqc: "Incoming QC (IQC)",
        iqcDesc: "Lumber grading, moisture content checks (8-12%) and hardware validation.",
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
      collection: "系列",
      viewProducts: "查看产品",
      overview: "概览",
      needCatalog: "需要目录？",
      catalogDesc: "下载此系列的完整 PDF 规格表。",
      requestPdf: "请求 PDF",
      availableSpecs: "可用规格",
      viewOptions: "查看选项",
      pdp: {
        techDims: "技术尺寸",
        drawingUnavailable: "数字线图不可用",
        ref: "参考",
        matSelection: "材料选择",
        inquireOrder: "咨询订购",
        share: "分享产品",
        description: "描述",
        descExtra: "设计时考虑到耐用性和美学纯度。这件作品体现了我们对精密制造的承诺，利用了 5 轴 CNC 技术和传统榫卯。",
        matConst: "材料与结构",
        primaryWood: "主要木材",
        finish: "涂装",
        joinery: "榫卯",
        hardware: "五金",
        downloads: "下载",
        specSheet: "产品规格表 (PDF)",
        model3d: "3D 模型 (STEP)",
        related: "相关产品",
        viewDetails: "查看详情"
      }
    },
    materials: {
      title: "材料与工艺",
      construction: "结构方法与板材变体",
      library: "木材库",
      fingerJoint: "指接",
      fingerJointDesc: "切入木块末端的互锁“手指”以延长长度。提供巨大的结构强度并最大化木材利用率。非常适合油漆框架和长台面。",
      edgeGlue: "直拼 (全长)",
      edgeGlueDesc: "板材并排胶合，贯穿整件作品的长度。创造连续、优质的纹理外观。首选用于高端餐桌和高级可见表面。",
      butcherBlock: "层压木",
      butcherBlockDesc: "厚木条胶合在一起。极其耐用且稳定。常用于重型工作台、厨房岛台和工业风格台面。",
      finishes: "涂装与规格",
      moisture: "含水率",
      moistureDesc: "所有木材在生产前均窑干 (KD) 至 8-10%，以防止翘曲和开裂。通过电子水分仪监控。",
      pu: "PU 漆",
      puDesc: "聚氨酯涂层提供耐用、坚硬的外壳，防水、耐热、耐刮擦。非常适合餐桌。",
      nc: "NC 漆",
      ncDesc: "硝基纤维素涂层，呈现自然、薄膜外观，增强木材纹理深度。易于修复，但耐水性较差。",
      uv: "UV 涂层",
      uvDesc: "紫外线固化涂层，用于大批量、即时固化生产线。极其一致且耐化学腐蚀。",
      request: "请求样品",
      requestDesc: "我们为开发团队提供实物木材和涂装样品。",
      orderKit: "订购样品包"
    },
    inquire: {
      title: "开始对话",
      desc: "无论您是寻找 ODM 合作伙伴的全球家具品牌，还是为商业项目指定规格的建筑师，我们都准备好执行您的愿景。",
      trade: "贸易计划",
      tradeDesc: "为室内设计师和建筑师提供独家定价和定制能力。",
      oem: "ODM / OEM 服务",
      oemDesc: "为零售品牌提供全规模制造。适用最低订购量。",
      catalog: "数字目录",
      catalogDesc: "通过表格请求我们的综合规格指南。包含完整的材料库、榫卯细节和工厂能力。",
      companyProfile: "公司简介",
      profileDesc: "下载我们的综合能力声明和工厂概览 (PDF)。",
      downloadPdf: "下载 PDF",
      form: {
        name: "姓名",
        company: "公司",
        email: "电子邮件地址",
        type: "咨询类型",
        message: "信息",
        send: "发送咨询",
        sending: "发送中",
        success: "谢谢",
        successDesc: "已收到您的咨询。我们的团队将审核您的项目需求并尽快回复。",
        again: "发送另一条信息"
      },
      types: {
        general: "一般咨询",
        catalog: "目录请求",
        trade: "贸易计划申请",
        oem: "ODM / OEM 合作"
      }
    },
    capacity: {
      footprint: "制造足迹",
      title: "全球规模，本地精度",
      desc: "PZ 运营着一个战略性的双岸制造网络。在中国和柬埔寨拥有大型设施，加上洛杉矶的国内仓库，我们提供不受单点故障影响的弹性供应链。",
      clientDist: "全球客户分布",
      clientDesc: "我们服务于北美、欧洲和中东的客户，重点集中在美国和加拿大。",
      stats: {
        sqft: "总平方英尺产能",
        brands: "主要美国品牌",
        units: "月产能单位",
        logistics: "美国物流中心"
      },
      locations: {
        cn_title: "肇庆总部",
        cn_desc: "我们的主要园区，专注于复杂的研发、混合材料制造和精湛工艺。我们的工程卓越中心。",
        kh_title: "柬埔寨工厂",
        kh_desc: "位于干拉省的战略性低关税制造中心，专为大批量生产和具有成本效益的可扩展性而量身定制。",
        usa_title: "美国市场",
        usa_desc: "我们最大的市场。我们通过洛杉矶仓库为 30 多个主要美国品牌提供直接集装箱计划和国内库存解决方案。",
        can_title: "加拿大市场",
        can_desc: "为加拿大零售商提供优质实木家具，具有耐寒气候的涂装和结构。",
        uk_title: "英国",
        uk_desc: "向英国分销商出口符合英国标准的独特细木工和阻燃软包家具。",
        de_title: "欧盟（德国）",
        de_desc: "满足挑剔的欧洲客户严格的欧盟可持续性 (EUTR) 和化学安全标准。",
        me_title: "中东",
        me_desc: "为该地区的豪华酒店项目和高端住宅开发项目提供服务。"
      },
      leadTime: "交货时间概览",
      sampleDev: "样品开发",
      initProd: "初始生产",
      reOrder: "返单生产",
      leadTimeNote: "* 交货时间可能因材料可用性和订单量而异。",
      logisticsTitle: "物流与 FOB",
      chinaOrigin: "中国原产",
      khOrigin: "柬埔寨原产",
      shippingDesc: "我们支持 FCL (整箱装载) 和 LCL 拼箱。通过我们的美国仓库提供一件代发计划。",
      supplyChain: "供应链解决方案",
      supplyChainDesc: "我们不仅制造家具；我们交付家具。从东南亚的 FOB 制造到美国的最后一英里能力。",
      flexible: "灵活出口",
      flexibleDesc: "根据您的关税策略和交货时间要求，选择中国或柬埔寨原产地。",
      warehouse: "美国仓库 (洛杉矶)",
      warehouseDesc: "位于加利福尼亚州的 129,000 平方英尺仓库，允许国内补货和一件代发计划。"
    },
    studio: {
       title: "工作室",
       subtitle: "设计遇见精度的地方",
       design: "设计",
       designTitle: "建筑思维",
       designDesc1: "我们将家具不仅视为物体，而且视为建筑元素。每一条曲线和接缝都经过深思熟虑。",
       designDesc2: "我们的设计团队与全球合作伙伴合作，将草图变为现实。",
       eng: "工程",
       engTitle: "结构完整性",
       engDesc: "美必须耐用。我们的工程流程确保长寿。",
       raw: "原材料",
       rawTitle: "优质精选",
       rawDesc: "我们从可持续森林采购最好的硬木。",
       exploreMat: "探索材料"
    },
    // --- ADMIN & CREATOR ---
    admin: {
      dashboard: "管理后台",
      openCreator: "打开创作工作室",
      viewSite: "查看网站",
      logout: "退出登录",
      inquiries: "咨询列表",
      exportCsv: "导出 CSV",
      noData: "没有符合条件的咨询。",
      loading: "数据加载中...",
      cols: { date: "日期", name: "姓名", company: "公司", type: "类型", msg: "留言", status: "状态" }
    },
    creator: {
      title: "创作模式",
      editing: "编辑中",
      backAdmin: "返回管理后台",
      tabs: { inventory: "库存管理", config: "网站配置", media: "媒体库" },
      status: { connected: "云端配置已连接", local: "本地模式", syncing: "同步中..." },
      inventory: {
        manage: "库存管理",
        desc: "搜索并管理您的产品库存。",
        search: "搜索库存...",
        noItems: "未找到项目",
        duplicate: "复制 / 创建变体",
        delete: "删除",
        edit: "编辑"
      },
      form: {
        edit: "编辑产品",
        add: "添加新产品",
        cancel: "取消",
        status: "状态",
        mainCat: "主分类",
        subCat: "子分类",
        create: "+ 新建",
        cancelNew: "取消新建",
        nameEn: "产品名称 (EN)",
        nameZh: "产品名称 (中文)",
        specs: "规格参数",
        material: "材质",
        dims: "尺寸",
        code: "产品代码",
        autoGen: "生成",
        descEn: "描述 (EN)",
        descZh: "描述 (中文)",
        colors: "颜色变体",
        addColor: "添加颜色",
        gallery: "图库",
        saveDraft: "保存草稿",
        publish: "发布产品",
        update: "更新产品",
        processing: "处理中...",
        delete: "删除产品"
      }
    },
    // NEW: Site Config Translations
    siteConfig: {
      sections: {
        "Global Settings": "全局设置",
        "Navigation Menu (Featured Images)": "导航菜单（特色图片）",
        "Home Page / Hero": "首页 / 主视觉",
        "Home Page / Sections": "首页 / 版块",
        "Home Page / Global Hubs": "首页 / 全球中心",
        "The Studio Page": "工作室页面",
        "About Page": "关于我们页面",
        "Manufacturing Page": "制造页面",
        "Global Capacity / Locations": "全球产能 / 地点",
        "Materials / Construction": "材料 / 结构工艺",
        "Materials / Wood Library": "材料 / 木材库",
      },
      fields: {
        "catalog.url": { label: "产品目录 PDF", help: "上传主产品目录 (PDF). 将显示在作品集和咨询页面。" },
        "menu.feat_collections": { label: "作品集菜单图片" },
        "menu.feat_mfg": { label: "制造菜单图片" },
        "menu.feat_capabilities": { label: "能力菜单图片" },
        "menu.feat_default": { label: "默认菜单图片" },
        "home.hero.title": { label: "主标题" },
        "home.hero.image": { label: "主背景图片" },
        "home.factory.image": { label: "工厂版块图片" },
        "home.cta.image": { label: "页脚 CTA 背景图" },
        "home.hub_cn.image": { label: "中国中心图片" },
        "home.hub_kh.image": { label: "柬埔寨中心图片" },
        "studio.hero": { label: "工作室主图" },
        "studio.design": { label: "设计版块图片" },
        "about.banner": { label: "主电影感横幅" },
        "about.gallery.raw": { label: "图库：原木筛选" },
        "about.gallery.milling": { label: "图库：精密铣削" },
        "about.gallery.automation": { label: "图库：自动化" },
        "about.gallery.finishing": { label: "图库：手工修整" },
        "about.gallery.qc": { label: "图库：质量控制" },
        "manufacturing.hero_machinery": { label: "机械设备主图" },
        "manufacturing.hero_qc": { label: "质检/实验室主图" },
        "capacity.map_bg": { label: "世界地图背景" },
        "capacity.card_cn": { label: "中国总部卡片图" },
        "capacity.card_kh": { label: "柬埔寨工厂卡片图" },
        "capacity.loc_usa": { label: "地点：美国" },
        "capacity.loc_can": { label: "地点：加拿大" },
        "capacity.loc_uk": { label: "地点：英国" },
        "capacity.loc_de": { label: "地点：德国" },
        "capacity.loc_me": { label: "地点：中东" },
        "materials.const_finger": { label: "指接工艺" },
        "materials.const_edge": { label: "直拼工艺" },
        "materials.const_butcher": { label: "层压木工艺" },
        "materials.wood_oak": { label: "白橡木" },
        "materials.wood_walnut": { label: "黑胡桃" },
        "materials.wood_rubber": { label: "橡胶木" },
        "materials.wood_ash": { label: "白蜡木" },
        "materials.wood_beech": { label: "榉木" },
        "materials.wood_maple": { label: "硬枫木" },
        "materials.wood_teak": { label: "柚木" },
        "materials.wood_acacia": { label: "相思木" },
        "materials.wood_birch": { label: "桦木" },
        "materials.wood_bamboo": { label: "竹子" }
      }
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
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
