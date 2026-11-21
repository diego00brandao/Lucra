/* ══════════ AJUSTES ══════════ */
T.ajustes=function(el){
  el.innerHTML=`<h1>Ajustes</h1><p class="sub">Os dados ficam só neste aparelho</p>
  <div class="sec"><div class="card">
    <h2 style="margin-bottom:10px">Seu espaço</h2>
    <div class="field"><label for="a-nome">Nome da clínica ou do seu espaço</label>
      <input id="a-nome" placeholder="Ex.: Studio Bela Pele" value="${esc(UI.clinica)}" maxlength="40"></div>
    <div class="row">
      <button class="btn pri" id="a-nome-ok" style="flex:1">${ic('check')}Salvar nome</button>
      <button class="btn soft" id="a-ob">Rever as boas-vindas</button></div>
  </div></div>
  <div class="sec"><div class="card">
    <h2 style="margin-bottom:10px">Backup</h2>
    <p class="sub" style="margin-bottom:12px">Guarde uma cópia antes de limpar o navegador ou trocar de aparelho.</p>
    <button class="btn pri full" id="a-exp">${ic('download')}Baixar backup (.json)</button>
    <button class="btn soft full" id="a-imp" style="margin-top:8px">${ic('upload')}Restaurar backup</button>
    <button class="btn soft full" id="a-csv" style="margin-top:8px">${ic('file')}Exportar movimento (.csv)</button>
  </div></div>
  <div class="sec"><div class="card">
    <h2 style="margin-bottom:10px">Apagar</h2>
    <p class="sub" style="margin-bottom:12px">Remove serviços, atendimentos, saídas e taxas. Não dá para desfazer.</p>
    <button class="btn danger full" id="a-del">${ic('trash')}Apagar tudo</button>
  </div></div>
  <p class="sub" style="text-align:center;margin-top:26px">Lucra · protótipo versão 1</p>`;

  const baixa=(n,t,m)=>{const u=URL.createObjectURL(new Blob([t],{type:m})),a=document.createElement('a');
    a.href=u;a.download=n;a.style.display='none';document.body.appendChild(a);a.click();
    setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},3000)};

  $('#a-nome-ok').onclick=()=>{ UI.clinica=$('#a-nome').value.trim(); salvarUI(); marca(); toast('Nome salvo') };
  $('#a-nome').addEventListener('keydown',e=>{if(e.key==='Enter')$('#a-nome-ok').click()});
  $('#a-ob').onclick=()=>boasVindas();
  $('#a-exp').onclick=()=>baixa('lucra-backup.json',JSON.stringify(S),'application/json');
  $('#a-csv').onclick=()=>{
    let c='tipo;data;descricao;forma;bruto;taxa;custo;lucro\n';
    S.vendas.forEach(v=>{const k=conta(v);
      c+=`venda;${v.data};${(k.nome||'').replace(/;/g,',')};${v.forma}${v.forma==='parc'?' '+v.parcelas+'x':''};${k.bruto.toFixed(2)};${k.taxa.toFixed(2)};${k.custo.toFixed(2)};${k.lucro.toFixed(2)}\n`});
    S.despesas.forEach(d=>{c+=`saida;${d.data};${(d.desc||'').replace(/;/g,',')};;-${num(d.valor).toFixed(2)};;;\n`});
    baixa('lucra-movimento.csv',c,'text/csv;charset=utf-8');
  };
  $('#a-imp').onclick=()=>{
    const i=document.createElement('input'); i.type='file'; i.accept='application/json,.json';
    i.onchange=()=>{const f=i.files&&i.files[0]; if(!f)return; const rd=new FileReader();
      el.innerHTML=ESQUELETO;                       /* lendo o arquivo: mostra o esqueleto */
      rd.onerror=()=>{toast('Não consegui ler o arquivo');render()};
      rd.onload=()=>{try{const d=JSON.parse(rd.result);
        if(!d||typeof d!=='object'||Array.isArray(d))throw 0;
        S=Object.assign(JSON.parse(JSON.stringify(PAD)),d); normalizar(); salvar(); tema();
        UI.boasVindas=true; salvarUI();
        toast('Backup restaurado'); ir('painel');
      }catch(e){toast('Arquivo inválido');render()}};
      rd.readAsText(f)};
    i.click();
  };
  if($('#a-demo'))$('#a-demo').onclick=()=>confirmar('Carregar o exemplo?','Isso <b>substitui os dados atuais</b> por uma clínica fictícia. Se você já lançou algo de verdade, baixe um backup antes.',
    'Carregar exemplo',()=>{ demo(); UI.boasVindas=true; salvarUI(); toast('Exemplo carregado'); ir('painel') },true);
  $('#a-del').onclick=()=>confirmar('Apagar tudo?','Serviços, atendimentos, clientes, agenda, saídas e taxas serão removidos deste aparelho. <b>Não dá para desfazer.</b>',
    'Apagar tudo',()=>{ const t=S.tema; S=JSON.parse(JSON.stringify(PAD)); S.tema=t; salvar(); toast('Tudo apagado'); ir('painel') },true);
};

