/* ══════════ EXTRAS ══════════
   Confirmação por WhatsApp · aniversariantes · contas a pagar · ranking de clientes ·
   orçamento com lucro previsto · equipe e repasse · estoque · fotos de antes e depois.
   Nada aqui mexe em conta(), resumo(), reservas(), retornos() ou usarSessao(). */
const qtdBR=n=>num(n).toLocaleString('pt-BR',{maximumFractionDigits:2});

/* ── 1 · confirmar horário pelo WhatsApp ── */
function btnConf(a){
  const c=cli(a.clienteId), s=serv(a.servicoId); if(!c||!c.tel||a.data<hojeISO())return '';
  const d=diasEntre(hojeISO(),a.data), quando=d===0?'hoje':d===1?'amanhã':`${diaSemana(a.data)}, dia ${dataBR(a.data)}`;
  const msg=`Oi, ${c.nome.split(' ')[0]}! Passando para confirmar o seu horário${s?' de '+s.nome:''} ${quando}${a.hora?' às '+a.hora:''}. Posso confirmar?`;
  return `<a class="btn sm soft" data-conf-a="${a.id}" href="${zap(c.tel,msg)}" target="_blank" rel="noopener">${ic('chat',16)}Confirmar</a>`;
}
function ligarConf(){
  document.querySelectorAll('[data-conf-a]').forEach(b=>b.addEventListener('click',()=>{
    const a=S.agenda.find(z=>z.id===b.dataset.confA); if(!a)return;
    a.avisado=true; salvar(); setTimeout(render,600) }));
}

/* ── 2 · aniversariantes do mês (usa o campo de aniversário do cadastro) ── */
function secNiver(){
  const h=hojeISO(), mm=h.slice(5,7), dd=h.slice(8,10);
  const ns=S.clientes.filter(c=>c.nasc&&String(c.nasc).slice(5,7)===mm)
    .sort((a,b)=>a.nasc.slice(8,10).localeCompare(b.nasc.slice(8,10)));
  if(!ns.length)return '';
  let x=`<div class="sec" data-pn="dir"><div class="sec-top"><h2>Aniversariantes de ${MESES[+mm-1]}</h2><span class="pill">${ns.length}</span></div><div class="card">`;
  ns.forEach(c=>{ const d=c.nasc.slice(8,10), eh=d===dd, passou=d<dd;
    const l=zap(c.tel,`Oi, ${c.nome.split(' ')[0]}! ${eh?'Hoje é o seu dia':'Este é o seu mês'}: feliz aniversário! Preparei um mimo especial para você comemorar aqui. Quer que eu reserve um horário?`);
    x+=`<div class="item" ${passou?'style="opacity:.62"':''}><div class="mn"><b>${esc(c.nome)} ${eh?'<span class="pill ok">é hoje</span>':''}</b>
      <small>dia ${d}/${mm}${passou?' · já passou':''}</small></div>
      <div class="acts">${l?`<a class="btn sm soft" href="${l}" target="_blank" rel="noopener">${ic('chat',16)}Dar parabéns</a>`:'<span class="pill">sem telefone</span>'}</div></div>` });
  return x+`</div></div>`;
}

