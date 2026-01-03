
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
        collections: "Collections",
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
      exploreMfg: "Explore Manufacturing",
      featuredCollections: "Featured Collections"
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
      title: "Capabilities",
      subtitle: "Engineering Your Vision",
      intro: "Manufacturing is not just execution; it is problem-solving. Our engineering teams engage upstream with your designers to ensure feasibility, cost-efficiency, and structural integrity.",
      categories: "Product Categories",
      productCats: [
        { name: "Accent Chairs", desc: "Solid wood frames, complex joinery, upholstery." },
        { name: "Bar Stools", desc: "Counter and bar height, swivel mechanisms, metal footrests." },
        { name: "Cabinetry & Casegoods", desc: "Sideboards, media units, soft-close hardware." },
        { name: "Dining Tables", desc: "Solid wood, butcher block, live edge processing." },
        { name: "Workspaces", desc: "Desks, adjustable height tops, workstations." },
        { name: "Hospitality", desc: "Guestroom FF&E, lobby seating, high-traffic finishes." },
        { name: "Bespoke Projects", desc: "Custom specs, mixed materials (stone/metal)." }
      ],
      limits: {
        title: "Dimensions & Tech Limits",
        subtitle: "Engineering constraints for standard production lines.",
        request: "Request Custom Eval",
        maxDim: "Max Dimension",
        precision: "Precision",
        materials: "Materials",
        length: "Length",
        width: "Width",
        thickness: "Thickness",
        cncTol: "CNC Tolerance",
        moisture: "Moisture Content",
        gloss: "Gloss Level",
        solidWood: "Solid Wood",
        veneer: "Veneer",
        mixed: "Mixed (Metal/Stone)"
      },
      oem: {
        service: "Service Models",
        title: "OEM & ODM Services",
        desc: "Whether you have complete CAD drawings ready for manufacturing (OEM) or need us to develop a product from a concept sketch (ODM), our engineering team integrates into the process.",
        oemTitle: "OEM (Build-to-Print)",
        oemDesc: "Exact execution of your technical drawings. Material matching and strict tolerance adherence.",
        odmTitle: "ODM (Design Support)",
        odmDesc: "We provide structural engineering, value engineering, and prototyping to realize your vision."
      },
      compliance: {
        title: "Technical Compliance",
        desc: "We ensure all products meet regulatory standards for destination markets, with specific focus on US and EU markets.",
        safety: "Chemical Safety",
        safetyDesc: "TSCA Title VI (Formaldehyde), CA Prop 65 Compliant.",
        sustain: "Sustainability",
        sustainDesc: "FSC Certified timber available upon request. EUTR Sourcing compliant.",
        pack: "Packaging",
        packDesc: "ISTA-3A / 6A Testing for E-commerce durability."
      },
      cta: {
        title: "Have a Custom Project?",
        btn: "Start Development"
      }
    },
    collections: {
      title: "Collections & Capabilities",
      intro: "Organized by manufacturing discipline. We specialize in pure solid wood fabrication for residential and commercial applications.",
      collection: "Collection",
      viewProducts: "View Products",
      overview: "Overview",
      needCatalog: "Need the Catalog?",
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
        descExtra: "Designed with durability and aesthetic purity in mind. This piece reflects our commitment to precision manufacturing, utilizing 5-axis CNC technology and traditional joinery.",
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
        customSizes: "Customizable Sizes"
      }
    },
    materials: {
      title: "Materials & Craft",
      construction: "Construction Methods & Variants",
      library: "Wood Library",
      fingerJoint: "Finger Joint",
      fingerJointDesc: "Interlocking 'fingers' cut into the ends of wood blocks to extend length. Provides immense structural strength and maximizes lumber yield. Ideal for painted frames and long tops.",
      edgeGlue: "Edge Glued (Full Stave)",
      edgeGlueDesc: "Staves glued side-by-side running the full length of the piece. Creates a continuous, premium grain look. Preferred for high-end dining tables and premium visible surfaces.",
      butcherBlock: "Butcher Block",
      butcherBlockDesc: "Thick wood staves glued together. Extremely durable and stable. Often used for heavy-duty workbenches, kitchen islands, and industrial-style tops.",
      finishes: "Finishes & Specs",
      moisture: "Moisture Content",
      moistureDesc: "All lumber is Kiln Dried (KD) to 8-10% (±2%) before production to prevent warping and cracking.",
      pu: "PU Finish",
      puDesc: "Polyurethane coating offering a durable, hard shell resistant to water, heat, and scratches. Ideal for dining tables.",
      nc: "NC Finish",
      ncDesc: "Nitrocellulose lacquer providing a natural, thin-film look that enhances grain depth. Easier to repair but less water resistant.",
      uv: "UV Coating",
      uvDesc: "Ultraviolet cured coating for high-volume, instant-cure lines. Extremely consistent and chemically resistant.",
      request: "Request Samples",
      requestDesc: "We provide physical wood and finish samples for development teams.",
      orderKit: "Order Sample Kit",
      species: {
        oak: { name: "White Oak", desc: "Durable hardwood with distinct grain patterns and excellent stability." },
        walnut: { name: "Black Walnut", desc: "Rich, dark tones with a naturally luxurious finish." },
        rubber: { name: "Rubberwood", desc: "Sustainable hardwood with fine, uniform texture. Eco-friendly sourcing." },
        ash: { name: "Ash", desc: "Light-colored hardwood known for its strength, flexibility, and striking grain." },
        beech: { name: "Beech", desc: "Smooth, fine-grain hardwood, excellent for curved structures and warm, natural finishes." },
        maple: { name: "Maple", desc: "Dense, smooth-grain hardwood with a clean, modern look and excellent durability." },
        birch: { name: "Birch", desc: "Pale hardwood known for fine, uniform grain, excellent machinability, and clean modern aesthetic." },
        teak: { name: "Teak", desc: "Premium tropical hardwood rich in natural oils, offering superior weather resistance and a timeless golden-brown hue." },
        acacia: { name: "Acacia", desc: "Durable hardwood with bold, contrasting grain patterns and strong visual character." },
        bamboo: { name: "Bamboo", desc: "Sustainable, fast-growing material with high hardness and unique linear texture." }
      }
    },
    inquire: {
      title: "Start a Conversation",
      desc: "Whether you are a global furniture brand looking for an ODM partner or an architect specifying for a commercial project, we are ready to engineer your vision.",
      trade: "Trade Program",
      tradeDesc: "Exclusive pricing and customization capabilities for interior designers and architects.",
      oem: "ODM / OEM Services",
      oemDesc: "Full-scale manufacturing for retail brands. MOQs apply.",
      catalog: "Digital Catalog",
      catalogDesc: "Request our comprehensive spec guide via the form. Includes full material library, joinery details, and factory capabilities.",
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
        sending: "Sending...",
        success: "Thank You",
        successDesc: "Your inquiry has been received. Our team will review your project requirements and respond shortly.",
        again: "Send Another Message"
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
      desc: "PZ operates a strategic dual-shore manufacturing network. With large-scale facilities in China and Cambodia, plus domestic warehousing in Los Angeles, we offer a resilient supply chain immune to single points of failure.",
      clientDist: "Global Client Distribution",
      clientDesc: "We serve clients across North America, Europe, and the Middle East, with a primary concentration in the US and Canadian markets.",
      stats: {
        sqft: "Total Sq.Ft Capacity",
        brands: "Major US Brands",
        units: "Monthly Unit Capacity",
        logistics: "US Logistics Hub"
      },
      locations: {
        cn_title: "Zhaoqing HQ",
        cn_desc: "Our primary campus focusing on complex R&D, mixed-material fabrication, and master craftsmanship. Our center of engineering excellence.",
        kh_title: "Cambodia Factory",
        kh_desc: "Strategic low-tariff manufacturing hub in Kandal Province, tailored for high-volume production runs and cost-effective scalability.",
        usa_title: "USA Market",
        usa_desc: "Our largest market. We support 30+ major US brands with direct container programs and domestic inventory solutions via our LA warehouse.",
        can_title: "Canada Market",
        can_desc: "Supplying Canadian retailers with premium solid wood furniture featuring cold-resistant finishes and construction.",
        uk_title: "United Kingdom",
        uk_desc: "Exporting distinct joinery and FR-compliant upholstery meeting UK standards.",
        de_title: "EU (Germany)",
        de_desc: "Meeting strict EU sustainability (EUTR) and chemical safety standards for discerning European clients.",
        me_title: "Middle East",
        me_desc: "Serving luxury hospitality projects and high-end residential developments in the region."
      },
      leadTime: "Lead Time Overview",
      sampleDev: "Sample Development",
      initProd: "Initial Production",
      reOrder: "Re-Order Production",
      leadTimeNote: "* Lead times may vary based on material availability and order volume.",
      logisticsTitle: "Logistics & FOB",
      chinaOrigin: "China Origin",
      khOrigin: "Cambodia Origin",
      shippingDesc: "We support FCL (Full Container Load) and LCL. Drop-ship programs available via our US warehouse.",
      supplyChain: "Supply Chain Solutions",
      supplyChainDesc: "We don't just build furniture; we deliver it. From FOB manufacturing in SE Asia to last-mile capabilities in the USA.",
      flexible: "Flexible Export",
      flexibleDesc: "Choose between China or Cambodia origin based on your tariff strategy and lead time requirements.",
      warehouse: "US Warehouse (LA)",
      warehouseDesc: "129,000 sq.ft facility in California allowing for domestic replenishment and drop-ship programs."
    },
    admin: {
      dashboard: "Admin Dashboard",
      openCreator: "Open Creator Studio",
      viewSite: "View Site",
      logout: "Logout",
      inquiries: "Inquiries",
      exportCsv: "Export CSV",
      noData: "No inquiries found.",
      loading: "Loading data...",
      cols: { date: "Date", name: "Name", company: "Company", type: "Type", msg: "Message", status: "Status" }
    },
    creator: {
      title: "Creator Mode",
      editing: "Editing",
      backAdmin: "Back to Admin",
      tabs: { inventory: "Inventory", collections: "Collections", config: "Site Config", media: "Media", review: "Review Queue", accounts: "Accounts", assets: "Assets" },
      status: { connected: "Cloud Config Connected", local: "Local Mode", syncing: "Syncing..." },
      inventory: {
        manage: "Manage Inventory",
        desc: "Search and manage your product inventory.",
        search: "Search inventory...",
        noItems: "No items found",
        duplicate: "Duplicate / Variant",
        delete: "Delete",
        edit: "Edit",
        header: "Inventory Management",
        selectCat: "Select a category to manage existing products or add new ones.",
        viewMaster: "View Master List",
        backCategories: "Back to Categories",
        emptyTitle: "This collection is empty",
        emptyDesc: "Initialize your inventory by creating the first product record.",
        noMatchTitle: "No Matches",
        noMatchDesc: "We couldn't find any products matching your criteria.",
        clearSearch: "Clear Search",
        createNewAnyway: "Create New Anyway",
        createProduct: "Create Product"
      },
      form: {
        edit: "Edit Product",
        add: "Add New Product",
        cancel: "Cancel",
        status: "Current Status",
        mainCat: "Main Category",
        subCat: "Sub Category",
        create: "+ Create New",
        cancelNew: "Cancel New",
        nameEn: "Product Name (EN)",
        nameZh: "Product Name (CN)",
        specs: "Specifications",
        material: "Material",
        dims: "Dimensions",
        code: "Product Code (SKU)",
        autoGen: "Generate",
        descEn: "Description (EN)",
        descZh: "Description (CN)",
        colors: "Color Variants",
        addColor: "Add Color",
        gallery: "Image Gallery",
        saveDraft: "Save Draft",
        publish: "Publish Product",
        submit: "Submit for Review",
        setDraft: "Set to Draft",
        forcePub: "Force Publish",
        update: "Update Product",
        processing: "Processing...",
        delete: "Delete Product"
      },
      config: {
        title: "Site Configuration",
        desc: "Manage global content and hero images.",
        discard: "Discard",
        publish: "Publish Changes",
        publishing: "Publishing...",
        unsaved: "Unsaved Changes",
        active: "Active"
      },
      assets: {
        title: "Site Asset Management",
        desc: "Manage static site images and files here (Catalog PDF, Hero Banners, Factory Images, etc.). Click 'Save' after uploading to apply changes.",
        history: "Asset History",
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
        "catalog.url": { label: "Catalog PDF", help: "Upload the main product catalog (PDF). Appears on Portfolio & Inquire pages." },
        "menu.feat_collections": { label: "Portfolio Menu Image" },
        "menu.feat_mfg": { label: "Manufacturing Menu Image" },
        "menu.feat_capabilities": { label: "Capabilities Menu Image" },
        "menu.feat_default": { label: "Default Menu Image" },
        "home.hero.title": { label: "Hero Title" },
        "home.hero.image": { label: "Hero Background Image" },
        "home.factory.image": { label: "Factory Section Image" },
        "home.cta.image": { label: "Footer CTA Background" },
        "home.hub_cn.image": { label: "China Hub Image" },
        "home.hub_kh.image": { label: "Cambodia Hub Image" },
        "about.banner": { label: "Main Cinematic Banner" },
        "about.gallery.raw": { label: "Gallery: Raw Lumber" },
        "about.gallery.milling": { label: "Gallery: Precision Milling" },
        "about.gallery.automation": { label: "Gallery: Automation" },
        "about.gallery.finishing": { label: "Gallery: Hand Finishing" },
        "about.gallery.qc": { label: "Gallery: Quality Control" },
        "manufacturing.hero_machinery": { label: "Machinery Hero" },
        "manufacturing.hero_qc": { label: "QC/Lab Hero" },
        "capacity.map_bg": { label: "World Map Background" },
        "capacity.card_cn": { label: "China HQ Card" },
        "capacity.card_kh": { label: "Cambodia Factory Card" },
        "capacity.loc_usa": { label: "Location: USA" },
        "capacity.loc_can": { label: "Location: Canada" },
        "capacity.loc_uk": { label: "Location: UK" },
        "capacity.loc_de": { label: "Location: Germany" },
        "capacity.loc_me": { label: "Location: Middle East" },
        "materials.const_finger": { label: "Finger Joint" },
        "materials.const_edge": { label: "Edge Glue" },
        "materials.const_butcher": { label: "Butcher Block" },
        "materials.wood_oak": { label: "White Oak" },
        "materials.wood_walnut": { label: "Walnut" },
        "materials.wood_rubber": { label: "Rubberwood" },
        "materials.wood_ash": { label: "Ash" },
        "materials.wood_beech": { label: "Beech" },
        "materials.wood_maple": { label: "Maple" },
        "materials.wood_teak": { label: "Teak" },
        "materials.wood_acacia": { label: "Acacia" },
        "materials.wood_birch": { label: "Birch" },
        "materials.wood_bamboo": { label: "Bamboo" }
      }
    }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children?: ReactNode }) => {
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

  const t = translations[language] || translations['en'];

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t
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
