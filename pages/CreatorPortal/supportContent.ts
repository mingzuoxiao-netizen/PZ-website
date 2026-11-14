export type SupportRole = 'FACTORY' | 'SUPERVISOR' | 'ADMIN';

export interface SupportSection {
  id: string;
  label: string;
}

export interface SupportTopic {
  id: string;
  role: SupportRole;
  section: string;
  title: string;
  keywords: string[];
  steps: string[];
  destination?: string;
  destinationLabel?: string;
}

export const supportSections: Record<SupportRole, SupportSection[]> = {
  FACTORY: [
    { id: 'start', label: '登录与待办' },
    { id: 'products', label: '产品资料与图片' },
    { id: 'zip', label: 'Excel 与图片 ZIP 导入' },
    { id: 'submission', label: '提交审核与退回修改' },
    { id: 'category', label: '产品分类申请' },
  ],
  SUPERVISOR: [
    { id: 'review', label: '产品初审' },
    { id: 'batch', label: '安全批量初审' },
    { id: 'category', label: '新品类初审' },
    { id: 'team', label: '团队账号管理' },
  ],
  ADMIN: [
    { id: 'review', label: '产品终审与发布' },
    { id: 'category', label: '分类审批' },
    { id: 'inventory', label: '产品状态管理' },
    { id: 'site', label: '网站内容维护' },
    { id: 'organization', label: '部门与账号权限' },
    { id: 'records', label: '询盘与操作日志' },
    { id: 'zip', label: 'Excel 与图片导入' },
    { id: 'inspection', label: '发布后抽检' },
  ],
};

