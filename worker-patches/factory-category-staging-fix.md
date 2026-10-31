# PZ 新品类申请 404：Staging Worker 修复实施清单

**状态：仅已准备补丁；尚未部署 Staging Worker；尚未完成端到端验收。**

## 已确认根因

Preview 截图显示 `{"error":"Not found"}`，且前端按顺序调用：

1. `POST /api/factory/category-requests`（新建草稿）
2. `POST /api/factory/category-requests/{id}/submit`（提交审核）

原有 V3.2 Worker 全量源码可见 ADMIN 查询、批准及驳回分类申请，但找不到这两个 FACTORY POST 路由。Worker 的兜底响应正是 HTTP 404 `{"error":"Not found"}`。

## 补丁文件

- [factoryCategoryStaging.mjs](./factoryCategoryStaging.mjs)：Staging-only 工厂分类申请路由。必须保留账号鉴权、R2 图片验证、重复分类校验和只允许本人提交草稿。
- [factoryCategoryStaging.test.mjs](./factoryCategoryStaging.test.mjs)：针对接口的本地 Mock 自动测试。
- [migrations/003_factory_category_requests_staging.sql](./migrations/003_factory_category_requests_staging.sql)：仅在 **Staging D1 缺少对应表时**考虑的建表迁移，不能直接用于现有不同结构的表。

## 修复顺序

### 1. 检查数据库，先不写入

打开 Cloudflare 控制台 **D1 → Staging 数据库 → Console**，只运行：

```sql
SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'category_requests';
PRAGMA table_info('category_requests');
SELECT status, COUNT(*) FROM category_requests GROUP BY status;
```

第三条仅在表存在且具有 `status` 列时才运行。核对以下字段是否存在：

`id, title, title_cn, subtitle, description, image, status, user_id, created_at, updated_at`

如果没有表，再审查并按需在 Staging 执行上述 003 SQL；如果表存在但字段不同，**暂停，先修订迁移，不要直接覆盖或删除原表**。

### 2. 只修改 Staging Worker

打开 **Workers & Pages → pz-inquiry-api-staging → Edit Code**。基于当前已部署 Worker 源码保存独立副本，切勿用旧版 V3.2 文件整体覆盖新版 V3.2.1。

把 `factoryCategoryStaging.mjs` 中 `handleFactoryCategoryRequests` 函数放在 Worker 顶层（在控制台单文件粘贴时，去掉 `export` 关键字）。在当前 Worker 的 `fetch(request, env)` 内，`const { pathname } = new URL(request.url)` 已经执行、进入 `try` 后且到达末尾 `Not found` 之前，插入：

```js
const categoryResult = await handleFactoryCategoryRequests({
  request, env, pathname, authorize, json, badRequest, pzConfiguredImageBase
});
if (categoryResult) return categoryResult;
```

只在 **Staging** 部署。补丁带有 `PZ_RUNTIME_ENV === 'staging'` 保护，不可当作 Production 的已审核补丁使用。不要修改生产 Worker、D1、KV、R2 或 `PZ_CATALOG_V2_ENABLED`。

### 3. 在 Preview 执行完整验收

1. 确认当前 Preview 的 `PZ_BACKEND_WORKER` 确实指向 `pz-inquiry-api-staging`。
2. FACTORY 账号填写独特测试英文名（如 `PZ QA Sofa Test`），中文名 `沙发测试`，并上传 Staging R2 图片。
3. 创建返回 `201 {success:true,id,status:"draft"}`；提交返回 `200 {success:true,id,status:"awaiting_review"}`。
4. 使用公开 Preview `/api/site-config`：在 ADMIN 批准之前，分类**不可**显示。
5. ADMIN 进入 **审核中心 → 待审核新品类**。检查标题、图片与状态，先用一条测试申请验证驳回路径。
6. 再用另一条测试申请验证批准：返回 `status:"approved"` 且 `published:true`（否则需要人工发布）。
7. 刷新公开 Preview：首页、产品目录、英文和中文导航都能看到新分类。点击分类后允许显示“暂无产品”，不应 404。
8. ADMIN 进入 **产品分类封面**，替换主图，保存草稿并发布；刷新页面及 `/api/site-config` 验证新的图片 URL 已生效。
9. 验证 FACTORY 身份访问 ADMIN 审批接口必须得到 403。

## 额外安全注意

当前旧版 Worker 的分类批准路由不是只允许 `awaiting_review` 状态，而是按 id 直接更新。正式发布前应单独收紧它的状态迁移、类别重名处理，并对两个管理员同时审批造成的 KV 丢失更新风险进行测试。只通过前端 Unit Tests **不能**确认这个问题已解决。

如果任何 Staging 步骤出现 400/404/409/500，请保留响应状态和消息，不要反复重试创建，更不要将失败中的 Worker 源码覆盖到 Production。
