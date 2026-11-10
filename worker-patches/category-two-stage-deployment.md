# 新品类申请双级审核 · Staging 验收和 Production 发布

## 背景与问题
- 原有 `category_requests` 仅记录分类名称、封面和状态，缺少员工提交人、主管、部门与退回原因。
- 员工端新增分类的 POST 返回了 ID，但不存在员工查询“我的新品类申请”的 GET，因此提交和退回后用户看不到任何记录。
- 新品类审批原本直接去 Admin，不经过部门主管。
- 生产 Worker 与 Staging Worker 有不同的环境锁定逻辑，不能跨环境复制。

## 新机制（与产品审核不同，不替换产品原有状态机）
1. 员工必须有在用部门、直属主管和可使用的账号，才能创建申请。
2. 新增申请写入原 `category_requests`（保留原表），并新增 `pz_category_request_flow` 和 `pz_category_request_events`。
3. 状态：`pending_supervisor` → `pending_admin` → `approved`。Admin 批准后自动将**这一条新品类**写入正式已发布网站配置，其他未发布的网站草稿保持原样；如果公开配置写入失败，审批仍为 `approved`，审核中心提供单分类重试。
4. Admin 退回：`pending_admin` → `returned_to_supervisor`；主管再退回员工：`returned_to_uploader`。
5. 员工修改原申请并提交同一 ID（`resubmit`），重回 `pending_supervisor`，历史审核记录可展开查看。
6. Admin 仅终审主管已通过的新品类，主管仅能处理本部门申请。
7. 历史 `category_requests` 没有提交人和部门信息，不可以根据名称猜测归属；保留原 Admin 流程处理这些历史记录。

## API
- `GET/POST /factory/category-requests` — 只查看当前员工的申请；提交时强制绑定部门主管
- `POST /factory/category-requests/:id/resubmit` — 修改属于自己的被退回申请
- `GET /supervisor/category-requests` — 自己部门的申请及历史
- `POST /supervisor/category-requests/:id/approve|reject` — 初审和退回（退回原因必填）
- `GET /admin/category-requests` — 全部申请及状态（含无提交人历史）
- `POST /admin/category-requests/:id/approve|reject` — 终审通过 / 退回主管（退回原因必填）

## Staging 上线顺序（必须按顺序）
1. **确认是 Staging D1**。先查看 `PRAGMA table_info(category_requests);`、`SELECT name FROM sqlite_master WHERE name='pz_staff_assignments';`。
2. Staging D1 执行 `migrations/015_category_request_two_stage_REVIEW.sql`。它创建额外的工作流与事件表，不重写历史分类，也不触碰 R2 / KV。
3. 核对目前真正运行的 Staging Worker，然后使用 `staging-worker-category-changes-REVIEW.js` 中的新增逻辑更新 Staging。**不要把 GitHub 候选版当成当前运行版而直接覆盖未经核对的 Worker。**
4. Staging 设置 `PZ_CATEGORY_TWO_STAGE_ENABLED=true`，保留 `PZ_RUNTIME_ENV=staging` 和当前绑定。
5. 在 Staging 部署本 PR 的前端：工厂产品分类快捷卡片、我的新品类申请、主管新品类初审、Admin 新品类终审。

## 必须验收
- 用工厂员工账号提交新品类，立即看到“待主管初审”，而不是旧版 `pending`。
- 另一个部门主管无法审批；正确主管可以通过。
- Admin 在主管通过前不能终审；通过后 Admin 才看到待办。
- Admin 退回并填写原因，主管看到退回记录；主管再退回，员工看到原因并修改原申请重提。
- 重提后的申请 ID 不变；审核日志不丢；Admin 批准后仅该新品类自动公开，其他网站草稿不得随之发布。
- 旧申请仍在 Admin 的申请历史中；员工看不到无法确认归属的旧申请。
- 工厂产品可按品类、未归类、搜索筛选；既有产品提交/双级审核不受影响。
- 需要验证新旧 R2 图片 URL，尤其是已上传但申请未保存的情况。

## Production 发布门槛
Staging 全链路通过后，先核对正式 D1 执行 015 的条件和现有 Worker 代码差异，再用独立的 `production-worker-admin-delete-v2-COPY.js` 候选版本进行生产审核。不可直接粘贴 Staging Worker，也不可在未执行 015 的生产库开启功能开关。生产上线后检查类别申请和已有产品双级审核，之后可逐步开放员工使用。

## 关闭/回滚
将 `PZ_CATEGORY_TWO_STAGE_ENABLED=false` 会回到旧的直接 Admin 路由；这不是完整的安全回滚方案，可能恢复旧单级审批。因此需要维护窗/临时限制新品类提交，并使用已验证的生产回退代码；不要通过删除数据库表“回滚”历史数据。

## PR #45：Admin 终审即发布单个新品类
- 沿用现有 015 迁移，不新增 D1 数据表；只对**新品类申请**实施自动发布。旧的“整站发布”按钮仍供首页文案、主图、其他配置草稿使用，SKU 的产品审核/发布不变。
- 新增 `POST /admin/category-requests/:id/publish`，只有 Admin 可以对`approved`状态单独重试发布，重复调用不产生重复分类。
- KV 模式从已发布快照合并且**只新增一个批准的分类**，不从草稿复制其他设置。KV 不支持跨请求原生 CAS；请不要在该分类批准瞬间与其他管理员并发操作整站发布。正式环境建议逐步采用受版本号保护的 D1 Site Config 模式。
- D1 Cutover 模式按 `published_revision` 条件更新；在写入公开配置前保存 R2 历史快照，防止并发覆盖。
- Admin 审批成功但发布失败，不应显示“审核失败”；审核中心单分类补发，不再要求进入“产品分类管理 → 发布全部网站配置”。
- 验收：先将首页标题或其它栏目存为**未发布草稿**，再批准新品类；确认前台新增分类，同时原公开首页标题不变。分别验证分类重复批准、单独补发、主管/员工不能发布、已有 SKU 审核不变。
