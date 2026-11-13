import {mkdirSync} from 'node:fs';

const {chromium}=await import('playwright').catch(()=>
  import((process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES||'')+'/playwright/index.mjs'));

const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
const results=[];
mkdirSync('docs/screenshots/task21b',{recursive:true});
for(const view of ['dashboard','queue','inquiries','product']){
  for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:844},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto('http://127.0.0.1:5173/tests/visual/21b.html?view='+view,{waitUntil:'networkidle'});
    await page.waitForTimeout(350);
    const sizes=await page.evaluate(()=>({body:document.body.scrollWidth,viewport:window.innerWidth,
      main:document.querySelector('main')?.scrollWidth||0}));
    const path='docs/screenshots/task21b/'+view+'-'+width+'.png';
    await page.screenshot({path,fullPage:true});
    results.push({view,width,...sizes,errors,path});
    await page.close();
  }
}
await browser.close();
console.log(JSON.stringify(results,null,2));
