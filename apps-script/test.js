// 서버 로직 점검: node apps-script/test.js (구글 서비스를 흉내 내서 Code.gs 를 실행)
const crypto=require('crypto'),fs=require('fs'),vm=require('vm');
let data=null;const cache={};
const sh={getRange:(a,b)=>typeof a==='number'?{setValues:v=>{data[a-1][b-1]=v[0][0];data[a-1][b]=v[0][1]}}:{setNumberFormat(){}},appendRow:r=>data.push(r),getDataRange:()=>({getValues:()=>data.map(r=>[...r])})};
const ctx={SpreadsheetApp:{getActive:()=>({getSheetByName:()=>data&&sh,insertSheet:()=>(data=[],sh)})},
Utilities:{getUuid:()=>crypto.randomUUID(),DigestAlgorithm:{},Charset:{},computeDigest:(a,s)=>[...crypto.createHash('sha256').update(s,'utf8').digest()].map(b=>b>127?b-256:b)},
LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},CacheService:{getScriptCache:()=>({get:k=>cache[k],put:(k,v)=>cache[k]=v,remove:k=>delete cache[k]})},
ContentService:{MimeType:{},createTextOutput:t=>({setMimeType:()=>t})}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(__dirname+'/Code.gs','utf8')+';this.doPost=doPost',ctx);
const call=o=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(o)}}));
const a=call({action:'signup',name:'아린',pw:'secret1',user:{gender:'f',study:{}}});console.log('signup',!!a.token);
console.log('dup',call({action:'signup',name:'아린',pw:'secret1'}).error);
console.log('bad name',call({action:'signup',name:'=HACK()',pw:'secret1'}).error);
console.log('wrong',call({action:'login',name:'아린',pw:'nope'}).error);
console.log('ok login same token',call({action:'login',name:'아린',pw:'secret1'}).token===a.token);
console.log('save',call({action:'save',token:a.token,user:{name:'해커',study:{phy:60},log:[1]}}).ok);
const s=call({action:'search',q:'아'}).users[0];console.log('search',JSON.stringify(s));
console.log('me',call({action:'me',token:'x'}).error);
for(let i=0;i<5;i++)call({action:'login',name:'아린',pw:'x'});console.log('lock',call({action:'login',name:'아린',pw:'secret1'}).error);
console.log('stored hash != pw', data[1][2].length, !JSON.stringify(data).includes('secret1'));
