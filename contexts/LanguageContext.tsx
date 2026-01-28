import React, { createContext, useContext, ReactNode } from 'react';

interface LanguageContextType {
  language: 'zh';
  t: typeof translations.zh;
  setLanguage: (lang: 'zh') => void;
  toggleLanguage: () => void;
}

const translations = {
  zh: {
    common: {
      readMore: "阅读更多",
      viewDetails: "查看详情",
      learnMore: "了解更多",
      contactUs: "联系我们",
      search: "档案搜索",
      searchPlaceholder: "输入搜索参数...",
      searchRefine: "优化搜索条件...",
      backHome: "返回首页",
      loading: "正在同步...",
      close: "关闭",
      explore: "导航",
      connect: "项目入口",
      privacy: "隐私政策",
      terms: "服务条款",
      rights: "保留所有技术权利。",
      startProject: "开启生产项目",
      tradeProgram: "行业计划",
      adminAccess: "管理面板",
      location_cn: "肇庆基地",
      location_kh: "干丹基地",
      factory_01: "主设施"
    },
    nav: {
      header: {
        home: "首页",
        capabilities: "生产能力",
        manufacturing: "制造工艺",
        materials: "材料库",
        collections: "作品集",
        capacity: "全球布局",
        about: "关于我们",
        inquire: "业务咨询"
      },
      mega: {
        process: "工业流程",
        lumberPrep: "木材养护",
        cnc5Axis: "五轴数控",
        autoFinishing: "涂装系统",
        standards: "审计规程",
        incomingQC: "材料入库检",
        inProcessQC: "结构审计",
        finalInspection: "档案终审",
        services: "业务模式",
        oemProduction: "OEM 代工",
        odmDesign: "ODM 工程",
        valueEngineering: "成本分析",
        compliance: "全球标准",
        tscaTitleVI: "TSCA 法案",
        fscCertification: "FSC 认证木材",
        istaPackaging: "ISTA 包装测试",
        focusPrecision: "精密公差",
        focusEng: "设计工程",
        focusLogistics: "履约逻辑"
      }
    },
    home: {
      subtitle: "实木制造专家",
      heroTitle: "为高端品牌打造精密工程实木解决方案。",
      heroQuote: "工业逻辑与自然材料的艺术融合。",
      heroBtnSecondary: "查看流程",
      featuredCollections: "大师系列",
      factoryStrength: "基础设施",
      strengthTitle: "专为商业高端市场优化。",
      strengthDesc1: "PZ 是全球领先设计品牌的战略实木合作伙伴。",
      strengthDesc2: "我们将精品手工技艺与航天级数控一致性深度整合。",
      globalHubs: "全球物流枢纽",
      chinaLoc: "总部与工程中心",
      cambodiaLoc: "出口物流中心",
      readyToScale: "准备开启生产吗？"
    },
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
  const language = 'zh' as const;
  const t = translations.zh;
  const value = { language, t, setLanguage: () => {}, toggleLanguage: () => {} };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