/* ── 3 · contas a pagar: só viram saída (e entram na conta do mês) quando são pagas ── */
function proxMes(iso){ const [a,m,d]=iso.split('-').map(Number); const u=new Date(a,m+1,0).getDate(); const n=new Date(a,m,Math.min(d,u));
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}` }
function estadoConta(c){ const d=diasEntre(hojeISO(),c.venc);
  return d<0?['bad',`venceu há ${-d} dia(s)`]:d===0?['war','vence hoje']:d<=7?['war',`vence em ${d} dia(s)`]:['',`vence em ${dataBR(c.venc)}`] }
function contasDaSemana(){ return S.contas.filter(c=>diasEntre(hojeISO(),c.venc)<=7) }
function secContas(){
  const cs=S.contas.slice().sort((a,b)=>a.venc.localeCompare(b.venc)), tot=cs.reduce((a,c)=>a+num(c.valor),0);
  let x=`<div class="sec"><div class="sec-top"><h2>Contas a pagar</h2>${cs.length?`<span class="pill war">${brl(tot)} em aberto</span>`:''}</div><div class="card">`;
  if(!cs.length)x+=`<div class="vazio"><b>Nenhuma conta agendada</b><p>Anote o que ainda vai vencer: aluguel, boleto de fornecedor, parcela de equipamento. O Painel avisa na semana do vencimento e, quando você paga, o valor entra nas saídas do mês.</p></div>`;
  else cs.forEach(c=>{ const e=estadoConta(c), s=serv(c.servicoId);
    x+=`<div class="item"><div class="mn"><b>${esc(c.desc||'Conta')} <span class="pill ${e[0]}">${e[1]}</span></b>
      <small>${dataBR(c.venc)}${c.rep?' · repete todo mês':''}${s?' · produto de '+esc(s.nome):''}</small></div>
      <div class="vr">${brl(num(c.valor))}</div>
      <div class="acts"><button class="btn sm pri" data-ct-pg="${c.id}">${ic('check',16)}Paguei</button>
        <button class="btn sm danger ic" data-ct-del="${c.id}" aria-label="Excluir">${ic('trash',18)}</button></div></div>` });
  x+=`<details class="dobra" ${cs.length?'':'open'}><summary class="btn soft full">${ic('plus')}Agendar uma conta</summary>
    <div class="grid2" style="margin-top:14px">
      <div class="field"><label>Descrição</label><input id="ct-desc" placeholder="aluguel, boleto, parcela..."></div>
      <div class="field"><label>Valor</label><input id="ct-valor" inputmode="decimal" placeholder="0,00"></div></div>
    <div class="grid2">
      <div class="field"><label>Vencimento</label><input id="ct-venc" type="date" value="${hojeISO()}"></div>
      <div class="field"><label>É produto de qual serviço?</label><select id="ct-serv"><option value="">Não é produto (despesa geral)</option>
        ${S.servicos.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join('')}</select></div></div>
    <div class="ck-l"><label class="sw"><input type="checkbox" id="ct-rep"> <span>Repete todo mês</span></label></div>
    <button class="btn pri full" id="ct-add" style="margin-top:10px">${ic('plus')}Agendar conta</button>
  </details></div></div>`;
  return x;
}
function ligarContas(){
  if(!$('#ct-add'))return;
  $('#ct-add').onclick=()=>{
    const v=num($('#ct-valor').value); if(v<=0)return toast('Informe o valor da conta');
    S.contas.push({id:uid(),desc:$('#ct-desc').value.trim(),valor:v,venc:$('#ct-venc').value||hojeISO(),
      servicoId:$('#ct-serv').value||'',rep:$('#ct-rep').checked});
    salvar(); toast('Conta agendada'); render() };
  document.querySelectorAll('[data-ct-pg]').forEach(b=>b.onclick=()=>{
    const c=S.contas.find(z=>z.id===b.dataset.ctPg); if(!c)return;
    S.despesas.push({id:uid(),data:hojeISO(),desc:c.desc||'Conta',valor:num(c.valor),servicoId:c.servicoId||''});
    if(c.rep)c.venc=proxMes(c.venc); else S.contas=S.contas.filter(z=>z.id!==c.id);
    mesSel=mesAtual(); salvar(); toast(c.rep?'Pago · próxima em '+dataBR(c.venc):'Pago · lançado nas saídas'); render() });
  document.querySelectorAll('[data-ct-del]').forEach(b=>b.onclick=()=>{ const id=b.dataset.ctDel;
    confirmar('Excluir esta conta?','Ela sai da lista de contas a pagar. Nada é lançado nas saídas.','Excluir',
      ()=>{ S.contas=S.contas.filter(z=>z.id!==id); salvar(); render(); toast('Conta excluída') },true) });
}

/* ── 4 · ranking e frequência de clientes ── */
let ordCli='lucro', sumidoDias=60;
const ORD_CLI={ lucro:(a,b)=>b.lucro-a.lucro, total:(a,b)=>b.total-a.total,
  sumidos:(a,b)=>a.ult.localeCompare(b.ult), nome:(a,b)=>a.c.nome.localeCompare(b.c.nome) };
const filtroCli=i=>ordCli!=='sumidos'||(!!i.ult&&diasEntre(i.ult,hojeISO())>=sumidoDias);
function chipsCli(){
  const o=[['lucro','Mais lucro'],['total','Mais faturamento'],['sumidos','Sumidos'],['nome','A–Z']];
  return `<div class="chips" role="group" aria-label="Ordenar clientes" style="margin-top:10px">${o.map(z=>
    `<button class="chip" data-ord-c="${z[0]}" aria-pressed="${ordCli===z[0]}">${z[1]}</button>`).join('')}</div>
    ${ordCli==='sumidos'?`<div class="field" style="margin:10px 0 0"><label>Sem aparecer há pelo menos</label>
      <select id="c-sumido">${[30,45,60,90,120,180].map(n=>`<option value="${n}" ${n===sumidoDias?'selected':''}>${n} dias</option>`).join('')}</select></div>`:''}`;
}
function ligarChipsCli(){
  document.querySelectorAll('[data-ord-c]').forEach(b=>b.onclick=()=>{ordCli=b.dataset.ordC;render()});
  const s=$('#c-sumido'); if(s)s.onchange=()=>{sumidoDias=parseInt(s.value)||60;render()};
}
function rankCli(i,lista){ if((ordCli!=='lucro'&&ordCli!=='total')||buscaCli.trim()||!i.qtd)return '';
  const p=lista.indexOf(i); return p>=0&&p<3?`<span class="rank">${p+1}º</span>`:'' }
const msgCli=c=>ordCli==='sumidos'
  ?`Oi, ${c.nome.split(' ')[0]}! Faz um tempinho que você não aparece por aqui. Quer que eu veja um horário para você esta semana?`
  :`Oi, ${c.nome.split(' ')[0]}! Tudo bem?`;

/* ── 5 · orçamento com lucro previsto ── */
let simAba='formas';
let orc={clienteId:'',itens:[],desc:'',forma:'pix',parcelas:2};
document.addEventListener('click',e=>{ const b=e.target.closest&&e.target.closest('[data-sim-aba]');
  if(b){ simAba=b.dataset.simAba; render() } });
function abasSim(){ return `<div class="abas" role="group" aria-label="Tipo de simulação">
  <button data-sim-aba="formas" aria-pressed="${simAba!=='orc'}">Formas de pagamento</button>
  <button data-sim-aba="orc" aria-pressed="${simAba==='orc'}">Orçamento</button></div>` }
function calcOrc(o){
  const bruto=o.itens.reduce((a,i)=>a+num(i.valor),0), desc=Math.min(Math.max(0,num(o.desc)),bruto), f=bruto?(bruto-desc)/bruto:0;
  const t={bruto,desc,f,total:bruto-desc,taxa:0,custo:0,comissao:0,imposto:0,lucro:0};
  o.itens.forEach(i=>{ const k=conta({servicoId:i.servicoId,valor:num(i.valor)*f,forma:o.forma,parcelas:o.parcelas,sessoes:i.sessoes});
    t.taxa+=k.taxa; t.custo+=k.custo; t.comissao+=k.comissao; t.imposto+=k.imposto; t.lucro+=k.lucro });
  t.margem=t.total?t.lucro/t.total*100:0; return t;
}
function textoOrc(o){
  const c=cli(o.clienteId), t=calcOrc(o), fn=(FORMAS.find(f=>f.k===o.forma)||{}).n||'';
  let m=`Oi${c?', '+c.nome.split(' ')[0]:''}! Segue o seu orçamento${UI.clinica?' · '+UI.clinica:''}:\n\n`;
  o.itens.forEach(i=>{ const s=serv(i.servicoId); m+=`• ${s?s.nome:'Procedimento'}${i.sessoes>1?` (${i.sessoes} sessões)`:''}: ${brl(num(i.valor))}\n` });
  if(t.desc)m+=`Desconto: ${brl(-t.desc)}\n`;
  m+=`\nTotal: ${brl(t.total)}`;
  m+=o.forma==='parc'?` em ${o.parcelas}x de ${brl(t.total/o.parcelas)}`:` no ${fn.toLowerCase()}`;
  return m+`\n\nQualquer dúvida, é só me chamar.`;
}
function telaOrc(el,x){
  const cs=S.clientes.slice().sort((a,b)=>a.nome.localeCompare(b.nome));
  x+=`<div class="sec"><div class="card">
    <h2 style="margin-bottom:12px">Montar orçamento</h2>
    <div class="field"><label>Cliente</label><select id="o-cli"><option value="">Sem cadastro</option>
      ${cs.map(c=>`<option value="${c.id}" ${orc.clienteId===c.id?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></div>
    <div class="grid2">
      <div class="field"><label>Procedimento</label><select id="o-serv">${S.servicos.map(s=>`<option value="${s.id}">${esc(s.nome)} · ${brl(s.preco)}</option>`).join('')}</select></div>
      <div class="field"><label>Sessões</label><select id="o-sess">${Array.from({length:12},(_,i)=>i+1).map(n=>`<option value="${n}">${n===1?'Sessão avulsa':n+' sessões'}</option>`).join('')}</select></div>
    </div>
    <button class="btn soft full" id="o-add">${ic('plus')}Adicionar ao orçamento</button>`;
  if(orc.itens.length){
    x+=`<div style="margin-top:8px">`;
    orc.itens.forEach((i,n)=>{ const s=serv(i.servicoId);
      x+=`<div class="item"><div class="mn"><b>${esc(s?s.nome:'Serviço removido')}</b><small>${i.sessoes>1?i.sessoes+' sessões':'sessão avulsa'}</small></div>
        <div class="acts" style="flex-wrap:nowrap"><input data-o-val="${n}" inputmode="decimal" aria-label="Valor de ${esc(s?s.nome:'item')}" value="${String(i.valor).replace('.',',')}" style="width:120px;flex:1">
          <button class="btn sm danger ic" data-o-del="${n}" aria-label="Tirar do orçamento">${ic('trash',18)}</button></div></div>` });
    x+=`</div><div class="grid3" style="margin-top:8px">
      <div class="field"><label>Desconto (R$)</label><input id="o-desc" inputmode="decimal" placeholder="0,00" value="${esc(orc.desc)}"></div>
      <div class="field"><label>Pagamento</label><select id="o-forma">${FORMAS.map(f=>`<option value="${f.k}" ${orc.forma===f.k?'selected':''}>${f.n}</option>`).join('')}</select></div>
      <div class="field" id="o-boxparc" style="display:${orc.forma==='parc'?'':'none'}"><label>Parcelas</label>
        <select id="o-parc">${Array.from({length:11},(_,i)=>i+2).map(n=>`<option value="${n}" ${orc.parcelas===n?'selected':''}>${n}x</option>`).join('')}</select></div>
    </div>
    <div id="o-res"></div>
    <div class="row" style="margin-top:12px">
      <a class="btn pri" id="o-zap" style="flex:1" target="_blank" rel="noopener" href="#">${ic('chat')}Enviar no WhatsApp</a>
      <button class="btn soft" id="o-salva">${ic('check')}Salvar</button></div>`;
  }else x+=`<p class="sub" style="margin-top:12px">Junte os procedimentos que a cliente quer. Antes de enviar o preço, você vê quanto sobra para você depois da maquininha, do produto, da comissão e do imposto. Ela só recebe os valores.</p>`;
  x+=`</div></div>`;

  const sv=S.orcamentos.slice().sort((a,b)=>b.data.localeCompare(a.data));
  if(sv.length){
    x+=`<div class="sec"><div class="sec-top"><h2>Orçamentos salvos</h2><span class="pill">${sv.length}</span></div><div class="card">`;
    sv.forEach(o=>{ const t=calcOrc(o), c=cli(o.clienteId), ab=o.status!=='fechado'&&o.status!=='perdido';
      x+=`<div class="item" ${ab?'':'style="opacity:.62"'}><div class="mn"><b>${esc(c?c.nome:'Sem cadastro')} ${ab?'':o.status==='perdido'?'<span class="pill">não fechou</span>':'<span class="pill ok">fechado</span>'}</b>
        <small>${dataBR(o.data)} · ${o.itens.map(i=>{const s=serv(i.servicoId);return esc(s?s.nome:'serviço removido')+(i.sessoes>1?' ×'+i.sessoes:'')}).join(', ')}</small></div>
        <div class="vr">${brl(t.total)}<small class="${t.lucro>=0?'v-ok':'v-bad'}">sobra ${brl(t.lucro)}</small></div>
        <div class="acts">${ab?`<button class="btn sm pri" data-o-fecha="${o.id}">${ic('check',16)}Fechou</button>
          <a class="btn sm soft" href="${c&&c.tel?zap(c.tel,textoOrc(o)):'https://wa.me/?text='+encodeURIComponent(textoOrc(o))}" target="_blank" rel="noopener">${ic('chat',16)}Reenviar</a>`:''}
          <button class="btn sm danger ic" data-o-apaga="${o.id}" aria-label="Excluir">${ic('trash',18)}</button></div></div>` });
    x+=`</div></div>`;
  }
  el.innerHTML=x;

  const pinta=()=>{ const r=$('#o-res'); if(!r)return; const t=calcOrc(orc), c=cli(orc.clienteId);
    r.innerHTML=`<div class="orc-res"><div><span class="eyebrow">A cliente paga</span><b>${brl(t.total)}</b>
        <small>${orc.forma==='parc'?`${orc.parcelas}x de ${brl(t.total/orc.parcelas)}`:(FORMAS.find(f=>f.k===orc.forma)||{}).n}</small></div>
      <div><span class="eyebrow">Sobra para você</span><b class="${t.lucro>=0?'v-ok':'v-bad'}">${brl(t.lucro)}</b><small>margem de ${pct(t.margem)}</small></div></div>
      <div class="nota" style="margin-top:10px">Maquininha <b>${brl(t.taxa)}</b>, produto <b>${brl(t.custo)}</b>${t.comissao?`, comissão <b>${brl(t.comissao)}</b>`:''}${t.imposto?`, imposto <b>${brl(t.imposto)}</b>`:''}${t.desc?`, desconto <b>${brl(t.desc)}</b>`:''}.
        ${t.lucro<0?'<b class="v-bad">Neste preço você paga para atender.</b>':''}</div>`;
    $('#o-zap').href=c&&c.tel?zap(c.tel,textoOrc(orc)):'https://wa.me/?text='+encodeURIComponent(textoOrc(orc)) };
  $('#o-cli').onchange=()=>{orc.clienteId=$('#o-cli').value;pinta()};
  $('#o-add').onclick=()=>{ const s=serv($('#o-serv').value); if(!s)return; const n=parseInt($('#o-sess').value)||1;
    orc.itens.push({servicoId:s.id,sessoes:n,valor:s.preco*n}); render() };
  document.querySelectorAll('[data-o-val]').forEach(i=>i.addEventListener('input',()=>{orc.itens[+i.dataset.oVal].valor=num(i.value);pinta()}));
  document.querySelectorAll('[data-o-del]').forEach(b=>b.onclick=()=>{orc.itens.splice(+b.dataset.oDel,1);render()});
  if($('#o-desc')){
    $('#o-desc').addEventListener('input',()=>{orc.desc=$('#o-desc').value;pinta()});
    $('#o-forma').onchange=()=>{orc.forma=$('#o-forma').value;$('#o-boxparc').style.display=orc.forma==='parc'?'':'none';pinta()};
    $('#o-parc').onchange=()=>{orc.parcelas=parseInt($('#o-parc').value)||2;pinta()};
    $('#o-salva').onclick=()=>{ if(calcOrc(orc).total<=0)return toast('O orçamento está zerado');
      S.orcamentos.push({id:uid(),data:hojeISO(),status:'aberto',clienteId:orc.clienteId,desc:num(orc.desc),forma:orc.forma,parcelas:orc.parcelas,
        itens:orc.itens.map(i=>({servicoId:i.servicoId,sessoes:i.sessoes,valor:num(i.valor)}))});
      orc={clienteId:'',itens:[],desc:'',forma:'pix',parcelas:2}; salvar(); toast('Orçamento salvo'); render() };
    pinta();
  }
  document.querySelectorAll('[data-o-fecha]').forEach(b=>b.onclick=()=>{ const o=S.orcamentos.find(z=>z.id===b.dataset.oFecha); if(!o)return;
    const t=calcOrc(o), c=cli(o.clienteId);
    confirmar('A cliente fechou?',`Isso lança <b>${brl(t.total)}</b> no Caixa com a data de hoje. Pacotes entram com todas as sessões ainda por fazer.`,'Lançar no Caixa',()=>{
      o.itens.forEach(i=>{ if(!serv(i.servicoId))return;
        S.vendas.push({id:uid(),data:hojeISO(),servicoId:i.servicoId,valor:Math.round(num(i.valor)*t.f*100)/100,forma:o.forma,
          parcelas:o.forma==='parc'?o.parcelas:1,sessoes:i.sessoes,usadas:[],desloc:0,clienteId:o.clienteId||'',cliente:c?c.nome:''}) });
      o.status='fechado'; mesSel=mesAtual(); salvar(); toast('Lançado no Caixa'); render() }) });
  document.querySelectorAll('[data-o-apaga]').forEach(b=>b.onclick=()=>{ const id=b.dataset.oApaga;
    confirmar('Excluir este orçamento?','Só o orçamento é apagado. O que já foi lançado no Caixa continua lá.','Excluir',
      ()=>{ S.orcamentos=S.orcamentos.filter(z=>z.id!==id); salvar(); render(); toast('Orçamento excluído') },true) });
}

/* ── 6 · equipe e repasse de comissão ── */
const prof=id=>S.equipe.find(p=>p.id===id)||null;
const nomeProf=v=>{const p=prof(v.profId);return p?p.nome:''};
function campoProf(id,sel){ if(!S.equipe.length)return '';
  return `<div class="field"><label>Quem atendeu</label><select id="${id}"><option value="">Sem profissional</option>
    ${S.equipe.map(p=>`<option value="${p.id}" ${sel===p.id?'selected':''}>${esc(p.nome)}</option>`).join('')}</select></div>` }
function repasses(mes){
  const m={};
  S.vendas.filter(v=>mesDe(v.data)===mes).forEach(v=>{ const k=conta(v), e=v.estorno; let c=k.comissao;
    if(e&&!e.comissaoPaga&&k.bruto)c*=1-k.devolvido/k.bruto;      /* comissão recuperada num estorno não é repassada */
    if(c<0.005)return; const p=prof(v.profId), id=p?p.id:'';
    const a=m[id]||(m[id]={nome:p?p.nome:'Sem profissional',qtd:0,valor:0}); a.qtd++; a.valor+=c });
  return Object.values(m).sort((a,b)=>b.valor-a.valor);
}
function secRepasses(mes){
  if(!S.equipe.length)return ''; const rs=repasses(mes); if(!rs.length)return '';
  let x=`<div class="sec" data-pn="esq"><div class="sec-top"><h2>Comissões a repassar</h2><span class="pill">${brl(rs.reduce((a,r)=>a+r.valor,0))}</span></div><div class="card">`;
  rs.forEach(r=>x+=`<div class="item"><div class="mn"><b>${esc(r.nome)}</b><small>${r.qtd} atendimento(s) com comissão</small></div>
    <div class="vr">${brl(r.valor)}</div></div>`);
  return x+`</div></div>`;
}
function secEquipe(){
  let x=`<div class="sec"><div class="card"><h2 style="margin-bottom:4px">Equipe</h2>
    <p class="sub" style="margin-bottom:12px">Cadastre quem atende para o Painel mostrar quanto repassar de comissão a cada pessoa. Trabalha sozinha? Pode deixar vazio.</p>`;
  S.equipe.forEach(p=>x+=`<div class="item"><div class="mn"><b>${esc(p.nome)}</b></div>
    <div class="acts"><button class="btn sm danger ic" data-eq-del="${p.id}" aria-label="Excluir ${esc(p.nome)}">${ic('trash',18)}</button></div></div>`);
  return x+`<div class="row" style="margin-top:${S.equipe.length?10:0}px;flex-wrap:nowrap">
    <input id="eq-nome" placeholder="Nome da profissional" aria-label="Nome da profissional" style="flex:1;min-width:0">
    <button class="btn soft" id="eq-add">${ic('plus')}Adicionar</button></div></div></div>`;
}
function ligarEquipe(){
  const add=()=>{ const n=$('#eq-nome').value.trim(); if(!n)return toast('Informe o nome');
    S.equipe.push({id:uid(),nome:n}); salvar(); toast('Adicionada à equipe'); render() };
  $('#eq-add').onclick=add; $('#eq-nome').addEventListener('keydown',e=>{if(e.key==='Enter')add()});
  document.querySelectorAll('[data-eq-del]').forEach(b=>b.onclick=()=>{ const id=b.dataset.eqDel;
    confirmar('Tirar da equipe?','Os atendimentos que ela fez continuam no histórico, mas ficam como “Sem profissional” no repasse.','Excluir',
      ()=>{ S.equipe=S.equipe.filter(p=>p.id!==id); salvar(); render(); toast('Removida da equipe') },true) });
}

/* ── 7 · estoque simples: você conta uma vez e o Lucra desconta a cada atendimento ── */
function sessoesFeitas(sid,desde){ let n=0;
  S.vendas.forEach(v=>{ if(v.servicoId!==sid)return; if(v.estorno&&!v.estorno.produtoUsado)return;
    if(Math.max(1,parseInt(v.sessoes)||1)>1)n+=(v.usadas||[]).filter(d=>d>=desde).length; else if(v.data>=desde)n++ });
  return n }
function saldo(p){ if(!p.servicoId||!num(p.porAtend)||!serv(p.servicoId))return num(p.qtd);
  return num(p.qtd)-num(p.porAtend)*Math.max(0,sessoesFeitas(p.servicoId,p.contadoEm||hojeISO())-(p.jaNoDia||0)) }
const estoqueBaixo=()=>S.produtos.filter(p=>saldo(p)<=num(p.min));
function secEstoque(){
  let x=`<div class="sec"><div class="sec-top"><h2>Estoque</h2>${estoqueBaixo().length?`<span class="pill war">${estoqueBaixo().length} para repor</span>`:''}</div><div class="card">`;
  if(!S.produtos.length)x+=`<div class="vazio"><b>Nenhum produto no estoque</b><p>Cadastre os produtos que não podem faltar e a quantidade que você tem hoje. Ligando o produto a um serviço, o Lucra desconta sozinho a cada atendimento e avisa quando chegar no mínimo.</p></div>`;
  else S.produtos.forEach(p=>{ const q=saldo(p), s=serv(p.servicoId), baixo=q<=num(p.min);
    x+=`<div class="item"><div class="mn"><b>${esc(p.nome)} ${baixo?'<span class="pill war">repor</span>':''}</b>
      <small>mínimo ${qtdBR(p.min)}${s&&num(p.porAtend)?` · gasta ${qtdBR(p.porAtend)} por atendimento de ${esc(s.nome)}`:' · ajuste manual'}${p.contadoEm?' · contado em '+dataBR(p.contadoEm):''}</small></div>
      <div class="vr ${baixo?'v-war':''}">${qtdBR(q)}<small>em estoque</small></div>
      <div class="acts"><button class="btn sm soft" data-pr-conta="${p.id}">${ic('edit',16)}Contar</button>
        <button class="btn sm danger ic" data-pr-del="${p.id}" aria-label="Excluir">${ic('trash',18)}</button></div></div>` });
  x+=`<details class="dobra" ${S.produtos.length?'':'open'}><summary class="btn soft full">${ic('plus')}Cadastrar produto</summary>
    <div class="field" style="margin-top:14px"><label>Produto</label><input id="pr-nome" placeholder="toxina, ácido, creme, luvas..."></div>
    <div class="grid2">
      <div class="field"><label>Tenho hoje</label><input id="pr-qtd" inputmode="decimal" placeholder="0"></div>
      <div class="field"><label>Avisar quando chegar em</label><input id="pr-min" inputmode="decimal" placeholder="0"></div></div>
    <div class="grid2">
      <div class="field"><label>Usado em qual serviço? (opcional)</label><select id="pr-serv"><option value="">Nenhum, eu ajusto na mão</option>
        ${S.servicos.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join('')}</select></div>
      <div class="field"><label>Gasta por atendimento</label><input id="pr-por" inputmode="decimal" placeholder="1"></div></div>
    <button class="btn pri full" id="pr-add">${ic('plus')}Cadastrar produto</button>
  </details></div></div>`;
  return x;
}
function ligarEstoque(){
  if(!$('#pr-add'))return;
  const contar=(p,q)=>{ p.qtd=q; p.contadoEm=hojeISO(); p.jaNoDia=p.servicoId?sessoesFeitas(p.servicoId,p.contadoEm):0 };
  $('#pr-add').onclick=()=>{ const n=$('#pr-nome').value.trim(); if(!n)return toast('Dê um nome ao produto');
    const sid=$('#pr-serv').value||'', p={id:uid(),nome:n,min:num($('#pr-min').value),servicoId:sid,porAtend:sid?(num($('#pr-por').value)||1):0};
    contar(p,num($('#pr-qtd').value)); S.produtos.push(p); salvar(); toast('Produto cadastrado'); render() };
  document.querySelectorAll('[data-pr-conta]').forEach(b=>b.onclick=()=>{ const p=S.produtos.find(z=>z.id===b.dataset.prConta); if(!p)return;
    abrirSheet('Contar estoque',esc(p.nome)+' · o sistema calcula '+qtdBR(saldo(p)),
      `<div class="field"><label>Quantidade que você tem agora</label><input id="pc-qtd" inputmode="decimal" value="${String(Math.round(saldo(p)*100)/100).replace('.',',')}"></div>
       <div class="field"><label>Avisar quando chegar em</label><input id="pc-min" inputmode="decimal" value="${String(num(p.min)).replace('.',',')}"></div>
       <p class="sub" style="margin:-2px 0 12px">Comprou mais ou a contagem não bateu? Digite o número real. A partir de agora o desconto recomeça dele.</p>
       <div class="row"><button class="btn pri" id="pc-ok" style="flex:1">${ic('check')}Salvar contagem</button><button class="btn soft" id="pc-no">Cancelar</button></div>`,
      fechar=>{ const i=$('#pc-qtd'); i.focus(); i.select(); $('#pc-no').onclick=fechar;
        $('#pc-ok').onclick=()=>{ p.min=num($('#pc-min').value); contar(p,num(i.value)); salvar(); fechar(); toast('Estoque atualizado'); render() } }) });
  document.querySelectorAll('[data-pr-del]').forEach(b=>b.onclick=()=>{ const id=b.dataset.prDel;
    confirmar('Excluir este produto?','Ele sai do controle de estoque. As saídas e reservas não mudam.','Excluir',
      ()=>{ S.produtos=S.produtos.filter(z=>z.id!==id); salvar(); render(); toast('Produto excluído') },true) });
}

/* ── 8 · fotos de antes e depois, por cliente ──
   Ficam no IndexedDB deste aparelho (cabem bem mais que no localStorage) e entram no backup. */
const FOTOS={ db:null,
  abrir(){ return new Promise((ok,er)=>{ if(this.db)return ok(this.db); if(!window.indexedDB)return er(new Error('sem IndexedDB'));
    const r=indexedDB.open('lucra-fotos',1);
    r.onupgradeneeded=()=>{ r.result.createObjectStore('registros',{keyPath:'id'}).createIndex('cli','clienteId') };
    r.onsuccess=()=>{ this.db=r.result; ok(this.db) }; r.onerror=()=>er(r.error) }) },
  tx(modo,fn){ return this.abrir().then(db=>new Promise((ok,er)=>{ const t=db.transaction('registros',modo), q=fn(t.objectStore('registros'));
    t.oncomplete=()=>ok(q&&q.result); t.onerror=()=>er(t.error); t.onabort=()=>er(t.error) })) },
  doCliente(id){ return this.tx('readonly',s=>s.index('cli').getAll(id)) },
  todos(){ return this.tx('readonly',s=>s.getAll()) },
  salvar(r){ return this.tx('readwrite',s=>s.put(r)) },
  apagar(id){ return this.tx('readwrite',s=>s.delete(id)) },
  limpar(){ return this.tx('readwrite',s=>s.clear()) } };
const fotoOk=u=>typeof u==='string'&&u.startsWith('data:image/');
function apagaFotosDe(cid){ FOTOS.doCliente(cid).then(rs=>rs.forEach(r=>FOTOS.apagar(r.id))).catch(()=>{}) }
/* reduz para no máximo 1280 px e JPEG: foto de celular cai de vários MB para ~200 KB */
function reduzFoto(file){ return new Promise((ok,er)=>{ const u=URL.createObjectURL(file), im=new Image();
  im.onload=()=>{ const k=Math.min(1,1280/Math.max(im.width,im.height)), c=document.createElement('canvas');
    c.width=Math.round(im.width*k); c.height=Math.round(im.height*k);
    c.getContext('2d').drawImage(im,0,0,c.width,c.height); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg',.82)) };
  im.onerror=()=>{ URL.revokeObjectURL(u); er(new Error('imagem inválida')) }; im.src=u }) }
function escolheFoto(aoEscolher){ const i=document.createElement('input'); i.type='file'; i.accept='image/*';
  i.onchange=()=>{ const f=i.files&&i.files[0]; if(!f)return;
    reduzFoto(f).then(aoEscolher).catch(()=>toast('Não consegui abrir essa imagem')) }; i.click() }
const ROT_FOTO={antes:'Antes',depois:'Depois'};
function pintaFotos(cid){
  const el=$('#h-fotos'); if(!el)return;
  FOTOS.doCliente(cid).then(rs=>{
    if(!el.isConnected)return;
    rs.sort((a,b)=>String(b.data).localeCompare(String(a.data))||String(b.id).localeCompare(String(a.id)));
    let h=`<div class="sec-top"><h2>Antes e depois</h2><button class="btn sm soft" id="ft-novo">${ic('plus',16)}Novo registro</button></div>`;
    if(!rs.length)h+=`<div class="card"><div class="vazio"><b>Nenhuma foto ainda</b><p>Fotografe antes do procedimento e depois do resultado. Lado a lado, as duas mostram a evolução para a cliente. As fotos ficam só neste aparelho.</p></div></div>`;
    else rs.forEach(r=>{ h+=`<div class="card ft"><div class="ft-top"><div><b>${esc(r.titulo||'Registro')}</b><small>${dataBR(r.data)}</small></div>
        <button class="btn sm danger ic" data-ft-del="${esc(r.id)}" aria-label="Excluir registro">${ic('trash',18)}</button></div><div class="ft-par">`;
      ['antes','depois'].forEach(t=>{ h+=fotoOk(r[t])
        ?`<button class="ft-slot" data-ft-ver="${esc(r.id)}" data-t="${t}" aria-label="Ver foto de ${t}"><img src="${esc(r[t])}" alt="${ROT_FOTO[t]}"><span>${ROT_FOTO[t]}</span></button>`
        :`<button class="ft-slot vago" data-ft-add="${esc(r.id)}" data-t="${t}">${ic('plus',22)}<span>Foto de ${t}</span></button>` });
      h+=`</div></div>` });
    el.innerHTML=h;
    const acha=id=>rs.find(r=>r.id===id);
    $('#ft-novo').onclick=()=>abrirSheet('Novo antes e depois','Crie o registro e adicione as fotos quando quiser',
      `<div class="field"><label>Procedimento</label><select id="fn-serv">${S.servicos.map(s=>`<option>${esc(s.nome)}</option>`).join('')}<option value="">Outro</option></select></div>
       <div class="field"><label>Data</label><input id="fn-data" type="date" value="${hojeISO()}"></div>
       <div class="row"><button class="btn pri" id="fn-ok" style="flex:1">${ic('check')}Criar registro</button><button class="btn soft" id="fn-no">Cancelar</button></div>`,
      fechar=>{ $('#fn-no').onclick=fechar;
        $('#fn-ok').onclick=()=>FOTOS.salvar({id:uid(),clienteId:cid,titulo:$('#fn-serv').value||'Registro',data:$('#fn-data').value||hojeISO(),antes:'',depois:''})
          .then(()=>{ fechar(); pintaFotos(cid) }).catch(()=>toast('Não consegui salvar neste navegador')) });
    el.querySelectorAll('[data-ft-add]').forEach(b=>b.onclick=()=>{ const r=acha(b.dataset.ftAdd); if(!r)return;
      escolheFoto(u=>{ r[b.dataset.t]=u; FOTOS.salvar(r).then(()=>{ toast('Foto guardada'); pintaFotos(cid) }).catch(()=>toast('Sem espaço para guardar a foto')) }) });
    el.querySelectorAll('[data-ft-del]').forEach(b=>b.onclick=()=>{ const id=b.dataset.ftDel;
      confirmar('Excluir este registro?','As fotos de antes e depois dele são apagadas deste aparelho. Não dá para desfazer.','Excluir',
        ()=>FOTOS.apagar(id).then(()=>{ toast('Registro excluído'); pintaFotos(cid) }),true) });
    el.querySelectorAll('[data-ft-ver]').forEach(b=>b.onclick=()=>{ const r=acha(b.dataset.ftVer), t=b.dataset.t; if(!r)return;
      abrirSheet(r.titulo||'Registro',dataBR(r.data),
        `<div class="ft-par grande">${['antes','depois'].filter(z=>fotoOk(r[z])).map(z=>`<figure><img src="${esc(r[z])}" alt="${ROT_FOTO[z]}"><figcaption>${ROT_FOTO[z]}</figcaption></figure>`).join('')}</div>
         <div class="row" style="margin-top:14px"><button class="btn soft" id="fv-troca" style="flex:1">${ic('upload')}Trocar foto de ${t}</button>
           <button class="btn danger" id="fv-tira">${ic('trash')}Remover</button></div>`,
        fechar=>{
          $('#fv-troca').onclick=()=>escolheFoto(u=>{ r[t]=u; FOTOS.salvar(r).then(()=>{ fechar(); toast('Foto trocada'); pintaFotos(cid) }) });
          $('#fv-tira').onclick=()=>{ r[t]=''; FOTOS.salvar(r).then(()=>{ fechar(); toast('Foto removida'); pintaFotos(cid) }) } }) });
  }).catch(()=>{ el.innerHTML=`<div class="sec-top"><h2>Antes e depois</h2></div><div class="nota">Este navegador não deixou guardar fotos. Isso acontece em janela anônima ou com o armazenamento bloqueado.</div>` });
}

