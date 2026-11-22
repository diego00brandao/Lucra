/* ══════════ PACOTE: SÓ ENTRA NO CAIXA O QUE FOI PAGO ══════════
   Ao registrar um pacote (4 sessões, por exemplo), o app pergunta quanto já foi pago.
   O pacote continua valendo as 4 sessões, mas o caixa recebe só o que entrou; o resto vai para
   "A receber" e entra no caixa no dia em que a pessoa pagar. Falta de quem tem pacote pode
   descontar uma sessão do pacote em vez de gerar uma cobrança nova. */
let vendasVistas=null;
const ehPacote=v=>(parseInt(v.sessoes)||1)>1;
function perguntaPagamentoPacote(v){ const c=cli(v.clienteId), s=serv(v.servicoId), tot=num(v.valor);
  abrirSheet('Quanto já foi pago?',`${esc(c?c.nome:'')} · ${esc(s?s.nome:'Pacote')} · ${v.sessoes} sessões · ${brl(tot)}`,
    `<p class="conf-tx">Só entra no caixa o que a pessoa já pagou. O que faltar fica em <b>A receber</b> e você marca quando ela pagar.</p>
     <div style="display:grid;gap:8px;margin-top:14px">
       <button class="btn pri full" data-pg-op="tudo">${ic('check')}Pagou tudo · ${brl(tot)}</button>
       <button class="btn soft full" data-pg-op="parte">Pagou uma parte</button>
       <div id="pg-parte" hidden><div class="field"><label for="pg-v">Quanto pagou agora (R$)</label><input id="pg-v" inputmode="decimal" placeholder="0,00"></div>
         <button class="btn pri full" id="pg-ok">Confirmar</button></div>
       <button class="btn soft full" data-pg-op="nada">Ainda não pagou nada</button></div>`,fechar=>{
    const aplica=pago=>{ pago=Math.max(0,Math.min(tot,Math.round(pago*100)/100)); const resto=Math.round((tot-pago)*100)/100;
      v.valor=pago; v.pacTotal=tot; v.pagoConf=1;
      if(resto>0){ S.receber.push({id:uid(),clienteId:v.clienteId,servicoId:'',valor:resto,data:v.data,desc:`Restante do pacote ${s?s.nome:''}`.trim(),pacId:v.id}) }
      salvar(); fechar(); toast(resto>0?(pago?`${brl(pago)} no caixa · ${brl(resto)} em A receber`:`${brl(resto)} em A receber`):'Pacote pago · no caixa'); render() };
    document.querySelector('[data-pg-op=tudo]').onclick=()=>aplica(tot);
    document.querySelector('[data-pg-op=nada]').onclick=()=>aplica(0);
    document.querySelector('[data-pg-op=parte]').onclick=()=>{ $('#pg-parte').hidden=false; $('#pg-v').focus() };
    $('#pg-ok').onclick=()=>{ const p=num($('#pg-v').value); if(p<=0)return toast('Informe quanto pagou'); if(p>=tot)return aplica(tot); aplica(p) };
  }) }
const _salvarPac=salvar;
salvar=function(){ const r=_salvarPac.apply(this,arguments);
  if(vendasVistas){ const novas=S.vendas.filter(v=>!vendasVistas.has(v.id)); novas.forEach(v=>vendasVistas.add(v.id));
    const p=novas.length<=2&&novas.find(v=>ehPacote(v)&&!v.pagoConf&&!v.estorno&&num(v.valor)>0);
    if(p)setTimeout(()=>perguntaPagamentoPacote(p),350) }
  else vendasVistas=new Set(S.vendas.map(v=>v.id));
  return r };
setTimeout(()=>{ if(!vendasVistas)vendasVistas=new Set(S.vendas.map(v=>v.id)) },0);
const _ativarPac=ativar; ativar=function(){ const r=_ativarPac.apply(this,arguments); vendasVistas=new Set(S.vendas.map(v=>v.id)); return r };
const _aplPac=aplicaParte; aplicaParte=function(){ const r=_aplPac.apply(this,arguments); (S.vendas||[]).forEach(v=>vendasVistas&&vendasVistas.add(v.id)); return r };

