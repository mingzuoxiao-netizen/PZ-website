import type {MappedRow,ImportRow} from './bulkImportCore.mjs';
export interface ZipProductImage {
  file:string;blob:Blob;preview:string;role:string;source:string;
}
export interface ZipProductBatch {
  rows:ImportRow[];
  records:MappedRow[];
  images:Map<string,ZipProductImage[]>;
  warnings:string[];
  orphan:string[];
}
export function readWorkbook(data:Uint8Array|ArrayBuffer):Promise<ImportRow[]>;
export function matchSkuFolder(path:string):{sku:string;file:string}|null;
export function assignInitialImageRoles(items:ZipProductImage[]):{images:ZipProductImage[];needsConfirmation:boolean};
export function readProductZip(data:Uint8Array|ArrayBuffer):Promise<ZipProductBatch>;
export function disposePreviews(batch:ZipProductBatch|null|undefined):void;
export function createTemplateWorkbook(category:string,attributeKeys?:string[]):Uint8Array;
export function createZipTemplate(category:string,attributeKeys?:string[]):Uint8Array;
export function zipSummary(batch:ZipProductBatch):Array<MappedRow & {images:ZipProductImage[];needsMainConfirmation:boolean}>;
