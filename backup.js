
(() => {
"use strict";
const config = window.APP_BACKUP_CONFIG;
if (!config) return;
const keys = config.keys;
const panel = document.createElement("div");
panel.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:2147483640;background:#fff;color:#172334;border:1px solid #aab9cd;border-radius:14px;box-shadow:0 4px 18px #0003;padding:10px;max-width:calc(100vw - 24px);font:14px/1.4 system-ui,sans-serif";
panel.innerHTML = '<div style="font-weight:700;margin-bottom:6px">💾 데이터 백업 · 복원</div><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" data-action="backup">파일로 저장</button><button type="button" data-action="restore">파일 불러오기</button></div><input type="file" accept=".json,application/json" style="display:none" aria-label="백업 파일 선택"><div role="status" style="font-size:12px;margin-top:5px;max-width:240px">파일은 직접 안전한 곳에 보관하세요.</div>';
panel.querySelectorAll("button").forEach(b=>b.style.cssText="background:#e9f1ff;color:#102c54;border:1px solid #afc4e3;border-radius:9px;padding:8px;font:inherit;cursor:pointer");
const fileInput=panel.querySelector("input");
const status=panel.querySelector('[role="status"]');
document.body.appendChild(panel);
function dateStamp() {
 const d=new Date();
 const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
 return local.toISOString().slice(0,19).replace(/[:T]/g,"-");
}
panel.querySelector('[data-action="backup"]').addEventListener("click",()=>{
 try{
  const data={};
  for(const key of keys){const value=localStorage.getItem(key);if(value!==null)data[key]=value;}
  if(Object.keys(data).length===0){status.textContent="저장된 데이터가 없습니다.";return;}
  const payload={format:"classroom-app-backup",version:1,app:config.app,createdAt:new Date().toISOString(),data};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=config.filePrefix+"-"+dateStamp()+".json";
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  status.textContent="백업 파일 저장을 요청했습니다. 다운로드 폴더에서 파일을 확인해 주세요.";
 }catch(e){status.textContent="백업 실패: "+e.message;}
});
panel.querySelector('[data-action="restore"]').addEventListener("click",()=>{fileInput.value="";fileInput.click();});
fileInput.addEventListener("change",async()=>{
 const file=fileInput.files&&fileInput.files[0];if(!file)return;
 try {
  if(file.size>10*1024*1024)throw Error("파일 크기가 너무 큽니다 (최대 10MB).");
  const payload=JSON.parse(await file.text());
  if(!payload || payload.format!=="classroom-app-backup" || payload.version!==1 || payload.app!==config.app || !payload.data || typeof payload.data!=="object" || Array.isArray(payload.data))throw Error("이 프로그램에서 만든 백업 파일이 아닙니다.");
  const entries=Object.entries(payload.data);
  if(!entries.length || entries.some(([key,value])=>!keys.includes(key)||typeof value!=="string"))throw Error("백업 데이터 구성이 올바르지 않습니다.");
  for(const [key,value] of entries)if(config.jsonKeys.includes(key))JSON.parse(value);
  if(!confirm("현재 저장된 설정이 백업 파일의 설정으로 교체됩니다. 계속할까요?"))return;
  const old=new Map(keys.map(k=>[k,localStorage.getItem(k)]));
  try{
   for(const key of keys)localStorage.removeItem(key);
   for(const [key,value] of entries)localStorage.setItem(key,value);
   if(config.app==="seat-change")localStorage.setItem("seat-randomizer-restored-local-v1","1");
  }catch(err){
   for(const [key,value] of old){if(value===null)localStorage.removeItem(key);else localStorage.setItem(key,value);}
   throw err;
  }
  alert("복원되었습니다. 화면을 새로고침합니다.");
  location.reload();
 }catch(e){status.textContent="복원 실패: "+e.message;alert("복원하지 못했습니다.\n"+e.message);}
});
})();
