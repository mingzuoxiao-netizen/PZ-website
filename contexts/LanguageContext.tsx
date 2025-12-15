
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
      title: "Start a Conversation",
      desc: "Whether you are a global furniture brand looking for an ODM partner or an architect specifying for a commercial project, we are ready to engineer your vision.",
      trade: "Trade Program",
      tradeDesc: "Exclusive pricing and custom capabilities for interior designers and architects.",
      oem: "ODM / OEM Services",
      oemDesc: "Full-scale manufacturing for retail brands. MOQs apply.",
      catalog: "Digital Catalog",
      catalogDesc: "Request our comprehensive guide to specs via form. Includes full material library, joinery details, and factory capabilities.",
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
        successDesc: "Your inquiry has been received. Our team will review your project needs and respond shortly.",
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
      desc: "PZ operates a strategic dual-shore manufacturing network. With large-scale facilities in both China and Cambodia, plus a domestic warehouse in Los Angeles, we offer a resilient supply chain immune to single points of failure.",
      clientDist: "Global Client Distribution",
      clientDesc: "We serve clients across North America, Europe, and the Middle East, with a strong concentration in the US and Canadian markets.",
      stats: {
        sqft: "Total Sq.Ft Capacity",
        brands: "Major US Brands",
        units: "Monthly Unit Capacity",
        logistics: "US Logistics Hub"
      },
      locations: {
        cn_title: "Zhaoqing HQ",
        cn_desc: "Our primary campus focusing on complex R&D, mixed-material fabrication, and master craftsmanship. The center of our engineering excellence.",
        kh_title: "Cambodia Factory",
        kh_desc: "A strategic low-tariff manufacturing hub in Kandal Province, tailored for high-volume production runs and cost-effective scalability.",
        usa_title: "USA Market",
        usa_desc: "Our largest market by volume. We support 30+ major US brands with direct container programs and domestic inventory solutions via our LA warehouse.",
        can_title: "Canada Market",
        can_desc: "Supplying Canadian retailers with premium solid wood furniture featuring cold-resistant finishes and construction.",
        uk_title: "United Kingdom",
        uk_desc: "Exporting distinct joinery and FR-compliant upholstery to meet British Standards.",
        de_title: "EU (Germany)",
        de_desc: "Meeting strict EU sustainability (EUTR) and chemical safety standards for discerning European clients.",
        me_title: "Middle East",
        me_desc: "Servicing luxury hospitality projects and high-end residential developments in the region."
      },
      leadTime: "Lead Time Overview",
      sampleDev: "Sample Development",
      initProd: "Initial Production",
      reOrder: "Re-Order Production",
      leadTimeNote: "* Lead times may vary based on material availability and order volume.",
      logisticsTitle: "Logistics & FOB",
      chinaOrigin: "China Origin",
      khOrigin: "Cambodia Origin",
      shippingDesc: "We support both FCL (Full Container Load) and LCL consolidation. Drop-ship programs available via our US warehouse.",
      supplyChain: "Supply Chain Solutions",
      supplyChainDesc: "We don't just build furniture; we deliver it. From FOB manufacturing in Southeast Asia to last-mile capabilities in the US.",
      flexible: "Flexible Export",
      flexibleDesc: "Choose between China or Cambodia origin based on your tariff strategy and lead time requirements.",
      warehouse: "US Warehouse (LA)",
      warehouseDesc: "129,000 sq.ft facility in California allowing for domestic replenishment and drop-ship programs."
    },
    studio: {
       title: "The Studio",
       subtitle: "Where Design Meets Precision",
       design: "Design",
       designTitle: "Architectural Thinking",
       designDesc1: "We approach furniture not just as objects, but as architectural elements. Every curve and joint is considered.",
       designDesc2: "Our in-house design team collaborates with global partners to bring sketches to reality.",
       eng: "Engineering",
       engTitle: "Structural Integrity",
       engDesc: "Beauty must be durable. Our engineering process ensures longevity.",
       raw: "Raw Materials",
       rawTitle: "Premium Selection",
       rawDesc: "We source only the finest hardwoods from sustainable forests.",
       exploreMat: "Explore Materials"
    },
    admin: {
      dashboard: "Admin Dashboard",
      openCreator: "Open Creator Studio",
      viewSite: "View Website",
      logout: "Log Out",
      inquiries: "Inquiries",
      exportCsv: "Export CSV",
      noData: "No inquiries found matching your criteria.",
      loading: "Loading Data...",
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
        search: "Search Inventory...",
        noItems: "No Items Found",
        duplicate: "Duplicate / Variant",
        delete: "Delete",
        edit: "Edit",
        header: "Inventory Management",
        selectCat: "Select a category to manage existing products or add new ones.",
        viewMaster: "View Master List",
        backCategories: "Back to Categories",
        emptyTitle: "This Collection is Empty",
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
        nameZh: "Product Name (Secondary)",
        specs: "Specifications",
        material: "Material",
        dims: "Dimensions",
        code: "Product Code",
        autoGen: "Generate",
        descEn: "Description (EN)",
        descZh: "Description (Secondary)",
        colors: "Color Variants",
        addColor: "Add Color",
        gallery: "Gallery",
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
        history: "Version History",
        active: "Active",
        rollback: "Rollback"
      },
      assets: {
        title: "Site Asset Management",
        desc: "Manage static site images and files (Catalog PDF, Hero Banners, Factory Images, etc) here. Click 'Save' after uploading to apply changes.",
        history: "Asset History",
        save: "Save Change",
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
        "The Studio Page": "The Studio Page",
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
        "studio.hero": { label: "Studio Hero Image" },
        "studio.design": { label: "Design Section Image" },
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
      location_kh: "柬埔寨干拉省",
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
        about: "关于",
        inquire: "咨询"
      },
      mega: {
        solidWoodProjects: "实木项目",
        diningTables: "餐桌",
        butcherBlock: "拼板",
        solidComponents: "实木组件",
        seatingProjects: "座椅项目",
        diningChairs: "餐椅",
        accentChairs: "休闲椅",
        barStools: "吧台椅",
        metalMixed: "金属与混合",
        metalBases: "金属底座",
        mixedMaterials: "混合材料",
        customFabrication: "定制制造",
        casegoods: "柜类",
        mediaConsoles: "媒体柜",
        nightstands: "床头柜",
        storageUnits: "储物单元",
        process: "工艺流程",
        lumberPrep: "木材预备",
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
        focusSolid: "实木",
        focusPrecision: "精密",
        focusEng: "工程",
        focusLogistics: "物流"
      }
    },
    home: {
      subtitle: "家具制造",
      heroTitle: "专为规模化制造而设计",
      heroSub: "PZ",
      heroQuote: "“以精密制造连接全球设计。”",
      heroBtnPrimary: "工厂能力",
      heroBtnSecondary: "生产流程",
      heroBtnTertiary: "材料与木材库",
      viewLibrary: "查看木材库",
      factoryProfile: "工厂简介",
      factoryStrength: "工厂实力",
      strengthTitle: "专为高端零售打造。",
      strengthDesc1: "PZ 是服务于设计驱动型品牌的实木制造合作伙伴。我们专注于材料控制、精确执行和大规模稳定生产——支持需要一致性而非一次性构建的项目。",
      strengthDesc2: "我们弥合了美国领先品牌所需的精品级质量与亚洲高效制造能力之间的差距——以全球标准交付设计准确性、工程稳定性和一致的产量。",
      strengthSection: {
        autoFinishDesc: "结合自动涂装、受控固化和熟练人工干预的集成涂装工作流，确保生产批次间的表面一致性。",
        highPrecisionDesc: "支持复杂榫卯、曲线轮廓和紧密尺寸公差的精密 CNC 加工系统，适用于实木和混合材料组件。",
        climateDesc: "气候控制车间和中央除尘系统，旨在在整个铣削、组装和涂装阶段保持材料稳定性。"
      },
      stats: {
        factories: "工厂 (中国 + 柬埔寨)",
        exp: "年经验",
        partners: "美国合作伙伴"
      },
      competencies: "核心竞争力",
      comp1Title: "材料精通",
      comp1Desc: "专注于实木硬木加工，控制采购、水分管理和生产批次间的材料一致性。",
      comp2Title: "双岸供应",
      comp2Desc: "在中国和柬埔寨均设有生产能力，允许根据关税、交货期和订单规模灵活规划产地。",
      comp3Title: "先进榫卯",
      comp3Desc: "将 CNC 加工与经过验证的榫卯方法相结合，生产结构可靠、配合和表面一致的家具组件。",
      visitUs: "参观我们",
      globalHubs: "全球制造中心",
      globalDesc: "我们的双岸战略确保我们能够满足任何数量或关税要求。联系我们安排工厂参观或审计。",
      chinaLoc: "总部及主要设施",
      cambodiaLoc: "低关税工厂",
      readyToScale: "准备好扩展了吗？",
      exploreMfg: "探索制造"
    },
    about: {
      since: "自 2014 年",
      title: "工程将创意转化为产品的地方",
      intro: "PZ 是一家以工程为驱动的工业规模实木制造商。通过统一材料科学、生产系统和过程控制，我们将概念转化为可靠、可重复的制造结果。",
      bannerText: "“规模化的工匠精神。”",
      storyTitle: "我们的故事",
      storyP1: "PZ 的建立是为了证明现代实木工厂可以同时交付规模和控制——而不将质量视为例外。",
      storyP2: "随着品牌的发展，我们看到了设计意图与制造现实之间反复出现的差距。许多工厂针对产量进行了优化，但未针对改进、工程反馈或长期合作伙伴关系进行优化。",
      storyP3: "我们围绕流程清晰度、可重复性和协作构建了 PZ——因此改进是持续的，而不是被动的。",
      storyP4: "从自动化生产线到数据驱动的质量控制，从多树种实木加工到灵活的组装工作流，PZ 不断投资于使我们能够应对快速变化的行业的能力。每年，我们都会升级设备、扩展类别并改进生产工程——因为我们服务的品牌在不断增长，我们也随之增长。",
      storyP5: "我们的优势不仅在于机械。还在于我们倾听、分析、优化和执行的能力。我们作为技术问题解决者与设计师和买手合作，将草图和原型转化为稳定、可重复且高效制造的产品。",
      storyP6: "起初的一个车间已成为一个面向未来的制造平台——建立在纪律、创新和对长期合作伙伴关系的承诺之上。我们不仅在生产家具；我们在建设全球品牌可以信赖的制造未来。",
      pillars: {
        elite: "精英合作伙伴关系",
        eliteDesc: "我们与美国家具零售业最负盛名的品牌建立了长期的 OEM/ODM 关系。我们对“高街”质量标准的理解在该地区是无与伦比的。",
        dual: "中国 + 柬埔寨",
        dualDesc: "我们在中国（肇庆）和柬埔寨（干拉省）拥有全资设施，为我们的合作伙伴提供应对关税的战略灵活性。具有弹性的“双岸”战略。",
        logistics: "美国物流",
        logisticsDesc: "我们位于洛杉矶的 129,167 平方英尺仓库支持美国国内履行和一件代发计划，确保您的产品始终触手可及。"
      },
      process: {
        label: "流程",
        title: "工厂内部",
        clickExpand: "点击图片展开"
      },
      galleryItems: {
        raw: { title: "原木选择", desc: "我们主要采购 FAS 级硬木板材，注重纹理一致性、受控含水率以及家具和建筑应用的适用性。" },
        milling: { title: "精密铣削", desc: "基于 CNC 的铣削工艺用于在组装前实现精确的榫卯、平滑的轮廓和可重复的零件几何形状。" },
        automation: { title: "生产自动化", desc: "在加工和涂装阶段应用选择性自动化，以提高一致性和吞吐量，同时保留定制和混合订单生产的灵活性。" },
        finishing: { title: "手工涂装", desc: "在需要的地方应用手工打磨和涂装，以完善受益于人工检查和调整的表面、边缘和过渡。" },
        qc: { title: "质量控制", desc: "质量检查集成在关键生产阶段，包括材料进料、加工、涂装和最终检验，以支持耐用性和视觉一致性。" }
      },
      journey: "我们的旅程",
      milestones: {
        2014: { 
          title: "PZ 起源", 
          desc: "成立于广东东莞。旅程始于对纯实木工艺的专注。" 
        },
        2018: { 
          title: "能力扩展", 
          desc: "将制造业务从东莞迁至肇庆以扩大产能，同时启动洛杉矶仓库以进行美国履行。" 
        },
        2021: { 
          title: "供应链与风险工程", 
          desc: "在西哈努克城开设了我们的第一家海外工厂，以设计低关税生产路径。这使我们能够在中国境外测试跨境供应链控制、员工培训和质量一致性。" 
        },
        2024: { 
          title: "制造系统升级", 
          desc: "肇庆总部扩建，专注于自动化和工艺稳定性。投资先进的涂装线、受控环境和可重复的生产系统，以减少规模化生产中的变异。" 
        },
        2025: { 
          title: "中国 + 1 战略", 
          desc: "战略性地重新进入柬埔寨，建立中国 + 1 制造结构。通过在中国和东南亚运营并行生产系统，PZ 旨在适应全球政策转变、关税变化和供应链不确定性——而不牺牲质量或交付可靠性。" 
        }
      }
    },
    manufacturing: {
      title: "工程制造系统",
      subtitle: "工业的艺术",
      intro: "我们设计和运营集成的制造系统，优先考虑精度、可重复性和可扩展的产量——专为长生产运行和复杂的实木项目而构建。",
      tabs: {
        process: "生产流程",
        machinery: "机械与技术",
        qc: "质量控制"
      },
      machinery: {
        title: "设计带来的生产一致性",
        desc: "我们的制造基础设施旨在最大限度地减少材料、工艺和产量之间的差异。通过结合基于 CNC 的加工、自动化涂装工作流和严格控制的环境条件，我们确保存储化项目和设计驱动型组件的稳定输出。",
        highPrecision: "高精度路由",
        autoFinish: "自动化涂装",
        climate: "受控基础设施"
      },
      qc: {
        title: "严格标准",
        desc: "质量不是事后诸葛亮；它嵌入在每一步中。我们遵循严格的 AQL 标准和美国合规法规。",
        iqc: "来料质检 (IQC)",
        iqcDesc: "板材分级、含水率检查 (8-12%) 和五金验证。",
        ipqc: "制程质检 (IPQC)",
        ipqcDesc: "首件检验、CNC 尺寸检查和打磨质量审查。",
        fqc: "最终质检 (FQC)",
        fqcDesc: "基于 AQL 2.5/4.0 的装运前检验。组装测试和纸箱跌落测试。",
        compliance: "合规性"
      },
      steps: [
        { title: "木材选择与水分控制", desc: "来料板材根据结构完整性和纹理一致性进行分级。水分含量通过受控干燥稳定，以确保长期尺寸稳定性。" },
        { title: "拼板与结构粘合", desc: "通过受控的颜色匹配和高强度粘合系统设计面板和拼板，以确保应力分布均匀和耐用性。" },
        { title: "精密 CNC 加工", desc: "数字化编程的加工工作流执行复杂的榫卯和整形操作，具有严格的尺寸控制和可重复的精度。" },
        { title: "表面处理与涂装", desc: "表面处理和涂装工艺旨在确保生产批次间的纹理一致性、颜色稳定性和涂层性能。" },
        { title: "组装与最终集成", desc: "组件使用工程榫卯方法组装，并辅以现代粘合剂和五金系统，以实现结构可靠性和可维护性。" },
        { title: "质量控制与包装", desc: "每个成品单元都经过针对结构、尺寸和美学标准的最终检验。包装系统旨在在长途物流中保护产品。" }
      ],
      machineryList: [
        { name: "CNC 加工系统", type: "加工", desc: "支持复杂 3D 整形、精密榫卯和可重复尺寸控制的多轴 CNC 路由平台。" },
        { name: "型材铣削", type: "铣削", desc: "用于在长生产运行中实现一致边缘几何形状和表面定义的高速成型和仿形系统。" },
        { name: "自动表面涂装", type: "涂装", desc: "集成了喷涂、受控干燥和固化工艺的连续涂装线，以实现均匀的表面质量。" },
        { name: "精密砂光与定厚", type: "砂光", desc: "自动砂光和表面定厚系统，确保涂装前的厚度精度和表面准备就绪。" },
        { name: "板材粘合与组装", type: "组装", desc: "设计用于层压板材和混合材料组件结构稳定性的工程粘合和压制系统。" },
        { name: "中央设施系统", type: "基础设施", desc: "支持工艺一致性和操作员安全的全厂除尘、空气过滤和环境控制基础设施。" }
      ]
    },
    capabilities: {
      title: "技术能力",
      subtitle: "工程化您的愿景",
      intro: "制造不仅仅是执行；它是关于解决问题。我们的工程团队与您的设计师上游合作，以确保可行性、成本效益和结构完整性。",
      categories: "产品类别",
      productCats: [
        { name: "休闲椅", desc: "实木框架，复杂榫卯，软包。" },
        { name: "吧台椅", desc: "柜台和吧台高度，旋转机构，金属脚踏。" },
        { name: "橱柜和柜类", desc: "餐边柜，媒体柜，软闭合五金。" },
        { name: "餐台面", desc: "实木，拼板，自然边加工。" },
        { name: "工作台面", desc: "办公桌，可调节高度台面，工作台。" },
        { name: "酒店家具", desc: "客房 FF&E，大堂座椅，高流量饰面。" },
        { name: "定制项目", desc: "定制规格，混合材料（石材/金属）。" }
      ],
      limits: {
        title: "尺寸和技术限制",
        subtitle: "标准生产线的工程约束。",
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
        mixed: "混合（金属/石材）"
      },
      oem: {
        service: "服务模式",
        title: "OEM 和 ODM 服务",
        desc: "无论您是有准备好制造的完整 CAD 图纸 (OEM)，还是需要我们根据概念草图开发产品 (ODM)，我们的工程团队都会融入该过程。",
        oemTitle: "OEM (按图制造)",
        oemDesc: "精确执行您的技术图纸。材料匹配和严格遵守公差。",
        odmTitle: "ODM (设计支持)",
        odmDesc: "我们提供结构工程、价值工程和原型制作来实现您的愿景。"
      },
      compliance: {
        title: "技术合规性",
        desc: "我们确保所有产品符合目的地市场的监管标准，特别关注美国和欧盟市场。",
        safety: "化学安全",
        safetyDesc: "TSCA Title VI (甲醛), CA Prop 65 合规。",
        sustain: "可持续性",
        sustainDesc: "可根据要求提供 FSC 认证木材。符合 EUTR 采购。",
        pack: "包装",
        packDesc: "ISTA-3A / 6A 测试，用于电商耐用性。"
      },
      cta: {
        title: "有定制项目吗？",
        btn: "开始开发"
      }
    },
    collections: {
      title: "系列和能力",
      intro: "按制造学科组织。我们专注于住宅和商业应用的纯实木制造。",
      collection: "系列",
      viewProducts: "查看产品",
      overview: "概览",
      needCatalog: "需要目录吗？",
      catalogDesc: "下载此系列的完整 PDF 规格表。",
      requestPdf: "索取 PDF",
      availableSpecs: "可用规格",
      viewOptions: "查看选项",
      pdp: {
        techDims: "技术尺寸",
        drawingUnavailable: "数字图纸不可用",
        ref: "参考",
        matSelection: "材料选择",
        inquireOrder: "咨询订购",
        share: "分享产品",
        description: "描述",
        descExtra: "设计时考虑到耐用性和美学纯度。这件作品体现了我们对精密制造的承诺，利用五轴 CNC 技术和传统榫卯。",
        matConst: "材料与结构",
        primaryWood: "主木材",
        finish: "饰面",
        joinery: "榫卯",
        hardware: "五金",
        downloads: "下载",
        specSheet: "产品规格表 (PDF)",
        model3d: "3D 模型 (STEP)",
        related: "相关产品",
        viewDetails: "查看详情",
        customSizes: "可定制尺寸"
      }
    },
    materials: {
      title: "材料与工艺",
      construction: "结构方法与变体",
      library: "木材库",
      fingerJoint: "指接",
      fingerJointDesc: "在木块末端切割互锁的“手指”以延长长度。提供巨大的结构强度并最大化木材出材率。非常适合油漆框架和长台面。",
      edgeGlue: "直拼 (全长板)",
      edgeGlueDesc: "板条并排胶合，贯穿整件作品的全长。营造出连续、优质的纹理外观。首选用于高端餐桌和优质可见表面。",
      butcherBlock: "多层实木拼板",
      butcherBlockDesc: "厚木条胶合在一起。极其耐用和稳定。通常用于重型工作台、厨房岛台和工业风格台面。",
      finishes: "饰面与规格",
      moisture: "含水率",
      moistureDesc: "所有木材在生产前均经过窑干 (KD) 至 8-10% (±2%) 以防止翘曲和开裂。",
      pu: "PU 饰面",
      puDesc: "聚氨酯涂层提供耐用、坚硬的外壳，耐水、耐热和耐刮擦。非常适合餐桌。",
      nc: "NC 饰面",
      ncDesc: "硝基漆提供自然、薄膜外观，增强纹理深度。更容易修复，但耐水性较差。",
      uv: "UV 涂层",
      uvDesc: "紫外线固化涂层，用于大批量、即时固化生产线。极其一致且耐化学腐蚀。",
      request: "索取样品",
      requestDesc: "我们为开发团队提供物理木材和饰面样品。",
      orderKit: "订购样品包",
      species: {
        oak: { name: "白橡木", desc: "耐用的硬木，具有独特的纹理图案和出色的稳定性。" },
        walnut: { name: "黑胡桃", desc: "丰富的深色调，具有天然奢华的饰面。" },
        rubber: { name: "橡胶木", desc: "可持续硬木，纹理细腻均匀，采购环保。" },
        ash: { name: "白蜡木", desc: "浅色硬木，以其强度、柔韧性和醒目的纹理而闻名。" },
        beech: { name: "榉木", desc: "光滑、细纹理硬木，非常适合弯曲结构和温暖、自然的饰面。" },
        maple: { name: "枫木", desc: "致密、光滑纹理的硬木，具有干净、现代的外观和出色的耐用性。" },
        birch: { name: "桦木", desc: "浅色硬木，以其细腻、均匀的纹理、出色的成型性和干净的现代美感而闻名。" },
        teak: { name: "柚木", desc: "优质热带硬木，富含天然油脂，具有卓越的耐用性和永恒的金黄色调。" },
        acacia: { name: "相思木", desc: "耐用的硬木，具有大胆、对比鲜明的纹理图案和强烈的视觉特征。" },
        bamboo: { name: "竹子", desc: "可持续、快速生长的材料，具有高硬度和独特的线性纹理。" }
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
        nameZh: "产品名称 (中文)",
        specs: "规格",
        material: "材质",
        dims: "尺寸",
        code: "产品代码 (SKU)",
        autoGen: "生成",
        descEn: "描述 (EN)",
        descZh: "描述 (中文)",
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
