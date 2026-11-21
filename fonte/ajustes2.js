/* ══════════ CAMPOS MAIS FÁCEIS: meta com ponto, CRP com barra, aniversário digitado ══════════ */
/* 10000 vira 10.000 enquanto digita; os centavos vão depois da vírgula */
function fmtMilhar(v,inicial){
  let s=String(v==null?'':v).trim(); if(!s)return '';
  if(inicial&&/^\d+\.\d{1,2}$/.test(s))s=s.replace('.',',');
  s=s.replace(/[^\d,]/g,''); const i=s.indexOf(','); let int=i<0?s:s.slice(0,i), dec=i<0?null:s.slice(i+1).replace(/,/g,'').slice(0,2);
  int=int.replace(/^0+(?=\d)/,''); int=int.replace(/\B(?=(\d{3})+(?!\d))/g,'.');
  return dec==null?int:(int||'0')+','+dec;
}
const fmtCrp=v=>area()==='psico'?molde(soDig(v).slice(0,8),'##/######'):String(v||'');
MASC.push(['#m-valor,#ob-meta',v=>fmtMilhar(v)],['#pf-reg',fmtCrp]);
/* quando o campo chega preenchido (ex.: meta salva como 10000.5), formata sem perder os centavos */
const _formata=formataCampos;
formataCampos=function(raiz){ raiz.querySelectorAll('#m-valor,#ob-meta').forEach(i=>{ if(i.value)i.value=fmtMilhar(i.value,true) });
  raiz.querySelectorAll('#pf-reg').forEach(i=>{ if(i.value)i.value=fmtCrp(i.value) });
  MASC.filter(m=>!/m-valor|pf-reg/.test(m[0])).forEach(([q,f])=>raiz.querySelectorAll(q).forEach(i=>{ if(i.value)i.value=f(i.value) })) };

/* aniversário: digitar dd/mm/aaaa em vez do calendário (ninguém rola até 1985) */
function preparaNasc(o){
  if(!o||o.type!=='date'||o.dataset.tx)return; o.dataset.tx='1';
  const iso=o.value, tx=document.createElement('input');
  tx.id='c-nasc-tx'; tx.inputMode='numeric'; tx.placeholder='dd/mm/aaaa'; tx.autocomplete='bday'; tx.maxLength=10;
  tx.value=/^\d{4}-\d{2}-\d{2}$/.test(iso)?iso.slice(8)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4):'';
  const lb=o.closest('.field')&&o.closest('.field').querySelector('label'); if(lb)lb.setAttribute('for','c-nasc-tx');
  o.type='hidden'; o.after(tx);
  const valida=()=>{ const d=soDig(tx.value); tx.value=molde(d.slice(0,8),'##/##/####');
    if(d.length===8){ const dd=+d.slice(0,2), mm=+d.slice(2,4), aa=+d.slice(4), dt=new Date(aa,mm-1,dd);
      const ok=aa>1900&&dt.getFullYear()===aa&&dt.getMonth()===mm-1&&dt.getDate()===dd&&dt<=new Date();
      o.value=ok?`${aa}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`:''; tx.setCustomValidity(ok?'':'Data inválida'); tx.classList.toggle('invalido',!ok) }
    else{ o.value=''; tx.classList.remove('invalido') } };
  tx.addEventListener('input',valida); tx.addEventListener('blur',()=>{ if(tx.value&&!o.value)toast('Confira o aniversário: use dd/mm/aaaa') });
}
new MutationObserver(()=>{ const o=document.getElementById('c-nasc'); if(o&&o.type==='date')preparaNasc(o) }).observe(document.body,{childList:true,subtree:true});
