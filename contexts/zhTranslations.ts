/**
 * Simplified Chinese public-site copy overrides.
 * The language provider deep-merges these translations with the existing
 * English dictionary. Technical IDs / SKUs / API values remain unchanged.
 */
export const zhTranslations: Record<string, any> = {
  common: {
    readMore:'了解更多',viewDetails:'查看详情',learnMore:'了解更多',contactUs:'联系我们',
    search:'搜索产品',searchPlaceholder:'搜索产品名称或型号',searchRefine:'筛选搜索结果',
    backHome:'返回首页',loading:'加载中…',close:'关闭',explore:'探索产品',connect:'联系我们',
    privacy:'隐私政策',terms:'服务条款',rights:'保留所有权利。',
    startProject:'提交项目需求',tradeProgram:'贸易合作',adminAccess:'管理后台',
    location_cn:'中国肇庆',location_kh:'柬埔寨干丹',factory_01:'主要生产基地'
  },
  nav: {
    header:{home:'首页',collections:'产品中心',capabilities:'定制制造',manufacturing:'生产制造',materials:'材料与品质',capacity:'我们的工厂',about:'关于 PZ',inquire:'获取报价'},
    mega:{process:'生产流程',lumberPrep:'木材处理',cnc5Axis:'数控加工',autoFinishing:'表面涂装',
      standards:'质量标准',incomingQC:'来料检验',inProcessQC:'过程检验',finalInspection:'成品检验',
      services:'合作方式',oemProduction:'OEM 代工',odmDesign:'ODM 开发',valueEngineering:'成本优化',
      compliance:'合规标准',tscaTitleVI:'TSCA Title VI',fscCertification:'FSC 认证',
      istaPackaging:'ISTA 包装测试',focusPrecision:'精度控制',focusEng:'设计工程',focusLogistics:'国际交付'}
  },
  home:{
    subtitle:'实木家具与木制品制造',heroTitle:'为全球品牌制造高品质实木家具。',
    heroQuote:'设计与制造并重。',heroBtnSecondary:'了解制造能力',featuredCollections:'产品系列',
    factoryStrength:'制造实力',strengthTitle:'从产品开发到规模化生产。',
    strengthDesc1:'我们为家具品牌、进口商及商业采购商提供专业制造支持。',
    strengthDesc2:'我们结合实木工艺与现代生产管理，满足不同项目需求。',
    globalHubs:'两大生产基地',chinaLoc:'中国总部',cambodiaLoc:'柬埔寨工厂',
    readyToScale:'准备开始新的产品项目了吗？'
  },
  about:{
    since:'始于 2014 年',title:'以实木工艺连接设计与制造。',
    intro:'为全球家具品牌提供产品开发与制造支持。',
    bannerText:'注重工艺细节与稳定生产。',
    storyTitle:'我们的故事',
    storyP1:'从实木家具制造出发，我们始终重视产品质量与合作伙伴的实际需求。',
    storyP2:'PZ 起步于中国肇庆，持续发展产品开发与家具制造能力。',
    storyP3:'如今我们在中国和柬埔寨开展生产业务，为不同市场的客户提供支持。',
    storyP4:'从木材加工、产品组装到表面涂装与检验，我们持续完善生产流程。',
    pillars:{
      elite:'工艺与制造',eliteDesc:'关注结构、工艺、品质和量产一致性。',
      dual:'双基地制造',dualDesc:'肇庆与柬埔寨工厂协同生产与产品管理。',
      logistics:'国际交付',logisticsDesc:'支持客户从订单准备到出货安排的沟通。'
    },
    process:{label:'制造流程',title:'从木材到成品'},
    galleryItems:{
      raw:{title:'木材处理',desc:'根据材料要求进行准备与干燥处理。'},
      milling:{title:'精密加工',desc:'通过设备完成关键尺寸和结构加工。'},
      automation:{title:'生产与组装',desc:'协同完成产品生产。'},
      finishing:{title:'表面处理',desc:'按产品要求选择和实施涂装工艺。'},
      qc:{title:'质量检验',desc:'按照约定标准检查产品。'}
    },
    journey:'发展历程'
  },
  manufacturing:{
    subtitle:'生产制造',title:'我们的制造流程',
    intro:'我们将实木加工、产品开发和制造管理结合，支持客户从方案走向量产。',
    tabs:{process:'工艺流程',machinery:'生产设备',qc:'质量管理'},
    steps:[
      {title:'材料入库',desc:'检查木材状态与来料要求。'},
      {title:'机械加工',desc:'根据图纸与规格完成加工。'},
      {title:'人工精修',desc:'对关键细节进行打磨和修整。'},
      {title:'表面处理',desc:'按照确认的要求进行涂装。'},
      {title:'结构检验',desc:'检查产品结构及尺寸。'},
      {title:'包装与出货',desc:'根据运输要求包装并准备交付。'}
    ],
    machinery:{
      title:'专业生产设备',desc:'根据不同产品和工艺要求安排设备与加工流程。',
      highPrecision:'材料准备与压合',autoFinish:'砂光及表面处理',climate:'木材干燥管理'
    },
    qc:{
      title:'贯穿生产的质量管理',
      desc:'从来料到生产过程及最终检验，按照确认的要求开展质量控制。',
      iqc:'来料检验',iqcDesc:'检查木材和材料入库状态。',
      ipqc:'过程检验',ipqcDesc:'在关键工序进行尺寸与质量检查。',
      fqc:'成品检验',fqcDesc:'检查完成品的外观与结构。'
    }
  },
  capabilities:{
    subtitle:'产品开发与制造',title:'支持不同规模的产品需求。',
    intro:'为住宅家具和商业项目提供实木产品的开发、打样和生产支持。',
    categories:'服务领域',
    productCats:[
      {name:'酒店与商业',desc:'酒店及商用家具项目。'},
      {name:'住宅家具',desc:'零售品牌及住宅家具系列。'},
      {name:'办公空间',desc:'办公桌及木制家具。'},
      {name:'户外产品',desc:'按材料和应用要求开发产品。'}
    ],
    limits:{
      title:'技术规格',request:'索取技术资料',maxDim:'最大尺寸',
      length:'长度',width:'宽度',thickness:'厚度',precision:'制造标准',
      cncTol:'加工公差',moisture:'木材含水率',gloss:'涂装光泽度',
      materials:'主要材料',solidWood:'实木',veneer:'木皮',mixed:'复合材料'
    },
    oem:{
      service:'合作方式',title:'按需求开展制造合作。',
      desc:'从产品图纸、材料和结构到样品确认与生产安排。',
      oemTitle:'OEM 代工',oemDesc:'根据客户确认的设计和规格组织生产。',
      odmTitle:'ODM 开发',odmDesc:'配合客户完成产品开发和打样。'
    },
    compliance:{
      title:'合规与检验',desc:'认证、检测和合规要求需根据具体产品及有效文件确认。',
      safety:'产品合规要求',safetyDesc:'根据产品和市场确认相关检测要求。',
      sustain:'负责任的木材采购',sustainDesc:'可按项目需求讨论材料来源与认证要求。',
      pack:'运输包装',packDesc:'根据运输方式确认包装要求。'
    }
  },
  materials:{
    title:'木材与制造工艺',construction:'结构工艺',
    fingerJoint:'指接拼板',fingerJointDesc:'通过指接和拼接组合木料。',
    edgeGlue:'边拼板',edgeGlueDesc:'通过拼接方式形成实木板材。',
    butcherBlock:'实木台面结构',butcherBlockDesc:'适用于厨房台面和商业工作表面。',
    library:'木材种类',
    species:{
      oak:{name:'白橡木',desc:'纹理清晰，适合多种家具风格。'},
      walnut:{name:'黑胡桃木',desc:'色泽温暖深沉，适合高端家具。'},
      rubber:{name:'橡胶木',desc:'适合多种批量家具应用。'},
      ash:{name:'白蜡木',desc:'纹理明显，适合家具结构与表面。'},
      beech:{name:'榉木',desc:'木纹细致，适合多种涂装。'},
      maple:{name:'枫木',desc:'颜色浅，材质较致密。'},
      teak:{name:'柚木',desc:'适合特定家具应用。'},
      acacia:{name:'相思木',desc:'色差和纹理丰富。'},
      birch:{name:'桦木',desc:'适用于板材及家具结构。'},
      bamboo:{name:'竹材',desc:'可用于特定板材产品。'}
    },
    moisture:'含水率控制',moistureDesc:'按材料、产品和使用地区确定目标含水率。',
    pu:'PU 涂装',puDesc:'聚氨酯表面涂装方案。',
    nc:'NC 涂装',ncDesc:'硝基漆表面涂装方案。',
    uv:'UV 涂装',uvDesc:'紫外光固化表面处理。',
    request:'材料样板',requestDesc:'咨询适用于产品项目的木材和涂装样板。',
    orderKit:'申请样板'
  },
  collections:{requestPdf:'下载技术目录',pdp:{descExtra:'结合材料美感和制造要求开发的实木产品。',inquireOrder:'咨询产品报价'}},
  inquire:{
    title:'提交采购需求',desc:'告诉我们您的产品需求、规格和预计采购数量。',
    oem:'OEM / ODM 合作',oemDesc:'从产品开发、样品确认到批量制造，支持不同合作方式。',
    form:{
      name:'联系人姓名',company:'公司名称',email:'工作邮箱',type:'项目类型',message:'具体需求',
      send:'提交询盘',sending:'提交中…',success:'询盘提交成功',
      successDesc:'我们已收到您的需求，团队将尽快联系您。',again:'提交新的询盘'
    },
    types:{general:'一般咨询',catalog:'产品目录或规格',trade:'采购合作',oem:'OEM / ODM 项目'}
  },
  capacity:{
    footprint:'制造基地',title:'中国与柬埔寨双基地',desc:'通过两个生产基地协调制造活动。',
    supplyChain:'供应链管理',warehouse:'仓储与物流'
  },
  creator:{
    config:{title:'网站内容配置',desc:'编辑网站文本、图片和站点展示设置。',discard:'放弃未保存更改',
      publish:'发布更改',pushProd:'发布到网站',publishing:'正在发布…',unsaved:'未保存更改',apply:'保存草稿'}
  }
};

