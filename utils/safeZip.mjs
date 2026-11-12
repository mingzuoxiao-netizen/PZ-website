// Browser-native, dependency-free ZIP reader/writer for restricted PZ imports.
// Extraction is bounded by both central-directory declarations AND streamed bytes.
const LIMITS={archive:180*1024*1024,expanded:360*1024*1024,entries:850,entry:12*1024*1024,
  workbook:8*1024*1024,ratio:120};
const encoder=new TextEncoder();
const decoder=new TextDecoder('utf-8',{fatal:true});
const u16=(view,pos)=>view.getUint16(pos,true);
const u32=(view,pos)=>view.getUint32(pos,true);
const marker=(view,pos,hex)=>pos>=0&&pos+4<=view.byteLength&&u32(view,pos)===hex;
const fail=message=>{throw Error('ZIP 无法安全导入：'+message);};
const validPath=name=>{
  if(!name||name.length>240||name.includes('\\')||name.includes('\0')||
     name.startsWith('/')||/^[A-Za-z]:/.test(name)||name.includes('//')||
     name.split('/').some(part=>part==='.'||part==='..'||part.includes(':')))
    fail('包含不安全文件路径');
  return name;
};
const crc32=data=>{
  let crc=0xffffffff;
  for(const b of data){
    crc^=b;
    for(let i=0;i<8;i++)crc=(crc&1)?0xedb88320^(crc>>>1):crc>>>1;
  }
  return (crc^0xffffffff)>>>0;
};
const packChunks=parts=>{
  const n=parts.reduce((sum,x)=>sum+x.length,0),out=new Uint8Array(n);
  let offset=0;for(const p of parts){out.set(p,offset);offset+=p.length;}
  return out;
};
export function createStoredZip(files){
  if(!Array.isArray(files)||files.length>LIMITS.entries)fail('模板文件过多');
  const parts=[],central=[];let offset=0;
  const write=(len)=>new Uint8Array(len);
  for(const file of files){
    const name=validPath(file.name),path=encoder.encode(name),data=
      file.data instanceof Uint8Array?file.data:encoder.encode(String(file.data??''));
    if(path.length>65535||data.length>LIMITS.expanded)fail('模板文件太大');
    const crc=crc32(data),local=write(30),v=new DataView(local.buffer);
    v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);
    v.setUint16(6,0x800,true);v.setUint16(8,0,true);
    v.setUint32(14,crc,true);v.setUint32(18,data.length,true);
    v.setUint32(22,data.length,true);v.setUint16(26,path.length,true);
    parts.push(local,path,data);
    const cd=write(46),c=new DataView(cd.buffer);
    c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);
    c.setUint16(8,0x800,true);c.setUint16(10,0,true);
    c.setUint32(16,crc,true);c.setUint32(20,data.length,true);
    c.setUint32(24,data.length,true);c.setUint16(28,path.length,true);
    c.setUint32(42,offset,true);
    central.push(cd,path);
    offset+=local.length+path.length+data.length;
  }
  const centralData=packChunks(central);
  const eocd=write(22),e=new DataView(eocd.buffer);
  e.setUint32(0,0x06054b50,true);
  e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);
  e.setUint32(12,centralData.length,true);e.setUint32(16,offset,true);
  return packChunks([...parts,centralData,eocd]);
}
export function inspectZip(bytes,{maxArchive=LIMITS.archive,maxTotal=LIMITS.expanded,
  maxEntry=LIMITS.entry,maxEntries=LIMITS.entries}={}){
  const data=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes);
  if(data.length<22||data.length>maxArchive)fail('文件大小超出限制');
  const view=new DataView(data.buffer,data.byteOffset,data.byteLength);
  let end=-1;
  for(let pos=data.length-22;pos>=Math.max(0,data.length-65557);pos--){
    if(marker(view,pos,0x06054b50)&&pos+22+u16(view,pos+20)===data.length){end=pos;break;}
  }
  if(end<0)fail('找不到完整的 ZIP 目录');
  if(u16(view,end+4)!==0||u16(view,end+6)!==0||
     u16(view,end+8)!==u16(view,end+10))fail('不支持分卷压缩包');
  const count=u16(view,end+10),size=u32(view,end+12),start=u32(view,end+16);
  if(count>maxEntries||!count||start+size>end)fail('文件数量或目录边界无效');
  const entries=[],names=new Set();let pos=start,total=0;
  for(let i=0;i<count;i++){
    if(!marker(view,pos,0x02014b50)||pos+46>start+size)fail('目录记录损坏');
    const flags=u16(view,pos+8),method=u16(view,pos+10),
      checksum=u32(view,pos+16),compressed=u32(view,pos+20),
      expanded=u32(view,pos+24),nameLen=u16(view,pos+28),
      extraLen=u16(view,pos+30),commentLen=u16(view,pos+32),
      disk=u16(view,pos+34),external=u32(view,pos+38),
      localOffset=u32(view,pos+42);
    if((flags&1)||(flags&0x40)||disk||![0,8].includes(method)||
       compressed===0xffffffff||expanded===0xffffffff||localOffset===0xffffffff)
      fail('加密、ZIP64 或未知压缩方式不受支持');
    if((flags&0x800)===0&&data.subarray(pos+46,pos+46+nameLen).some(byte=>byte>=128))
      fail('含中文的 ZIP 文件名需要使用 UTF-8 编码');
    const next=pos+46+nameLen+extraLen+commentLen;
    if(next>start+size)fail('目录记录越界');
    let name;try{name=decoder.decode(data.subarray(pos+46,pos+46+nameLen));}
    catch{fail('文件名不是 UTF-8');}
    validPath(name);
    const folded=name.toLocaleLowerCase('en-US');
    if(names.has(folded))fail('ZIP 包含重名文件或大小写冲突');names.add(folded);
    const isDir=name.endsWith('/');
    const mode=(external>>>16)&0xf000;
    if(mode===0xa000)fail('不允许符号链接');
    if(!isDir){
      if(expanded>maxEntry)fail('单个文件超过大小限制：'+name);
      if(compressed===0||expanded/Math.max(1,compressed)>LIMITS.ratio)
        fail('文件压缩比异常，疑似 ZIP bomb：'+name);
      total+=expanded;if(total>maxTotal)fail('解压总大小超过安全限制');
    }
    if(!marker(view,localOffset,0x04034b50)||localOffset+30>start)
      fail('本地 ZIP 文件头无效');
    const localMethod=u16(view,localOffset+8),localNameLen=u16(view,localOffset+26),
      localExtraLen=u16(view,localOffset+28),
      offset=localOffset+30+localNameLen+localExtraLen;
    if(method!==localMethod||offset+compressed>start)fail('数据块超出边界');
    entries.push({name,method,checksum,compressed,expanded,offset,isDir});
    pos=next;
  }
  if(pos!==start+size)fail('ZIP 目录尾部不一致');
  const byName=new Map(entries.map(entry=>[entry.name,entry]));
  const read=async(entry,overrideMax)=>{
    if(typeof entry==='string')entry=byName.get(entry);
    if(!entry||entry.isDir)fail('找不到文件');
    const cap=Math.min(overrideMax||maxEntry,maxTotal);
    if(entry.expanded>cap)fail('解压文件超出限制：'+entry.name);
    let result;
    const compressedBytes=data.subarray(entry.offset,entry.offset+entry.compressed);
    if(entry.method===0){
      result=compressedBytes.slice();
    }else{
      if(typeof DecompressionStream==='undefined')
        fail('当前浏览器不支持 ZIP 解压，请更新 Chrome/Edge');
      const stream=new Blob([compressedBytes]).stream()
        .pipeThrough(new DecompressionStream('deflate-raw'));
      const reader=stream.getReader(),chunks=[];
      let totalRead=0;
      try{
        while(true){
          const {done,value}=await reader.read();if(done)break;
          totalRead+=value.byteLength;
          if(totalRead>cap||totalRead>entry.expanded){
            await reader.cancel();fail('实际解压大小超过声明：'+entry.name);
          }
          chunks.push(value);
        }
      }catch(error){throw Error('ZIP 解压失败：'+entry.name+'；'+String(error.message||'文件损坏'));}
      result=packChunks(chunks);
    }
    if(result.length!==entry.expanded||crc32(result)!==entry.checksum)
      fail('文件损坏，CRC/长度校验失败：'+entry.name);
    return result;
  };
  return {entries,has:name=>byName.has(name),read,get:name=>byName.get(name)};
}
export const ZIP_LIMITS=LIMITS;
