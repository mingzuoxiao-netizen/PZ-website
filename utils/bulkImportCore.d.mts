import type {ProductSpecifications} from './productSpecifications';
export interface ImportIssue {row:number;field:string;message:string;severity:'error'|'warning'}
export interface ImportDraft {
 code:string;name:string;name_cn:string;category:string;sub_category:string;
 material:string;finish:string;description:string;description_cn:string;
 production_sites:('zhaoqing'|'cambodia')[];images:string[];
 specifications:ProductSpecifications;status:'draft';
}
export interface ImportRow {row:number;cells:Record<string,string>}
export interface MappedRow {row:number;code:string;product:ImportDraft;issues:ImportIssue[];valid:boolean}
export const IMPORT_LIMIT:number;
export const SITE_VALUES:string[];
export const IMAGE_ROLES:string[];
export const BASE_COLUMNS:string[];
export function normalizeSku(value:unknown):string;
export function columnsForAttributes(keys?:string[]):string[];
export function templateColumns(keys?:string[]):string[];
export function csvTemplate(columns?:string[]):string;
export function csvLine(cells:unknown[]):string;
export function parseCsv(content:string):{headers:string[];rows:ImportRow[]};
export function mapImportRow(row:ImportRow):MappedRow;
export function attachImageRoles(row:MappedRow, images:{url:string;role:string}[]):MappedRow;
export function matchImageFilename(fileName:string):{code:string;role:string}|null;
export function errorReportCsv(issues:ImportIssue[]):string;
