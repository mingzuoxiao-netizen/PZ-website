# PZ 管理员直接删除账号 · V2

本分支基于仓库 main 的 `worker-patches/production-worker-category-governance-REVIEW.js` 修改。用户确认此上传版本对应其正式 Worker，但源文件头部仍含 NOT DEPLOYED 注释，因此上线前应核对 Cloudflare 当前 Worker 内容。

## 使用步骤
1. 在 D1 检查 `PRAGMA table_info(users)`，若没有 `deleted_at` 和 `deleted_by`，执行同目录 `pz_account_retirement.sql` 一次。已经存在的字段不能重复 ALTER。
2. 检查 `pz_staff_assignments.supervisor_id` 允许 NULL，审批表含 `updated_at`、`department_id`、`status`、`supervisor_id`；建议先 Staging。
3. 打开 `production-worker-admin-delete-v2-COPY.js`，点击 Raw 后复制全文（不是单独替换最后一个函数）。确认生产 Worker 的绑定和配置保持原样。
4. 验证：删除 TEST02；主管有/无下属删除；无候选接任主管时人工重分配；已删除账号旧 JWT 拒绝；最后管理员无法删除；产品双级审核。
5. 审核通过后再部署生产。此 PR 不直接修改生产 D1/Cloudflare Worker。

## 逻辑
- 无业务关联账号尝试物理删除；有业务历史则软删除（`is_active=0,deleted_at,deleted_by`），列表不显示，登录失效，历史保留。
- 主管有下属和待审批数据仍可注销。有唯一合格接任主管则自动迁移；否则员工主管置空，API 返回 `requires_reassignment`，后续管理员指派主管。
- 保护当前登录管理员与最后有效管理员。
- 已注销用户名保留，无法直接重用相同用户名。
- 代码基于本地原始 V2 补丁合并。本次 GitHub 文件未进行 Cloudflare 实际端到端验证。
