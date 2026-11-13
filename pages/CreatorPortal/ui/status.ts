/**
 * PZ 后台状态词典 — 产品、询盘、导入批次、抽检统一在此定义。
 * UI 不应自行命名“驳回/退回”或指定状态颜色。
 * 同一状态使用固定的中文标签；历史字段在 aliases 中映射到正式状态。
 */
export type StatusTone='neutral'|'amber'|'red'|'blue'|'green'|'muted';
export type StatusDefinition={label:string;tone:StatusTone};
export const STATUS_DEFINITIONS={
  draft:{label:'草稿',tone:'neutral'},
  pending_supervisor:{label:'待初审',tone:'amber'},
  pending_admin:{label:'待终审',tone:'amber'},
  returned:{label:'已退回',tone:'red'},
  approved_pending_publish:{label:'待发布',tone:'blue'},
  published:{label:'已发布',tone:'green'},
  soft_deleted:{label:'回收站',tone:'muted'},
  unpublished:{label:'已下架',tone:'muted'},
  archived:{label:'已归档',tone:'muted'},
  enabled:{label:'已启用',tone:'green'},
  inactive:{label:'已停用',tone:'muted'},
  new:{label:'新询盘',tone:'blue'},
  replied:{label:'已回复',tone:'neutral'},
  quoted:{label:'已报价',tone:'blue'},
  won:{label:'已成交',tone:'green'},
  closed:{label:'已关闭',tone:'muted'},
  import_pending:{label:'待导入',tone:'amber'},
  import_running:{label:'导入中',tone:'blue'},
  import_complete:{label:'导入完成',tone:'green'},
  import_partial:{label:'部分成功',tone:'amber'},
  import_verify:{label:'保存待核对',tone:'amber'},
  import_failed:{label:'导入失败',tone:'red'},
  sampled:{label:'待抽检',tone:'amber'},
  sampled_ok:{label:'抽检通过',tone:'green'},
  audit_success:{label:'成功',tone:'green'},
  audit_failed:{label:'失败',tone:'red'},
  audit_pending:{label:'结果待确认',tone:'amber'}
} as const satisfies Record<string,StatusDefinition>;

const ALIASES:Record<string,keyof typeof STATUS_DEFINITIONS>={
  awaiting_review:'pending_supervisor',
  rejected:'returned',returned_to_uploader:'returned',returned_to_supervisor:'returned',
  approved:'approved_pending_publish',deleted:'soft_deleted',soft_deleted:'soft_deleted',
  'soft-deleted':'soft_deleted',active:'published',Active:'enabled',Disabled:'inactive',
  New:'new',Read:'new',Replied:'replied',overdue:'new',
  pending:'import_pending',processing:'import_running',completed:'import_complete',
  complete:'import_complete',partial:'import_partial',failed:'import_failed',
  saved:'import_complete',uploaded:'import_complete',uploading:'import_running',
  ready:'import_pending',verify:'import_verify',error:'import_failed'
};
export const STATUS_CLASSES:Record<StatusTone,string>={
  neutral:'bg-stone-100 text-stone-800 border-stone-300',
  amber:'bg-amber-50 text-amber-900 border-amber-300',
  red:'bg-red-50 text-red-800 border-red-300',
  blue:'bg-blue-50 text-blue-900 border-blue-300',
  green:'bg-green-50 text-green-900 border-green-300',
  muted:'bg-stone-100 text-stone-600 border-stone-200'
};
export function getStatusDefinition(status:string|null|undefined):StatusDefinition{
  const raw=String(status||'').trim();
  const key=(ALIASES[raw]||raw) as keyof typeof STATUS_DEFINITIONS;
  return STATUS_DEFINITIONS[key]||{label:'状态待核实',tone:'muted'};
}
export const OVERDUE_STATUS:StatusDefinition={label:'已超时',tone:'red'};
