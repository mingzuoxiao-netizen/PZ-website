/** Backoffice-only feedback: never render raw Worker codes or English exceptions to staff. */
export function backofficeError(error:unknown,fallback='操作未完成，请刷新页面核对状态后重试。'):string{
  const raw=error instanceof Error?error.message:typeof error==='string'?error:'';
  const message=raw.trim();
  if(!message)return fallback;
  if(/(?:PRODUCT_EDIT_CONFLICT|VERSION_CONFLICT)/i.test(message))
    return '资料已被其他人修改。请刷新并对比最新版本后再保存。';
  if(/(?:401|403|Unauthorized|Forbidden|permission denied)/i.test(message))
    return '当前账号没有操作权限。请重新登录或联系管理员。';
  if(/(?:429|rate.limit|Too Many Requests)/i.test(message))
    return '操作过于频繁，请稍后再试。';
  if(/(?:network|Failed to fetch|Timeout|AbortError|ECONN|fetch failed)/i.test(message))
    return '网络连接不稳定，请检查网络后刷新核对状态。';
  // Preserve actionable Chinese messages, but never print stack traces or raw transport responses.
  if(/[\u3400-\u9fff]/.test(message)&&!/(?:\bat\s+\S+\s*\(|<html|<!doctype|traceback)/i.test(message))
    return message.slice(0,220);
  return fallback;
}
