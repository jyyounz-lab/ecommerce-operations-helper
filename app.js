import {APP_VERSION,calculators,evaluate,number} from './calculators.js?v=2.0.1';
const $=s=>document.querySelector(s),KEY='ecommerce-helper:v2',LEGACY_KEY='ecommerce-helper:v1';
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defaults=c=>Object.fromEntries(c.fields.map(f=>[f.id,String(f.defaultValue)]));
let state={active:'gross-margin',drafts:{},records:[]},storageOK=true,installPrompt,toastTimer,pendingConfirm;
function migrateLegacy(){
 try{
  if(localStorage.getItem(KEY))return;
  const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY)||'null');
  if(!legacy||typeof legacy!=='object')return;
  for(const c of calculators.slice(0,6)){const old=legacy[c.id];if(old&&typeof old==='object')state.drafts[c.id]=Object.fromEntries(c.fields.map(f=>[f.id,old[f.id]??String(f.defaultValue)]));}
  localStorage.setItem(KEY,JSON.stringify(state));
 }catch{storageOK=false;}
}
migrateLegacy();
try{const stored=JSON.parse(localStorage.getItem(KEY)||'null');if(stored&&typeof stored==='object'){
 if(calculators.some(c=>c.id===stored.active))state.active=stored.active;
 for(const c of calculators){const d=stored.drafts?.[c.id];if(d&&typeof d==='object')state.drafts[c.id]=Object.fromEntries(c.fields.map(f=>[f.id,typeof d[f.id]==='string'||typeof d[f.id]==='number'?String(d[f.id]):String(f.defaultValue)]));}
 if(Array.isArray(stored.records))state.records=stored.records.filter(r=>r&&typeof r.id==='string'&&typeof r.name==='string'&&calculators.some(c=>c.id===r.tool)&&r.raw&&typeof r.raw==='object').slice(0,50);
}}catch{storageOK=false;}
const current=()=>calculators.find(c=>c.id===state.active);
const rawFor=c=>state.drafts[c.id]||defaults(c);
function storageStatus(){ $('#storage-status').textContent=storageOK?'資料只存本機 · 不上傳':'本機儲存不可用；本次可計算，關閉後可能遺失'; }
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;}storageStatus();}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
function confirmAction(title,text,action){pendingConfirm=action;$('#confirm-title').textContent=title;$('#confirm-text').textContent=text;$('#confirm-ok').textContent=title.includes('恢復')?'確定恢復':title.includes('載入')?'確定載入':title.includes('刪除')?'確定刪除':'確定清除';$('#confirm').showModal();$('#confirm-cancel').focus();}
$('#confirm-cancel').onclick=()=>$('#confirm').close();$('#confirm-ok').onclick=()=>{$('#confirm').close();pendingConfirm?.();pendingConfirm=null;};
function navigation(){
 const group=current().group,groups=['商品定價','獲利促銷','營運目標','流量廣告'];
 $('#groups').innerHTML=groups.map(g=>`<button aria-pressed="${g===group}" data-group="${g}">${g}</button>`).join('');
 $('#tools').innerHTML=calculators.filter(c=>c.group===group).map(c=>`<button aria-pressed="${c.id===state.active}" data-tool="${c.id}">${c.title}${c.isNew?'<span class="new">新增</span>':''}</button>`).join('');
 $('#saved-count').textContent=state.records.length;
}
$('#groups').onclick=e=>{const b=e.target.closest('[data-group]');if(b)select(calculators.find(c=>c.group===b.dataset.group).id);};
$('#tools').onclick=e=>{const b=e.target.closest('[data-tool]');if(b)select(b.dataset.tool);};
function select(id){state.active=id;persist();render();$('#calc-title').focus({preventScroll:true});}
function render(){
 const c=current(),raw=rawFor(c);navigation();
 $('#workspace').innerHTML=`<div class="workspace-head"><div><h2 id="calc-title" tabindex="-1">${c.title}</h2><p>${c.subtitle}</p></div><div class="actions"><button class="quiet" id="reset-current">恢復範例</button><button class="quiet" id="clear-current">清除此項</button></div></div>
 <div class="workspace-grid"><div class="input-panel"><p class="section-label"><span>01</span> 輸入條件</p><div class="formula formula-first"><h3>計算公式</h3><p>${c.formulaText}</p><p class="percent-help">百分比輸入 35 代表 35%；計算時換算為 0.35。</p></div><div class="fields">${c.fields.map(f=>`<div class="field"><label for="field-${f.id}">${f.label}</label><div class="input-wrap"><input type="number" inputmode="decimal" step="any" min="0" ${f.max===undefined?'':`max="${f.max}"`} id="field-${f.id}" name="${f.id}" value="${escape(raw[f.id])}" aria-describedby="hint-${f.id} error-${f.id}"><span>${f.unit}</span></div><p class="hint" id="hint-${f.id}">${f.hint||''}</p><p class="error" id="error-${f.id}"></p></div>`).join('')}</div></div>
 <aside class="result-panel" aria-label="試算結果"><div class="result-box"><p class="result-label">${c.resultLabel}</p><output id="result" aria-live="polite" aria-atomic="true"></output><p id="result-status" class="result-status"></p><div class="substitution"><h3>數字代入</h3><p id="substitution"></p></div></div><dl class="breakdown" id="breakdown"></dl><div id="scenarios"></div><p class="note">${c.note}</p><div class="save-box"><input id="record-name" aria-label="方案名稱" maxlength="40" placeholder="方案名稱，例如：商品 A 原價"><button id="save-record" class="primary">儲存方案</button></div><p class="muted">最多 50 組 · 同一工具可儲存多組並比較</p></aside></div>`;
 $('#workspace').querySelectorAll('.field input').forEach(el=>el.addEventListener('input',()=>{state.drafts[c.id]=readInputs();persist();updateResult();}));
 $('#reset-current').onclick=()=>confirmAction('恢復此項範例？','只會取代目前工具的輸入；其他工具與已存方案保持不變。',()=>{state.drafts[c.id]=defaults(c);persist();render();toast('已恢復範例值');});
 $('#clear-current').onclick=()=>confirmAction('清除此項輸入？','已存方案保持不變。清除後可使用「恢復範例」。',()=>{state.drafts[c.id]=Object.fromEntries(c.fields.map(f=>[f.id,'']));persist();render();toast('已清除此項輸入');});
 $('#save-record').onclick=saveRecord;updateResult();
}
function readInputs(){return Object.fromEntries([...$('#workspace').querySelectorAll('.field input')].map(el=>[el.name,el.value]));}
function updateResult(){
 const c=current(),{errors,result,values}=evaluate(c,readInputs());
 for(const f of c.fields){$(`#error-${f.id}`).textContent=errors[f.id]||'';$(`#field-${f.id}`).setAttribute('aria-invalid',Boolean(errors[f.id]));}
 $('.result-box').classList.toggle('invalid',result===null);$('.result-box').classList.toggle('negative',result!==null&&result<0);
 $('#result').textContent=result===null?'—':c.format(result);
 $('#result-status').textContent=result===null?(errors._form||'請完成有效輸入，結果與代入將顯示於此。'):result<0?'目前條件產生負值，請確認售價與成本。':'依目前輸入即時計算';
 $('#substitution').textContent=result===null?'填妥欄位後顯示計算過程。':`${c.substitute(values)} ＝ ${c.format(result)}`;
 $('#breakdown').innerHTML=result===null?'':(c.details?.(values,result)||[]).map(r=>`<div><dt>${escape(r.label)}</dt><dd>${escape(r.value)}</dd></div>`).join('');
 $('#scenarios').innerHTML=result!==null&&c.scenarios?`<section class="scenarios"><h3>轉換率情境比較</h3><table><thead><tr><th>情境</th><th>轉換率</th><th>預估營業額</th></tr></thead><tbody>${c.scenarios(values).map(s=>`<tr><td>${s.label}</td><td>${s.rate}</td><td>${s.value}</td></tr>`).join('')}</tbody></table></section>`:'';
 $('#save-record').disabled=result===null;
}
function saveRecord(){
 const c=current(),raw=readInputs();if(evaluate(c,raw).result===null)return;
 if(state.records.length>=50){toast('已達 50 組，請先移除不需要的方案。');return;}
 const name=$('#record-name').value.trim()||`${c.title} ${state.records.length+1}`;
 state.records.unshift({id:crypto.randomUUID(),name,tool:c.id,raw,created:new Date().toISOString()});persist();navigation();toast(storageOK?'方案已儲存在此瀏覽器':'方案暫存於本次視窗；本機儲存失敗');
}
function showRecords(){
 $('#records').innerHTML=state.records.length?state.records.map(r=>{const c=calculators.find(c=>c.id===r.tool),e=evaluate(c,r.raw);return `<div class="record"><input type="checkbox" id="pick-${escape(r.id)}" value="${escape(r.id)}" aria-label="選取 ${escape(r.name)}"><label for="pick-${escape(r.id)}">${escape(r.name)}<small>${c.title} · ${e.result===null?'數值無效':c.format(e.result)}</small></label><button class="secondary" data-load="${escape(r.id)}">載入</button><button class="quiet" data-delete="${escape(r.id)}">刪除</button></div>`;}).join(''):'<div class="empty">還沒有方案。完成一次試算後，輸入名稱並點「儲存方案」。</div>';
 $('#comparison').innerHTML='';$('#compare-button').disabled=state.records.length<2;
}
$('#library-button').onclick=()=>{showRecords();$('#library').showModal();};
$('#records').onclick=e=>{const b=e.target.closest('button');if(!b)return;const id=b.dataset.load||b.dataset.delete,r=state.records.find(x=>x.id===id);if(!r)return;
 if(b.dataset.load){const c=calculators.find(c=>c.id===r.tool);confirmAction('載入此方案？','將取代該工具目前的輸入；已存方案仍保留。',()=>{state.drafts[r.tool]=Object.fromEntries(c.fields.map(f=>[f.id,String(r.raw[f.id]??'')]));$('#library').close();select(r.tool);toast('已載入，可修改後另存新方案');});}
 else confirmAction('刪除這組方案？',`即將刪除「${r.name}」，此動作無法復原。`,()=>{state.records=state.records.filter(x=>x.id!==id);persist();navigation();showRecords();});
};
$('#compare-button').onclick=()=>{
 const ids=[...$('#records').querySelectorAll('input:checked')].map(el=>el.value),records=state.records.filter(r=>ids.includes(r.id)),out=$('#comparison');
 if(records.length<2||records.length>3){out.textContent='請選取 2–3 組方案。';return;}
 if(!records.every(r=>r.tool===records[0].tool)){out.textContent='請選取同一計算工具的方案，避免比較不同指標。';return;}
 const c=calculators.find(c=>c.id===records[0].tool);
 out.innerHTML=`<div class="compare-wrap"><table class="compare-table"><caption>${c.title} · 方案比較</caption><thead><tr><th>項目</th>${records.map(r=>`<th>${escape(r.name)}</th>`).join('')}</tr></thead><tbody><tr><th>${c.resultLabel}</th>${records.map(r=>{const e=evaluate(c,r.raw);return `<td>${e.result===null?'無效':c.format(e.result)}</td>`;}).join('')}</tr>${c.fields.map(f=>`<tr><th>${f.label}</th>${records.map(r=>`<td>${escape(r.raw[f.id])} ${f.unit}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
};
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
$('#settings-button').onclick=()=>$('#settings').showModal();
$('#clear-all').onclick=()=>confirmAction('清除全部本機資料？','將清空九項工具的輸入與所有已存方案，無法復原。',()=>{state.records=[];for(const c of calculators)state.drafts[c.id]=Object.fromEntries(c.fields.map(f=>[f.id,'']));persist();render();$('#settings').close();toast('已清除全部本機資料');});
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#install-button').hidden=false;});
$('#install-button').onclick=async()=>{if(!installPrompt)return;await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;$('#install-button').hidden=true;};
let offlineReady=false;
function network(){ $('#network').textContent=offlineReady?(navigator.onLine?'● 離線資源已就緒':'● 目前離線 · 可繼續試算'):(navigator.onLine?'○ 線上使用 · 離線資源未就緒':'○ 目前離線 · 快取未確認'); }
window.addEventListener('online',network);window.addEventListener('offline',network);
async function prepareOffline(){try{if(!('serviceWorker' in navigator))return;await navigator.serviceWorker.register('./sw.js');await navigator.serviceWorker.ready;const cache=await caches.open(`ecommerce-helper-v${APP_VERSION}`);offlineReady=Boolean(await cache.match('./app.js?v=2.0.1'));network();}catch{network();}}
$('#version').textContent=`v${APP_VERSION}`;render();storageStatus();network();prepareOffline();