/* ══════════ BOAS-VINDAS ══════════
   Quatro passos: nome, meta, primeiro serviço, taxas. Cada passo grava na hora,
   então quem sair no meio não perde o que já preencheu. */
const SUGESTOES={
  estetica:[['Limpeza de pele',180,25],['Drenagem linfática',150,10],['Massagem modeladora',150,10],['Peeling químico',250,40],
    ['Microagulhamento',350,60],['Toxina botulínica',1200,450],['Preenchimento labial',1300,500],['Bioestimulador de colágeno',1800,700],
    ['Skinbooster',900,350],['Radiofrequência',200,15],['Depilação a laser',200,15],['Design de sobrancelha',60,5]],
  odonto:[['Avaliação',150,5],['Limpeza (profilaxia)',250,20],['Restauração em resina',300,40],['Clareamento em consultório',1200,250],
    ['Clareamento caseiro',800,150],['Tratamento de canal',1200,120],['Extração simples',300,30],['Extração de siso',700,60],
    ['Raspagem periodontal',400,30],['Faceta em resina',600,80],['Coroa de porcelana',2000,600],['Implante',3500,1200],
    ['Instalação de aparelho',1500,400],['Manutenção de aparelho',200,15]]};
function boasVindas(){
  if(document.querySelector('.ob'))return;
  const TOT=4; let passo=0, servId='', criados=[];
  let sugA=area(); const sel={};
  const SUGX=()=>{ if(sugA!==area()){ sugA=area(); Object.keys(sel).forEach(k=>delete sel[k]) } return SUGESTOES[area()]||null };
  const d={clinica:UI.clinica||'',meta:S.meta||'',nome:'',preco:'',custo:'',
    deb:S.taxas.debito,c1:S.taxas.cred1,parc:S.taxas.parc,extra:S.taxas.parcExtra,imp:S.imposto};
  const bg=document.createElement('div'); bg.className='ob';
  bg.setAttribute('role','dialog'); bg.setAttribute('aria-modal','true'); bg.setAttribute('aria-label','Boas-vindas ao Lucra');
  document.body.appendChild(bg); document.body.style.overflow='hidden';
  requestAnimationFrame(()=>requestAnimationFrame(()=>bg.classList.add('on')));
  const q=s=>bg.querySelector(s);
  const v=k=>esc(String(d[k]==null?'':d[k]).replace('.',','));
  const sair=msg=>{ UI.boasVindas=true; salvarUI(); bg.classList.remove('on'); document.body.style.overflow='';
    setTimeout(()=>bg.remove(),300); marca(); ir('painel'); if(msg)toast(msg) };
  const topo=()=>`<div class="ob-top"><button class="ibtn" id="ob-volta" aria-label="Voltar um passo">${ic('left')}</button>
      <div class="ob-prog" role="progressbar" aria-valuemin="1" aria-valuemax="${TOT}" aria-valuenow="${passo}" aria-label="Passo ${passo} de ${TOT}">
        ${[1,2,3,4].map(n=>`<i class="${n<=passo?'on':''}"></i>`).join('')}</div>
      <button class="btn-tx" id="ob-pula">Pular</button></div>
    <p class="eyebrow">Passo ${passo} de ${TOT}</p>`;
  const acoes=r=>`<div class="ob-acoes"><button class="btn pri full lg" id="ob-ok">${r||'Continuar'}${ic('arrow')}</button></div>`;

  const P=[
    ()=>`<div class="ob-logo">${MARCA}</div>
      <h1>Quanto sobra de verdade em cada atendimento?</h1>
      <p class="ob-lead">O Lucra desconta a maquininha, o produto, a comissão e o imposto, e mostra o que fica com você.</p>
      <ul class="ob-lista">
        <li>${ic('coins',20)}<span><b>Lucro real por procedimento</b>não só o que entrou no caixa</span></li>
        <li>${ic('sliders',20)}<span><b>Pix ou parcelado?</b>veja a diferença antes de fechar o preço</span></li>
        <li>${ic('box',20)}<span><b>Dinheiro da reposição separado</b>para o mês não fechar sem produto</span></li>
      </ul>
      <div class="ob-acoes">
        <button class="btn pri full lg" id="ob-ok">Começar · leva 2 minutos${ic('arrow')}</button>
        <button class="btn-tx" id="ob-fora">Agora não, quero explorar primeiro</button>
        <p class="ob-nota">${typeof CONTA!=='undefined'&&CONTA?'Tudo fica salvo na sua conta.':'Seus dados ficam só neste aparelho.'}</p>
      </div>`,
    ()=>`${topo()}<h1>Como se chama o seu espaço?</h1>
      <p class="ob-lead">Pode ser o nome da clínica, do studio ou o seu próprio nome.</p>
      <div class="ob-campos"><div class="field"><label for="ob-clinica">Nome</label>
        <input id="ob-clinica" data-k="clinica" data-foco placeholder="Ex.: Studio Bela Pele" value="${esc(d.clinica)}" maxlength="40" autocomplete="organization"></div></div>
      ${acoes()}`,
    ()=>`${topo()}<h1>Quanto você quer faturar neste mês?</h1>
      <p class="ob-lead">É o total que entra, antes dos custos. O Painel mostra o quanto falta para chegar lá.</p>
      <div class="ob-campos"><div class="field"><label for="ob-meta">Meta de faturamento (R$)</label>
        <input id="ob-meta" data-k="meta" data-foco inputmode="decimal" placeholder="0,00" value="${v('meta')}"></div>
        <div class="chips">${[5000,10000,20000,30000].map(n=>`<button class="chip" data-meta="${n}">${brl(n).replace(',00','')}</button>`).join('')}</div></div>
      <div class="nota" style="margin-top:18px">Não tem certeza? Chute um valor. Dá para mudar a qualquer hora no Painel.</div>
      ${acoes()}`,
    ()=>SUGX()?`${topo()}<h1>Quais serviços você faz?</h1>
      <p class="ob-lead">Toque nos que você oferece. Os valores são só um ponto de partida: troque pelo seu preço e pelo que você gasta de produto.</p>
      <div class="chips ob-sug" role="group" aria-label="Serviços comuns">${SUGX().map((s,i)=>`<button type="button" class="chip" data-sug="${i}" aria-pressed="${!!sel[i]}">${esc(s[0])}</button>`).join('')}</div>
      ${Object.keys(sel).length?`<div class="ob-esc">${Object.keys(sel).map(i=>`<div class="ob-esc-l"><b>${esc(SUGX()[i][0])}</b>
        <div class="field"><label for="sp-${i}">Preço (R$)</label><input id="sp-${i}" data-sp="${i}" data-c="preco" inputmode="decimal" value="${esc(String(sel[i].preco).replace('.',','))}"></div>
        <div class="field"><label for="sc-${i}">Produto (R$)</label><input id="sc-${i}" data-sp="${i}" data-c="custo" inputmode="decimal" value="${esc(String(sel[i].custo).replace('.',','))}"></div>
        <button type="button" class="ibtn" data-tira="${i}" aria-label="Tirar ${esc(SUGX()[i][0])}">${ic('x',18)}</button></div>`).join('')}</div>`:''}
      <p class="eyebrow" style="margin-top:18px">Faz algum que não está na lista?</p>
      <div class="ob-campos">
        <div class="field"><label for="ob-nome">Nome do procedimento</label>
          <input id="ob-nome" data-k="nome" placeholder="opcional" value="${esc(d.nome)}"></div>
        <div class="grid2">
          <div class="field"><label for="ob-preco">Preço cobrado (R$)</label>
            <input id="ob-preco" data-k="preco" inputmode="decimal" placeholder="0,00" value="${v('preco')}"></div>
          <div class="field"><label for="ob-custo">Custo de produto (R$)</label>
            <input id="ob-custo" data-k="custo" inputmode="decimal" placeholder="0,00" value="${v('custo')}"></div>
        </div></div>
      <div class="nota">O <b>custo de produto</b> é o que sai do seu bolso a cada atendimento: ${area()==='odonto'?'resina, anestésico, descartável, laboratório':'creme, descartável, agulha, toxina'}. Um valor aproximado já serve.</div>
      ${acoes()}`
    :`${topo()}<h1>Qual procedimento você mais faz?</h1>
      <p class="ob-lead">Cadastre só um agora. Os outros você adiciona depois em Serviços.</p>
      <div class="ob-campos">
        <div class="field"><label for="ob-nome">Nome do procedimento</label>
          <input id="ob-nome" data-k="nome" data-foco placeholder="Limpeza de pele, drenagem, laser..." value="${esc(d.nome)}"></div>
        <div class="grid2">
          <div class="field"><label for="ob-preco">Preço cobrado (R$)</label>
            <input id="ob-preco" data-k="preco" inputmode="decimal" placeholder="0,00" value="${v('preco')}"></div>
          <div class="field"><label for="ob-custo">Custo de produto (R$)</label>
            <input id="ob-custo" data-k="custo" inputmode="decimal" placeholder="0,00" value="${v('custo')}"></div>
        </div></div>
      <div class="nota">O <b>custo de produto</b> é o que sai do seu bolso a cada atendimento: creme, descartável, agulha, toxina. Um valor aproximado já serve.</div>
      ${acoes()}`,
    ()=>`${topo()}<h1>As taxas da sua maquininha</h1>
      <p class="ob-lead">Elas aparecem no app ou no contrato da maquininha. Já deixamos valores comuns de mercado preenchidos.</p>
      <div class="ob-campos">
        <div class="grid2">
          <div class="field"><label for="ob-deb">Débito (%)</label><input id="ob-deb" data-k="deb" data-foco inputmode="decimal" value="${v('deb')}"></div>
          <div class="field"><label for="ob-c1">Crédito à vista (%)</label><input id="ob-c1" data-k="c1" inputmode="decimal" value="${v('c1')}"></div>
        </div>
        <div class="grid2">
          <div class="field"><label for="ob-parc">Crédito 2x (%)</label><input id="ob-parc" data-k="parc" inputmode="decimal" value="${v('parc')}"></div>
          <div class="field"><label for="ob-extra">A mais por parcela (%)</label><input id="ob-extra" data-k="extra" inputmode="decimal" value="${v('extra')}"></div>
        </div>
        <div class="field"><label for="ob-imp">Imposto sobre o faturamento (%)</label>
          <input id="ob-imp" data-k="imp" inputmode="decimal" value="${v('imp')}"></div></div>
      <div class="nota">Não sabe agora? Continue com esses valores e ajuste depois em Serviços, na parte de taxas e encargos.</div>
      ${acoes('Concluir')}`,
    ()=>{ const s=serv(servId); let pay='';
      if(s){ const a=conta({servicoId:s.id,valor:s.preco,forma:'pix',parcelas:1}),
                   b=conta({servicoId:s.id,valor:s.preco,forma:'parc',parcelas:12});
        pay=`<div class="ob-pay"><span class="eyebrow">${esc(s.nome)} por ${brl(s.preco)}</span>
          <div class="ob-pay-l"><span>No Pix sobram</span><b class="${a.lucro>=0?'v-ok':'v-bad'}">${brl(a.lucro)}</b></div>
          <div class="ob-pay-l"><span>Em 12x sobram</span><b class="${b.lucro>=0?'v-war':'v-bad'}">${brl(b.lucro)}</b></div>
          <p>São <b>${brl(a.lucro-b.lucro)}</b> de diferença no mesmo atendimento. É esse tipo de número que o Lucra mostra todo dia.</p></div>` }
      return `<div class="ob-logo">${MARCA}</div>
        <h1>Tudo pronto${UI.clinica?', '+esc(UI.clinica):''}</h1>
        <p class="ob-lead">${s?'Veja o que o seu primeiro serviço já revela:':'Seu espaço está configurado. Cadastre um serviço para o Lucra começar a calcular.'}</p>
        ${pay}
        <div class="ob-acoes">
          <button class="btn pri full lg" id="ob-fim">${s?'Ir para o Painel':'Cadastrar um serviço'}${ic('arrow')}</button>
          ${s?'<button class="btn soft full" id="ob-cx">Registrar o primeiro atendimento</button>':''}
        </div>` }
  ];

  const guarda=()=>{ bg.querySelectorAll('[data-k]').forEach(i=>d[i.dataset.k]=i.value);
    bg.querySelectorAll('[data-sp]').forEach(i=>{ if(sel[i.dataset.sp])sel[i.dataset.sp][i.dataset.c]=i.value }) };
  const avanca=()=>{ guarda();
    if(passo===1){ UI.clinica=String(d.clinica).trim(); salvarUI(); marca() }
    if(passo===2){ S.meta=num(d.meta); salvar() }
    if(passo===3&&SUGX()){ const n=String(d.nome).trim(), lista=Object.keys(sel).map(i=>({nome:SUGX()[i][0],preco:num(sel[i].preco),custo:num(sel[i].custo)}));
      if(n){ if(num(d.preco)<=0){ toast('Informe o preço de '+n); q('#ob-preco').focus(); return } lista.push({nome:n,preco:num(d.preco),custo:num(d.custo)}) }
      if(!lista.length){ toast('Escolha pelo menos um serviço'); return }
      const semPreco=lista.find(s=>s.preco<=0); if(semPreco){ toast('Informe o preço de '+semPreco.nome); return }
      S.servicos=S.servicos.filter(s=>!criados.includes(s.id)); criados=[];
      lista.forEach(s=>{ const id=uid(); criados.push(id); S.servicos.push({id,nome:s.nome,preco:s.preco,precoMax:0,custo:s.custo,comissao:0,retorno:0}) });
      servId=criados[0]; salvar(); passo++; return desenha() }
    if(passo===3){ const n=String(d.nome).trim(), p=num(d.preco);
      if(!n){ toast('Dê um nome ao procedimento'); q('#ob-nome').focus(); return }
      if(p<=0){ toast('Informe o preço cobrado'); q('#ob-preco').focus(); return }
      const ja=serv(servId);
      if(ja)Object.assign(ja,{nome:n,preco:p,custo:num(d.custo)});
      else{ servId=uid(); S.servicos.push({id:servId,nome:n,preco:p,precoMax:0,custo:num(d.custo),comissao:0,retorno:0}) }
      salvar() }
    if(passo===4){ S.taxas=Object.assign({},S.taxas,{debito:num(d.deb),cred1:num(d.c1),parc:num(d.parc),parcExtra:num(d.extra)});
      S.imposto=num(d.imp); salvar() }
    passo++; desenha() };
  const desenha=()=>{
    bg.innerHTML=`<div class="ob-card"><div class="ob-in">${P[passo]()}</div></div>`; bg.scrollTop=0;
    if(q('#ob-ok'))q('#ob-ok').onclick=avanca;
    if(q('#ob-volta'))q('#ob-volta').onclick=()=>{ guarda(); passo--; desenha() };
    if(q('#ob-pula'))q('#ob-pula').onclick=()=>{ guarda(); passo++; desenha() };
    if(q('#ob-fora'))q('#ob-fora').onclick=()=>sair();
    if(q('#ob-demo'))q('#ob-demo').onclick=()=>{ demo(); sair('Exemplo carregado') };
    if(q('#ob-fim'))q('#ob-fim').onclick=()=>{ const tem=!!serv(servId); sair(); if(!tem)ir('servicos') };
    if(q('#ob-cx'))q('#ob-cx').onclick=()=>{ sair(); ir('vendas') };
    bg.querySelectorAll('[data-sug]').forEach(b=>b.onclick=()=>{ guarda(); const i=b.dataset.sug;
      if(sel[i])delete sel[i]; else sel[i]={preco:SUGX()[i][1],custo:SUGX()[i][2]}; const y=bg.scrollTop; desenha(); bg.scrollTop=y });
    bg.querySelectorAll('[data-tira]').forEach(b=>b.onclick=()=>{ guarda(); delete sel[b.dataset.tira]; const y=bg.scrollTop; desenha(); bg.scrollTop=y });
    bg.querySelectorAll('[data-meta]').forEach(b=>b.onclick=()=>{ q('#ob-meta').value=b.dataset.meta; q('#ob-ok').focus() });
    const f=q('[data-foco]')||q('#ob-ok')||q('#ob-fim'); if(f)setTimeout(()=>{try{f.focus({preventScroll:true})}catch(e){}},80);
  };
  bg.addEventListener('keydown',e=>{ if(e.key==='Enter'&&e.target.tagName==='INPUT'&&q('#ob-ok')){ e.preventDefault(); avanca() } });
  desenha();
}

/* ── exemplo ── */
