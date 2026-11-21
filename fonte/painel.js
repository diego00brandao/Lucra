/* ══════════ PAINEL ══════════ */
T.painel=function(el){
  const r=resumo(mesSel), res=reservas(mesSel);
  const faltaReserva=res.reduce((a,b)=>a+b.falta,0);
  const metaPct=S.meta>0?Math.min(100,r.bruto/S.meta*100):0;
  const margem=r.bruto?r.lucro/r.bruto*100:0;

  let x=`<div class="sec-top"><div><h1>Painel</h1>
    <p class="sub">${UI.clinica?esc(UI.clinica)+' · ':''}o dinheiro do mês</p></div>${seletorMes()}</div>`;

  if(!S.servicos.length){
    x+=`<div class="card" style="margin-top:16px"><div class="vazio">
      <b>Vamos descobrir quanto sobra de verdade</b>
      <p>O Lucra precisa de três coisas: o preço que você cobra, quanto gasta de produto em cada atendimento e as taxas da sua maquininha. Com isso ele mostra o lucro real de cada procedimento.</p>
      <button class="btn pri full" id="ir-ob">${ic('arrow')}Configurar em 2 minutos</button>
      <button class="btn soft full" id="ir-serv">${ic('plus')}Cadastrar serviços direto</button>
    </div></div>`;
    el.innerHTML=x; ligarMes();
    $('#ir-ob').onclick=()=>boasVindas();
    $('#ir-serv').onclick=()=>ir('servicos');
    if($('#ir-demo'))$('#ir-demo').onclick=()=>{demo();UI.boasVindas=true;salvarUI();toast('Exemplo carregado');render();animar()};
    return;
  }

  /* 1 · os números do mês: quanto sobrou manda, quanto entrou, quanto saiu e a meta */
  x+=`<section class="kpis" data-pn="kpis" aria-label="Resumo de ${mesNome(mesSel)}">
    <div class="kpi dest"><span class="lb">Sobrou de verdade</span>
      <div class="kv ${r.lucro<0?'v-bad':'v-ok'}">${brl(r.lucro)}</div>
      <p class="kx">${!r.bruto?(r.despesas?'Só saídas até agora. Registre um atendimento no Caixa.':'Registre o primeiro atendimento do mês no Caixa.')
        :r.lucro>=0?`<span class="etq ok">${Math.round(margem)}% do que entrou</span> depois de todos os custos do mês`
        :'<span class="etq bad">prejuízo</span> as saídas passaram do que entrou'}</p></div>
    <div class="kpi"><span class="lb">Entrou</span><div class="kv">${brl(r.bruto)}</div>
      <p class="kx">${r.qtd} atendimento(s)${r.qtd?' · ticket '+brl(r.ticket):''}</p></div>
    <div class="kpi"><span class="lb">Saiu</span><div class="kv">${brl(r.bruto-r.lucro)}</div>
      <p class="kx">custos e despesas do mês</p></div>
    <div class="kpi"><span class="lb">Meta do mês <button class="lnk" id="ed-meta">${S.meta>0?'Alterar':'Definir'}</button></span>
      <div class="kv">${S.meta>0?Math.floor(metaPct)+'%':'Sem meta'}</div>
      ${S.meta>0?`<div class="bar meta"><i style="width:${metaPct}%"></i></div>`:''}
      <p class="kx">${S.meta>0?(r.bruto>=S.meta?'Meta batida. Parabéns!':`Faltam ${brl(S.meta-r.bruto)} de ${brl(S.meta)}`):'Defina quanto quer faturar no mês'}</p></div>
  </section>`;

  /* 3 · atalhos */
  x+=`<div class="sec" data-pn="dir"><div class="sec-top"><h2>Atenção no financeiro</h2></div><div class="tiles">
    <button class="tile" id="ir-res">
      <span class="tile-top"><span class="ico">${ic('box',17)}</span><span class="eyebrow">Separar para repor</span></span>
      <div class="tile-n ${faltaReserva>0?'v-ac':'v-ok'}">${brl(faltaReserva)}</div>
      <div class="sub">${faltaReserva>0?'produto ainda não comprado':'estoque em dia'} · ver reservas</div></button>
  </div></div>`;

  /* 4 · para onde foi o dinheiro: cada custo com o seu peso, e a sobra no fim */
  if(r.bruto>0){
    const estLiq=r.bruto-r.taxa-r.custo-r.desloc-r.comissao-r.imposto-r.despesas-r.lucro;
    const ls=[['Ficou com a maquininha','taxas de pagamento',r.taxa],['Produto usado','insumo dos atendimentos',r.custo]];
    if(r.desloc)ls.push(['Deslocamento','atendimentos em domicílio',r.desloc]);
    ls.push(['Comissões','da equipe, por atendimento',r.comissao],
      ['Impostos',pct(num(S.imposto))+' sobre o faturamento',r.imposto],
      ['Despesas do mês','aluguel, contas, compras',r.despesas]);
    if(r.qtdEstorno)ls.push(['Estornos',`${r.qtdEstorno} devolvido(s) · ${brl(r.devolvido)} ao cliente`,estLiq]);
    const p1=v=>pct(Math.round(v/r.bruto*1000)/10);
    x+=`<div class="sec" data-pn="esq"><div class="sec-top"><h2>Para onde foi o dinheiro</h2><span class="pill">de ${brl(r.bruto)}</span></div><div class="card">`;
    ls.filter(l=>Math.abs(l[2])>=0.005).forEach(l=>{
      x+=`<div class="fluxo-l"><div class="fluxo-t"><span>${l[0]}<small>${l[1]}</small></span>
        <b>${brl(-l[2])}</b><i>${p1(l[2])}</i></div>
        <div class="bar custo"><i style="width:${Math.max(0,Math.min(100,l[2]/r.bruto*100))}%"></i></div></div>`});
    x+=`<div class="fluxo-l fim"><div class="fluxo-t"><span>Sobrou de verdade</span>
        <b class="${r.lucro>=0?'v-ok':'v-bad'}">${brl(r.lucro)}</b><i>${p1(r.lucro)}</i></div>
        <div class="bar"><i style="width:${Math.max(0,Math.min(100,margem))}%"></i></div></div>
    </div></div>`;
  }

  const pacs=pacotesAbertos();
  if(pacs.length){
    const aEntregar=pacs.reduce((a,p)=>a+p.c.porSessao*p.c.restam,0);
    x+=`<div class="sec" data-pn="esq"><div class="sec-top"><h2>Pacotes em aberto</h2>
      <span class="pill">${pacs.length}</span></div><div class="card">`;
    pacs.forEach(p=>{
      x+=`<div class="item"><div class="mn"><b>${esc(p.cliente?p.cliente.nome:'Sem cadastro')}</b>
        <small>${esc(p.c.nome)} · vendido em ${dataBR(p.venda.data)} · ${brl(p.c.porSessao)} por sessão</small></div>
        <div class="vr">${p.c.restam} de ${p.c.sessoes}<small>ainda por fazer</small></div>
        <div class="acts"><button class="btn sm pri" data-pac="${p.venda.id}">${ic('check',16)}Usar sessão</button></div></div>`});
    x+=`<p class="sub" style="margin-top:12px">Já recebido, mas ainda por entregar: <b>${brl(aEntregar)}</b>.
      Esse dinheiro está no caixa, só que o trabalho ainda vem.</p></div></div>`;
  }

  const ps=Object.values(r.porServico).sort((a,b)=>b.lucro-a.lucro);
  x+=`<div class="sec" data-pn="esq"><div class="sec-top"><h2>Lucro por procedimento</h2></div><div class="card">`;
  if(!ps.length){ x+=`<div class="vazio"><b>Nenhum atendimento neste mês</b><p>Registre um atendimento no Caixa e veja aqui quanto cada procedimento deixa de verdade, já sem taxa, produto, comissão e imposto.</p>
    <button class="btn pri" id="ir-cx">${ic('plus')}Registrar atendimento</button></div>` }
  else{
    const maxL=Math.max(...ps.map(a=>Math.abs(a.lucro)))||1;
    ps.forEach((a,i)=>{ const mg=a.bruto?a.lucro/a.bruto*100:0;
      x+=`<div style="padding:13px 0;${i<ps.length-1?'border-bottom:1px solid var(--line)':''}">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:baseline">
          <b style="font-size:15px;letter-spacing:-.015em">${esc(a.nome)}</b>
          <b style="font-size:16px;font-weight:800;letter-spacing:-.02em;white-space:nowrap" class="${a.lucro>=0?'v-ok':'v-bad'}">${brl(a.lucro)}</b></div>
        <div style="display:flex;justify-content:space-between;gap:10px;font-size:12.5px;color:var(--tx3);font-weight:600;margin:3px 0 8px">
          <span>${a.qtd} atendimento(s) · entrou ${brl(a.bruto)}</span><span>${pct(mg)}</span></div>
        <div class="bar"><i style="width:${Math.abs(a.lucro)/maxL*100}%;${a.lucro<0?'background:var(--bad)':''}"></i></div></div>`});
  }
  x+=`</div></div>`;

  const dias=Object.keys(r.porDia).sort();
  if(dias.length){
    const max=Math.max(...dias.map(d=>Math.abs(r.porDia[d])))||1;
    const melhorD=dias.reduce((a,d)=>r.porDia[d]>r.porDia[a]?d:a,dias[0]);
    const piorD=dias.reduce((a,d)=>r.porDia[d]<r.porDia[a]?d:a,dias[0]);
    const media=dias.reduce((a,d)=>a+r.porDia[d],0)/dias.length;
    x+=`<div class="sec" data-pn="esq"><div class="sec-top"><h2>Lucro por dia</h2></div><div class="card">
      <div id="dia-info" class="nota" style="margin-bottom:14px" aria-live="polite">Melhor dia: <b>${dataBR(melhorD)}</b> com <b class="v-ok">${brl(r.porDia[melhorD])}</b>.
        Média de <b>${brl(media)}</b> por dia. Toque numa barra para ver o valor.</div>
      <div class="dias">`;
    dias.forEach(d=>{ const v=r.porDia[d], h=Math.max(4,Math.abs(v)/max*100);
      x+=`<button class="dia" data-dia="${d}" data-val="${v}" title="${dataBR(d)}: ${brl(v)}" aria-label="${dataBR(d)}: ${brl(v)}"><i class="${v>=0?'':'neg'}" style="height:${h}%"></i></button>`});
    x+=`</div><div style="display:flex;justify-content:space-between;font-size:12px;color:var(--tx3);font-weight:600;margin-top:6px">
        <span>${dataBR(dias[0])}</span><span>${dataBR(dias[dias.length-1])}</span></div>
      <p class="sub" style="margin-top:8px">Pior dia: ${dataBR(piorD)} com ${brl(r.porDia[piorD])}.</p></div></div>`;
  }

  el.innerHTML=x; ligarMes();
  document.querySelectorAll('[data-dia]').forEach(b=>b.onclick=()=>{
    const d=b.dataset.dia, v=num(b.dataset.val);
    document.querySelectorAll('.dia.on').forEach(z=>z.classList.remove('on')); b.classList.add('on');
    $('#dia-info').innerHTML=`<b>${dataBR(d)}</b> · ${diaSemana(d)}: sobrou
      <b class="${v>=0?'v-ok':'v-bad'}">${brl(v)}</b>.`;
  });
  document.querySelectorAll('[data-pac]').forEach(b=>b.onclick=()=>usarSessao(b.dataset.pac));
  if($('#ir-cx'))$('#ir-cx').onclick=()=>ir('vendas');
  $('#ir-res').onclick=()=>ir('reserva');
  $('#ed-meta').onclick=()=>{
    abrirSheet('Meta do mês','Quanto você quer faturar em '+mesNome(mesSel),
      `<div class="field"><label for="m-valor">Meta de faturamento (R$)</label>
         <input id="m-valor" inputmode="decimal" value="${S.meta||''}" placeholder="0,00"></div>
       <div class="row" style="margin-top:4px">
         <button class="btn pri" id="m-ok" style="flex:1">${ic('check')}Salvar meta</button>
         <button class="btn soft" id="m-no">Cancelar</button></div>`,
      fechar=>{
        const i=$('#m-valor'); i.focus(); i.select();
        $('#m-no').onclick=fechar;
        $('#m-ok').onclick=()=>{ S.meta=num(i.value); salvar(); fechar(); toast('Meta atualizada'); render() };
        i.addEventListener('keydown',e=>{if(e.key==='Enter')$('#m-ok').click()});
      });
  };
};

