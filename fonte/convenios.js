/* ══════════ CONVÊNIOS ══════════
   Paciente de convênio: o atendimento vira uma guia. A guia vai para o convênio (enviada)
   e só entra no caixa quando o convênio paga. O que vier a menos fica como glosa. */
const temConv=()=>area()==='odonto'||area()==='psico';
const conv=id=>(S.convenios||[]).find(c=>c.id===id);
const precoConv=(cv,sid)=>{ const s=serv(sid); if(!cv)return s?num(s.preco):0; const v=cv.precos&&cv.precos[sid]; return v!=null&&v!==''?num(v):(s?num(s.preco):0) };
const GUIA_ST={aberta:['Para enviar','war'],enviada:['Enviada','ac'],paga:['Paga','ok'],glosada:['Glosada','bad']};
let convAba='guias', convSel='';
T.convenios=function(el){
  const cs=(S.convenios||[]).slice().sort((a,b)=>a.nome.localeCompare(b.nome)), gs=S.guias||[];
  if(convSel&&!conv(convSel))convSel='';
  const abertas=gs.filter(g=>g.status==='aberta'), enviadas=gs.filter(g=>g.status==='enviada');
  const soma=l=>l.reduce((a,g)=>a+num(g.valor),0), mes=mesAtual();
  const doMes=gs.filter(g=>mesDe(g.data)===mes);
  const filtro=g=>!convSel||g.convenioId===convSel;
  const linha=g=>{ const c=cli(g.clienteId), s=serv(g.servicoId), cv=conv(g.convenioId), st=GUIA_ST[g.status];
    const atr=g.status==='enviada'&&g.enviada&&cv&&diasEntre(g.enviada,hojeISO())>num(cv.prazo||30);
    return `<div class="ck-l item">${g.status==='aberta'||g.status==='enviada'?`<label class="sw" style="flex:1"><input type="checkbox" data-gu="${g.id}">`:'<div style="flex:1">'}
      <span class="mn"><b>${esc(c?c.nome:'—')}</b><small>${esc(cv?cv.nome:'convênio removido')} · ${esc(s?s.nome:'procedimento')} · ${dataBR(g.data)}${g.numero?' · guia '+esc(g.numero):''}${g.status==='enviada'&&g.enviada?` · enviada em ${dataBR(g.enviada)}`:''}${atr?' · <b class="v-bad">passou do prazo</b>':''}${g.status==='paga'?' · paga em '+dataBR(g.pagoEm):''}${g.status==='glosada'||g.glosa?` · glosa ${brl(num(g.glosa))}`:''}</small></span>
      ${g.status==='aberta'||g.status==='enviada'?'</label>':'</div>'}<b>${brl(num(g.status==='paga'?g.recebido:g.valor))}</b>
      ${g.status==='aberta'?`<button class="ibtn" data-gu-x="${g.id}" aria-label="Excluir guia">${ic('trash',16)}</button>`:''}</div>` };
  const chipsC=cs.length>1?`<div class="chips" role="group" aria-label="Convênio" style="margin:6px 0 2px"><button class="chip" data-cv-f="" aria-pressed="${!convSel}">Todos</button>${cs.map(c=>`<button class="chip" data-cv-f="${c.id}" aria-pressed="${convSel===c.id}">${esc(c.nome)}</button>`).join('')}</div>`:'';
  el.innerHTML=`<h1>Convênios</h1><p class="sub">Guias para enviar, o que o convênio deve e o que já pagou</p>
    <div class="abas" role="group" aria-label="Convênios" style="margin-top:12px"><button data-cv-aba="guias" aria-pressed="${convAba==='guias'}">Guias</button><button data-cv-aba="cad" aria-pressed="${convAba==='cad'}">Convênios e preços</button></div>
    ${convAba==='guias'?`
    <section class="kpis cx-k" aria-label="Resumo">
      <div class="kpi dest"><span class="lb">Convênios devem</span><div class="kv">${brl(soma(abertas)+soma(enviadas))}</div><p class="kx">${abertas.length} para enviar · ${enviadas.length} enviada(s)</p></div>
      <div class="kpi"><span class="lb">Atendimentos em ${mesNome(mes)}</span><div class="kv">${doMes.length}</div><p class="kx">${brl(soma(doMes))} em guias</p></div>
      <div class="kpi"><span class="lb">Glosas no ano</span><div class="kv ${gs.some(g=>num(g.glosa))?'v-bad':''}">${brl(gs.filter(g=>(g.pagoEm||'').slice(0,4)===mes.slice(0,4)).reduce((a,g)=>a+num(g.glosa),0))}</div><p class="kx">o que o convênio não pagou</p></div></section>
    ${!cs.length?`<div class="card" style="margin-top:12px"><div class="vazio"><b>Nenhum convênio cadastrado</b><p>Cadastre os convênios que você atende e o valor que cada um paga. Depois marque no cadastro do paciente qual convênio ele usa.</p><button class="btn pri" data-cv-aba="cad" style="margin-top:10px">${ic('plus')}Cadastrar convênio</button></div></div>`:`
    ${chipsC}
    <div class="sec"><div class="sec-top"><h2>Para enviar ao convênio</h2><span class="pill war">${brl(soma(abertas.filter(filtro)))}</span></div><div class="card">
      ${abertas.filter(filtro).map(linha).join('')||'<p class="sub" style="margin:0">Nenhuma guia esperando. Quando um paciente de convênio é atendido, a guia aparece aqui.</p>'}
      ${abertas.filter(filtro).length?`<div class="row" style="margin-top:10px;gap:8px"><button class="btn pri" id="gu-env" style="flex:1">${ic('check',16)}Marcar marcadas como enviadas</button><button class="btn-tx" data-gu-todas="aberta">Marcar todas</button></div>`:''}</div></div>
    <div class="sec"><div class="sec-top"><h2>Enviadas, esperando pagamento</h2><span class="pill">${brl(soma(enviadas.filter(filtro)))}</span></div><div class="card">
      ${enviadas.filter(filtro).map(linha).join('')||'<p class="sub" style="margin:0">Nada esperando pagamento.</p>'}
      ${enviadas.filter(filtro).length?`<div class="row" style="margin-top:10px;gap:8px"><button class="btn pri" id="gu-pag" style="flex:1">${ic('coins',16)}O convênio pagou as marcadas</button><button class="btn-tx" data-gu-todas="enviada">Marcar todas</button></div>`:''}</div></div>
    ${gs.filter(g=>(g.status==='paga'||g.status==='glosada')&&filtro(g)).length?`<div class="sec"><div class="sec-top"><h2>Pagas</h2></div><div class="card">${gs.filter(g=>(g.status==='paga'||g.status==='glosada')&&filtro(g)).sort((a,b)=>(b.pagoEm||'').localeCompare(a.pagoEm||'')).slice(0,20).map(linha).join('')}</div></div>`:''}`}`
    :`<div class="sec"><div class="card"><h2 style="margin-bottom:12px">${convSel?'Editar convênio':'Novo convênio'}</h2>
      <div class="grid2"><div class="field"><label for="cv-n">Nome</label><input id="cv-n" placeholder="ex.: Amil Dental" value="${esc(convSel?conv(convSel).nome:'')}"></div>
        <div class="field"><label for="cv-p">Paga em quantos dias</label><input id="cv-p" inputmode="numeric" value="${convSel?num(conv(convSel).prazo||30):30}"></div></div>
      <p class="eyebrow" style="margin-top:6px">Quanto o convênio paga por procedimento</p>
      <div class="cv-tab">${S.servicos.map(s=>`<div class="cv-l"><span>${esc(s.nome)}<small>particular ${brl(num(s.preco))}</small></span><input data-cv-pr="${s.id}" inputmode="decimal" aria-label="Valor do convênio para ${esc(s.nome)}" placeholder="${String(num(s.preco)).replace('.',',')}" value="${convSel&&conv(convSel).precos&&conv(convSel).precos[s.id]!=null?String(conv(convSel).precos[s.id]).replace('.',','):''}"></div>`).join('')}</div>
      <p class="sub" style="margin:6px 0 12px">Em branco, vale o preço particular.</p>
      <div class="row" style="gap:8px"><button class="btn pri" id="cv-ok" style="flex:1">${ic('check')}${convSel?'Salvar':'Cadastrar convênio'}</button>${convSel?`<button class="btn soft" id="cv-cancel">Cancelar</button>`:''}</div></div></div>
    ${cs.length?`<div class="sec"><div class="sec-top"><h2>Seus convênios</h2></div><div class="card">${cs.map(c=>{ const n=S.clientes.filter(x=>x.convenioId===c.id).length;
      return `<div class="item"><div class="mn"><b>${esc(c.nome)}</b><small>${n} paciente(s) · paga em ${num(c.prazo||30)} dias</small></div>
        <div class="acts"><button class="btn sm soft" data-cv-ed="${c.id}">${ic('edit',16)}Editar</button><button class="btn sm danger ic" data-cv-x="${c.id}" aria-label="Excluir ${esc(c.nome)}">${ic('trash',18)}</button></div></div>` }).join('')}</div></div>`:''}`}`;
  el.querySelectorAll('[data-cv-aba]').forEach(b=>b.onclick=()=>{ convAba=b.dataset.cvAba; if(convAba==='cad')convSel=''; render() });
  el.querySelectorAll('[data-cv-f]').forEach(b=>b.onclick=()=>{ convSel=b.dataset.cvF; render() });
  const marcadas=()=>[...el.querySelectorAll('[data-gu]:checked')].map(k=>gs.find(g=>g.id===k.dataset.gu)).filter(Boolean);
  el.querySelectorAll('[data-gu-todas]').forEach(b=>b.onclick=()=>{ const st=b.dataset.guTodas; el.querySelectorAll('[data-gu]').forEach(k=>{ const g=gs.find(z=>z.id===k.dataset.gu); if(g&&g.status===st)k.checked=true }) });
  if($('#gu-env'))$('#gu-env').onclick=()=>{ const ms=marcadas().filter(g=>g.status==='aberta'); if(!ms.length)return toast('Marque as guias enviadas');
    ms.forEach(g=>{ g.status='enviada'; g.enviada=hojeISO() }); salvar(); toast(ms.length+' guia(s) enviada(s)'); render() };
  if($('#gu-pag'))$('#gu-pag').onclick=()=>{ const ms=marcadas().filter(g=>g.status==='enviada'); if(!ms.length)return toast('Marque as guias que o convênio pagou'); pagouGuias(ms) };
  el.querySelectorAll('[data-gu-x]').forEach(b=>b.onclick=()=>confirmar('Excluir esta guia?','O atendimento continua na agenda, mas sai da lista do convênio.','Excluir',()=>{ S.guias=S.guias.filter(g=>g.id!==b.dataset.guX); salvar(); render() },true));
  if($('#cv-ok'))$('#cv-ok').onclick=()=>{ const n=$('#cv-n').value.trim(); if(!n)return toast('Informe o nome do convênio');
    const precos={}; el.querySelectorAll('[data-cv-pr]').forEach(i=>{ if(i.value.trim())precos[i.dataset.cvPr]=num(i.value) });
    if(!S.convenios)S.convenios=[];
    if(convSel)Object.assign(conv(convSel),{nome:n,prazo:num($('#cv-p').value)||30,precos}); else S.convenios.push({id:uid(),nome:n,prazo:num($('#cv-p').value)||30,precos});
    toast(convSel?'Convênio atualizado':'Convênio cadastrado'); convSel=''; salvar(); render() };
  if($('#cv-cancel'))$('#cv-cancel').onclick=()=>{ convSel=''; render() };
  el.querySelectorAll('[data-cv-ed]').forEach(b=>b.onclick=()=>{ convSel=b.dataset.cvEd; render(); window.scrollTo(0,0) });
  el.querySelectorAll('[data-cv-x]').forEach(b=>b.onclick=()=>{ const c=conv(b.dataset.cvX);
    confirmar(`Excluir ${esc(c.nome)}?`,'Os pacientes desse convênio passam a ser particulares. As guias já lançadas continuam.','Excluir',()=>{ S.convenios=S.convenios.filter(x=>x.id!==c.id); S.clientes.forEach(x=>{ if(x.convenioId===c.id)x.convenioId='' }); salvar(); render() },true) });
};
function pagouGuias(ms){
  const tot=ms.reduce((a,g)=>a+num(g.valor),0);
  abrirSheet('O convênio pagou',`${ms.length} guia(s) · ${brl(tot)}`,
    `<p class="sub" style="margin-bottom:8px">Se veio menos em alguma guia, corrija o valor: a diferença fica registrada como glosa.</p>
     <div class="card" style="padding:4px 14px;margin-bottom:12px">${ms.map(g=>{ const c=cli(g.clienteId), s=serv(g.servicoId);
       return `<div class="cv-l"><span>${esc(c?c.nome:'—')}<small>${esc(s?s.nome:'')} · ${dataBR(g.data)} · guia ${brl(num(g.valor))}</small></span><input data-pg="${g.id}" inputmode="decimal" aria-label="Valor recebido" value="${String(num(g.valor)).replace('.',',')}"></div>` }).join('')}</div>
     <div class="field"><label for="pg-f">Como entrou</label><select id="pg-f">${FORMAS.filter(f=>f.k!=='parc').map(f=>`<option value="${f.k}" ${f.k==='transf'?'selected':''}>${f.n}</option>`).join('')}</select></div>
     <div class="rap-sobra" id="pg-s"></div>
     <button class="btn pri full" id="pg-ok" style="margin-top:12px">${ic('check')}Lançar no caixa</button>`,
    fechar=>{ const pinta=()=>{ const r=ms.reduce((a,g)=>a+num($(`[data-pg="${g.id}"]`).value),0); $('#pg-s').innerHTML=`<span>Entra no caixa${r<tot?` · glosa de ${brl(tot-r)}`:''}</span><b>${brl(r)}</b>` };
      document.querySelectorAll('[data-pg]').forEach(i=>i.addEventListener('input',pinta)); pinta();
      $('#pg-ok').onclick=()=>{ const f=$('#pg-f').value;
        ms.forEach(g=>{ const r=num($(`[data-pg="${g.id}"]`).value), c=cli(g.clienteId), cv=conv(g.convenioId);
          if(r>0){ const v={id:uid(),data:hojeISO(),sessao:g.data,servicoId:g.servicoId,valor:r,forma:f,parcelas:1,sessoes:1,usadas:[],desloc:0,clienteId:g.clienteId,cliente:c?c.nome:'',desc:'Convênio'+(cv?' '+cv.nome:''),profId:g.profId||''};
            S.vendas.push(v); g.vendaId=v.id }
          g.recebido=r; g.glosa=Math.max(0,Math.round((num(g.valor)-r)*100)/100); g.pagoEm=hojeISO(); g.status=r>0?'paga':'glosada' });
        mesSel=mesAtual(); salvar(); fechar(); toast('Lançado no caixa'); render() } });
}

