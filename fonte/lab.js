/* ══════════ LABORATÓRIO DE PRÓTESE (odontologia) ══════════
   O que foi para o laboratório, quando volta e quanto custou. Atrasado aparece no Hoje. */
const temLab=()=>area()==='odonto';
const LAB_ST={enviado:['No laboratório','ac'],voltou:['Voltou · falta instalar','war'],instalado:['Instalado','ok'],refazer:['Voltou para refazer','bad']};
const TRAB_SUG=['Coroa','Coroa sobre implante','Faceta','Prótese total','Prótese parcial removível','Provisório','Placa de bruxismo','Núcleo','Inlay / onlay','Modelo de estudo','Clareamento · moldeira'];
const labDe=cid=>(S.lab||[]).filter(l=>l.clienteId===cid);
const labAtrasado=l=>(l.status==='enviado'||l.status==='refazer')&&l.prevista&&l.prevista<hojeISO();
let labVer='abertos';
T.lab=function(el){
  const h=hojeISO(), ls=(S.lab||[]).slice(), labs=[...new Set(ls.map(l=>l.laboratorio).filter(Boolean))];
  const abertos=ls.filter(l=>l.status!=='instalado').sort((a,b)=>(labAtrasado(b)-labAtrasado(a))||(a.prevista||'9').localeCompare(b.prevista||'9'));
  const feitos=ls.filter(l=>l.status==='instalado').sort((a,b)=>(b.instalado||'').localeCompare(a.instalado||''));
  const cs=S.clientes.slice().sort((a,b)=>a.nome.localeCompare(b.nome));
  const mes=mesAtual(), gasto=ls.filter(l=>mesDe(l.enviado)===mes).reduce((a,l)=>a+num(l.valor),0);
  const linha=l=>{ const c=cli(l.clienteId), at=labAtrasado(l), st=LAB_ST[l.status];
    return `<div class="item"><div class="mn"><b>${esc(l.trabalho)} <span class="pill ${at?'bad':st[1]}">${at?'atrasado':st[0]}</span></b>
      <small>${esc(c?c.nome:'—')}${l.dente?' · dente '+esc(l.dente):''} · ${esc(l.laboratorio||'laboratório')} · foi em ${dataBR(l.enviado)}${l.prevista&&l.status!=='instalado'&&l.status!=='voltou'?` · ${at?'<b class="v-bad">':''}volta ${dataBR(l.prevista)}${at?'</b>':''}`:''}${l.status==='instalado'&&l.instalado?' · instalado em '+dataBR(l.instalado):''}${l.obs?' · '+esc(l.obs):''}</small></div>
      <div class="vr">${num(l.valor)?brl(num(l.valor)):''}</div>
      <div class="acts">${l.status==='enviado'||l.status==='refazer'?`<button class="btn sm pri" data-lab-volta="${l.id}">${ic('check',16)}Voltou</button>`:''}
        ${l.status==='voltou'?`<button class="btn sm pri" data-lab-inst="${l.id}">${ic('check',16)}Instalado</button><button class="btn sm soft" data-lab-ref="${l.id}">Refazer</button>`:''}
        ${c&&c.tel&&l.status==='voltou'?`<button class="btn sm soft" data-lab-zap="${l.id}">${ic('chat',16)}Chamar para instalar</button>`:''}
        <button class="btn sm danger ic" data-lab-x="${l.id}" aria-label="Excluir">${ic('trash',18)}</button></div></div>` };
  el.innerHTML=`<h1>Laboratório</h1><p class="sub">Trabalhos de prótese: o que foi, quando volta e quanto custou</p>
    <section class="kpis cx-k" aria-label="Resumo">
      <div class="kpi"><span class="lb">No laboratório</span><div class="kv">${abertos.filter(l=>l.status==='enviado'||l.status==='refazer').length}</div><p class="kx">${abertos.filter(labAtrasado).length} atrasado(s)</p></div>
      <div class="kpi"><span class="lb">Voltou, falta instalar</span><div class="kv">${abertos.filter(l=>l.status==='voltou').length}</div><p class="kx">chame o paciente</p></div>
      <div class="kpi"><span class="lb">Gasto este mês</span><div class="kv">${brl(gasto)}</div><p class="kx">trabalhos enviados em ${mesNome(mes)}</p></div></section>
    <div class="sec"><div class="card"><h2 style="margin-bottom:12px">Enviar trabalho</h2>
      <div class="field"><label for="lb-cli">Paciente</label><select id="lb-cli"><option value="" disabled selected hidden>Escolha o paciente</option>${cs.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select></div>
      <div class="grid2"><div class="field"><label for="lb-tr">Trabalho</label><input id="lb-tr" list="lb-trl" placeholder="ex.: Coroa"><datalist id="lb-trl">${TRAB_SUG.map(t=>`<option value="${t}">`).join('')}</datalist></div>
        <div class="field"><label for="lb-de">Dente ou região</label><input id="lb-de" placeholder="ex.: 36"></div></div>
      <div class="grid2"><div class="field"><label for="lb-lab">Laboratório</label><input id="lb-lab" list="lb-labl" value="${esc(labs[0]||'')}"><datalist id="lb-labl">${labs.map(t=>`<option value="${esc(t)}">`).join('')}</datalist></div>
        <div class="field"><label for="lb-v">Custo (R$)</label><input id="lb-v" inputmode="decimal" placeholder="0,00"></div></div>
      <div class="grid2"><div class="field"><label for="lb-env">Foi em</label><input id="lb-env" inputmode="numeric" maxlength="10" value="${dataBRano(h)}"></div>
        <div class="field"><label for="lb-prev">Volta em</label><input id="lb-prev" inputmode="numeric" maxlength="10" placeholder="dd/mm/aaaa" value="${dataBRano(somaDias(h,7))}"></div></div>
      <div class="grid2"><div class="field"><label for="lb-serv">Procedimento (para o lucro)</label><select id="lb-serv"><option value="">Nenhum</option>${S.servicos.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join('')}</select></div>
        <div class="field"><label for="lb-obs">Cor, observação</label><input id="lb-obs" placeholder="ex.: cor A2"></div></div>
      <button class="btn pri full" id="lb-add">${ic('plus')}Registrar envio</button></div></div>
    <div class="chips" role="group" aria-label="Mostrar" style="margin-top:6px"><button class="chip" data-lab-v="abertos" aria-pressed="${labVer==='abertos'}">Em andamento (${abertos.length})</button><button class="chip" data-lab-v="feitos" aria-pressed="${labVer==='feitos'}">Instalados (${feitos.length})</button></div>
    <div class="sec"><div class="card">${(labVer==='abertos'?abertos:feitos.slice(0,30)).map(linha).join('')||`<div class="vazio"><b>${labVer==='abertos'?'Nada no laboratório':'Nenhum instalado ainda'}</b><p>${labVer==='abertos'?'Registre acima quando mandar um trabalho. Se atrasar, o Lucra avisa no Hoje.':'Os trabalhos instalados aparecem aqui.'}</p></div>`}</div></div>`;
  $('#lb-serv').onchange=()=>{ const s=serv($('#lb-serv').value); if(s&&!$('#lb-tr').value)$('#lb-tr').value=s.nome };
  $('#lb-add').onclick=()=>{ const cid=$('#lb-cli').value, tr=$('#lb-tr').value.trim(); if(!cid)return toast('Escolha o paciente'); if(!tr)return toast('Diga qual é o trabalho');
    const env=dataDeBR($('#lb-env').value), prev=$('#lb-prev').value?dataDeBR($('#lb-prev').value):'';
    if(!env)return toast('Confira a data de envio: dd/mm/aaaa'); if($('#lb-prev').value&&!prev)return toast('Confira a data de volta: dd/mm/aaaa');
    if(!S.lab)S.lab=[]; S.lab.push({id:uid(),clienteId:cid,trabalho:tr,dente:$('#lb-de').value.trim(),laboratorio:$('#lb-lab').value.trim(),valor:num($('#lb-v').value),
      enviado:env,prevista:prev,servicoId:$('#lb-serv').value,obs:$('#lb-obs').value.trim(),status:'enviado'});
    labVer='abertos'; salvar(); toast('Envio registrado'); render() };
  const acha=id=>(S.lab||[]).find(l=>l.id===id);
  el.querySelectorAll('[data-lab-v]').forEach(b=>b.onclick=()=>{ labVer=b.dataset.labV; render() });
  el.querySelectorAll('[data-lab-volta]').forEach(b=>b.onclick=()=>labVoltou(acha(b.dataset.labVolta)));
  el.querySelectorAll('[data-lab-inst]').forEach(b=>b.onclick=()=>{ const l=acha(b.dataset.labInst); l.status='instalado'; l.instalado=hojeISO(); salvar(); toast('Instalado'); render() });
  el.querySelectorAll('[data-lab-ref]').forEach(b=>b.onclick=()=>{ const l=acha(b.dataset.labRef); l.status='refazer'; l.prevista=somaDias(hojeISO(),7); salvar(); toast('Voltou para o laboratório · nova data em 7 dias'); render() });
  el.querySelectorAll('[data-lab-zap]').forEach(b=>b.onclick=()=>{ const l=acha(b.dataset.labZap), c=cli(l.clienteId);
    zapAbrir(zap(c.tel,`Oi, ${c.nome.split(' ')[0]}! O seu trabalho (${l.trabalho.toLowerCase()}) já voltou do laboratório. Vamos marcar o horário para colocar?${UI.clinica?'\n\n'+UI.clinica:''}`)) });
  el.querySelectorAll('[data-lab-x]').forEach(b=>b.onclick=()=>confirmar('Excluir este trabalho?','Some da lista do laboratório. O custo lançado em Saídas continua lá.','Excluir',()=>{ S.lab=S.lab.filter(l=>l.id!==b.dataset.labX); salvar(); render(); toast('Excluído') },true));
};
MASC.push(['#lb-env,#lb-prev',v=>molde(soDig(v).slice(0,8),'##/##/####')]);
function labVoltou(l){ if(!l)return;
  const pago=!!l.despesaId||!num(l.valor);
  if(pago){ l.status='voltou'; l.voltou=hojeISO(); salvar(); toast('Voltou do laboratório'); return render() }
  abrirSheet('Voltou do laboratório',esc(l.trabalho),`<p class="conf-tx">Quer lançar o custo de <b>${brl(num(l.valor))}</b> em Saídas, com a data de hoje? Assim ele entra no lucro${l.servicoId&&serv(l.servicoId)?' de '+esc(serv(l.servicoId).nome):''}.</p>
    <div class="row" style="margin-top:16px"><button class="btn pri" id="lv-ok" style="flex:1">Lançar em Saídas</button><button class="btn soft" id="lv-no">Já paguei ou pago depois</button></div>`,
    fechar=>{ const fim=lanca=>{ if(lanca){ const d={id:uid(),data:hojeISO(),desc:'Laboratório · '+l.trabalho+(l.laboratorio?' ('+l.laboratorio+')':''),valor:num(l.valor),servicoId:l.servicoId||''}; S.despesas.push(d); l.despesaId=d.id }
        l.status='voltou'; l.voltou=hojeISO(); salvar(); fechar(); toast(lanca?'Voltou · custo lançado em Saídas':'Voltou do laboratório'); render() };
      $('#lv-ok').onclick=()=>fim(true); $('#lv-no').onclick=()=>fim(false) });
}
/* na ficha: o que está no laboratório */
function secLabFicha(cid){ if(!temLab())return ''; const ls=labDe(cid).filter(l=>l.status!=='instalado'); if(!ls.length)return '';
  return `<div class="sec"><div class="sec-top"><h2>No laboratório</h2></div><div class="card">${ls.map(l=>`<div class="item"><div class="mn"><b>${esc(l.trabalho)}${l.dente?' · '+esc(l.dente):''}</b>
    <small>${labAtrasado(l)?'<b class="v-bad">atrasado</b> · ':''}${LAB_ST[l.status][0]}${l.prevista&&l.status!=='voltou'?' · volta '+dataBR(l.prevista):''}</small></div></div>`).join('')}
    <button class="btn sm soft" id="h-lab" style="margin-top:8px">Abrir o laboratório${ic('right',16)}</button></div></div>` }
const _topoLb=topoHist, _ligaLb=ligarTopoHist;
topoHist=c=>_topoLb(c)+secLabFicha(c.id);
ligarTopoHist=function(id,fechar){ _ligaLb(id,fechar); if($('#h-lab'))$('#h-lab').onclick=()=>{ fechar(); setTimeout(()=>ir('lab'),220) } };
