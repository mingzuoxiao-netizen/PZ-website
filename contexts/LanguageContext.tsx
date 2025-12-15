

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: typeof translations.en;
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
      },
      steps: [
        { title: "Lumber Selection & Moisture Control", desc: "Incoming lumber is graded for structural integrity and grain consistency. Moisture levels are stabilized through controlled drying to ensure long-term dimensional stability." },
        { title: "Panel Jointing & Structural Bonding", desc: "Panels and butcher blocks are engineered through controlled color matching and high-strength bonding systems to ensure uniform stress distribution and durability." },
        { title: "Precision CNC Machining", desc: "Digitally programmed machining workflows execute complex joinery and shaping operations with tight dimensional control and repeatable accuracy." },
        { title: "Surface Preparation & Finishing", desc: "Surface preparation and finishing processes are engineered for consistent texture, color stability, and coating performance across production runs." },
        { title: "Assembly & Final Integration", desc: "Components are assembled using engineered joinery methods reinforced with modern adhesives and hardware systems for structural reliability and serviceability." },
        { title: "Quality Control & Packaging", desc: "Each finished unit undergoes final inspection against structural, dimensional, and aesthetic standards. Packaging systems are designed to protect products through long-distance logistics." }
      ],
      machineryList: [
        { name: "CNC MACHINING SYSTEMS", type: "Processing", desc: "Multi-axis CNC routing platforms supporting complex 3D shaping, precision joinery, and repeatable dimensional control." },
        { name: "PROFILE MILLING", type: "Milling", desc: "High-speed moulding and profiling systems for consistent edge geometry and surface definition across long production runs." },
        { name: "AUTOMATED SURFACE FINISHING", type: "Finishing", desc: "Continuous finishing lines integrating spray application, controlled drying, and curing processes for uniform surface quality." },
        { name: "PRECISION SANDING & CALIBRATION", type: "Sanding", desc: "Automated sanding and surface calibration systems ensuring thickness accuracy and finish readiness prior to coating." },
        { name: "PANEL BONDING & ASSEMBLY", type: "Assembly", desc: "Engineered bonding and pressing systems designed for structural stability in laminated panels and mixed-material assemblies." },
        { name: "CENTRALIZED FACILITY SYSTEMS", type: "Infrastructure", desc: "Plant-wide dust extraction, air filtration, and environmental control infrastructure supporting process consistency and operator safety." }
      ]
    },
    capabilities: {
      title: "Technical Capabilities",
      subtitle: "Engineering Your Vision",
      intro: "Manufacturing is more than just execution; it is about problem-solving. Our engineering team works upstream with your designers to ensure feasibility, cost-efficiency, and structural integrity.",
      categories: "Product Categories",
      productCats: [
        { name: "Accent Chairs", desc: "Solid wood frames, complex joinery, upholstery." },
        { name: "Bar Stools", desc: "Counter and bar height, swivel mechanisms, metal footrests." },
        { name: "Cabinets and Casegoods", desc: "Sideboards, media consoles, soft-close hardware." },
        { name: "Dining Tops", desc: "Solid wood, butcher block, live-edge processing." },
        { name: "Work Surfaces", desc: "Office desks, adjustable height tops, workbenches." },
        { name: "Hotel Furniture", desc: "Guest room FF&E, lobby seating, high-traffic finishes." },
        { name: "Custom Projects", desc: "Bespoke specifications, mixed materials (stone/metal)." }
      ],
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
      needCatalog: "Need the catalog?",
      catalogDesc: "Download the full PDF spec sheet for this collection.",
      requestPdf: "Request PDF",
      availableSpecs: "Available Specs",
      viewOptions: "View Options",
      pdp: {
        techDims: "Technical Dimensions",
        drawingUnavailable: "Digital drawing unavailable",
        ref: "Ref",
        matSelection: "Material Selection",
        inquireOrder: "Inquire to Order",
        share: "Share Product",
        description: "Description",
        descExtra: "Designed with durability and aesthetic purity in mind. This piece exemplifies our commitment to precision manufacturing, utilizing 5-axis CNC technology and traditional joinery.",
        matConst: "Material & Construction",
        primaryWood: "Primary Wood",
        finish: "Finish",
        joinery: "Joinery",
        hardware: "Hardware",
        downloads: "Downloads",
        specSheet: "Product Spec Sheet (PDF)",
        model3d: "3D Model (STEP)",
        related: "Related Products",
        viewDetails: "View Details",
        customSizes: "Custom Sizes Available"
      }
    },
    materials: {
      title: "Materials & Process",
      construction: "Construction Methods & Variants",
      library: "Wood Library",
      fingerJoint: "Finger Joint",
      fingerJointDesc: "Interlocking 'fingers' cut into the ends of wood blocks to extend length. Provides immense structural strength and maximizes lumber yield. Ideal for painted frames and long countertops.",
      edgeGlue: "Edge Glue (Full Stave)",
      edgeGlueDesc: "Staves glued side-by-side, running the full length of the piece. Creates a continuous, premium grain appearance. Preferred for high-end dining tables and premium visible surfaces.",
      butcherBlock: "Butcher Block",
      butcherBlockDesc: "Thick wood strips glued together. Extremely durable and stable. Commonly used for heavy-duty workbenches, kitchen islands, and industrial-style tops.",
      finishes: "Finishes & Specs",
      moisture: "Moisture Content",
      moistureDesc: "All lumber is Kiln Dried (KD) to 8-10% prior to production to prevent warping and cracking. Monitored via electronic moisture meters.",
      pu: "PU Finish",
      puDesc: "Polyurethane coating offering a durable, hard shell resistant to water, heat, and scratches. Excellent for dining tables.",
      nc: "NC Finish",
      ncDesc: "Nitrocellulose lacquer offering a natural, thin-film look that enhances grain depth. Easier to repair but less water resistant.",
      uv: "UV Coating",
      uvDesc: "Ultraviolet cured coatings for high-volume, instant-cure lines. Extremely consistent and chemically resistant.",
      request: "Request Samples",
      requestDesc: "We provide physical wood and finish samples for development teams.",
      orderKit: "Order Sample Kit",
      species: {
        oak: { name: "White Oak", desc: "Durable hardwood with distinct grain patterns and excellent stability." },
        walnut: { name: "Walnut", desc: "Rich dark tones with a naturally luxurious finish." },
        rubber: { name: "Rubberwood", desc: "Sustainable hardwood with fine, uniform grain and eco-friendly sourcing." },
        ash: { name: "Ash", desc: "Light-toned hardwood known for its strength, flexibility, and striking grain." },
        beech: { name: "Beech", desc: "Smooth, fine-grained hardwood ideal for curved structures and warm, natural finishes." },
        maple: { name: "Maple", desc: "Dense, smooth-textured hardwood with a clean, modern look and excellent durability." },
        birch: { name: "Birch", desc: "Light-toned hardwood known for its fine, even grain, excellent formability, and clean modern aesthetic." },
        teak: { name: "Teak", desc: "Premium tropical hardwood with rich natural oils, exceptional durability, and timeless golden tones." },
        acacia: { name: "Acacia", desc: "Durable hardwood with bold, contrasting grain patterns and strong visual character." },
        bamboo: { name: "Bamboo", desc: "Sustainable, fast-growing material with high hardness and distinct linear grain." }
      }
    },
    inquire: {
      title: "开始对话",
      desc: "无论您是寻找 ODM 合作伙伴的全球家具品牌，还是为商业项目指定规格的建筑师，我们都准备好实现您的愿景。",
      trade: "贸易计划",
      tradeDesc: "为室内设计师和建筑师提供独家定价和定制能力。",
      oem: "ODM / OEM 服务",
      oemDesc: "零售品牌的全规模制造。适用最低订货量。",
      catalog: "数字目录",
      catalogDesc: "通过表格索取我们的综合规格指南。包括完整的材料库、榫卯细节和工厂能力。",
      companyProfile: "公司简介",
      profileDesc: "下载我们的综合能力说明和工厂概览 (PDF)。",
      downloadPdf: "下载 PDF",
      form: {
        name: "姓名",
        company: "公司",
        email: "电子邮件地址",
        type: "咨询类型",
        message: "留言",
        send: "发送咨询",
        sending: "发送中...",
        success: "谢谢",
        successDesc: "您的咨询已收到。我们的团队将审核您的项目需求并尽快回复。",
        again: "发送另一条消息"
      },
      types: {
        general: "一般咨询",
        catalog: "索取目录",
        trade: "贸易计划申请",
        oem: "ODM / OEM 合作伙伴关系"
      }
    },
    capacity: {
      footprint: "制造足迹",
      title: "全球规模，本地精度",
      desc: "PZ 运营着战略性的双岸制造网络。在中国和柬埔寨拥有大型设施，加上洛杉矶的国内仓库，我们提供不受单一故障点影响的弹性供应链。",
      clientDist: "全球客户分布",
      clientDesc: "我们为北美、欧洲和中东的客户提供服务，主要集中在美国和加拿大市场。",
      stats: {
        sqft: "总平方英尺产能",
        brands: "主要美国品牌",
        units: "月单位产能",
        logistics: "美国物流中心"
      },
      locations: {
        cn_title: "肇庆总部",
        cn_desc: "我们的主要园区，专注于复杂的研发、混合材料制造和大师级工艺。我们的工程卓越中心。",
        kh_title: "柬埔寨工厂",
        kh_desc: "位于干拉省的战略性低关税制造中心，专为大批量生产和具有成本效益的可扩展性而定制。",
        usa_title: "美国市场",
        usa_desc: "我们需要最大的市场。我们通过直接集装箱计划和洛杉矶仓库的国内库存解决方案支持 30 多个主要美国品牌。",
        can_title: "加拿大市场",
        can_desc: "为加拿大零售商提供具有耐寒饰面和结构的优质实木家具。",
        uk_title: "英国",
        uk_desc: "出口符合英国标准的独特细木工和符合 FR 标准的软包。",
        de_title: "欧盟 (德国)",
        de_desc: "为挑剔的欧洲客户满足严格的欧盟可持续性 (EUTR) 和化学安全标准。",
        me_title: "中东",
        me_desc: "服务于该地区的豪华酒店项目和高端住宅开发。"
      },
      leadTime: "交货期概览",
      sampleDev: "样品开发",
      initProd: "初始生产",
      reOrder: "翻单生产",
      leadTimeNote: "* 交货时间可能因材料可用性和订单量而异。",
      logisticsTitle: "物流与 FOB",
      chinaOrigin: "中国原产",
      khOrigin: "柬埔寨原产",
      shippingDesc: "我们支持 FCL (整箱) 和 LCL 拼箱。通过我们的美国仓库提供一件代发计划。",
      supplyChain: "供应链解决方案",
      supplyChainDesc: "我们不仅仅制造家具；我们交付家具。从东南亚的 FOB 制造到美国的最后一英里能力。",
      flexible: "灵活出口",
      flexibleDesc: "根据您的关税策略和交货期要求，在中国或柬埔寨原产地之间进行选择。",
      warehouse: "美国仓库 (洛杉矶)",
      warehouseDesc: "位于加利福尼亚州的 129,000 平方英尺设施，允许国内补货和一件代发计划。"
    },
    studio: {
       title: "工作室",
       subtitle: "设计与精度的交汇点",
       design: "设计",
       designTitle: "建筑思维",
       designDesc1: "我们不仅将家具视为物体，而且视为建筑元素。每个曲线和接头都经过深思熟虑。",
       designDesc2: "我们的内部设计团队与全球合作伙伴合作，将草图变为现实。",
       eng: "工程",
       engTitle: "结构完整性",
       engDesc: "美必须耐用。我们的工程流程确保使用寿命。",
       raw: "原材料",
       rawTitle: "优质精选",
       rawDesc: "我们只从可持续森林采购最好的硬木。",
       exploreMat: "探索材料"
    },
    admin: {
      dashboard: "管理仪表板",
      openCreator: "打开创作者工作室",
      viewSite: "查看网站",
      logout: "登出",
      inquiries: "咨询",
      exportCsv: "导出 CSV",
      noData: "未找到符合条件的咨询。",
      loading: "加载数据中...",
      cols: { date: "日期", name: "姓名", company: "公司", type: "类型", msg: "消息", status: "状态" }
    },
    creator: {
      title: "创作者模式",
      editing: "编辑中",
      backAdmin: "返回管理",
      tabs: { inventory: "库存", collections: "系列", config: "网站配置", media: "媒体", review: "审核队列", accounts: "账户", assets: "资产" },
      status: { connected: "云配置已连接", local: "本地模式", syncing: "同步中..." },
      inventory: {
        manage: "管理库存",
        desc: "搜索并管理您的产品库存。",
        search: "搜索库存...",
        noItems: "未找到项目",
        duplicate: "复制 / 变体",
        delete: "删除",
        edit: "编辑",
        header: "库存管理",
        selectCat: "选择一个类别以管理现有产品或添加新产品。",
        viewMaster: "查看总列表",
        backCategories: "返回类别",
        emptyTitle: "此系列为空",
        emptyDesc: "通过创建第一个产品记录来初始化您的库存。",
        noMatchTitle: "无匹配项",
        noMatchDesc: "我们找不到符合您标准的产品。",
        clearSearch: "清除搜索",
        createNewAnyway: "仍然新建",
        createProduct: "创建产品"
      },
      form: {
        edit: "编辑产品",
        add: "添加新产品",
        cancel: "取消",
        status: "当前状态",
        mainCat: "主类别",
        subCat: "子类别",
        create: "+ 新建",
        cancelNew: "取消新建",
        nameEn: "产品名称 (EN)",
        nameZh: "产品名称 (次要)",
        specs: "规格",
        material: "材料",
        dims: "尺寸",
        code: "产品代码",
        autoGen: "生成",
        descEn: "描述 (EN)",
        descZh: "描述 (次要)",
        colors: "颜色变体",
        addColor: "添加颜色",
        gallery: "图库",
        saveDraft: "保存草稿",
        publish: "发布产品",
        submit: "提交审核",
        setDraft: "设为草稿",
        forcePub: "强制发布",
        update: "更新产品",
        processing: "处理中...",
        delete: "删除产品"
      },
      config: {
        title: "网站配置",
        desc: "管理全局内容和英雄图像。",
        discard: "放弃",
        publish: "发布更改",
        publishing: "发布中...",
        unsaved: "未保存的更改",
        history: "版本历史",
        active: "活动",
        rollback: "回滚"
      },
      assets: {
        title: "网站资产管理",
        desc: "在此处管理静态网站图像和文件（目录 PDF、英雄横幅、工厂图像等）。上传后点击“保存”以应用更改。",
        history: "资产历史",
        save: "保存更改",
        cancel: "取消",
        reset: "重置为默认"
      }
    },
    siteConfig: {
      sections: {
        "Global Settings": "全局设置",
        "Navigation Menu (Featured Images)": "导航菜单 (特色图像)",
        "Home Page / Hero": "首页 / 英雄",
        "Home Page / Sections": "首页 / 部分",
        "Home Page / Global Hubs": "首页 / 全球中心",
        "The Studio Page": "工作室页面",
        "About Page": "关于页面",
        "Manufacturing Page": "制造页面",
        "Global Capacity / Locations": "全球产能 / 地点",
        "Materials / Construction": "材料 / 结构",
        "Materials / Wood Library": "材料 / 木材库",
      },
      fields: {
        "catalog.url": { label: "目录 PDF", help: "上传主要产品目录 (PDF)。显示在作品集和咨询页面上。" },
        "menu.feat_collections": { label: "作品集菜单图像" },
        "menu.feat_mfg": { label: "制造菜单图像" },
        "menu.feat_capabilities": { label: "能力菜单图像" },
        "menu.feat_default": { label: "默认菜单图像" },
        "home.hero.title": { label: "英雄标题" },
        "home.hero.image": { label: "英雄背景图像" },
        "home.factory.image": { label: "工厂部分图像" },
        "home.cta.image": { label: "页脚 CTA 背景" },
        "home.hub_cn.image": { label: "中国中心图像" },
        "home.hub_kh.image": { label: "柬埔寨中心图像" },
        "studio.hero": { label: "工作室英雄图像" },
        "studio.design": { label: "设计部分图像" },
        "about.banner": { label: "主要电影横幅" },
        "about.gallery.raw": { label: "图库：原木" },
        "about.gallery.milling": { label: "图库：精密铣削" },
        "about.gallery.automation": { label: "图库：自动化" },
        "about.gallery.finishing": { label: "图库：手工涂装" },
        "about.gallery.qc": { label: "图库：质量控制" },
        "manufacturing.hero_machinery": { label: "机械英雄" },
        "manufacturing.hero_qc": { label: "QC/实验室英雄" },
        "capacity.map_bg": { label: "世界地图背景" },
        "capacity.card_cn": { label: "中国总部卡片" },
        "capacity.card_kh": { label: "柬埔寨工厂卡片" },
        "capacity.loc_usa": { label: "地点：美国" },
        "capacity.loc_can": { label: "地点：加拿大" },
        "capacity.loc_uk": { label: "地点：英国" },
        "capacity.loc_de": { label: "地点：德国" },
        "capacity.loc_me": { label: "地点：中东" },
        "materials.const_finger": { label: "指接" },
        "materials.const_edge": { label: "直拼" },
        "materials.const_butcher": { label: "多层实木拼板" },
        "materials.wood_oak": { label: "白橡木" },
        "materials.wood_walnut": { label: "黑胡桃" },
        "materials.wood_rubber": { label: "橡胶木" },
        "materials.wood_ash": { label: "白蜡木" },
        "materials.wood_beech": { label: "榉木" },
        "materials.wood_maple": { label: "枫木" },
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
  // Use state to manage language, initialize from localStorage if available
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('pz_lang');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  const toggleLanguage = () => {
    setLanguage(prev => {
      const next = prev === 'en' ? 'zh' : 'en';
      localStorage.setItem('pz_lang', next);
      return next;
    });
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
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