/* ── no "Atendeu": atendimento pelo convênio ── */
const _extF=extrasFechar, _ligExtF=ligarExtrasFechar;
extrasFechar=function(a,s){ const c=cli(a.clienteId), cv=c&&temConv()&&conv(c.convenioId);
  return (cv?`<div class="ou"><span>ou</span></div><button class="btn soft full" id="k-conv">${ic('file')}Pelo convênio ${esc(cv.nome)} · ${brl(precoConv(cv,s.id))}</button>`:'')+_extF(a,s) };
ligarExtrasFechar=function(a,s,fechar){ _ligExtF(a,s,fechar); const c=cli(a.clienteId), cv=c&&conv(c.convenioId);
  if($('#k-conv'))$('#k-conv').onclick=()=>{ if(!S.guias)S.guias=[];
    S.guias.push({id:uid(),convenioId:cv.id,clienteId:c.id,agId:a.id,servicoId:s.id,valor:precoConv(cv,s.id),data:a.data,status:'aberta',profId:$('#k-prof')?$('#k-prof').value:''});
    a.status='concluido'; salvar(); fechar(); toast('Guia criada em Convênios'); render(); posAtender(a) } };

/* ── cadastro do paciente: qual convênio usa ── */
const _cliCv=T.clientes;
T.clientes=function(el){ _cliCv(el); const add=$('#c-add'); if(!add||!temConv()||!(S.convenios||[]).length)return;
  const eid=edit.t==='cli'?edit.id:'', ed=eid&&cli(eid), cpf=$('#c-cpf'); const ref=cpf&&cpf.closest('.grid2')||$('#c-email').closest('.field');
  ref.insertAdjacentHTML('afterend',`<div class="grid2"><div class="field"><label for="c-conv">Convênio</label><select id="c-conv"><option value="">Particular</option>${S.convenios.map(c=>`<option value="${c.id}" ${ed&&ed.convenioId===c.id?'selected':''}>${esc(c.nome)}</option>`).join('')}</select></div>
    <div class="field"><label for="c-cart">Carteirinha</label><input id="c-cart" inputmode="numeric" value="${esc(ed&&ed.carteira||'')}"></div></div>`);
  const orig=add.onclick;
  add.onclick=()=>{ const cv=$('#c-conv').value, ca=$('#c-cart').value.trim(), antes=new Set(S.clientes.map(c=>c.id)), id=eid;
    orig(); const alvo=id?cli(id):S.clientes.find(c=>!antes.has(c.id)); if(alvo){ alvo.convenioId=cv; alvo.carteira=ca; salvar() } };
};
