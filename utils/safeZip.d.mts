export interface ZipEntry {name:string;method:number;checksum:number;compressed:number;expanded:number;offset:number;isDir:boolean}
export interface ZipArchive {
  entries:ZipEntry[];
  has:(name:string)=>boolean;
  get:(name:string)=>ZipEntry|undefined;
  read:(entry:ZipEntry|string,maxSize?:number)=>Promise<Uint8Array>;
}
export const ZIP_LIMITS:{archive:number;expanded:number;entries:number;entry:number;workbook:number;ratio:number};
export function inspectZip(bytes:ArrayBuffer|Uint8Array,limits?:{
  maxArchive?:number;maxTotal?:number;maxEntry?:number;maxEntries?:number
}):ZipArchive;
export function createStoredZip(files:{name:string;data:Uint8Array|string}[]):Uint8Array;
