export interface ReturnIssue { field:string; message:string }
export interface ReviewReturnDetails {
  review_id?:string;
  issues:ReturnIssue[];
  return_reason?:string|null;
  legacy?:boolean;
  baseline:Record<string,unknown>;
  version?:number;
  returned_by?:string|null;
  returned_at?:string|null;
}
export const RETURN_PREFIX:string;
export function validateReturnIssues(raw:unknown):ReturnIssue[];
export function serializeReturnEvent(note:string,issues:ReturnIssue[]):string;
export function readReturnEvent(note:unknown):{note:string;issues:ReturnIssue[];legacy:boolean};
export function normalizeIssueField(field:string):string;
export function changedProductFields(before:unknown,after:unknown):string[];
export function isRecheck(review:unknown):boolean;
