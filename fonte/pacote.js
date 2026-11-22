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
