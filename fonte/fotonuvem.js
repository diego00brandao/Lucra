/* ══════════ FOTOS NA NUVEM ══════════
   O aparelho continua guardando as fotos (abre rápido e funciona sem internet).
   Com conta, cada foto também vai para o Supabase Storage, na pasta da clínica; outro aparelho baixa quando abre a ficha.
   Só dono e profissional leem as fotos: a regra fica no servidor (supabase/fotos.sql). */
const FCAMPOS=['antes','depois'];
const fHash=s=>s?s.length+':'+s.slice(-32):'';
const fNuvem=()=>NUVEM&&CONTA&&SES&&podeClinico();
const fPath=(r,c)=>`${CONTA.cid}/${r.clienteId}/${r.id}-${c}.jpg`;
function fIdx(){ if(!S.fotosIdx)S.fotosIdx=[]; return S.fotosIdx }
async function fSobe(path,url){ await garanteToken(); const blob=await (await fetch(url)).blob();
  const r=await fetch(`${SB_URL}/storage/v1/object/fotos/${path}`,{method:'POST',headers:{apikey:SB_KEY,Authorization:'Bearer '+SES.access_token,'Content-Type':'image/jpeg','x-upsert':'true'},body:blob});
  if(!r.ok)throw new Error('envio '+r.status) }
async function fBaixa(path){ await garanteToken();
  const r=await fetch(`${SB_URL}/storage/v1/object/authenticated/fotos/${path}`,{headers:{apikey:SB_KEY,Authorization:'Bearer '+SES.access_token}});
  if(!r.ok)throw new Error('baixa '+r.status); const b=await r.blob();
  return await new Promise((ok,er)=>{ const f=new FileReader(); f.onload=()=>ok(f.result); f.onerror=er; f.readAsDataURL(b) }) }
function fApagaN(paths){ if(!paths.length)return Promise.resolve();
  return garanteToken().then(()=>fetch(`${SB_URL}/storage/v1/object/fotos`,{method:'DELETE',headers:{apikey:SB_KEY,Authorization:'Bearer '+SES.access_token,'Content-Type':'application/json'},body:JSON.stringify({prefixes:paths})})).catch(()=>{}) }
/* manda um registro: só as fotos que mudaram */
async function fEnvia(r){
  const idx=fIdx(); let e=idx.find(z=>z.id===r.id); const novo=!e; if(!e)e={id:r.id,clienteId:r.clienteId,tem:{}};
  for(const c of FCAMPOS){ const h=fHash(fotoOk(r[c])?r[c]:'');
    if(h&&e.tem[c]!==h){ await fSobe(fPath(r,c),r[c]); e.tem[c]=h }
    else if(!h&&e.tem[c]){ await fApagaN([fPath(r,c)]); delete e.tem[c] } }
  Object.assign(e,{titulo:r.titulo||'',data:r.data||''}); if(novo)idx.push(e); salvar();
  r._nuvem=true; await _FOTOS.salvar.call(FOTOS,r);
}
const _FOTOS={salvar:FOTOS.salvar,apagar:FOTOS.apagar,doCliente:FOTOS.doCliente};
FOTOS.salvar=function(r){ return _FOTOS.salvar.call(this,r).then(x=>{ if(fNuvem())fEnvia(r).catch(()=>toast('Foto guardada no aparelho. Envio para a nuvem falhou: tento de novo ao abrir a ficha')); return x }) };
FOTOS.apagar=function(id){ return _FOTOS.apagar.call(this,id).then(x=>{ if(fNuvem()){ const e=fIdx().find(z=>z.id===id);
    if(e){ S.fotosIdx=fIdx().filter(z=>z.id!==id); salvar(); fApagaN(Object.keys(e.tem).map(c=>`${CONTA.cid}/${e.clienteId}/${e.id}-${c}.jpg`)) } } return x }) };
FOTOS.doCliente=function(cid){ return _FOTOS.doCliente.call(this,cid).then(async loc=>{
  if(!fNuvem())return loc;
  const idx=fIdx().filter(e=>e.clienteId===cid), porId=new Map(loc.map(r=>[r.id,r])), out=[];
  for(const e of idx){ let r=porId.get(e.id);
    const falta=FCAMPOS.some(c=>e.tem[c]&&(!r||fHash(fotoOk(r[c])?r[c]:'')!==e.tem[c]));
    if(falta){ try{ r=Object.assign({id:e.id,clienteId:cid,antes:'',depois:''},r||{},{titulo:e.titulo,data:e.data,_nuvem:true});
        for(const c of FCAMPOS){ if(e.tem[c]&&fHash(fotoOk(r[c])?r[c]:'')!==e.tem[c])r[c]=await fBaixa(`${CONTA.cid}/${cid}/${e.id}-${c}.jpg`); if(!e.tem[c])r[c]='' }
        await _FOTOS.salvar.call(FOTOS,r) }catch(err){ if(!r)continue } }
    else if(r&&(r.titulo!==e.titulo||r.data!==e.data)){ r.titulo=e.titulo; r.data=e.data; await _FOTOS.salvar.call(FOTOS,r) }
    if(r){ out.push(r); porId.delete(e.id) } }
  for(const r of porId.values()){
    if(r._nuvem){ await _FOTOS.apagar.call(FOTOS,r.id); continue }   /* apagada em outro aparelho */
    out.push(r); fEnvia(r).catch(()=>{}) }                           /* ainda não tinha subido */
  return out }) };
