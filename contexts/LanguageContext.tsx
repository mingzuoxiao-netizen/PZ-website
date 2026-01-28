import React, { createContext, useContext, ReactNode } from 'react';

interface LanguageContextType {
  language: 'en';
  t: typeof translations.en;
  setLanguage: (lang: 'en') => void;
  toggleLanguage: () => void;
}

const translations = {
  en: {
    // --- PUBLIC SITE (English) ---
    common: {
      readMore: "Read More",
      viewDetails: "View Details",
      learnMore: "Learn More",
      contactUs: "Contact Us",
      search: "Search Archive",
      searchPlaceholder: "Enter search parameters...",
      searchRefine: "Refine search results...",
      backHome: "Back to Home",
      loading: "Synchronizing...",
      close: "Close",
      explore: "Explore",
      connect: "Connect",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      rights: "All technical rights reserved.",
      startProject: "Start Project Run",
      tradeProgram: "Industry Program",
      adminAccess: "Management Panel",
      location_cn: "Zhaoqing Terminal",
      location_kh: "Kandal Terminal",
      factory_01: "Main Facility"
    },
    nav: {
      header: {
        home: "Home",
        capabilities: "Capabilities",
        manufacturing: "Manufacturing",
        materials: "Resources",
        collections: "Portfolio",
        capacity: "Global Layout",
        about: "About",
        inquire: "Inquire"
      },
      mega: {
        process: "Industrial Flow",
        lumberPrep: "Lumber Curing",
        cnc5Axis: "5-Axis CNC",
        autoFinishing: "Coating Systems",
        standards: "Audit Protocol",
        incomingQC: "Material IQC",
        inProcessQC: "Structural IPQC",
        finalInspection: "Final Audit",
        services: "Business Models",
        oemProduction: "OEM Scale",
        odmDesign: "ODM Engineering",
        valueEngineering: "Cost Analysis",
        compliance: "Global Standards",
        tscaTitleVI: "TSCA Title VI",
        fscCertification: "FSC Certified",
        istaPackaging: "ISTA Testing",
        focusPrecision: "Precision Tolerances",
        focusEng: "Design Engineering",
        focusLogistics: "Fulfillment Logic"
      }
    },
    home: {
      subtitle: "Solid Wood Manufacturing Experts",
      heroTitle: "Precision Engineered Solid Wood Solutions for Global Brands.",
      heroQuote: "Integrating industrial logic with natural material artistry.",
      heroBtnSecondary: "View Process",
      featuredCollections: "Master Collections",
      factoryStrength: "Infrastructure",
      strengthTitle: "Optimized for Commercial Luxury.",
      strengthDesc1: "PZ is a strategic partner for design-led global furniture brands.",
      strengthDesc2: "We integrate boutique craftsmanship with aerospace-grade CNC consistency.",
      globalHubs: "Logistics Hubs",
      chinaLoc: "HQ & Engineering Center",
      cambodiaLoc: "Export Logistics Terminal",
      readyToScale: "Ready to Initiate Production?"
    },
    about: {
      since: "EST. 2014",
      title: "The Industrial Art of Wood.",
      intro: "Engineering high-capacity furniture solutions for the world's most exacting design brands.",
      bannerText: "A synthesis of boutique craftsmanship and aerospace-grade precision.",
      storyTitle: "Our Narrative",
      storyP1: "We didn't just build a factory; we engineered a production system for the natural world.",
      storyP2: "Starting in Zhaoqing, China, PZ was founded with a singular mission: to provide design-led brands with the structural reliability they demand and the organic beauty they crave.",
      storyP3: "Today, with facilities in both China and Cambodia, we operate as a global logistics and manufacturing terminal, ensuring duty-optimized delivery and consistent SKU quality across any volume.",
      storyP4: "From 5-axis CNC precision to handcrafted oil finishes, our process is a closed loop of excellence.",
      pillars: {
        elite: "Elite Engineering",
        eliteDesc: "Micron-level tolerances in wood construction, ensuring every piece meets global commercial standards.",
        dual: "Dual-Terminal Supply",
        dualDesc: "Direct control over China and Cambodia production lines for maximum tariff and logistics optimization.",
        logistics: "Integrated Logistics",
        logisticsDesc: "Full fulfillment visibility from the factory floor to regional distribution hubs worldwide."
      },
      process: { label: "Industrial Lifecycle", title: "Material Flow" },
      galleryItems: {
        raw: { title: "Climate Controlled Curing", desc: "Stabilizing moisture content to 8-10%." },
        milling: { title: "5-Axis CNC Precision", desc: "Complex geometries executed with robotic consistency." },
        automation: { title: "Automated Assembly", desc: "Ensuring structural integrity at scale." },
        finishing: { title: "Low-VOC Coating", desc: "Premium surface treatments in dust-free environments." },
        qc: { title: "AQL 2.5 Audit", desc: "Rigorous testing of every production batch." }
      },
      journey: "Timeline",
      milestones: {
        "2014": { title: "Zhaoqing Launch", desc: "First 200,000 sq.ft facility established." },
        "2018": { title: "5-Axis Integration", desc: "Strategic upgrade to robotic manufacturing." },
        "2021": { title: "Cambodia Terminal", desc: "Expansion into Kandal for duty-free export." },
        "2024": { title: "Registry OS v2.5", desc: "Proprietary supply chain visibility platform launch." },
        "2025": { title: "Carbon Neutral Aim", desc: "Targeting net-zero manufacturing via FSC-only sourcing." }
      }
    },
    manufacturing: {
      subtitle: "Manufacturing Protocols",
      title: "The PZ Production Engine.",
      intro: "We bridge the gap between bespoke design and industrial scalability through advanced CNC logic and structural engineering.",
      tabs: { process: "The Flow", machinery: "Infrastructure", qc: "Audits" },
      steps: [
        { title: "Material Intake", desc: "Raw lumber is stress-tested and moisture-balanced." },
        { title: "5-Axis Milling", desc: "Digital designs translated into precise physical forms." },
        { title: "Manual Refinement", desc: "Artisans hand-finish critical joinery details." },
        { title: "Surface Treatment", desc: "Robotic coating for perfectly consistent UV/PU layers." },
        { title: "Structural Audit", desc: "Pressure tests ensure long-term commercial durability." },
        { title: "Global Fulfillment", desc: "Optimized packing for maritime and regional transit." }
      ],
      machinery: {
        title: "Aerospace-Grade Hardware.",
        desc: "Our floor is equipped with leading European and Japanese technology to ensure that wood behaves with the precision of metal.",
        highPrecision: "High-Frequency Pressing",
        autoFinish: "Robotic Sanding & Dust Recovery",
        climate: "Automated Vacuum Kiln Curing"
      },
      machineryList: [
        { type: "CNC", name: "HOMAG 5-Axis", desc: "The industry standard for high-complexity wood milling." },
        { type: "FINISHING", name: "Venjakob Line", desc: "Fully automated, high-velocity coating system." },
        { type: "PREP", name: "SCM Planers", desc: "Precision surfacing to 0.1mm tolerances." }
      ],
      qc: {
        title: "Zero-Defect Logic.",
        desc: "Quality is not an inspection; it is a manufacturing state of mind enforced through three distinct audit gates.",
        iqc: "IQC: Intake Audit",
        iqcDesc: "Incoming wood density and moisture verified before induction.",
        ipqc: "IPQC: In-Process Audit",
        ipqcDesc: "Tolerances checked after every major machining sequence.",
        fqc: "FQC: Final Release",
        fqcDesc: "Complete structural and aesthetic audit before cataloguing."
      }
    },
    capabilities: {
      subtitle: "Production Channels",
      title: "Engineered For Volume.",
      intro: "High-capacity solid wood solutions serving the world's most exacting hospitality and residential brands.",
      categories: "Sector Matrix",
      productCats: [
        { name: "Hospitality", desc: "Bespoke hotel casegoods and dining solutions." },
        { name: "Residential", desc: "Scalable collections for global retail chains." },
        { name: "Workplace", desc: "High-durability ergonomic desk systems." },
        { name: "Outdoor", desc: "Resilient Teak and Acacia engineering." }
      ],
      limits: {
        title: "Technical Limits",
        request: "Request Full Spec Sheet",
        maxDim: "Maximum Dimensions",
        length: "Length",
        width: "Width",
        thickness: "Thickness",
        precision: "Precision Standards",
        cncTol: "CNC Tolerance",
        moisture: "Moisture (KD)",
        gloss: "Gloss Range",
        materials: "Material Core",
        solidWood: "Solid Wood",
        veneer: "Veneer Work",
        mixed: "Mixed Media"
      },
      oem: {
        service: "Business Models",
        title: "Strategic Manufacturing.",
        desc: "We operate as an invisible extension of your design team, handling everything from engineering to duty-free delivery.",
        oemTitle: "OEM Production",
        oemDesc: "Executing your designs with high-fidelity accuracy at massive scale.",
        odmTitle: "ODM Solutions",
        odmDesc: "Internal PZ engineering to bring your conceptual vision to life."
      },
      compliance: {
        title: "Global Compliance Protocols",
        desc: "Every item indexed in our registry complies with the strictest international safety and environmental laws.",
        safety: "TSCA Title VI / CARB 2",
        safetyDesc: "Verified formaldehyde-free production environments.",
        sustain: "FSC Certified Sourcing",
        sustainDesc: "100% chain of custody for responsibly harvested timber.",
        pack: "ISTA-3A Standards",
        packDesc: "Drop-tested packaging for zero-damage transit."
      },
      cta: { title: "Ready to Scale?", btn: "Initiate Production Run" }
    },
    capacity: {
      footprint: "Global Footprint",
      title: "Operational Terminals.",
      desc: "Our dual-hub manufacturing strategy ensures consistent quality with optimized tariff and logistics routes for every major global market.",
      leadTime: "Standard Lead Times",
      sampleDev: "Sample Development",
      initProd: "Initial Production Run",
      reOrder: "Repeat Orders",
      leadTimeNote: "Lead times may vary based on material availability and SKU complexity.",
      logisticsTitle: "Maritime Logistics",
      chinaOrigin: "China Port",
      khOrigin: "Cambodia Port",
      shippingDesc: "Full-container-load (FCL) and less-than-container-load (LCL) support with direct port access from both terminals.",
      clientDist: "Market Reach",
      clientDesc: "Currently supporting the fulfillment requirements of design leaders across North America, Europe, and the Middle East.",
      stats: {
        sqft: "Facility Area",
        brands: "Global Brands",
        units: "Monthly Units",
        logistics: "LA Logistics"
      },
      supplyChain: "Seamless Supply Chains",
      supplyChainDesc: "We manage the friction of global trade through integrated logistics and technical oversight.",
      flexible: "Flexible Induction",
      flexibleDesc: "Switch production between hubs to navigate trade barriers seamlessly.",
      warehouse: "Domestic Fulfillment",
      warehouseDesc: "US-based warehousing for regional SKU distribution and buffer stock management.",
      locations: {
        usa_title: "North America Hub",
        usa_desc: "Our primary export market with dedicated logistics support in Los Angeles for West Coast distribution.",
        can_title: "Canada Network",
        can_desc: "Fulfillment solutions for major Canadian hospitality and residential retailers.",
        uk_title: "UK Operations",
        uk_desc: "Direct shipping to UK hubs with full compliance to British safety and fire regulations.",
        de_title: "European Gateway",
        de_desc: "Strategic partnerships across Germany and Northern Europe with EUTR-compliant lumber sourcing.",
        me_title: "Middle East Projects",
        me_desc: "Custom hospitality solutions for premium developments in the GCC region.",
        cn_title: "Main Terminal (CN)",
        cn_desc: "The PZ headquarters and primary engineering center, managing high-complexity 5-axis CNC production.",
        kh_title: "Fulfillment Terminal (KH)",
        kh_desc: "A dedicated facility for high-volume SKU production with 0% tariff access to the US market."
      }
    },
    materials: {
      title: "The Material Archive.",
      construction: "Structural Logic",
      fingerJoint: "Finger Jointing",
      fingerJointDesc: "High-strength interlocking joinery for maximum panel stability and yield optimization.",
      edgeGlue: "Edge Gluing",
      edgeGlueDesc: "Seamless grain matching for expansive, monolithic solid wood surfaces.",
      butcherBlock: "Cross-Grain Lamination",
      butcherBlockDesc: "Industrial-grade surfaces engineered for high-impact commercial environments.",
      library: "Lumber Registry",
      species: {
        oak: { name: "White Oak", desc: "Durable, classic grain for high-end hospitality." },
        walnut: { name: "American Walnut", desc: "Rich, deep tones for premium executive collections." },
        rubber: { name: "Rubber Wood", desc: "Cost-efficient, sustainable hardwood for high-volume lines." },
        ash: { name: "White Ash", desc: "Resilient and flexible with a striking architectural grain." },
        beech: { name: "European Beech", desc: "Uniform texture, ideal for painted or light-stained finishes." },
        maple: { name: "Hard Maple", desc: "Dense, light wood with exceptional durability." },
        teak: { name: "Plantation Teak", desc: "High oil content, naturally resistant to moisture." },
        acacia: { name: "Acacia", desc: "Distinctive figure with excellent outdoor performance." },
        birch: { name: "Yellow Birch", desc: "Strong, closed-grain wood for stable structural cores." },
        bamboo: { name: "Moso Bamboo", desc: "Engineered grass fiber with extreme hardness." }
      },
      moisture: "Moisture Control",
      moistureDesc: "Kiln-dried to 8% - 10% to prevent warping in diverse climates.",
      pu: "PU Finishing",
      puDesc: "Polyurethane coatings for extreme heat and liquid resistance.",
      nc: "NC Finishing",
      ncDesc: "Nitrocellulose lacquers for a natural, tactile wood feel.",
      uv: "UV Curable",
      uvDesc: "Instant robotic curing for scratch-resistant surface consistency.",
      request: "Material Sample Kit",
      requestDesc: "Order a physical kit featuring our primary wood species and finish variants.",
      orderKit: "Request Kit"
    },
    collections: {
      requestPdf: "Download Technical Catalog",
      pdp: {
        descExtra: "Precision-engineered combining structural integrity with natural material excellence.",
        inquireOrder: "Request Project Quote"
      }
    },
    inquire: {
      title: "Project Intake.",
      desc: "Connect with our engineering team to discuss manufacturing scale and duty optimization.",
      oem: "OEM/ODM Strategy",
      oemDesc: "We provide full-lifecycle support from prototyping to global distribution.",
      form: {
        name: "Name / Contact",
        company: "Company Name",
        email: "Work Email",
        type: "Project Type",
        message: "Technical Requirements",
        send: "Transmit Inquiry",
        sending: "Synchronizing...",
        success: "Protocol Received.",
        successDesc: "Your inquiry has been successfully indexed. Our engineering team will respond within 24 hours.",
        again: "New Transmission"
      },
      types: {
        general: "General Inquiry",
        catalog: "Catalog / Spec Request",
        trade: "Industry Program",
        oem: "OEM / ODM Project"
      }
    },

    // --- PORTAL (Chinese) ---
    admin: {
      dashboard: "档案控制中心",
      openCreator: "进入工作区",
      logout: "安全退出",
      inquiries: "客户咨询收件箱",
      previewSite: "实时预览",
      date: "日期",
      name: "客户姓名",
      company: "公司",
      type: "分类",
      status: "状态",
      loading: "正在同步注册表...",
      noData: "暂无记录"
    },
    creator: {
      title: "档案终端",
      inventory: {
        header: "产品档案管理",
        selectCat: "选择分类以管理或索引新产品。",
        viewMaster: "查看总库",
        backCategories: "返回分类",
        search: "搜索产品名或编号...",
        noMatchTitle: "未找到匹配项",
        noMatchDesc: "没有记录符合您的搜索参数。",
        createProduct: "新增档案",
        batchInduction: "批量录入",
        singleEntry: "手动录入",
        backToCategories: "返回分组"
      },
      form: {
        edit: "修改档案",
        add: "创建新档案",
        cancel: "放弃更改",
        saveDraft: "保存草稿",
        submitReview: "提交审核",
        discard: "放弃",
        material: "核心材料",
        skuRef: "工厂 SKU 编号",
        media: "媒体资产",
        productImg: "主要图片",
        snapshot: "档案快照",
        series: "生产系列"
      },
      config: {
        title: "站点协议配置",
        desc: "配置全局 UI 资产、静态海报和运营参数。",
        discard: "清除缓存",
        publish: "发布更改",
        pushProd: "推送到生产环境",
        publishing: "发布协议运行中...",
        unsaved: "未提交的更改",
        apply: "应用本地更改"
      },
      assets: {
        title: "静态资产库",
        desc: "管理高分辨率界面资产和技术文档。",
        save: "提交资产",
        cancel: "放弃上传",
        reset: "恢复默认",
        selectFiles: "选择文件"
      },
      statusLabels: {
        published: "已发布",
        pending: "待审核",
        draft: "草稿箱",
        rejected: "需修正",
        all: "全部状态"
      },
      accounts: {
        title: "身份注册表",
        detected: "已识别的身份",
        refresh: "同步",
        newUser: "分配账号",
        profile: "身份概况",
        auth: "权限等级",
        ops: "操作",
        active: "活跃",
        disabled: "已撤销",
        rotateKey: "轮换密钥",
        revoke: "撤销权限",
        restore: "恢复权限"
      },
      review: {
        pendingProducts: "待审产品档案",
        pendingCategories: "新系列提案",
        selectAll: "全选",
        approveSelected: "批量核准",
        empty: "队列已清空",
        emptyDesc: "所有提交的数据均已审计。",
        approve: "核准并发布",
        reject: "驳回申请",
        reason: "审计反馈",
        confirmReject: "确认驳回"
      }
    },
    siteConfig: {
      sections: {
        "Global Settings": "全局协议设置",
        "Navigation Menu (Posters)": "导航展示面板",
        "Home Page / Hero": "首屏序列",
        "Home Page / Sections": "内容区块",
        "Home Page / Global Hubs": "终端分布",
        "About Page": "公司概况",
        "Manufacturing Page": "制造系统",
        "Capabilities Page": "生产能力",
        "Portfolio Page": "档案总库",
        "Inquire Page": "咨询门户",
        "Global Capacity / Terminals": "全球交付网络",
        "Materials / Technical Construction": "结构工程",
        "Materials / Lumber Registry": "木材档案",
      },
      fields: {
        "catalog.url": { label: "技术目录 PDF", help: "供公开下载的主产品目录。" },
        "home.hero.title": { label: "首屏标题文字" },
        "home.hero.image": { label: "首屏背景海报" },
        "home.factory.image": { label: "工厂概览展示图" },
        "home.cta.image": { label: "底部行动背景" },
        "home.hub_cn.image": { label: "中国总部视觉识别" },
        "home.hub_kh.image": { label: "柬埔寨枢纽视觉识别" },
        "about.banner": { label: "关于页横幅" },
        "portfolio.hero_poster": { label: "档案库头部特写" },
        "inquire.hero_poster": { label: "咨询页头部特写" },
        "menu.feat_collections": { label: "导航：系列特写" },
        "menu.feat_mfg": { label: "导航：制造特写" },
        "menu.feat_capabilities": { label: "导航：能力特写" },
        "menu.feat_default": { label: "导航：默认面板" },
      }
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children?: ReactNode }) => {
  const language = 'en' as const;
  const t = translations.en;
  const value = { language, t, setLanguage: () => {}, toggleLanguage: () => {} };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
