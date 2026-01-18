
import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  t: typeof translations.en;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
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
        collections: "Collections",
        capacity: "Global Capacity",
        about: "About",
        inquire: "Inquire"
      },
      mega: {
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
        focusPrecision: "Precision",
        focusEng: "Engineering",
        focusLogistics: "Logistics"
      }
    },
    home: {
      subtitle: "Furniture Manufacturing",
      heroTitle: "Engineered for Scalable Manufacturing",
      heroQuote: "Precision engineering meets natural artistry.",
      heroBtnSecondary: "Production Process",
      featuredCollections: "Featured Collections",
      factoryStrength: "Factory Strength",
      strengthTitle: "Engineered for High-End Retail.",
      strengthDesc1: "PZ is a solid wood manufacturing partner serving design-driven brands.",
      strengthDesc2: "We bridge the gap between boutique-level quality and high-efficiency manufacturing.",
      globalHubs: "Global Manufacturing Hubs",
      chinaLoc: "HQ & Main Facility",
      cambodiaLoc: "Low-Tariff Factory",
      readyToScale: "Ready to Scale?"
    },
    about: {
      since: "EST. 2014",
      title: "Our Story",
      intro: "Founded on the principles of precision and craftsmanship, PZ has grown from a specialized workshop into a global leader in high-end wood manufacturing.",
      bannerText: "Craftsmanship at Scale",
      storyTitle: "The Beginning",
      storyP1: "Rooted in Zhaoqing.",
      storyP2: "PZ started with a simple vision: to bring industrial-grade precision to the world of bespoke solid wood furniture.",
      storyP3: "Over the last decade, we have scaled our operations across China and Cambodia, serving some of the world's most prestigious furniture brands and retailers.",
      storyP4: "We believe that engineering is the backbone of great design.",
      galleryItems: {
        raw: { title: "Raw Lumber", desc: "Sourcing the finest FSC-certified woods." },
        milling: { title: "Precision Milling", desc: "CNC-driven accuracy for every part." },
        automation: { title: "Automation", desc: "Streamlining complex production tasks." },
        finishing: { title: "Finishing", desc: "Expert hand-applied stains and lacquers." },
        qc: { title: "Quality Control", desc: "Rigorous inspection at every station." }
      },
      pillars: {
        elite: "Elite Craftsmanship",
        eliteDesc: "Our team consists of master carpenters with decades of experience.",
        dual: "Dual-Hub Logistics",
        dualDesc: "Seamless operations between our China and Cambodia facilities.",
        logistics: "Global Fulfillment",
        logisticsDesc: "Comprehensive shipping and warehousing solutions worldwide."
      },
      process: {
        label: "How We Work",
        title: "The Production Journey"
      },
      journey: "A Decade of Growth",
      milestones: {
        "2014": { title: "Inception", desc: "First facility opens in Zhaoqing, China." },
        "2018": { title: "Expansion", desc: "Added 5-axis CNC capabilities." },
        "2021": { title: "Cambodia Hub", desc: "Opened our Kandal facility for tariff-free export." },
        "2024": { title: "Global Reach", desc: "Serving 30+ major brands across 5 continents." },
        "2025": { title: "Next Phase", desc: "Introducing AI-driven material optimization." }
      }
    },
    manufacturing: {
      subtitle: "The Production Cycle",
      title: "Advanced Manufacturing",
      intro: "Our facilities combine traditional joinery with aerospace-grade CNC technology to ensure consistency at scale.",
      tabs: {
        process: "Process",
        machinery: "Machinery",
        qc: "Quality Control"
      },
      steps: [
        { title: "Kiln Drying", desc: "Moisture stabilization to 8-10% to prevent warping." },
        { title: "Component Preparation", desc: "Finger jointing and edge gluing for structural integrity." },
        { title: "Precision Machining", desc: "5-axis CNC cutting for complex geometries." },
        { title: "Structural Assembly", desc: "Traditional joinery reinforced for commercial durability." },
        { title: "Surface Finishing", desc: "Multi-stage sanding and UV/PU coating applications." },
        { title: "Final Inspection", desc: "Comprehensive AQL inspection before packaging." }
      ],
      machinery: {
        title: "Industrial Tech",
        desc: "We invest in the latest European and Asian machinery to maintain a competitive edge in precision and speed.",
        highPrecision: "±0.1mm CNC Tolerance",
        autoFinish: "Automated Finishing Lines",
        climate: "Climate Controlled Storage"
      },
      machineryList: [
        { type: "CNC", name: "Biesse Rover Five-Axis", desc: "Italian-engineered versatility for intricate 3D carvings." },
        { type: "Sanding", name: "Steinemann Wide Belt", desc: "Swiss precision for perfectly calibrated surfaces." },
        { type: "Finish", name: "Cefla iGiotto", desc: "Robotic spray system for flawless, consistent coating." }
      ],
      qc: {
        title: "Uncompromising Standards",
        desc: "Quality is not an afterthought; it is embedded in every stage of our production flow.",
        iqc: "Incoming QC",
        iqcDesc: "Detailed moisture and density checks on all raw lumber.",
        ipqc: "In-Process QC",
        ipqcDesc: "Dimensional verification after every machining operation.",
        fqc: "Final QC",
        fqcDesc: "Full assembly and finish inspection under professional studio lighting."
      }
    },
    capabilities: {
      subtitle: "Technical Expertise",
      title: "Industrial Capacities",
      intro: "From OEM manufacturing to ODM design, we provide a full spectrum of wood production services.",
      categories: "Product Areas",
      productCats: [
        { name: "Dining & Tables", desc: "Large-scale solid wood tables with complex edge details." },
        { name: "Cabinetry & Casegoods", desc: "Precisely engineered storage for home and office." },
        { name: "Accent Seating", desc: "Frame manufacturing for high-end upholstered chairs." },
        { name: "Butcher Block", desc: "Industrial-strength surfaces for kitchens and workspaces." }
      ],
      limits: {
        title: "Technical Specifications",
        subtitle: "Maximum production parameters for wood components.",
        request: "Request Full Spec Sheet",
        maxDim: "Max Dimensions",
        length: "Length",
        width: "Width",
        thickness: "Thickness",
        precision: "Precision & Moisture",
        cncTol: "CNC Tolerance",
        moisture: "Moisture Content",
        gloss: "Gloss Levels",
        materials: "Material Support",
        solidWood: "Solid Wood",
        veneer: "Veneer Work",
        mixed: "Mixed Media"
      },
      oem: {
        service: "Production Models",
        title: "Your Manufacturing Partner",
        desc: "We adapt to your workflow, whether you provide blueprints or need us to develop them.",
        oemTitle: "OEM Production",
        oemDesc: "Manufacturing based strictly on your provided designs and specifications.",
        odmTitle: "ODM / Development",
        odmDesc: "Collaborative engineering to refine designs for scalable production."
      },
      compliance: {
        title: "Standards & Compliance",
        desc: "We adhere to international environmental and safety regulations.",
        safety: "Global Safety",
        safetyDesc: "Products comply with TSCA Title VI and EU REACH standards.",
        sustain: "Sustainability",
        sustainDesc: "FSC-certified materials available upon request.",
        pack: "ISTA Packaging",
        packDesc: "Tested packaging solutions for global e-commerce shipping."
      },
      cta: {
        title: "Start Your Production Cycle",
        btn: "Contact Our Engineering Team"
      }
    },
    capacity: {
      footprint: "Our Global Footprint",
      title: "Logistics & Reach",
      desc: "Operating two major manufacturing hubs to provide tariff-optimized solutions for global clients.",
      leadTime: "Production Lead Times",
      sampleDev: "Sample Development",
      initProd: "Initial Production",
      reOrder: "Repeat Orders",
      leadTimeNote: "Note: Times vary by material availability and order complexity.",
      logisticsTitle: "FOB Shipping Points",
      chinaOrigin: "China Hub",
      khOrigin: "Cambodia Hub",
      shippingDesc: "We provide comprehensive container consolidation and logistics support.",
      clientDist: "Market Distribution",
      clientDesc: "Serving high-end retailers and hospitality projects across the globe.",
      stats: {
        sqft: "Total Sq. Ft",
        brands: "Global Partners",
        units: "Monthly Units",
        logistics: "Logistics Hub"
      },
      supplyChain: "Resilient Supply Chain",
      supplyChainDesc: "We maintain deep relationships with lumber mills globally to ensure stable pricing.",
      flexible: "Flexible Scalability",
      flexibleDesc: "Easily scale production from 100 to 10,000 units.",
      warehouse: "Regional Warehousing",
      warehouseDesc: "Inventory management and fulfillment services via our LA hub.",
      locations: {
        usa_title: "United States",
        usa_desc: "Our largest market with dedicated logistics support in Los Angeles.",
        can_title: "Canada",
        can_desc: "Serving boutique retailers across North America.",
        uk_title: "United Kingdom",
        uk_desc: "Specialized in UKFR compliant residential furniture.",
        de_title: "Germany",
        de_desc: "Meeting strict EUTR and sustainability requirements.",
        me_title: "Middle East",
        me_desc: "Supplying luxury hospitality projects in Dubai and Riyadh.",
        cn_title: "China (HQ)",
        cn_desc: "Our primary R&D and high-precision manufacturing center.",
        kh_title: "Cambodia",
        kh_desc: "High-volume facility optimized for US tariff efficiency."
      }
    },
    materials: {
      title: "Material Library",
      construction: "Construction Methods",
      fingerJoint: "Finger Jointing",
      fingerJointDesc: "Strong, stable construction for industrial and hidden components.",
      edgeGlue: "Edge Gluing",
      edgeGlueDesc: "Full-length staves for a seamless, high-end solid wood look.",
      butcherBlock: "Butcher Block",
      butcherBlockDesc: "Cross-grain construction for maximum surface durability.",
      library: "Lumber Species",
      species: {
        oak: { name: "White Oak", desc: "Classic open grain with superior strength and durability." },
        walnut: { name: "Black Walnut", desc: "Deep, rich tones with a refined, luxurious figure." },
        rubber: { name: "Rubberwood", desc: "Eco-friendly hardwood with a consistent, pale grain." },
        ash: { name: "White Ash", desc: "Strong and flexible with a prominent, sweeping grain." },
        beech: { name: "European Beech", desc: "Fine, even texture ideal for painted or stained finishes." },
        maple: { name: "Hard Maple", desc: "Extremely hard with a clean, modern aesthetic." },
        birch: { name: "Yellow Birch", desc: "Versatile and durable with subtle character." },
        teak: { name: "Plantation Teak", desc: "Naturally oily and weather-resistant for premium use." },
        acacia: { name: "Acacia", desc: "Vibrant, interlocking grain with high natural contrast." },
        bamboo: { name: "Compressed Bamboo", desc: "Sustainable, ultra-hard material for heavy-duty surfaces." }
      },
      moisture: "Moisture Control",
      moistureDesc: "All lumber is kiln-dried to 8-10% to ensure stability across climates.",
      pu: "PU Finishing",
      puDesc: "Polyurethane coatings for high-traffic commercial durability.",
      nc: "NC Finishing",
      ncDesc: "Nitrocellulose lacquers for a natural, breathable hand-feel.",
      uv: "UV Coating",
      uvDesc: "Instant-cure coatings for superior scratch resistance on flat surfaces.",
      request: "Material Samples",
      requestDesc: "We offer curated sample kits showcasing our species and finishing capabilities.",
      orderKit: "Order Sample Kit"
    },
    inquire: {
      title: "Contact Us",
      desc: "Our team is ready to assist with project quotes, material questions, or factory tours.",
      oem: "OEM/ODM Inquiries",
      oemDesc: "Please include technical drawings or reference images if available.",
      form: {
        success: "Inquiry Sent",
        successDesc: "Thank you. Our team will review your message and respond within 24-48 hours.",
        again: "Send another inquiry",
        name: "Full Name",
        company: "Company Name",
        email: "Email Address",
        type: "Project Type",
        message: "Message",
        sending: "Sending...",
        send: "Send Message"
      },
      types: {
        general: "General Inquiry",
        catalog: "Catalog Request",
        trade: "Trade Program",
        oem: "OEM/ODM Production"
      }
    },
    admin: {
      dashboard: "Admin Dashboard",
      openCreator: "Open Creator Studio",
      logout: "Logout",
      inquiries: "Inquiries"
    },
    creator: {
      title: "Creator Mode",
      inventory: {
        header: "Inventory Management",
        selectCat: "Select a category to manage existing products or add new ones.",
        viewMaster: "View Master List",
        backCategories: "Back to Categories",
        search: "Search inventory...",
        noMatchTitle: "No Matches",
        noMatchDesc: "We couldn't find any products matching your criteria.",
        createProduct: "Create Product"
      },
      form: {
        edit: "Edit Product",
        add: "Add New Product",
        cancel: "Cancel"
      },
      config: {
        title: "Site Configuration",
        desc: "Manage global content and hero images.",
        discard: "Discard",
        publish: "Publish Changes",
        publishing: "Publishing...",
        unsaved: "Unsaved Changes"
      },
      assets: {
        title: "Site Asset Management",
        desc: "Manage static site images and files here.",
        save: "Save Changes",
        cancel: "Cancel",
        reset: "Reset to Default"
      },
      statusLabels: {
        published: "Published",
        pending: "Pending Review",
        draft: "Draft",
        rejected: "Rejected"
      }
    },
    siteConfig: {
      sections: {
        "Global Settings": "Global Settings",
        "Navigation Menu (Featured Images)": "Navigation Menu (Featured Images)",
        "Home Page / Hero": "Home Page / Hero",
        "Home Page / Sections": "Home Page / Sections",
        "Home Page / Global Hubs": "Home Page / Global Hubs",
        "About Page": "About Page",
        "Manufacturing Page": "Manufacturing Page",
        "Global Capacity / Locations": "Global Capacity / Locations",
        "Materials / Construction": "Materials / Construction",
        "Materials / Wood Library": "Materials / Wood Library",
      },
      fields: {
        "catalog.url": { label: "Catalog PDF", help: "Upload the main product catalog (PDF)." },
        "home.hero.title": { label: "Hero Title" },
        "home.hero.image": { label: "Hero Background Image" },
        "home.factory.image": { label: "Factory Section Image" },
        "home.cta.image": { label: "Footer CTA Background" },
        "home.hub_cn.image": { label: "China Hub Image" },
        "home.hub_kh.image": { label: "Cambodia Hub Image" },
        "about.banner": { label: "Main Cinematic Banner" },
      }
    },
    collections: {
      collection: "Collection",
      viewProducts: "View Products",
      intro: "Organized by manufacturing discipline.",
      requestPdf: "Request PDF",
      pdp: {
        techDims: "Technical Dimensions",
        matConst: "Material & Construction",
        inquireOrder: "Inquire to Order",
        descExtra: "Designed with durability and aesthetic purity in mind.",
        customSizes: "Customizable Sizes"
      }
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
      searchRefine: "缩小搜索范围...",
      backHome: "返回首页",
      loading: "加载中",
      close: "关闭",
      explore: "探索",
      connect: "建立联系",
      privacy: "隐私政策",
      terms: "服务条款",
      rights: "保留所有权利。",
      startProject: "启动项目",
      tradeProgram: "贸易计划",
      adminAccess: "管理员访问",
      location_cn: "中国，肇庆",
      location_kh: "柬埔寨，干丹",
      factory_01: "工厂 01"
    },
    nav: {
      header: {
        home: "首页",
        capabilities: "能力",
        manufacturing: "制造",
        materials: "材料",
        collections: "产品系列",
        capacity: "全球产能",
        about: "关于我们",
        inquire: "咨询"
      },
      mega: {
        process: "生产流程",
        lumberPrep: "木材准备",
        cnc5Axis: "五轴 CNC",
        autoFinishing: "自动涂装",
        standards: "质控标准",
        incomingQC: "入库质检",
        inProcessQC: "过程质检",
        finalInspection: "成品检验",
        services: "服务模式",
        oemProduction: "OEM 代工",
        odmDesign: "ODM 设计",
        valueEngineering: "价值工程",
        compliance: "合规性",
        tscaTitleVI: "TSCA Title VI",
        fscCertification: "FSC 认证",
        istaPackaging: "ISTA 包装标准",
        focusPrecision: "精密制造",
        focusEng: "工程开发",
        focusLogistics: "物流保障"
      }
    },
    home: {
      subtitle: "家具制造",
      heroTitle: "专为规模化制造而生",
      heroQuote: "精密工程与自然艺术的结合。",
      heroBtnSecondary: "生产工艺",
      featuredCollections: "精选系列",
      factoryStrength: "工厂实力",
      strengthTitle: "服务于高端零售品牌",
      strengthDesc1: "PZ 是服务于设计驱动型品牌的实木制造伙伴。",
      strengthDesc2: "我们弥合了精品店品质与高效生产之间的差距。",
      globalHubs: "全球制造中心",
      chinaLoc: "总部及主厂区",
      cambodiaLoc: "低关税工厂",
      readyToScale: "准备好扩大生产规模了吗？"
    },
    about: {
      since: "始于 2014",
      title: "我们的故事",
      intro: "基于精密和工艺的原则，PZ 已从一家专业工作室发展成为高端木材制造领域的全球领导者。",
      bannerText: "规模化的匠心工艺",
      storyTitle: "起步",
      storyP1: "扎根于肇庆。",
      storyP2: "PZ 的初心很简单：将工业级的精密技术带入定制实木家具的世界。",
      storyP3: "在过去的十年中，我们的业务已扩展到中国和柬埔寨，服务于全球一些最负盛名的家具品牌和零售商。",
      storyP4: "我们相信工程技术是卓越设计的支柱。",
      galleryItems: {
        raw: { title: "原木采购", desc: "采购优质的 FSC 认证木材。" },
        milling: { title: "精密铣削", desc: "每个部件都经过 CNC 驱动的精确加工。" },
        automation: { title: "自动化", desc: "精简复杂的生产任务。" },
        finishing: { title: "涂装工艺", desc: "专业的纯手工染色和喷漆。" },
        qc: { title: "质量控制", desc: "每个工站都经过严格检验。" }
      },
      pillars: {
        elite: "精英工艺",
        eliteDesc: "我们的团队由拥有数十年经验的资深木匠组成。",
        dual: "双中心物流",
        dualDesc: "中国和柬埔寨工厂之间的无缝协作。",
        logistics: "全球履行",
        logisticsDesc: "全球范围内的综合运输和仓储解决方案。"
      },
      process: {
        label: "工作流程",
        title: "生产之旅"
      },
      journey: "十年的成长",
      milestones: {
        "2014": { title: "成立", desc: "第一家工厂在中国肇庆开业。" },
        "2018": { title: "扩张", desc: "新增五轴 CNC 加工能力。" },
        "2021": { title: "柬埔寨中心", desc: "在干丹省开设工厂，实现零关税出口。" },
        "2024": { title: "全球触达", desc: "服务于五大洲的 30 多个主要品牌。" },
        "2025": { title: "下一阶段", desc: "引入 AI 驱动的材料优化。" }
      }
    },
    manufacturing: {
      subtitle: "生产周期",
      title: "先进制造",
      intro: "我们的工厂将传统木工结构与航空级 CNC 技术相结合，确保规模化生产的一致性。",
      tabs: {
        process: "生产流程",
        machinery: "机械设备",
        qc: "质量控制"
      },
      steps: [
        { title: "窑干处理", desc: "含水率稳定在 8-10%，防止变形。" },
        { title: "组件准备", desc: "指接和拼板工艺确保结构强度。" },
        { title: "精密加工", desc: "五轴 CNC 切割处理复杂几何形状。" },
        { title: "结构组装", desc: "传统榫卯结构增强商业耐用性。" },
        { title: "表面涂装", desc: "多级打磨及 UV/PU 涂层应用。" },
        { title: "成品检验", desc: "包装前进行全面的 AQL 检验。" }
      ],
      machinery: {
        title: "工业技术",
        desc: "我们投资于最新的欧洲和亚洲机械设备，以保持精密和速度方面的竞争优势。",
        highPrecision: "±0.1mm CNC 公差",
        autoFinish: "自动涂装生产线",
        climate: "温湿度控制仓储"
      },
      machineryList: [
        { type: "CNC", name: "Biesse Rover 五轴", desc: "意大利设计的全能机型，适用于复杂的 3D 雕刻。" },
        { type: "打磨", name: "Steinemann 宽带", desc: "瑞士精密技术，打造完美平整的表面。" },
        { type: "涂装", name: "Cefla iGiotto", desc: "机器人喷涂系统，实现完美且一致的涂层。" }
      ],
      qc: {
        title: "不妥协的标准",
        desc: "质量并非事后之谈，而是嵌入生产流程的每个阶段。",
        iqc: "进料检验",
        iqcDesc: "对所有原木进行详细的含水率和密度检查。",
        ipqc: "过程检验",
        ipqcDesc: "每道加工工序后的尺寸校验。",
        fqc: "最终检验",
        fqcDesc: "在专业影棚级灯光下进行完整的组装和表面检查。"
      }
    },
    capabilities: {
      subtitle: "技术专长",
      title: "工业产能",
      intro: "从 OEM 代工到 ODM 开发，我们提供全方位的木制品生产服务。",
      categories: "产品领域",
      productCats: [
        { name: "餐饮及桌台", desc: "具有复杂边缘细节的大型实木桌。" },
        { name: "柜类及箱件", desc: "为家庭和办公设计的精密工程储物方案。" },
        { name: "重点座椅", desc: "高端软包椅的实木框架制造。" },
        { name: "案板及台面", desc: "适用于厨房和工作室的高强度工业表面。" }
      ],
      limits: {
        title: "技术规格",
        subtitle: "木质组件的最大生产参数。",
        request: "索取完整规格书",
        maxDim: "最大尺寸",
        length: "长度",
        width: "宽度",
        thickness: "厚度",
        precision: "精密与水分",
        cncTol: "CNC 公差",
        moisture: "含水率",
        gloss: "光泽度",
        materials: "材料支持",
        solidWood: "实木",
        veneer: "木皮/贴皮",
        mixed: "混合材质"
      },
      oem: {
        service: "服务模式",
        title: "您的制造伙伴",
        desc: "无论您提供蓝图还是需要我们进行开发，我们都能适应您的工作流。",
        oemTitle: "OEM 代工",
        oemDesc: "严格根据您提供的设计和规格进行生产。",
        odmTitle: "ODM / 开发",
        odmDesc: "协作工程开发，优化设计以实现规模化生产。"
      },
      compliance: {
        title: "标准与合规",
        desc: "我们遵守国际环境和安全法规。",
        safety: "全球安全",
        safetyDesc: "产品符合 TSCA Title VI 和欧盟 REACH 标准。",
        sustain: "可持续性",
        sustainDesc: "可根据要求提供 FSC 认证材料。",
        pack: "ISTA 包装",
        packDesc: "针对全球电商运输测试的包装方案。"
      },
      cta: {
        title: "启动您的生产周期",
        btn: "联系我们的工程团队"
      }
    },
    capacity: {
      footprint: "全球足迹",
      title: "物流与触达",
      desc: "运营两大制造中心，为全球客户提供关税优化的解决方案。",
      leadTime: "生产提前期",
      sampleDev: "样品开发",
      initProd: "首次生产",
      reOrder: "重复订单",
      leadTimeNote: "注：时间随材料供应情况和订单复杂度而变化。",
      logisticsTitle: "FOB 离岸点",
      chinaOrigin: "中国中心",
      khOrigin: "柬埔寨中心",
      shippingDesc: "我们提供全面的货柜整合及物流支持。",
      clientDist: "市场分布",
      clientDesc: "服务于全球的高端零售商和酒店项目。",
      stats: {
        sqft: "总平方英尺",
        brands: "全球合作伙伴",
        units: "月产能/件",
        logistics: "物流中心"
      },
      supplyChain: "强韧的供应链",
      supplyChainDesc: "我们与全球木材厂保持深度关系，确保价格稳定。",
      flexible: "灵活的扩展性",
      flexibleDesc: "可轻松将生产规模从 100 件扩大到 10,000 件。",
      warehouse: "区域仓储",
      warehouseDesc: "通过我们的洛杉矶中心提供库存管理和履行服务。",
      locations: {
        usa_title: "美国",
        usa_desc: "我们最大的市场，在洛杉矶设有专门的物流支持。",
        can_title: "加拿大",
        can_desc: "为北美各地的精品零售商提供服务。",
        uk_title: "英国",
        uk_desc: "专注于符合英国阻燃标准 (UKFR) 的住宅家具。",
        de_title: "德国",
        de_desc: "符合严格的 EUTR 和可持续性要求。",
        me_title: "中东",
        me_desc: "为迪拜和利雅得的奢侈酒店项目供货。",
        cn_title: "中国 (总部)",
        cn_desc: "我们的主要研发和高精密制造中心。",
        kh_title: "柬埔寨",
        kh_desc: "针对美国关税效率优化的规模化工厂。"
      }
    },
    materials: {
      title: "材料库",
      construction: "结构工艺",
      fingerJoint: "指接工艺",
      fingerJointDesc: "适用于工业及隐藏部件的强力、稳定的结构。",
      edgeGlue: "拼板工艺",
      edgeGlueDesc: "通材拼板，打造高端实木的连贯外观。",
      butcherBlock: "案板工艺",
      butcherBlockDesc: "端面/横纹结构，实现最大的表面耐用性。",
      library: "木材种类",
      species: {
        oak: { name: "白橡木", desc: "经典的开放纹理，具有卓越的强度和耐用性。" },
        walnut: { name: "黑胡桃", desc: "色泽深沉华丽，具有精致的奢华纹理。" },
        rubber: { name: "橡胶木", desc: "环保硬木，纹理均匀，色泽淡雅。" },
        ash: { name: "白蜡木", desc: "坚韧且富有弹性，具有明显的抛物线形纹理。" },
        beech: { name: "欧洲榉木", desc: "质地细密均匀，是涂装或染色处理的理想选择。" },
        maple: { name: "硬枫木", desc: "质地极硬，外观简洁现代。" },
        birch: { name: "黄桦木", desc: "用途广泛且耐用，具有微妙的木材特性。" },
        teak: { name: "种植柚木", desc: "天然富含油脂，耐候性极佳，适用于高端用途。" },
        acacia: { name: "相思木", desc: "纹理交错，具有极高的天然反差感。" },
        bamboo: { name: "重竹/楠竹", desc: "可持续的超硬材质，适用于重型桌面。" }
      },
      moisture: "水分控制",
      moistureDesc: "所有木材均窑干至 8-10%，确保在不同气候下的稳定性。",
      pu: "PU 涂装",
      puDesc: "聚氨酯涂层，提供商业级的耐磨性。",
      nc: "NC 涂装",
      ncDesc: "硝基漆涂装，提供自然且透气的触感。",
      uv: "UV 涂层",
      uvDesc: "瞬时固化涂层，在平面上具有卓越的抗划伤性。",
      request: "材料样品",
      requestDesc: "我们提供精心准备的样品盒，展示我们的木种和涂装能力。",
      orderKit: "订购样品盒"
    },
    inquire: {
      title: "咨询我们",
      desc: "我们的团队随时准备为您提供项目报价、材料咨询或安排工厂参观。",
      oem: "OEM/ODM 咨询",
      oemDesc: "如果可能，请附上技术图纸或参考图片。",
      form: {
        success: "咨询已发送",
        successDesc: "谢谢。我们的团队将审核您的信息并在 24-48 小时内回复。",
        again: "发送另一条咨询",
        name: "姓名",
        company: "公司名称",
        email: "电子邮箱",
        type: "项目类型",
        message: "留言内容",
        sending: "发送中...",
        send: "发送信息"
      },
      types: {
        general: "一般咨询",
        catalog: "索取目录",
        trade: "贸易合作",
        oem: "OEM/ODM 生产"
      }
    },
    admin: {
      dashboard: "管理后台",
      openCreator: "进入创作工作室",
      logout: "退出登录",
      inquiries: "客户咨询"
    },
    creator: {
      title: "创作模式",
      inventory: {
        header: "库存管理",
        selectCat: "选择一个类别来管理现有产品或添加新产品。",
        viewMaster: "查看全部列表",
        backCategories: "返回类别",
        search: "搜索库存...",
        noMatchTitle: "未找到匹配项",
        noMatchDesc: "我们找不到符合您条件的任何产品。",
        createProduct: "创建产品"
      },
      form: {
        edit: "编辑产品",
        add: "添加新产品",
        cancel: "取消"
      },
      config: {
        title: "网站配置",
        desc: "管理全局内容和封面图片。",
        discard: "丢弃更改",
        publish: "发布更改",
        publishing: "发布中...",
        unsaved: "未保存的更改"
      },
      assets: {
        title: "网站资源管理",
        desc: "在此管理静态图片和文件。",
        save: "保存更改",
        cancel: "取消",
        reset: "恢复默认"
      },
      statusLabels: {
        published: "已发布",
        pending: "待审核",
        draft: "草稿",
        rejected: "已拒绝"
      }
    },
    siteConfig: {
      sections: {
        "Global Settings": "全局设置",
        "Navigation Menu (Featured Images)": "导航菜单（推荐图片）",
        "Home Page / Hero": "首页 / 封面",
        "Home Page / Sections": "首页 / 板块",
        "Home Page / Global Hubs": "首页 / 全球枢纽",
        "About Page": "关于页面",
        "Manufacturing Page": "制造页面",
        "Global Capacity / Locations": "全球产能 / 地区",
        "Materials / Construction": "材料 / 结构工艺",
        "Materials / Wood Library": "材料 / 木材库",
      },
      fields: {
        "catalog.url": { label: "产品目录 PDF", help: "上传主产品目录 (PDF)。" },
        "home.hero.title": { label: "封面标题" },
        "home.hero.image": { label: "封面背景图" },
        "home.factory.image": { label: "工厂板块图片" },
        "home.cta.image": { label: "底部引导背景" },
        "home.hub_cn.image": { label: "中国枢纽图" },
        "home.hub_kh.image": { label: "柬埔寨枢纽图" },
        "about.banner": { label: "主要全景横幅" },
      }
    },
    collections: {
      collection: "系列",
      viewProducts: "查看产品",
      intro: "按制造工艺组织。",
      requestPdf: "索取 PDF 目录",
      pdp: {
        techDims: "技术规格",
        matConst: "材料与结构",
        inquireOrder: "咨询订购",
        descExtra: "兼顾耐用性与美学设计。",
        customSizes: "可定制尺寸"
      }
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children?: ReactNode }) => {
  const [language, setLang] = useState<Language>('en');

  // Logic to auto-switch language based on path
  useEffect(() => {
    const handlePathLanguage = () => {
      const path = window.location.hash || window.location.pathname;
      if (path.includes('/admin') || path.includes('/creator')) {
        setLang('zh');
      } else {
        setLang('en');
      }
    };

    handlePathLanguage();
    window.addEventListener('hashchange', handlePathLanguage);
    return () => window.removeEventListener('hashchange', handlePathLanguage);
  }, []);

  const t = translations[language];

  const value = {
    language,
    t,
    setLanguage: (l: Language) => setLang(l),
    toggleLanguage: () => setLang(prev => prev === 'en' ? 'zh' : 'en')
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
