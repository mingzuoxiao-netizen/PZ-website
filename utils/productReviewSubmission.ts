// UI presentation only. The Worker checks the D1 row again and remains the
// source of truth for permissions and valid transitions.
export const submitReadyProductStatuses = new Set(['draft', 'rejected', 'returned_to_uploader']);

export const productReviewStatusLabel: Record<string,string> = {
  draft: '草稿',
  rejected: '已退回',
  returned_to_uploader: '已退回待修改',
  pending_supervisor: '待主管初审',
  pending_admin: '待管理员终审',
  returned_to_supervisor: '已退回主管，等待安排修改',
  approved_pending_publish: '终审已通过，等待管理员发布',
  published: '已发布',
  awaiting_review: '旧流程待审核'
};

export function productReviewSubmissionHint(status: string | null | undefined): string | null {
  const normalized = String(status || '').toLowerCase();
  if (submitReadyProductStatuses.has(normalized)) return null;
  const label = productReviewStatusLabel[normalized] || normalized || '未知';
  return `该产品当前状态为「${label}」，无法重复提交。请返回产品列表刷新状态；如已进入审核队列，请联系直属主管处理。`;
}