// The visible button names below follow the role-specific PZ workspaces.
// Keep this help text synchronized when a workspace flow changes.
export const supportTopics: SupportTopic[] = [
  // Factory
  { id: 'factory-todo', role: 'FACTORY', section: 'start', title: '登录后在哪里查看需要处理的产品',
    keywords: ['登录', '我的待办', '待审核', '已退回', '首页'], destination: 'inventory', destinationLabel: '打开工厂产品管理',
    steps: ['登录工厂账号，打开左侧「工厂产品管理」。', '在「我的待办」查看「待审核」和「已退回」数量。', '使用状态筛选「需要我处理」查看当前待办；需要查找历史产品时切换「全部产品」。'] },
  { id: 'factory-find', role: 'FACTORY', section: 'start', title: '如何按 SKU、品类和状态查找产品',
    keywords: ['搜索', '查找', '筛选', 'SKU', '生产基地'], destination: 'inventory', destinationLabel: '打开产品列表',
    steps: ['进入「工厂产品管理」。', '在「产品分类」选择品类，或展开「按品类快速筛选」。', '填写「SKU 或产品名称」，选择状态和生产基地，点击「搜索」。', '点击「回到我的待办」恢复日常待处理列表。'] },
  { id: 'factory-new-product', role: 'FACTORY', section: 'products', title: '如何新建一款产品',
    keywords: ['新建', '创建', '单款', '产品资料', 'SKU'], destination: 'inventory', destinationLabel: '打开产品管理',
    steps: ['在「工厂产品管理」点击「+ 新建产品」。', '选择产品分类，填写 SKU、中英文名称、主要材质和生产基地。', '填写尺寸、表面处理、描述以及需要的内部资料。', '上传并排序产品图片，检查预览。', '点击「保存草稿」；需要提交主管时选择「保存并提交审核」。'] },
  { id: 'factory-size', role: 'FACTORY', section: 'products', title: '尺寸、材质和表面处理应该填写在哪里',
    keywords: ['长宽高', '尺寸', '单位', 'cm', 'kg', '材质', '油漆', '表面处理', '未填写'], destination: 'inventory', destinationLabel: '打开产品管理',
    steps: ['打开目标草稿的编辑页面。', '在产品基础资料填写主材与表面处理。', '在规格区按页面单位填写长、宽、高（cm）；重量使用 kg。', '保存草稿后重新打开，确认字段已保留。'] },
  { id: 'factory-images', role: 'FACTORY', section: 'products', title: '如何上传、排序和更换产品图片',
    keywords: ['上传图片', '照片', '主图', '排序', '删除图片', '产品图'], destination: 'inventory', destinationLabel: '打开产品管理',
    steps: ['打开目标产品的资料编辑页面。', '在图片区域选择或拖入产品图片。', '检查缩略图，按页面控件调整图片顺序与主图。', '点击「保存草稿」保存本次上传、删除或排序修改。', '返回列表，再次打开产品核对图片。'] },
  { id: 'factory-preview', role: 'FACTORY', section: 'products', title: '如何检查官网预览与内部资料',
    keywords: ['预览', '官网', '技术附件', '包装', '描述'], destination: 'inventory', destinationLabel: '打开产品管理',
    steps: ['打开目标产品的编辑页面。', '分别查看产品公开预览和内部资料预览。', '核对主图、文字、尺寸与附件。', '确认无误后保存草稿或提交审核。'] },
  { id: 'factory-zip-upload', role: 'FACTORY', section: 'zip', title: 'ZIP 文件如何上传并导入 Excel 和产品图片',
    keywords: ['ZIP', 'Excel', '上传', '导入', '批量', '文件夹', 'upload', '模板', '图片'], destination: 'bulk-import', destinationLabel: '打开 ZIP 一键导入',
    steps: ['在左侧点击「ZIP 一键导入草稿」。', '选择家具类别，点击「下载示例 ZIP（内含可直接填写的 Excel 模板）」。', '解压后填写「产品资料.xlsx」，保留模板字段结构。', '在 images/ 下为每个 SKU 建立同名文件夹，并将对应图片放入其中。', '将「产品资料.xlsx」和 images/ 一起压缩为 ZIP，点击页面的 ZIP 选择文件控件上传。', '在预检中逐款核对字段、图片、主图、用途、顺序和跳过原因。', '确认有效记录后执行导入，返回「工厂产品管理」核对新草稿。'] },
  { id: 'factory-zip-template', role: 'FACTORY', section: 'zip', title: '如何下载并填写对应家具类别的中文 Excel 模板',
    keywords: ['Excel模板', '中文', '字段', '表格', '分类', '下载', '填写'], destination: 'bulk-import', destinationLabel: '打开模板下载',
    steps: ['进入「ZIP 一键导入草稿」。', '在「选择需要的家具类别模板」中选择目标品类。', '点击「下载示例 ZIP」，解压并打开产品资料 Excel。', '展开「查看本类中文填写指南」逐项核对字段。', '填写产品数据，不删除或改名模板中的机器字段行。'] },
  { id: 'factory-zip-images', role: 'FACTORY', section: 'zip', title: 'ZIP 图片没有自动匹配 SKU 怎么办',
    keywords: ['图片匹配', '匹配失败', '图片缺失', 'SKU', 'images', '文件名', '文件夹', '主图'], destination: 'bulk-import', destinationLabel: '打开 ZIP 导入',
    steps: ['检查 Excel 中的完整 SKU 是否与 images/ 下的子文件夹名相同。', '确认产品资料 Excel 和 images/ 位于 ZIP 根目录。', '将该 SKU 的图片放入对应子文件夹，普通照片可保留原文件名。', '重新压缩并上传，在预检中检查图片缩略图和主图选择。'] },
  { id: 'factory-zip-duplicate', role: 'FACTORY', section: 'zip', title: 'ZIP 预检显示已有 SKU、跳过或不能导入怎么办',
    keywords: ['重复', '已有SKU', '跳过', '导入失败', '无法上传', 'ZIP', '错误报告'], destination: 'bulk-import', destinationLabel: '打开 ZIP 导入',
    steps: ['在预检列表查看每条 SKU 的状态与错误提示。', '若提示「已有 SKU」「跳过」，返回产品列表检索该 SKU。', '需要改已有产品时使用草稿编辑或已发布产品的修订入口。', '修正无效字段或图片目录后重新制作 ZIP，再次预检。'] },
  { id: 'factory-zip-draft', role: 'FACTORY', section: 'zip', title: 'ZIP 导入成功后为什么没有自动提交审核',
    keywords: ['ZIP', '草稿', '审核', '未发布', '提交', '导入后'], destination: 'inventory', destinationLabel: '查看导入草稿',
    steps: ['进入「工厂产品管理」并搜索导入的 SKU，或使用导入批次筛选。', '确认状态为「草稿」，核对资料和图片。', '点击单条「提交审核」，或勾选多条产品后使用「批量提交审核」。', '刷新列表，确认状态已进入主管初审。'] },
  { id: 'factory-submit', role: 'FACTORY', section: 'submission', title: '如何单独提交一个 SKU 给主管审核',
    keywords: ['提交审核', '主管', '单个', 'SKU', '草稿'], destination: 'inventory', destinationLabel: '打开待提交产品',
    steps: ['在「工厂产品管理」定位草稿 SKU。', '核对名称、材质、尺寸、图片和生产基地。', '点击该条记录的「提交审核」，按页面提示确认。', '刷新列表，确认该 SKU 显示「待主管初审」。'] },
  { id: 'factory-bulk-submit', role: 'FACTORY', section: 'submission', title: '如何勾选多款产品并批量提交审核',
    keywords: ['批量提交审核', '多款', '多选', '勾选', '全选', '提交'], destination: 'inventory', destinationLabel: '打开产品列表',
    steps: ['进入「工厂产品管理」，筛选「需要我处理」。', '勾选需要提交的草稿，查看页面的「已选 N 件」。', '核对所选 SKU，点击底部「批量提交审核」并按页面提示确认。', '不提交时点击「清除已选产品」，提交后刷新列表查看状态。'] },
  { id: 'factory-returned', role: 'FACTORY', section: 'submission', title: '产品被主管退回后如何修改并重新提交',
    keywords: ['退回', '修改', '补充', '重新提交', '审核状态'], destination: 'inventory', destinationLabel: '打开被退回产品',
    steps: ['进入「工厂产品管理」，将状态筛选到「退回待修改」。', '打开产品编辑页面，查看退回原因和字段提示。', '修正相关内容并保存草稿。', '重新点击提交审核，刷新列表核对新状态。'] },
  { id: 'factory-revision', role: 'FACTORY', section: 'submission', title: '已发布产品如何申请修改',
    keywords: ['已发布', '修改', '修订', '申请修改', '更新图片'], destination: 'inventory', destinationLabel: '打开已发布产品',
    steps: ['在产品列表筛选「已发布」，搜索目标 SKU。', '点击对应记录的「申请修改」。', '在修订编辑中修改需要更新的字段并保存或提交。', '在「我的产品修订」中查看等待主管、等待管理员或退回状态。'] },
  { id: 'factory-category-request', role: 'FACTORY', section: 'category', title: '现有分类不合适时如何申请新品类',
    keywords: ['新品类', '分类申请', '分类名称', '封面', '类别'], destination: 'categories', destinationLabel: '打开产品分类申请',
    steps: ['先在产品分类列表查找可用的现有类别。', '点击左侧「产品分类申请」或产品列表的「申请新品类」。', '按表单填写分类中英文名称、说明及封面图片。', '提交后在分类申请页面查看审核状态。'] },

  // Supervisor
  { id: 'supervisor-find', role: 'SUPERVISOR', section: 'review', title: '如何查找本部门待初审的 SKU',
    keywords: ['搜索', '筛选', 'SKU', '待审核', '产品初审'], destination: 'reviews', destinationLabel: '打开产品初审',
    steps: ['点击左侧「产品初审」。', '使用 SKU 或产品名称、提交员工、申请类型及状态筛选。', '点击「搜索」查看匹配的申请卡片；必要时点击「刷新列表」。'] },
  { id: 'supervisor-card', role: 'SUPERVISOR', section: 'review', title: '如何在卡片上核对产品图片、材质和尺寸',
    keywords: ['图片', '材质', '尺寸', '表面处理', '规则提示', '卡片', '初审'], destination: 'reviews', destinationLabel: '打开审核卡片',
    steps: ['打开「产品初审」，定位目标 SKU。', '在未展开卡片中查看主图、图片数量、SKU、版本、材质、尺寸和表面处理。', '查看卡片上的规则提示，再点击「查看审核详情 · 展开核对」。', '在「主管审核摘要」中核对分类、生产基地、图片及基础字段检查结果。'] },
  { id: 'supervisor-detail', role: 'SUPERVISOR', section: 'review', title: '如何查看完整资料和技术附件',
    keywords: ['查看完整资料', '展开', '附件', '包装', '历史版本', '技术'], destination: 'reviews', destinationLabel: '打开审核详情',
    steps: ['在产品卡片点击「查看审核详情 · 展开核对」。', '点击「查看完整资料」。', '核对产品描述、技术资料、包装附件、所有版本和审核历史。', '核对完成后点击「收起完整资料」。'] },
  { id: 'supervisor-approve', role: 'SUPERVISOR', section: 'review', title: '主管如何初审通过或退回员工',
    keywords: ['初审通过', '退回员工', '前往审核操作', '按钮', '审批'], destination: 'reviews', destinationLabel: '打开产品初审',
    steps: ['展开目标 SKU 的审核详情并完成资料核对。', '点击「前往审核操作 ↓」。', '资料正确时点击「初审通过并查看下一条」。', '需要补充资料时点击「退回员工」，填写原因并确认。'] },
  { id: 'supervisor-batch', role: 'SUPERVISOR', section: 'batch', title: '如何使用安全批量初审',
    keywords: ['批量', '安全', '预检', '勾选', '新品', '初审'], destination: 'reviews', destinationLabel: '打开产品初审',
    steps: ['在符合条件的首次新品卡片勾选「加入安全批量初审」。', '查看已选数量与每条卡片的规则提示。', '点击「预检并批量初审」，按页面预检提示操作。', '不需要处理时点击「清空选择」。'] },
  { id: 'supervisor-category', role: 'SUPERVISOR', section: 'category', title: '主管如何初审新品类申请',
    keywords: ['新品类', '分类', '审批', '封面', '申请'], destination: 'categories', destinationLabel: '打开新品类初审',
    steps: ['点击左侧「新品类初审」。', '打开本部门的待审核分类申请。', '核对分类名称、描述、封面及分类层级。', '按页面操作批准或退回申请。'] },
  { id: 'supervisor-team', role: 'SUPERVISOR', section: 'team', title: '如何创建部门员工账号',
    keywords: ['创建账号', '秘书', '业务', '资料录入员', '密码', '员工'], destination: 'team', destinationLabel: '打开团队账号管理',
    steps: ['打开「团队账号管理」。', '在创建下属账户区域填写账号名称、初始密码，选择人员岗位。', '点击「创建账户」。', '在「我的团队」列表核对新账号和岗位。'] },
  { id: 'supervisor-account', role: 'SUPERVISOR', section: 'team', title: '如何搜索、停用或重置团队账号密码',
    keywords: ['停用', '启用', '重置密码', '搜索员工', '账号'], destination: 'team', destinationLabel: '打开团队账号管理',
    steps: ['进入「团队账号管理」。', '在搜索框填写员工账号，并按启用状态筛选。', '找到目标账号，按需点击「停用」「启用」或「重置密码」。', '操作后刷新团队列表核对状态。'] },

  // Admin
  { id: 'admin-review', role: 'ADMIN', section: 'review', title: '如何终审并发布主管已通过的产品',
    keywords: ['审核中心', '终审', '发布', '查看差异', '确认发布', '退回主管'], destination: 'review', destinationLabel: '打开审核中心',
    steps: ['进入「审核中心」并选择「产品审核与发布」。', '按 SKU、部门、审核主管和申请类型搜索待发布记录。', '点击目标申请的「查看差异」，核对名称、材质、尺寸、图片和版本。', '符合要求时点击「确认发布」；需要补正时点击「退回主管」。', '刷新待办并到公开产品列表检查对应 SKU。'] },
  { id: 'admin-bulk-publish', role: 'ADMIN', section: 'review', title: '如何勾选产品批量终审发布',
    keywords: ['批量发布', '勾选', '全选', '发布本页选中的', '终审'], destination: 'review', destinationLabel: '打开产品终审',
    steps: ['在「审核中心」选择「产品审核与发布」。', '使用筛选条件找到需要发布的产品。', '勾选目标产品，核对「发布本页选中的 N 项」数量。', '点击该批量发布按钮，按页面提示完成操作。', '刷新列表并逐项核对发布结果。'] },
  { id: 'admin-return', role: 'ADMIN', section: 'review', title: '产品终审需要退回主管怎么办',
    keywords: ['退回', '主管', '修改', '差异', '驳回'], destination: 'review', destinationLabel: '打开终审队列',
    steps: ['在产品审核与发布列表定位目标 SKU。', '点击「查看差异」检查具体字段。', '点击「退回主管」，按页面要求填写需补正的内容。', '刷新待办并查看处理状态。'] },
  { id: 'admin-new-category', role: 'ADMIN', section: 'category', title: '如何审核和单独发布新品类',
    keywords: ['新增分类申请', '新品类', '单独发布此分类', '已批准未发布', '分类'], destination: 'review', destinationLabel: '打开新品类审核',
    steps: ['进入「审核中心」，切换「新增分类申请」。', '打开待终审分类，核对名称、描述、封面和层级。', '按页面按钮批准或退回。', '对于「已批准，但尚未发布的分类」，找到目标分类并点击「单独发布此分类」。', '打开公开网站目录核对该分类。'] },
  { id: 'admin-change-category', role: 'ADMIN', section: 'category', title: '已有分类修改申请如何审核',
    keywords: ['分类修改', '批准修改', '保存草稿', '分类封面', '退回'], destination: 'review', destinationLabel: '打开分类修改审核',
    steps: ['进入「审核中心」并切换「分类修改申请」。', '展开「查看修改前后差异」，核对名称、说明和封面。', '内容符合要求时点击「批准修改（保存草稿）」；不符合时点击「退回」。', '随后在网站配置中核对草稿及实际发布状态。'] },
  { id: 'admin-product-status', role: 'ADMIN', section: 'inventory', title: '如何下架、恢复或归档产品',
    keywords: ['下架', '恢复', '归档', '在售', '30天', '产品管理'], destination: 'inventory', destinationLabel: '打开产品管理',
    steps: ['打开「产品管理」，搜索目标 SKU。', '根据当前状态切换「在售」「已下架」「归档」等列表。', '核对 SKU 与操作对象，再按行内对应的下架、恢复或归档按钮处理。', '刷新状态列表并检查公开网站及操作日志。'] },
  { id: 'admin-product-delete', role: 'ADMIN', section: 'inventory', title: '如何找到永久删除 SKU 的入口',
    keywords: ['删除', '永久删除', 'SKU', '归档', '测试数据'], destination: 'inventory', destinationLabel: '打开产品管理',
    steps: ['进入「产品管理」并定位准确的 SKU。', '查看产品当前状态与审批历史。', '在页面允许删除且已获授权时，使用对应「永久删除 SKU」入口。', '操作后刷新列表，检查记录与日志；有发布或审核历史的产品可能受删除保护。'] },
  { id: 'admin-site-categories', role: 'ADMIN', section: 'site', title: '如何编辑网站产品分类和封面',
    keywords: ['分类管理', '封面', '子分类', '隐藏', '草稿'], destination: 'categories', destinationLabel: '打开产品分类管理',
    steps: ['在「网站内容」打开「产品分类管理」。', '选中分类，编辑中英文名称、描述和封面。', '需要子分类时点击「+ 新增子分类」；需要暂停展示时使用隐藏选项。', '点击「保存草稿」，按页面发布流程确认公开配置并检查前台。'] },
  { id: 'admin-site-image', role: 'ADMIN', section: 'site', title: '如何替换网站图片并检查电脑和手机裁切',
    keywords: ['图片管理', '网站图片', '上传', '裁切', '首页', '发布'], destination: 'media', destinationLabel: '打开网站图片管理',
    steps: ['在「网站内容」打开「网站图片管理」。', '选择图片分组与要替换的位置。', '上传图片，检查电脑裁切和手机裁切预览。', '保存草稿并按页面发布操作处理。', '在电脑和手机页面检查显示结果。'] },
  { id: 'admin-site-basics', role: 'ADMIN', section: 'site', title: '如何更新首页文字和产品目录 PDF',
    keywords: ['PDF', '目录', '网站基础信息', '首页主标题', '上传'], destination: 'basics', destinationLabel: '打开网站基础信息',
    steps: ['打开「网站内容」→「网站基础信息」。', '填写首页主标题，或上传产品目录 PDF。', '保存草稿，按页面发布流程处理。', '在正式网站检查文字及 PDF 下载。'] },
  { id: 'admin-org', role: 'ADMIN', section: 'organization', title: '如何创建部门并分配主管和员工',
    keywords: ['部门', '主管', '员工', '分配', '组织架构'], destination: 'organization', destinationLabel: '打开部门与主管管理',
    steps: ['在「系统管理」打开「部门与主管管理」。', '检查现有部门，必要时创建新部门并选择工厂归属。', '选择所属部门，创建主管或员工账号。', '展开组织成员列表，核对岗位与部门。'] },
  { id: 'admin-unassigned', role: 'ADMIN', section: 'organization', title: '删除部门后如何重新分配待分配账号',
    keywords: ['待分配', '删除部门', '重新分配', '直属主管'], destination: 'organization', destinationLabel: '打开部门与主管管理',
    steps: ['进入「部门与主管管理」并找到「待分配」账号。', '选择目标部门与岗位。', '非主管岗位按页面选择直属主管。', '完成分配后展开目标部门成员列表复核。'] },
  { id: 'admin-account', role: 'ADMIN', section: 'organization', title: '如何改账号名称、停用账号或重置密码',
    keywords: ['账号管理', '修改名称', '停用', '启用', '重置密码', '创建账号'], destination: 'accounts', destinationLabel: '打开账号权限管理',
    steps: ['在「系统管理」打开「账号权限管理」。', '按账号、部门或岗位搜索目标人员。', '使用对应行的改名、停用、启用或重置密码操作。', '刷新账号列表，核对名称、状态和所属部门。'] },
  { id: 'admin-inquiries', role: 'ADMIN', section: 'records', title: '如何搜索询盘并查看客户留言',
    keywords: ['询盘', '客户', '邮箱', '留言', '搜索'], destination: 'inquiries', destinationLabel: '打开询盘管理',
    steps: ['打开左侧「询盘管理」。', '使用姓名、邮箱、公司或留言关键词搜索。', '点击「查看详情」，核对客户需求、时间和联系方式。', '需要联系客户时使用页面的邮件联系入口。'] },
  { id: 'admin-audit', role: 'ADMIN', section: 'records', title: '按钮提示失败但状态已经变化时如何查日志',
    keywords: ['操作失败', '实际成功', '错误', '审计', '日志', '状态不一致'], destination: 'audit', destinationLabel: '打开操作日志',
    steps: ['先刷新对应列表核对 SKU 或账号的真实状态。', '在「系统管理」打开「操作日志」。', '按操作人、类型、对象和时间筛选。', '打开日志详情，核对成功、失败或结果待确认状态。', '若仍不一致，记录对象 ID 与操作时间交技术人员排查。'] },
  { id: 'admin-zip', role: 'ADMIN', section: 'zip', title: '管理员如何使用 Excel + 图片一键导入',
    keywords: ['ZIP', 'Excel', '批量', '上传', '图片', '导入'], destination: 'bulk-import', destinationLabel: '打开 Excel + 图片导入',
    steps: ['打开左侧「Excel + 图片一键导入」。', '选择家具类别，下载并填写对应 Excel 模板。', '按 Excel 的 SKU 在 images/ 下整理同名文件夹并压缩为 ZIP。', '选择 ZIP 并完成预检、主图和字段核对。', '确认导入后回产品管理核对草稿；导入不会自动发布。'] },
  { id: 'admin-inspection', role: 'ADMIN', section: 'inspection', title: '在哪里查看发布后抽检和可信操作员状态',
    keywords: ['抽检', '可信操作员', '快捷通道', 'Worker', '开关', '发布后'], destination: 'review', destinationLabel: '打开审核中心',
    steps: ['进入「审核中心」，切换「发布后抽检与可信操作员」。', '查看全局发布开关的 Worker 和 Admin 状态。', '在「搜索操作员」中搜索账号并查看可信标记。', '在发布后抽检列表选择状态，点击「刷新」查看记录。'] },
];