// Additional page-specific copy keeps the entire public navigation journey bilingual.
Object.assign(zhTranslations.about, {
  milestones: {
    '2014': { title: '肇庆工厂起步', desc: '公司发展初期的制造基地。' },
    '2018': { title: '生产设备升级', desc: '持续加强家具加工与制造能力。' },
    '2021': { title: '柬埔寨基地', desc: '将生产网络拓展至干丹。' },
    '2024': { title: '数字化产品管理', desc: '逐步完善产品与流程管理。' },
    '2025': { title: '持续改进', desc: '持续关注材料、生产与企业发展。' }
  }
});
Object.assign(zhTranslations.manufacturing, {
  machineryList: [
    { type: '数控设备', name: 'CNC 加工', desc: '支持产品结构与关键尺寸的加工。' },
    { type: '表面处理', name: '涂装生产线', desc: '为不同涂装工艺提供生产支持。' },
    { type: '木材准备', name: '木材加工设备', desc: '协助完成木材准备与表面加工。' }
  ]
});
Object.assign(zhTranslations.capabilities, {
  cta: { title: '准备开始新项目？', btn: '提交生产需求' }
});
Object.assign(zhTranslations.capacity, {
  leadTime: '交付周期', sampleDev: '样品开发', initProd: '首批生产', reOrder: '重复订单',
  leadTimeNote: '实际交付时间取决于材料供应、产品复杂度及订单安排。',
  logisticsTitle: '海运物流', chinaOrigin: '中国港口', khOrigin: '柬埔寨港口',
  shippingDesc: '可根据订单和物流方案讨论整柜或拼箱运输。',
  clientDist: '市场与合作', clientDesc: '我们面向不同国际市场的家具品牌和采购客户。',
  stats: { sqft: '生产设施面积', brands: '合作品牌', units: '月度产能', logistics: '物流支持' },
  supplyChainDesc: '根据产品需求协调采购、生产与物流。',
  flexible: '灵活的生产安排', flexibleDesc: '根据产品及订单情况协调两个生产基地。',
  warehouseDesc: '可针对客户的物流和仓储需求讨论可行方案。',
  locations: {
    usa_title: '北美市场', usa_desc: '了解面向北美客户的产品与出货需求。',
    can_title: '加拿大市场', can_desc: '支持客户讨论不同品类的采购需求。',
    uk_title: '英国市场', uk_desc: '可根据具体产品和市场要求讨论合作。',
    de_title: '欧洲市场', de_desc: '可根据具体产品和市场要求讨论合作。',
    me_title: '中东项目', me_desc: '可根据商业项目要求讨论家具供应。',
    cn_title: '中国肇庆总部', cn_desc: '产品管理及主要制造业务所在地。',
    kh_title: '柬埔寨干丹工厂', kh_desc: '支持公司制造与国际供应业务的另一生产基地。'
  }
});
