# PZ Admin 强制移除产品 · Staging 验收与 Production 部署门槛

## 用户场景
原有永久删除只允许没有审核历史和关联记录的草稿 SKU。
已发布或有 `pz_product_reviews`、`pz_published_product_revisions`、
`pz_product_responsibilities`、`pz_product_responsibility_events`
关联的 SKU 会收到 HTTP 409。PR #47 的新能力允许 Admin 直接选择这些产品执行批量移除。

## 不可忽略的数据语义
- 未发布、无关联审核历史的安全草稿可 **物理删除 `products` 行**。
- 已发布或有受保护历史的产品执行 **审计保留式永久移除**：
  - `products.id` 不变，保留一个不可编辑的匿名占位行，以维护外键；
  - `products.code` 替换成唯一 `PZ-DEL-...` 编码，原 SKU 解除占用；
  - 将展示名称替换为“已移除产品”。为兼容真实 D1 的状态/必填字段 CHECK 与不可变审核历史，保留原工作流 `status`、分类、材质、说明和图片引用等已有字段；数据库保留必要的审计占位行，绝不声称全部内容被物理擦除；
  - 设置 `catalog_hidden=1`、`archived_at`、`deleted_at`、`deleted_by`，其余公开/工厂/Admin 产品列表以及审批待办均不再展示该行；
  - `pz_product_retirements` 保留原 SKU、操作者、时间和占位编码，且不允许修改；
  - **原审核版本、审批事件和责任变更日志不删除**，可能包含历史产品详情。
- 所有动作继续使用现有带权限校验的接口、版本条件及操作审计，跨 SKU 批量按顺序处理并报告部分失败。
- **不删除 R2 文件**；未先验证其他引用时不能自动做物理图片清理。
- 不能声称数据库内所有历史内容已被物理删除。

## 新接口与配置
- `GET /admin/product-delete/capabilities`：要求 ADMIN，返回 `force_available`；只有数据库迁移完整且两个开关启用才为 true。
- `GET /admin/products/:id/permanent-delete`：Admin 预检（启用强制模式后，即使有历史也返回可操作）。
- `POST /admin/products/:id/permanent-delete`：仍需 `confirm_sku` + `expected_updated_at`，强制模式附加 `force:true`；不要求管理员手动输入 SKU。
- 开关：
  - `PZ_PERMANENT_SKU_DELETE_ENABLED=true`
  - `PZ_FORCE_PRODUCT_RETIRE_ENABLED=true` （默认不开）
- Worker 强制校验 `PZ_RUNTIME_ENV` 与当前环境一致。

## Staging 上线顺序（严格按顺序）
1. 核对 Staging D1 备份策略和现有表结构，确认 008、009、010、012、013 等基础迁移状态；尤其产品审计和责任表。**先有可用的灾备/恢复方案再执行不可逆删除验证。**
2. 仅在 Staging D1 执行 `migrations/016_admin_product_retirement_REVIEW.sql` **一次**。
3. 用 SQL 验证：
   `PRAGMA table_info(products);` 包含 `deleted_at` 和 `deleted_by`；
   `SELECT name FROM sqlite_master WHERE type='table' AND name='pz_product_retirements';`；
   `PRAGMA foreign_key_check;` 不得存在异常。
4. 核对当前 Cloudflare **Staging Worker** 和 GitHub
   `worker-patches/staging-worker-category-changes-REVIEW.js` 差异及其现有 D1/KV/R2 绑定，部署最新代码。
5. Staging 配置 `PZ_RUNTIME_ENV=staging`，设置以上两个开关为 true。用 Admin 账号访问能力接口，确认 `force_available:true`，否则不要尝试强制删除。
6. 部署 PR #47 前端至 Staging Pages，管理员“产品管理”里已发布、下架、待审核及草稿都可勾选移除。

## 最小验收
- 创建 2 件测试草稿，批量删除，数据库产品行消失，SKU 可复用；
- 创建已发布/有审核历史的测试产品，强制移除；Admin 和 Factory 产品列表不再显示；
- `/public/products?v=2` 与 `/public/products` 不再展示该 ID（旧 KV 公共缓存 TTL 到期后复查）；
- 原 SKU 可以安全用于新产品；内部 `pz_product_retirements` 有操作者、原 SKU 和时间；
- 原 `pz_product_reviews` / 版本 / 事件表仍保留关联，`PRAGMA foreign_key_check;` 返回空；
- 已移除产品无法经旧的产品更新接口复活；R2 对象不受影响；
- 不启用 `PZ_FORCE_PRODUCT_RETIRE_ENABLED` 时，仍按旧规则拒绝强制删除；
- 一次批量含有无法删除的产品，界面明确区分成功与失败并刷新名单；
- 原有新品类两级审核、SKU 审核/发布及其它 Admin 功能仍正常。

## Production 发布门槛
先通过 Staging 全链路，再核对生产库状态和当前线上 Worker 源码差异，独立执行生产 D1 016、部署生产 Worker 和正式前端。两环境不能互相覆盖 Worker。

由于本功能不可逆，PR #47 保持 Draft，**不会在此步骤自动触发 Cloudflare 生产部署或强制删除任何真实产品。**

## Staging 删除事务兼容性修复（PR #49）
- 旧版 SQL 将已发布或待审核产品的 `status` 强制改为 `archived`，但系统使用的是 `catalog_hidden` / `archived_at` 表示下架/归档，真实 D1 的产品状态 CHECK 可能不允许 `archived`，造成整个两语句原子事务失败。
- 新版删除事务**不修改原有审核/发布 status**，只改唯一 SKU、隐藏及审计字段，展示名称改为“已移除产品”；原 SKU 释放，源 ID 和审核外键仍保留，产品列表和前台依旧过滤已移除 ID。
- 已发布产品的分类与图片可能受到 CHECK 约束，新版不会在同一个事务盲目置空这些字段。R2 原图和审核快照仍保留。
- 现在后端会把 D1 事务异常归类成 `RETIREMENT_CHECK_CONSTRAINT`、`RETIREMENT_SCHEMA_MISMATCH`、`RETIREMENT_FOREIGN_KEY`、`RETIREMENT_UNIQUE_CONFLICT` 或 `RETIREMENT_TRANSACTION_FAILED`，详细 SQL 错误仅记录在 Worker 日志，不发到用户界面。
- Staging 测试应包括 **已下架但 status 仍为 published** 的产品，以及拥有审核历史、受 DB CHECK 约束的产品；必须同时核对 `pz_product_retirements` 回执、SKU 可重用、公开目录不可见及 `PRAGMA foreign_key_check`。
- 如果 Staging 016 已执行，不要重复执行；本次 Worker 修复不新增数据库迁移。