const questionWords = /如何|怎么|怎样|为什么|怎么办|在哪|哪里|什么|一下|文件|步骤|教程|操作|流程|可以|需要|进行|的|吗|呢|啊/g;
const knownTerms = /zip|excel|sku|worker|pdf|images|upload|批量|预检|上传|导入|模板|图片|照片|主图|尺寸|材质|表面处理|审核|初审|终审|发布|退回|修改|草稿|分类|账号|密码|权限|部门|抽检|日志|删除|下架|归档|查询|搜索|筛选|匹配|跳过|重复|技术|包装/gi;

const normalized = (text: string) => text.normalize('NFKC').toLocaleLowerCase().replace(/[\s\p{P}\p{S}]+/gu, '');

export function searchSupportTopics(role: SupportRole, query = '', section = ''): SupportTopic[] {
  const q = normalized(query);
  const relevant = supportTopics.filter(item => item.role === role && (!section || item.section === section));
  if (!q) return relevant;
  const recognized = Array.from(new Set((q.match(knownTerms) || []).map(normalized)));
  const remainder = q.replace(questionWords, '');
  const matches = relevant.map(topic => {
    const title = normalized(topic.title);
    const tags = normalized(topic.keywords.join(' '));
    const steps = normalized(topic.steps.join(' '));
    const all = title + tags + steps;
    const exact = all.includes(q) || (remainder.length >= 2 && all.includes(remainder));
    const termsMatch = recognized.length > 0 && recognized.every(term => all.includes(term));
    const score = exact ? 100 : termsMatch ? 40 + recognized.reduce((sum, term) => sum + (title.includes(term) ? 5 : tags.includes(term) ? 3 : 1), 0) : 0;
    return { topic, score };
  }).filter(result => result.score > 0);
  return matches.sort((a, b) => b.score - a.score).map(result => result.topic);
}
