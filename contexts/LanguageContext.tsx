import React, { createContext, useContext, ReactNode, useState } from 'react';

interface LanguageContextType {
  language: 'en';
  t: typeof translations.en;
  setLanguage: (lang: 'en') => void;
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
      searchPlaceholder: "Search archive...",
      searchRefine: "Refine your search parameters...",
      backHome: "Return Home",
      loading: "Synchronizing...",
      close: "Dismiss",
      explore: "Explore",
      connect: "Project Portal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      rights: "All technical rights reserved.",
      startProject: "Contact for Quote",
      tradeProgram: "Industry Program",
      adminAccess: "System Access",
      location_cn: "Zhaoqing, China (HQ)",
      location_kh: "Kandal, Cambodia",
      factory_01: "Main Facility"
    },
    nav: {
      header: {
        home: "Home",
        capabilities: "Capabilities",
        manufacturing: "Manufacturing",
        materials: "Resources",
        collections: "Portfolio",
        capacity: "Process",
        about: "About",
        inquire: "Contact"
      },
      mega: {
        process: "Industrial Flow",
        lumberPrep: "Lumber Stabilization",
        cnc5Axis: "5-Axis Precision",
        autoFinishing: "Coating Systems",
        standards: "QA Protocol",
        incomingQC: "Material Intake",
        inProcessQC: "Structural Audit",
        finalInspection: "Surface Validation",
        services: "Operational Models",
        oemProduction: "OEM Scale",
        odmDesign: "ODM Engineering",
        valueEngineering: "Cost Analysis",
        compliance: "Global Standards",
        tscaTitleVI: "TSCA Title VI",
        fscCertification: "FSC Wood",
        istaPackaging: "ISTA Testing",
        focusPrecision: "Tolerances",
        focusEng: "Engineering",
        focusLogistics: "Fulfillment"
      }
    },
    home: {
      subtitle: "Solid Wood Manufacturing",
      heroTitle: "Engineered for Scalable Production",
      heroQuote: "Industrial precision meets natural material artistry.",
      heroBtnSecondary: "View Process",
      featuredCollections: "Featured Collections",
      factoryStrength: "Operational Infrastructure",
      strengthTitle: "Optimized for Commercial High-End.",
      strengthDesc1: "PZ is a strategic solid wood partner serving design-led global brands.",
      strengthDesc2: "We integrate boutique craftsmanship with aerospace-grade CNC consistency.",
      globalHubs: "Global Infrastructure Hubs",
      chinaLoc: "HQ & Engineering Center",
      cambodiaLoc: "Tariff-Optimized Facility",
      readyToScale: "Ready to Start a Project?"
    },
    about: {
      since: "OPERATIONAL SINCE 2014",
      title: "About PZ",
      intro: "Driven by structural integrity and geometric precision, PZ has evolved from a specialist workshop into an industrial leader in high-end wood manufacturing.",
      bannerText: "Craftsmanship. Validated.",
      storyTitle: "Origins",
      storyP1: "Headquartered in Zhaoqing.",
      storyP2: "PZ was founded to solve the gap between artisanal design and mass production viability.",
      storyP3: "Over the last decade, we have expanded our footprint across Asia to serve the most exacting furniture retailers.",
      storyP4: "Engineering is the foundation of every successful project.",
      galleryItems: {
        raw: { title: "Raw Inventory", desc: "Fine FSC-certified lumber stock." },
        milling: { title: "CNC Milling", desc: "Digital accuracy for every component." },
        automation: { title: "Systems", desc: "Optimizing repetitive production cycles." },
        finishing: { title: "Surface Application", desc: "Premium stains and aerospace lacquers." },
        qc: { title: "Audit", desc: "Strict verification at every station." }
      },
      pillars: {
        elite: "Master Joinery",
        eliteDesc: "Led by engineers and master carpenters with decades of lineage.",
        dual: "Dual-Hub Logistics",
        dualDesc: "Optimized flow between China HQ and Cambodia export lines.",
        logistics: "Turnkey Fulfillment",
        logisticsDesc: "Global shipping consolidation and last-mile logistics support."
      },
      process: {
        label: "Operational Flow",
        title: "The Project Lifecycle"
      },
      journey: "A Decade of Engineering",
      milestones: {
        "2014": { title: "Inception", desc: "PZ-01 facility opens in Zhaoqing, China." },
        "2018": { title: "Digitalization", desc: "Deployment of multi-axis CNC clusters." },
        "2021": { title: "Cambodia Hub", desc: "PZ-02 facility activated for global export." },
        "2024": { title: "Market Lead", desc: "Serving 30+ category-leading brands." },
        "2025": { title: "PZ Next", desc: "Implementation of AI-driven yield optimization." }
      }
    },
    manufacturing: {
      subtitle: "The Production Cycle",
      title: "Advanced Systems",
      intro: "Our facilities fuse traditional joinery with aerospace-grade CNC technology to ensure zero-defect consistency.",
      tabs: {
        process: "Lifecycle",
        machinery: "Infrastructure",
        qc: "Audit Protocol"
      },
      steps: [
        { title: "Kiln Curing", desc: "Moisture stabilized to 8-10% to prevent dimensional shift." },
        { title: "Skeletion Prep", desc: "Edge-gluing and jointing for maximum structural strength." },
        { title: "Precision CNC", desc: "High-speed multi-axis milling for complex CAD data." },
        { title: "Assembly", desc: "Traditional joinery reinforced for high-traffic environments." },
        { title: "Surface Coat", desc: "Multi-phase robotic application of UV/PU finishes." },
        { title: "Final Audit", desc: "AQL 2.5 inspection before sealed packaging." }
      ],
      machinery: {
        title: "Industrial Logic",
        desc: "We utilize advanced European machinery to maintain tolerances unreachable by manual labor.",
        highPrecision: "±0.1mm Digital Tolerance",
        autoFinish: "Robotic Finish Channels",
        climate: "HVAC Climate Controlled Zones"
      },
      machineryList: [
        { type: "MILLING", name: "Biesse 5-Axis", desc: "Italian versatility for intricate 3D geometries." },
        { type: "CALIBRATION", name: "Steinemann Wide Belt", desc: "Swiss accuracy for perfectly flat surfaces." },
        { type: "COATING", name: "Cefla iGiotto", desc: "Robotic spray tech for flawless consistency." }
      ],
      qc: {
        title: "Protocol Standards",
        desc: "Quality is an engineered metric, verified at every stage of the assembly line.",
        iqc: "Material Intake",
        iqcDesc: "Full scan of density and moisture for all raw lumber.",
        ipqc: "Flow Audit",
        ipqcDesc: "Dimensional verification after every machine cycle.",
        fqc: "Registry Final",
        fqcDesc: "Studio-lit inspection of finishes and hardware alignment."
      }
    },
    capabilities: {
      subtitle: "Technical Matrix",
      title: "Industrial Capacity",
      intro: "From OEM manufacturing to full ODM development, we provide an industrial ecosystem for wood production.",
      categories: "Market Sectors",
      productCats: [
        { name: "Tables & Desks", desc: "Large-scale solid wood surfaces with engineered joints." },
        { name: "Storage Systems", desc: "Precisely detailed cabinetry and casegoods." },
        { name: "Frame Systems", desc: "Base structures for high-performance seating." },
        { name: "Professional Prep", desc: "Heavy-duty surfaces for culinary and work environments." }
      ],
      limits: {
        title: "Technical Constraints",
        subtitle: "Production parameters for mass manufacturing.",
        request: "Request Data Sheet",
        maxDim: "Envelope Dimensions",
        length: "Max Length",
        width: "Max Width",
        thickness: "Max Profile",
        precision: "Curing & Precision",
        cncTol: "CNC Tolerance",
        moisture: "MC Target",
        gloss: "Gloss Range",
        materials: "Input Support",
        solidWood: "Solid Lumber",
        veneer: "Veneer Logic",
        mixed: "Hybrid Media"
      },
      oem: {
        service: "Production Models",
        title: "Your Scaled Partner",
        desc: "We integrate with your workflow, providing the engineering depth to scale your concepts.",
        oemTitle: "OEM Channel",
        oemDesc: "Manufacturing based on verified blueprints and material specs." ,
        odmTitle: "ODM Development",
        odmDesc: "Collaborative engineering to optimize design for manufacturing (DFM)."
      },
      compliance: {
        title: "Safety & Ethics",
        desc: "Strict adherence to international safety and sustainability mandates.",
        safety: "Global Compliance",
        safetyDesc: "Products comply with TSCA Title VI and EU REACH standards.",
        sustain: "Resource Ethics",
        sustainDesc: "FSC Chain-of-Custody materials available upon request.",
        pack: "E-Commerce Ready",
        packDesc: "ISTA tested packaging for drop-ship reliability."
      },
      cta: {
        title: "Initiate Production Cycle",
        btn: "Contact Engineering Team"
      }
    },
    capacity: {
      footprint: "Operational Reach",
      title: "Process Matrix",
      desc: "Synchronizing two high-capacity hubs to provide tariff-free and high-precision wood solutions.",
      leadTime: "Cycle Projections",
      sampleDev: "Prototype Cycle",
      initProd: "Initial Run",
      reOrder: "Repeat Production",
      leadTimeNote: "Note: Schedules depend on material procurement and SKU complexity.",
      logisticsTitle: "Export Gateways",
      chinaOrigin: "Zhaoqing Terminal",
      khOrigin: "Kandal Terminal",
      shippingDesc: "Full container consolidation and DDP/FOB logistics support.",
      clientDist: "Client Registry",
      clientDesc: "Supporting Tier-1 retailers and luxury hospitality projects globally.",
      stats: {
        sqft: "Facility Sq. Ft",
        brands: "Global Clients",
        units: "Monthly Output",
        logistics: "Logistics Hub"
      },
      supplyChain: "Input Resilience",
      supplyChainDesc: "Global lumber procurement ensuring stable raw material pricing.",
      flexible: "Elastic Scale",
      flexibleDesc: "Seamlessly scale from 100 to 10,000 units per SKU.",
      warehouse: "Regional Support",
      warehouseDesc: "Inventory buffering and fulfillment via our LA logistics hub.",
      locations: {
        usa_title: "United States",
        usa_desc: "Key market with local logistics and fulfillment in California.",
        can_title: "Canada",
        can_desc: "Supplying boutique chains across North America.",
        uk_title: "United Kingdom",
        uk_desc: "Specialized UKFR compliant upholstery frames.",
        de_title: "Germany",
        de_desc: "EUTR compliant sustainable lumber supply.",
        me_title: "Middle East",
        me_desc: "Hospitality millwork for luxury developments.",
        cn_title: "China (HQ)",
        cn_desc: "Primary R&D and high-precision fabrication center.",
        kh_title: "Cambodia",
        kh_desc: "High-volume factory optimized for US tariff efficiency."
      }
    },
    materials: {
      title: "Resources Library",
      construction: "Joinery Methods",
      fingerJoint: "Finger-Jointing",
      fingerJointDesc: "High-stability structural bonding for industrial parts.",
      edgeGlue: "Edge-Gluing",
      edgeGlueDesc: "Seamless solid wood boards using full-length staves.",
      butcherBlock: "Cross-Grain",
      butcherBlockDesc: "Industrial-grade surfaces for maximum durability.",
      library: "Lumber Species",
      species: {
        oak: { name: "White Oak", desc: "Structural classic with superior density and durability." },
        walnut: { name: "American Walnut", desc: "Exquisite tones with luxury figurative grain." },
        rubber: { name: "Rubberwood", desc: "Eco-optimized hardwood with neutral palette." },
        ash: { name: "White Ash", desc: "Elastic strength with prominent sweeping grain." },
        beech: { name: "European Beech", desc: "Fine texture engineered for uniform stains." },
        maple: { name: "Hard Maple", desc: "High density with clean architectural aesthetic." },
        birch: { name: "Yellow Birch", desc: "Versatile character with resilient cell structure." },
        teak: { name: "Plantation Teak", desc: "Weather-resistant silica content for premium SKUs." },
        acacia: { name: "Acacia", desc: "Interlocking grain with high natural contrast." },
        bamboo: { name: "Compacted Bamboo", desc: "Sustainable ultra-hard material for heavy usage." }
      },
      moisture: "Curing Control",
      moistureDesc: "Kiln-dried to 8-10% to ensure stability across global climates.",
      pu: "PU Systems",
      puDesc: "Polyurethane coatings for heavy commercial traffic.",
      nc: "NC Systems",
      ncDesc: "Nitrocellulose lacquers for breathable, natural hand-feel.",
      uv: "UV Curing",
      uvDesc: "Instant-cure coatings for high scratch resistance on flatware.",
      request: "Material Samples",
      requestDesc: "We provide curated kits showcasing our material and finish matrix.",
      orderKit: "Request Sample Kit"
    },
    inquire: {
      title: "Contact Us",
      desc: "Connect with our engineering team for technical quotes or material inquiries.",
      oem: "Technical Inquiries",
      oemDesc: "Please provide CAD data or dimensioned sketches for accurate quoting.",
      form: {
        success: "Message Received",
        successDesc: "Your inquiry has been logged. An engineer will respond within 24 hours.",
        again: "Start new inquiry",
        name: "Full Name",
        company: "Company Entity",
        email: "Email Address",
        type: "Engagement Type",
        message: "Technical Note",
        sending: "Logging Data...",
        send: "Transmit Inquiry"
      },
      types: {
        general: "General Inquiry",
        catalog: "Catalog Request",
        trade: "Industry Partner",
        oem: "Production Run"
      }
    },
    admin: {
      dashboard: "Registry Dashboard",
      openCreator: "Open Creator Studio",
      logout: "Exit System",
      inquiries: "Logged Inquiries"
    },
    creator: {
      title: "Studio Mode",
      inventory: {
        header: "SKU Management",
        selectCat: "Select a category to manage or add new products.",
        viewMaster: "Registry Overview",
        backCategories: "Back to Sets",
        search: "Search SKU...",
        noMatchTitle: "Entry Not Found",
        noMatchDesc: "We could not find any records matching your parameters.",
        createProduct: "New Registry Entry"
      },
      form: {
        edit: "Modify Entry",
        add: "Create Entry",
        cancel: "Discard"
      },
      config: {
        title: "Site Logic",
        desc: "Global interface configuration and asset mapping.",
        discard: "Flush Cache",
        publish: "Apply Changes",
        publishing: "Committing...",
        unsaved: "Uncommitted Changes"
      },
      assets: {
        title: "Asset Repository",
        desc: "Manage high-resolution static assets and technical documents.",
        save: "Commit",
        cancel: "Abort",
        reset: "Factory Default"
      },
      statusLabels: {
        published: "Published",
        pending: "Awaiting Audit",
        draft: "Draft Mode",
        rejected: "Revision Needed"
      }
    },
    siteConfig: {
      sections: {
        "Global Settings": "Global Protocol",
        "Navigation Menu (Featured Images)": "Interface Assets",
        "Home Page / Hero": "Front-End Hero",
        "Home Page / Sections": "Body Content",
        "Home Page / Global Hubs": "Logistics Mapping",
        "About Page": "About Profile",
        "Manufacturing Page": "Manufacturing Logic",
        "Global Capacity / Locations": "Process Flow",
        "Materials / Construction": "Construction Methods",
        "Materials / Wood Library": "Resources",
      },
      fields: {
        "catalog.url": { label: "Catalog (PDF)", help: "Primary product catalog for public download." },
        "home.hero.title": { label: "Primary Header" },
        "home.hero.image": { label: "Hero Background" },
        "home.factory.image": { label: "Facility Visual" },
        "home.cta.image": { label: "Footer Background" },
        "home.hub_cn.image": { label: "China HQ Visual" },
        "home.hub_kh.image": { label: "Cambodia Hub Visual" },
        "about.banner": { label: "Cinematic Banner" },
      }
    },
    collections: {
      collection: "Project Set",
      viewProducts: "Access SKUs",
      intro: "Organized by industrial category and joinery logic.",
      requestPdf: "Access PDF",
      pdp: {
        techDims: "Technical Data",
        matConst: "Material Stack",
        inquireOrder: "Inquire SKU",
        descExtra: "Engineered for structural resilience and aesthetic purity.",
        customSizes: "Technical sizing upon request"
      }
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children?: ReactNode }) => {
  const language = 'en' as const;
  const t = translations.en;

  const value = {
    language,
    t,
    setLanguage: () => {}, // No-op
    toggleLanguage: () => {} // No-op
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