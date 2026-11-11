export interface PreflightIssue {
  field: string;
  code: string;
  en: string;
  zh: string;
  severity: 'error' | 'warning';
}
export function preflightProduct(
  product: Record<string, any>,
  options?: { existingSku?: boolean }
): { errors: PreflightIssue[]; warnings: PreflightIssue[] };
