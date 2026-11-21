/* ══════════ ORÇAMENTOS: o funil de quem ainda não fechou ══════════
   Orçamento enviado → em conversa → fechou ou não fechou (com o motivo).
   O Hoje lembra de chamar quem recebeu o orçamento e sumiu. */
const temFunil=()=>area()!=='psico';
const MOTIVOS=['Achou caro','Sumiu, não respondeu','Fechou com outro lugar','Não era o momento','Outro motivo'];
const etapaOrc=o=>o.status==='fechado'?'fechado':o.status==='perdido'?'perdido':(o.etapa||'enviado');
const ultimoContato=o=>(o.contatos||[]).slice(-1)[0]||o.data;
const orcParaChamar=()=>temFunil()?(S.orcamentos||[]).filter(o=>{ const e=etapaOrc(o); return (e==='enviado'||e==='conversa')&&o.clienteId&&diasEntre(ultimoContato(o),hojeISO())>=3 }):[];
let funVer='abertos';
T.orcamentos=function(el){
  const h=hojeISO(), os=(S.orcamentos||[]).slice().sort((a,b)=>b.data.localeCompare(a.data)), d90=somaDias(h,-90);
  const rec=os.filter(o=>o.data>=d90), fech=rec.filter(o=>etapaOrc(o)==='fechado'), perd=rec.filter(o=>etapaOrc(o)==='perdido');
  const abertos=os.filter(o=>['enviado','conversa'].includes(etapaOrc(o)));
  const decid=fech.length+perd.length, taxa=decid?fech.length/decid*100:0, tot=o=>calcOrc(o).total;
  const chamar=new Set(orcParaChamar().map(o=>o.id));
  const motivos={}; perd.forEach(o=>{ const m=o.motivo||'Outro motivo'; motivos[m]=(motivos[m]||0)+1 });
  const linha=o=>{ const c=cli(o.clienteId), e=etapaOrc(o), dc=diasEntre(ultimoContato(o),h);
    return `<div class="item"><div class="mn"><b>${esc(c?c.nome:'Sem cadastro')} ${e==='conversa'?'<span class="pill ac">em conversa</span>':e==='fechado'?'<span class="pill ok">fechou</span>':e==='perdido'?`<span class="pill">${esc(o.motivo||'não fechou')}</span>`:''}${chamar.has(o.id)?' <span class="pill war">chamar</span>':''}</b>
      <small>${dataBR(o.data)} · ${o.itens.map(i=>{ const s=serv(i.servicoId); return esc(s?s.nome:'procedimento') }).join(', ')}${(e==='enviado'||e==='conversa')?` · ${(o.contatos||[]).length?'último contato há '+dc+(dc===1?' dia':' dias'):'enviado há '+dc+(dc===1?' dia':' dias')}`:''}</small></div>
      <div class="vr">${brl(tot(o))}</div>
      ${e==='enviado'||e==='conversa'?`<div class="acts">${c&&c.tel?`<button class="btn sm soft" data-fu-zap="${o.id}">${ic('chat',16)}Chamar</button>`:''}
        ${e==='enviado'?`<button class="btn sm soft" data-fu-conv="${o.id}">Respondeu</button>`:''}
        <button class="btn sm pri" data-fu-ok="${o.id}">${ic('check',16)}Fechou</button><button class="btn sm soft" data-fu-no="${o.id}">Não fechou</button></div>`:''}</div>` };
  const lista=funVer==='abertos'?abertos.sort((a,b)=>(chamar.has(b.id)-chamar.has(a.id))||a.data.localeCompare(b.data)):funVer==='fechados'?os.filter(o=>etapaOrc(o)==='fechado'):os.filter(o=>etapaOrc(o)==='perdido');
  el.innerHTML=`<h1>Orçamentos</h1><p class="sub">Quem recebeu um orçamento e ainda não fechou</p>
    <section class="kpis cx-k" aria-label="Resumo">
      <div class="kpi dest"><span class="lb">Em aberto</span><div class="kv">${brl(abertos.reduce((a,o)=>a+tot(o),0))}</div><p class="kx">${abertos.length} orçamento(s) · ${chamar.size} para chamar</p></div>
      <div class="kpi"><span class="lb">Fecham (90 dias)</span><div class="kv">${decid?taxa.toFixed(0)+'%':'—'}</div><p class="kx">${fech.length} de ${decid} que já tiveram resposta</p></div>
      <div class="kpi"><span class="lb">Fechado (90 dias)</span><div class="kv">${brl(fech.reduce((a,o)=>a+tot(o),0))}</div><p class="kx">${perd.length} não fecharam</p></div></section>
    ${Object.keys(motivos).length?`<div class="sec"><div class="sec-top"><h2>Por que não fecharam</h2></div><div class="card">${Object.entries(motivos).sort((a,b)=>b[1]-a[1]).map(([m,n])=>`<div class="oc-l"><span>${esc(m)}</span><span class="oc-b"><i style="width:${(n/perd.length*100).toFixed(0)}%"></i></span><b>${n}</b></div>`).join('')}</div></div>`:''}
    <div class="row" style="margin-top:10px;gap:8px;align-items:center;flex-wrap:wrap"><div class="chips" role="group" aria-label="Mostrar">${[['abertos','Em aberto ('+abertos.length+')'],['fechados','Fecharam'],['perdidos','Não fecharam']].map(([k,n])=>`<button class="chip" data-fu-v="${k}" aria-pressed="${funVer===k}">${n}</button>`).join('')}</div>
      <button class="btn sm pri" id="fu-novo" style="margin-left:auto">${ic('plus',16)}Novo orçamento</button></div>
    <div class="sec"><div class="card">${lista.map(linha).join('')||`<div class="vazio"><b>${funVer==='abertos'?'Nenhum orçamento em aberto':'Nada aqui ainda'}</b><p>${funVer==='abertos'?'Monte um orçamento no Simulador e salve. Ele aparece aqui até a pessoa responder.':'Quando você marcar Fechou ou Não fechou, o orçamento vem para cá.'}</p></div>`}</div></div>`;
  const acha=id=>S.orcamentos.find(o=>o.id===id);
  el.querySelectorAll('[data-fu-v]').forEach(b=>b.onclick=()=>{ funVer=b.dataset.fuV; render() });
  $('#fu-novo').onclick=()=>{ simAba='orc'; ir('sim') };
  el.querySelectorAll('[data-fu-zap]').forEach(b=>b.onclick=()=>{ const o=acha(b.dataset.fuZap), c=cli(o.clienteId);
    o.contatos=(o.contatos||[]).concat(h); salvar();
    zapAbrir(zap(c.tel,`Oi, ${c.nome.split(' ')[0]}! Tudo bem? Passando para saber se ficou alguma dúvida sobre o orçamento que te enviei (${o.itens.map(i=>{ const s=serv(i.servicoId); return s?s.nome:'' }).filter(Boolean).join(', ')}). Se quiser, já posso ver um horário para você.`)); render() });
  el.querySelectorAll('[data-fu-conv]').forEach(b=>b.onclick=()=>{ const o=acha(b.dataset.fuConv); o.etapa='conversa'; o.contatos=(o.contatos||[]).concat(h); salvar(); render() });
  el.querySelectorAll('[data-fu-no]').forEach(b=>b.onclick=()=>{ const o=acha(b.dataset.fuNo);
    abrirSheet('Não fechou','Por quê? Ajuda a entender onde você perde paciente.',`<div class="grupo-f">${MOTIVOS.map(m=>`<button class="btn soft" data-mo="${esc(m)}">${esc(m)}</button>`).join('')}</div>`,fechar=>{
      document.querySelectorAll('[data-mo]').forEach(x=>x.onclick=()=>{ o.status='perdido'; o.motivo=x.dataset.mo; o.decidido=h; salvar(); fechar(); toast('Anotado'); render() }) }) });
  el.querySelectorAll('[data-fu-ok]').forEach(b=>b.onclick=()=>fechouOrc(acha(b.dataset.fuOk)));
};
function fechouOrc(o){ const t=calcOrc(o), c=cli(o.clienteId);
  const lanca=()=>{ o.itens.forEach(i=>{ if(!serv(i.servicoId))return;
      S.vendas.push({id:uid(),data:hojeISO(),servicoId:i.servicoId,valor:Math.round(num(i.valor)*t.f*100)/100,forma:o.forma,parcelas:o.forma==='parc'?o.parcelas:1,sessoes:i.sessoes,usadas:[],desloc:0,clienteId:o.clienteId||'',cliente:c?c.nome:''}) });
    o.status='fechado'; o.decidido=hojeISO(); mesSel=mesAtual(); salvar(); toast('Lançado no caixa'); render() };
  if(!temPlano()||!o.clienteId)return confirmar('Fechou!',`Isso lança <b>${brl(t.total)}</b> no caixa com a data de hoje.`,'Lançar no caixa',lanca);
  abrirSheet('Fechou!',`${esc(c?c.nome:'')} · ${brl(t.total)}`,`<p class="conf-tx">Como você quer seguir?</p>
    <div style="display:grid;gap:8px;margin-top:14px"><button class="btn pri full" id="fo-pl">${ic('file')}Virar plano de tratamento</button>
      <small class="sub" style="text-align:center">As etapas ficam na ficha e dá para parcelar. O dinheiro entra quando for pago.</small>
      <button class="btn soft full" id="fo-cx">${ic('coins')}Já pagou tudo · lançar no caixa</button></div>`,fechar=>{
    $('#fo-cx').onclick=()=>{ fechar(); lanca() };
    $('#fo-pl').onclick=()=>{ const ets=[]; o.itens.forEach(i=>{ const s=serv(i.servicoId), n=Math.max(1,parseInt(i.sessoes)||1); for(let k=0;k<n;k++)ets.push(etapaDe(s,'',num(i.valor)*t.f/n)) });
      const p=novoPlano(o.clienteId,ets); p.orcId=o.id; o.status='fechado'; o.decidido=hojeISO(); salvar(); fechar(); render(); setTimeout(()=>abrePlano(p.id),260) } });
}