/* falta de quem tem pacote: desconta uma sessão em vez de cobrar de novo */
const _aposFaltaP=aposFalta;
aposFalta=function(a){ const c=cli(a.clienteId), s=serv(a.servicoId);
  const p=c&&pacotesAbertos().filter(z=>z.venda.clienteId===c.id).sort((x,y)=>(y.venda.servicoId===a.servicoId)-(x.venda.servicoId===a.servicoId))[0];
  if(!p||!regraFalta().cobrar)return _aposFaltaP(a);
  abrirSheet('Falta de quem tem pacote',`${esc(c.nome)} · ${dataBR(a.data)}${a.hora?' às '+a.hora:''}`,
    `<p class="conf-tx">${esc(c.nome.split(' ')[0])} tem um pacote com <b>${p.c.restam}</b> ${p.c.restam>1?'sessões':'sessão'} sobrando. Pela sua regra, falta sem aviso é cobrada.</p>
     <div style="display:grid;gap:8px;margin-top:14px"><button class="btn pri full" id="fp-pac">${ic('check')}Descontar 1 sessão do pacote</button>
       <button class="btn soft full" id="fp-cob">Cobrar à parte (${brl(s?num(s.preco):0)} em A receber)</button>
       <button class="btn soft full" id="fp-no">Avisou a tempo · não cobrar</button></div>`,fechar=>{
    $('#fp-pac').onclick=()=>{ const v=p.venda; if(!Array.isArray(v.usadas))v.usadas=[]; v.usadas.push(a.data); a.pacFalta=v.id; salvar(); fechar(); toast(`Descontado do pacote · restam ${p.c.restam-1}`); render() };
    $('#fp-cob').onclick=()=>{ fechar(); setTimeout(()=>_aposFaltaP(a),260) };
    $('#fp-no').onclick=()=>{ fechar(); toast('Falta registrada, sem cobrança') } }) };

/* ── no agendamento que se repete: "pacote de N sessões já pago" vai direto para o caixa ── */
const _novoagPac=T.novoag;
T.novoag=function(el){ _novoagPac(el); const vb=$('#a-vezes-box'), rep=$('#a-rep'), add=$('#a-add'); if(!vb||!rep||!add||emEdicao('ag'))return;
  const linha=vb.closest('.grid2')||vb;
  linha.insertAdjacentHTML('afterend',`<div id="a-pac-box" class="a-pac" hidden><label class="sw"><input type="checkbox" id="a-pac"><span>Pacote de <b id="a-pac-n"></b> sessões já pago</span></label>
    <div class="grid2" id="a-pac-det" hidden style="margin-top:8px"><div class="field"><label for="a-pac-v">Valor do pacote (R$)</label><input id="a-pac-v" inputmode="decimal"></div>
      <div class="field"><label for="a-pac-f">Como pagou</label><select id="a-pac-f">${FORMAS.map(f=>`<option value="${f.k}" ${f.k==='pix'?'selected':''}>${f.n}</option>`).join('')}</select></div></div>
    <small class="sub" id="a-pac-tx">Entra no caixa hoje e cada sessão atendida desconta do pacote.</small></div>`);
  let mexeuValor=false;
  const atual=()=>{ const n=parseInt($('#a-vezes').value)||0, on=!!rep.value&&n>1, s=serv($('#a-serv').value);
    $('#a-pac-box').hidden=!on; $('#a-pac-n').textContent=n; $('#a-pac-det').hidden=!$('#a-pac').checked;
    if(!mexeuValor&&s)$('#a-pac-v').value=String(Math.round(num(s.preco)*n*100)/100).replace('.',',') };
  rep.addEventListener('change',atual); $('#a-vezes').addEventListener('change',atual); $('#a-serv').addEventListener('change',atual);
  $('#a-pac').addEventListener('change',atual); $('#a-pac-v').addEventListener('input',()=>{ mexeuValor=true }); atual();
  const orig=add.onclick;
  add.onclick=()=>{ const on=!$('#a-pac-box').hidden&&$('#a-pac').checked, n=parseInt($('#a-vezes').value)||0, val=num($('#a-pac-v').value), forma=$('#a-pac-f').value,
      cid=$('#a-cli').value, sid=$('#a-serv').value, antes=S.agenda.length;
    if(on&&val<=0){ toast('Informe o valor do pacote'); $('#a-pac-v').focus(); return }
    orig();
    if(on&&S.agenda.length>antes){ const c=cli(cid);
      S.vendas.push({id:uid(),data:hojeISO(),servicoId:sid,valor:val,forma,parcelas:1,sessoes:n,usadas:[],desloc:0,clienteId:cid,cliente:c?c.nome:'',pagoConf:1,pacTotal:val});
      mesSel=mesAtual(); salvar(); toast(`Agendado · pacote de ${n} sessões no caixa (${brl(val)})`) } };
};

/* ── "Atendeu" de quem tem pacote: desconta a sessão do pacote, sem pedir pagamento ── */
document.addEventListener('click',e=>{ const b=e.target.closest('[data-acao="concluir"][data-ag]'); if(!b)return;
  const a=S.agenda.find(z=>z.id===b.dataset.ag); if(!a||!a.clienteId)return;
  const p=pacotesAbertos().filter(z=>z.venda.clienteId===a.clienteId).sort((x,y)=>(y.venda.servicoId===a.servicoId)-(x.venda.servicoId===a.servicoId))[0];
  if(!p)return;
  e.stopImmediatePropagation(); e.preventDefault();
  const v=p.venda; if(!Array.isArray(v.usadas))v.usadas=[]; v.usadas.push(a.data);
  a.status='concluido'; a.pacUsado=v.id; salvar(); render();
  const r=p.c.restam-1; toast(r>0?`Sessão do pacote · ${r} ${r>1?'restam':'resta'}`:'Última sessão do pacote');
  posAtender(a) },true);
