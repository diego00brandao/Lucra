/* ══════════ OCUPAÇÃO DA AGENDA ══════════
   Quanto do horário de trabalho virou atendimento, onde sobram horários e quanto se perde com falta. */
const EXP_PAD={dias:[1,2,3,4,5],ini:'08:00',fim:'18:00',dur:60};
const exped=()=>Object.assign({},EXP_PAD,S.expediente||{});
const minDe=h=>{ const [a,b]=String(h||'0:0').split(':').map(Number); return a*60+(b||0) };
let ocPer='semana';
function periodoOc(){ const h=hojeISO(), ini=somaDias(h,-dowDe(h));
  if(ocPer==='passada')return [somaDias(ini,-7),somaDias(ini,-1),'Semana passada'];
  if(ocPer==='proxima')return [somaDias(ini,7),somaDias(ini,13),'Próxima semana'];
  if(ocPer==='mes'){ const [a,m]=h.split('-').map(Number), f=new Date(a,m,0).getDate(); return [`${h.slice(0,7)}-01`,`${h.slice(0,7)}-${String(f).padStart(2,'0')}`,MES_L[m-1][0].toUpperCase()+MES_L[m-1].slice(1)] }
  return [ini,somaDias(ini,6),'Esta semana'];
}
function calcOcupacao(de,ate){
  const e=exped(), porDia=Math.max(0,Math.floor((minDe(e.fim)-minDe(e.ini))/Math.max(15,num(e.dur)||60)));
  const r={cap:0,ocup:0,falta:0,feito:0,dow:Array.from({length:7},()=>({cap:0,ocup:0})),faixa:{manha:0,tarde:0,noite:0},dias:[]};
  for(let d=de;d<=ate;d=somaDias(d,1)){ const w=dowDe(d), trab=e.dias.includes(w);
    const ags=S.agenda.filter(a=>a.data===d&&['marcado','concluido','faltou'].includes(a.status));
    const cap=trab?porDia:0, oc=ags.length;
    r.cap+=cap; r.ocup+=Math.min(oc,cap||oc); r.falta+=ags.filter(a=>a.status==='faltou').length; r.feito+=ags.filter(a=>a.status==='concluido').length;
    r.dow[w].cap+=cap; r.dow[w].ocup+=oc;
    ags.forEach(a=>{ const m=minDe(a.hora); r.faixa[m<12*60?'manha':m<18*60?'tarde':'noite']++ });
    if(trab)r.dias.push({d,cap,oc,vagos:Math.max(0,cap-oc)});
  }
  r.taxa=r.cap?Math.min(100,r.ocup/r.cap*100):0; r.vagos=Math.max(0,r.cap-r.ocup); r.taxaFalta=(r.feito+r.falta)?r.falta/(r.feito+r.falta)*100:0;
  return r;
}
T.ocupacao=function(el){
  const e=exped(), [de,ate,nome]=periodoOc(), r=calcOcupacao(de,ate), h=hojeISO();
  const preco=S.servicos.length?S.servicos.reduce((a,s)=>a+num(s.preco),0)/S.servicos.length:0;
  const barra=(p,cl)=>`<span class="oc-b"><i class="${cl||''}" style="width:${Math.max(0,Math.min(100,p)).toFixed(0)}%"></i></span>`;
  const DOWC=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const futuros=r.dias.filter(x=>x.d>=h&&x.vagos>0);
  el.innerHTML=`<h1>Ocupação da agenda</h1><p class="sub">Quanto do seu horário de trabalho virou atendimento</p>
    <div class="chips" role="group" aria-label="Período" style="margin-top:12px">${[['passada','Semana passada'],['semana','Esta semana'],['proxima','Próxima semana'],['mes','Este mês']].map(([k,n])=>`<button class="chip" data-oc="${k}" aria-pressed="${ocPer===k}">${n}</button>`).join('')}</div>
    <section class="kpis cx-k" aria-label="Resumo">
      <div class="kpi dest"><span class="lb">Agenda ocupada · ${nome.toLowerCase()}</span><div class="kv">${r.taxa.toFixed(0)}%</div>${barra(r.taxa)}
        <p class="kx">${r.ocup} de ${r.cap} horários (${dataBR(de)} a ${dataBR(ate)})</p></div>
      <div class="kpi"><span class="lb">Horários vagos</span><div class="kv">${r.vagos}</div><p class="kx">${preco&&r.vagos?'até '+brl(r.vagos*preco)+' a mais':'com o expediente abaixo'}</p></div>
      <div class="kpi"><span class="lb">Faltas</span><div class="kv ${r.taxaFalta>15?'v-bad':''}">${r.taxaFalta.toFixed(0)}%</div><p class="kx">${r.falta} de ${r.feito+r.falta} que já passaram</p></div></section>
    <div class="sec"><div class="sec-top"><h2>Por dia da semana</h2></div><div class="card">${[1,2,3,4,5,6,0].filter(w=>e.dias.includes(w)||r.dow[w].ocup).map(w=>{ const x=r.dow[w], p=x.cap?x.ocup/x.cap*100:0;
      return `<div class="oc-l"><span>${DOWC[w]}</span>${barra(p,p>=85?'ok':p<40?'war':'')}<b>${x.cap?p.toFixed(0)+'%':x.ocup+' fora do expediente'}</b></div>` }).join('')}
      <p class="sub" style="margin-top:8px">Dias com barra laranja têm muito horário livre: bons para promoção ou para chamar quem está na hora de voltar.</p></div></div>
    <div class="sec"><div class="sec-top"><h2>Por período do dia</h2></div><div class="card">${[['manha','Manhã'],['tarde','Tarde'],['noite','Noite']].map(([k,n])=>{ const t=r.faixa.manha+r.faixa.tarde+r.faixa.noite, p=t?r.faixa[k]/t*100:0;
      return `<div class="oc-l"><span>${n}</span>${barra(p)}<b>${r.faixa[k]}</b></div>` }).join('')}</div></div>
    ${futuros.length?`<div class="sec"><div class="sec-top"><h2>Dias com horário livre</h2></div><div class="card">${futuros.slice(0,7).map(x=>`<div class="item"><div class="mn"><b>${DOW_L[dowDe(x.d)]}, ${dataBR(x.d)}</b><small>${x.oc} marcado(s) · ${x.vagos} ${x.vagos>1?'horários livres':'horário livre'}</small></div>
      <div class="acts"><button class="btn sm soft" data-oc-ag="${x.d}">${ic('calendar',16)}Ver o dia</button></div></div>`).join('')}</div></div>`:''}
    <div class="sec"><div class="card"><h2 style="margin-bottom:4px">Seu horário de trabalho</h2><p class="sub" style="margin-bottom:12px">É a base da conta. Ajuste para o seu expediente de verdade.</p>
      <div class="chips" role="group" aria-label="Dias de trabalho">${[1,2,3,4,5,6,0].map(w=>`<button class="chip" data-oc-d="${w}" aria-pressed="${e.dias.includes(w)}">${DOWC[w]}</button>`).join('')}</div>
      <div class="grid3" style="margin-top:10px"><div class="field"><label for="oc-i">Começa</label><select id="oc-i">${Array.from({length:17},(_,i)=>String(i+5).padStart(2,'0')+':00').map(t=>`<option ${t===e.ini?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="oc-f">Termina</label><select id="oc-f">${Array.from({length:17},(_,i)=>String(i+8).padStart(2,'0')+':00').map(t=>`<option ${t===e.fim?'selected':''}>${t}</option>`).join('')}</select></div>
        <div class="field"><label for="oc-dur">Cada horário</label><select id="oc-dur">${[30,40,45,50,60,90].map(m=>`<option value="${m}" ${m===num(e.dur)?'selected':''}>${m} min</option>`).join('')}</select></div></div></div></div>`;
  const guarda=()=>{ S.expediente=exped(); S.expediente.ini=$('#oc-i').value; S.expediente.fim=$('#oc-f').value; S.expediente.dur=+$('#oc-dur').value; salvar(); render() };
  el.querySelectorAll('[data-oc]').forEach(b=>b.onclick=()=>{ ocPer=b.dataset.oc; render() });
  el.querySelectorAll('[data-oc-d]').forEach(b=>b.onclick=()=>{ const w=+b.dataset.ocD, x=exped(); x.dias=x.dias.includes(w)?x.dias.filter(z=>z!==w):x.dias.concat(w); S.expediente=x; salvar(); render() });
  ['#oc-i','#oc-f','#oc-dur'].forEach(q=>$(q).onchange=guarda);
  el.querySelectorAll('[data-oc-ag]').forEach(b=>b.onclick=()=>{ agDia=b.dataset.ocAg; ir('agenda') });
};

/* ══════════ VALIDADE NO ESTOQUE ══════════ */
function dataDeBR(t){ const d=soDig(t); if(d.length!==8)return ''; const dd=+d.slice(0,2), mm=+d.slice(2,4), aa=+d.slice(4), x=new Date(aa,mm-1,dd);
  return aa>1999&&x.getDate()===dd&&x.getMonth()===mm-1?`${aa}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`:'' }
const dataBRano=iso=>iso?iso.slice(8)+'/'+iso.slice(5,7)+'/'+iso.slice(0,4):'';
const diasParaVencer=p=>p.validade?diasEntre(hojeISO(),p.validade):null;
function pillValidade(p){ const d=diasParaVencer(p); if(d==null)return '';
  if(d<0)return `<span class="pill bad">venceu em ${dataBRano(p.validade)}</span> `;
  if(d<=30)return `<span class="pill war">vence em ${dataBRano(p.validade)}</span> `;
  return `validade ${dataBRano(p.validade)} · ` }
const vencendo=()=>modOn('estoque')?S.produtos.filter(p=>{ const d=diasParaVencer(p); return d!=null&&d<=30 }):[];
MASC.push(['#pr-val,#pc-val',v=>molde(soDig(v).slice(0,8),'##/##/####')]);
