
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
      searchRefine: "优化搜索...",
      backHome: "返回首页",
      loading: "加载中",
      close: "关闭",
      explore: "探索",
      connect: "连接",
      privacy: "隐私政策",
      terms: "服务条款",
      rights: "版权所有。",
      startProject: "启动项目",
      tradeProgram: "贸易计划",
      adminAccess: "管理员入口",
      location_cn: "中国肇庆",
      location_kh: "柬埔寨干拉",
      factory_01: "第一工厂"
    },
    nav: {
      header: {
        home: "首页",
        capabilities: "能力",
        manufacturing: "制造",
        materials: "材料",
        portfolio: "作品集",
        capacity: "全球产能",
        about: "关于我们",
        inquire: "咨询"
      },
      mega: {
        solidWoodProjects: "实木项目",
        diningTables: "餐桌",
        butcherBlock: "层压木",
        solidComponents: "实木组件",
        seatingProjects: "座椅项目",
        diningChairs: "餐椅",
        accentChairs: "休闲椅",
        barStools: "吧台椅",
        metalMixed: "金属与混合材质",
        metalBases: "金属底座",
        mixedMaterials: "混合材质",
        customFabrication: "定制制造",
        casegoods: "柜类家具",
        mediaConsoles: "电视柜",
        nightstands: "床头柜",
        storageUnits: "储物单元",
        process: "工艺流程",
        lumberPrep: "木材备料",
        cnc5Axis: "五轴 CNC",
        autoFinishing: "自动涂装",
        standards: "标准",
        incomingQC: "来料质检",
        inProcessQC: "制程质检",
        finalInspection: "最终检验",
        services: "服务",
        oemProduction: "OEM 生产",
        odmDesign: "ODM 设计",
        valueEngineering: "价值工程",
        compliance: "合规性",
        tscaTitleVI: "TSCA Title VI",
        fscCertification: "FSC 认证",
        istaPackaging: "ISTA 包装",
        focusSolid: "实木工艺",
        focusPrecision: "精密制造",
        focusEng: "工程技术",
        focusLogistics: "全球物流"
      }
    },
    home: {
      subtitle: "家具制造",
      heroTitle: "为规模化制造而工程化",
      heroSub: "PZ",
      heroQuote: "\"以精密制造连接全球设计。\"",
      viewLibrary: "查看木材库",
      factoryProfile: "工厂概况",
      factoryStrength: "工厂实力",
      strengthTitle: "专为高端零售设计。",
      strengthDesc1: "PZ 是一家服务于设计驱动型品牌的实木制造合作伙伴。我们专注于材料控制、精密执行和规模化稳定生产——支持那些需要一致性而非一次性构建的项目。",
      strengthDesc2: "我们弥合了领先美国品牌所需的精品级质量与亚洲高效制造能力之间的差距——以全球标准交付设计准确性、工程稳定性和一致的产量。",
      strengthSection: {
        autoFinishDesc: "集成自动化涂装系统结合熟练的手工工艺，确保表面质量一致，颜色匹配受控，并在标准和定制生产中保持稳定的输出。",
        highPrecisionDesc: "先进的 CNC 镂铣系统支持复杂的榫卯、弯曲轮廓和严格的尺寸控制，实现实木和混合材料组件的精确和可重复加工。",
        climateDesc: "我们的生产基础设施专为一致性和可重复性而设计。温控车间和中央集尘有助于在整个加工过程中保持材料稳定性。"
      },
      stats: {
        factories: "工厂 (中国 + 柬埔寨)",
        exp: "多年经验",
        partners: "美国合作伙伴"
      },
      competencies: "核心竞争力",
      comp1Title: "材料精通",
      comp1Desc: "专注于实木硬木加工，在生产批次中进行受控采购、水分管理和材料一致性控制。",
      comp2Title: "双岸供应",
      comp2Desc: "在中国和柬埔寨均设有生产能力，允许根据关税、交货时间和订单规模灵活规划原产地。",
      comp3Title: "先进榫卯",
      comp3Desc: "结合 CNC 加工与经过验证的榫卯方法，生产出结构可靠、配合和表面一致的家具组件。",
      visitUs: "参观我们",
      globalHubs: "全球制造中心",
      globalDesc: "我们的双岸战略确保我们能够满足任何产量或关税要求。联系我们安排工厂参观或审计。",
      chinaLoc: "总部及主要设施",
      cambodiaLoc: "低关税工厂",
      readyToScale: "准备好扩展规模了吗？",
      exploreMfg: "探索制造"
    },
    about: {
      since: "自 2014 年起",
      title: "工程将创意转化为生产的地方",
      intro: "PZ 是一家以工程为驱动的工业级实木制造商。通过整合材料科学、生产系统和过程控制，我们将概念转化为可靠、可重复的制造结果。",
      bannerText: "\"规模化的工匠精神。\"",
      storyTitle: "我们的故事",
      storyP1: "建立 PZ 的初衷是为了证明，现代实木工厂可以同时实现规模和控制——而不将质量视为例外。",
      storyP2: "随着品牌的成长，我们看到设计意图与制造现实之间反复出现的差距。许多工厂为了产量而优化，而不是为了精致度、工程反馈或长期合作。",
      storyP3: "我们围绕流程清晰度、可重复性和协作构建了 PZ——因此改进是持续的，而非被动的。",
      storyP4: "从自动化生产线到数据驱动的质量控制，从多树种实木加工到灵活的组装工作流，PZ 不断投资于让我们能够应对快速变化的行业的能力。每年，我们升级设备、扩展品类并优化生产工程——因为我们服务的品牌在不断成长，我们与他们共同成长。",
      storyP5: "我们的优势不仅仅是机械。而是我们倾听、分析、优化和执行的能力。我们作为技术问题解决者与设计师和买手合作，将草图和原型转化为稳定、可重复且高效制造的产品。",
      storyP6: "最初的一个车间现已成为一个具有前瞻性的制造平台——建立在纪律、创新和对长期合作的承诺之上。我们不仅仅是在生产家具；我们正在构建全球品牌可以信赖的制造未来。",
      pillars: {
        elite: "精英合作伙伴",
        eliteDesc: "我们已与美国家具零售界最负盛名的品牌建立了长期的 OEM/ODM 关系。我们对“高街”质量标准的理解在区域内无与伦比。",
        dual: "中国 + 柬埔寨",
        dualDesc: "我们在中国（肇庆）和柬埔寨（干拉）拥有全资设施，为合作伙伴提供应对关税的战略灵活性。一个有韧性的“双岸”战略。",
        logistics: "美国物流",
        logisticsDesc: "我们位于洛杉矶的 129,167 平方英尺仓库支持美国国内履行和一件代发计划，确保您的产品始终触手可及。"
      },
      process: {
        label: "流程",
        title: "工厂内部",
        clickExpand: "点击图片展开"
      },
      journey: "我们的旅程",
      milestones: {
        2014: { 
          title: "PZ 起点", 
          desc: "成立于广东东莞。旅程始于对纯实木工艺的专注。" 
        },
        2018: { 
          title: "规模化扩张", 
          desc: "将生产基地从东莞搬迁至肇庆以扩大产能，同时启用洛杉矶仓库以服务美国本土配送。" 
        },
        2021: { 
          title: "供应链与风险工程", 
          desc: "在西哈努克开设首个海外工厂，构建低关税生产路径。这使我们能够测试跨国供应链控制、劳动力培训以及中国境外的质量一致性。" 
        },
        2024: { 
          title: "制造系统升级", 
          desc: "肇庆总部扩建，专注于自动化和制程稳定性。投资先进的涂装线、受控环境和可重复的生产系统，以减少大规模生产中的变异。" 
        },
        2025: { 
          title: "中国 + 1 战略", 
          desc: "战略性重返柬埔寨，在干拉省建立大型工厂，构建'中国+1'制造结构。通过在中国和东南亚运行并行生产系统，PZ 被设计为能适应全球政策转变、关税变化和供应链不确定性——且不牺牲质量或交付可靠性。" 
        }
      }
    },
    manufacturing: {
      title: "工程化制造系统",
      subtitle: "工业的艺术",
      intro: "我们设计并运营集成的制造系统，优先考虑精度、可重复性和可扩展的产量——专为长期生产运行和复杂的实木项目而构建。",
      tabs: {
        process: "生产流程",
        machinery: "机械与技术",
        qc: "质量控制"
      },
      machinery: {
        title: "设计驱动的生产一致性",
        desc: "我们的生产基础设施旨在最大限度地减少材料、工艺和产量之间的差异。通过结合基于 CNC 的加工、自动化涂装工作流和严格控制的环境条件，我们确保标准化项目和设计驱动组件的稳定输出。",
        highPrecision: "高精度镂铣",
        autoFinish: "自动化涂装",
        climate: "受控基础设施"
      },
      qc: {
        title: "严格标准",
        desc: "质量不是事后诸葛亮；它嵌入在每一步中。我们遵循严格的 AQL 标准和美国合规法规。",
        iqc: "来料质量控制 (IQC)",
        iqcDesc: "木材分级、含水率检查 (8-12%) 和五金验证。",
        ipqc: "制程质量控制 (IPQC)",
        ipqcDesc: "首件检查、CNC 尺寸检查和砂光质量审查。",
        fqc: "最终质量控制 (FQC)",
        fqcDesc: "基于 AQL 2.5/4.0 的装船前检查。组装测试和纸箱跌落测试。",
        compliance: "合规性"
      }
    },
    capabilities: {
      title: "技术能力",
      subtitle: "工程化您的愿景",
      intro: "制造不仅仅是执行；它是解决问题。我们的工程团队与您的设计师在上游合作，以确保可行性、成本效益和结构完整性。",
      categories: "产品类别",
      limits: {
        title: "尺寸与技术限制",
        subtitle: "标准生产线的工程限制。",
        request: "请求定制评估",
        maxDim: "最大尺寸",
        precision: "精度",
        materials: "材料",
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
        title: "OEM 和 ODM 服务",
        desc: "无论您是有准备好制造的完整 CAD 图纸 (OEM)，还是需要我们从概念草图开发产品 (ODM)，我们的工程团队都会融入流程中。",
        oemTitle: "OEM (按图制造)",
        oemDesc: "精确执行您的技术图纸。材料匹配和严格的公差遵守。",
        odmTitle: "ODM (设计支持)",
        odmDesc: "我们提供结构工程、价值工程和原型设计来实现您的愿景。"
      },
      compliance: {
        title: "技术合规",
        desc: "我们确保所有产品符合目的地市场的监管标准，特别关注美国和欧盟市场。",
        safety: "化学安全",
        safetyDesc: "TSCA Title VI (甲醛), CA Prop 65 合规。",
        sustain: "可持续性",
        sustainDesc: "可根据要求提供 FSC 认证木材。符合 EUTR 采购标准。",
        pack: "包装",
        packDesc: "ISTA-3A / 6A 电商耐用性测试。"
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
