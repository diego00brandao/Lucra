/* ══════════ DOCUMENTOS: receita, atestado, declaração e termo de consentimento ══════════
   Saem com o nome e o registro do profissional, prontos para imprimir ou salvar em PDF.
   Ficam guardados na ficha (dados de saúde: a recepção não vê). */
const TIPOS_DOC={
  receita:{n:'Receita',areas:['odonto'],ic:'file'},
  atestado:{n:'Atestado',areas:['odonto'],ic:'file'},
  declaracao:{n:'Declaração de comparecimento',areas:['odonto','estetica','psico'],ic:'clock'},
  termo:{n:'Termo de consentimento',areas:['odonto','estetica'],ic:'edit'}};
const tiposDoc=()=>Object.keys(TIPOS_DOC).filter(k=>TIPOS_DOC[k].areas.includes(area()));
const docsDe=cid=>(S.documentos||[]).filter(d=>d.clienteId===cid).sort((a,b)=>b.data.localeCompare(a.data)||String(b.id).localeCompare(String(a.id)));
const TERMO_PAD='Eu, {paciente}{cpf}, declaro que fui informado(a) de forma clara sobre o procedimento {procedimento}: seus objetivos, benefícios, riscos, cuidados antes e depois, e as alternativas de tratamento.\n\nTive a oportunidade de fazer perguntas e todas foram respondidas. Estou ciente de que o resultado pode variar de pessoa para pessoa e de que devo seguir as orientações recebidas.\n\nAutorizo a realização do procedimento e o registro de fotos para acompanhamento clínico, que não serão divulgadas sem a minha autorização. Sei que posso retirar este consentimento a qualquer momento.';
const modelosDoc=t=>(S.modelosDoc||[]).filter(m=>m.tipo===t);
const profLinha=()=>{ const p=S.perfil||{}, ar=area(); return [(p.profissao||PROFISSAO[ar]||'').trim(),p.registro?AREAS[ar].reg+' '+p.registro:''].filter(Boolean).join(' · ') };
const hojeExtenso=()=>{ const p=S.perfil||{}; return (p.cidade?p.cidade+', ':'')+dataCheia(hojeISO()) };
function preencheDoc(t,c,extra){ extra=extra||{};
  return String(t||'').replace(/\{paciente\}/g,c.nome).replace(/\{cpf\}/g,c.cpf?', CPF '+fmtDoc(c.cpf):'').replace(/\{procedimento\}/g,extra.procedimento||'________')
    .replace(/\{data\}/g,dataBR(hojeISO())).replace(/\{profissional\}/g,(S.perfil||{}).nome||'') }

/* texto pronto de atestado e declaração (dá para editar antes de imprimir) */
function textoAtestado(c,o){
  let t=`Atesto, para os devidos fins, que ${c.nome}${c.cpf?', CPF '+fmtDoc(c.cpf)+',':''} esteve sob meus cuidados profissionais no dia ${dataBR(o.data)}${o.de?`, das ${o.de}${o.ate?' às '+o.ate:''}`:''}`;
  t+=num(o.dias)>0?`, necessitando de ${num(o.dias)} ${num(o.dias)>1?'dias':'dia'} de repouso a partir desta data.`:', devendo se afastar de suas atividades apenas durante esse período.';
  if(o.cid)t+=`\n\nCID: ${o.cid} (informado com autorização do paciente).`;
  return t }
function textoDeclaracao(c,o){ const ps=ehPsico();
  return `Declaro, para os devidos fins, que ${c.nome}${c.cpf?', CPF '+fmtDoc(c.cpf)+',':''} compareceu ${ps?'a atendimento psicológico':'a atendimento'} no dia ${dataBR(o.data)}${o.de?`, das ${o.de}${o.ate?' às '+o.ate:''}`:''}.${o.acomp?`\n\nEsteve acompanhado(a) por ${o.acomp}.`:''}` }

/* ── o papel impresso ── */
function docHTML(d){ const c=cli(d.clienteId)||{nome:''}, p=S.perfil||{}, tit=d.tipo==='termo'?(d.titulo||TIPOS_DOC.termo.n):TIPOS_DOC[d.tipo].n;
  return `<div class="recibo doc-imp"><div class="rc-cab"><b class="rc-t">${esc(tit)}</b>${topoRecibo()?`<span>${esc(topoRecibo())}</span>`:''}${profLinha()?`<span>${esc(profLinha())}</span>`:''}</div>
    ${d.tipo==='receita'?`<p class="doc-pac"><b>Paciente:</b> ${esc(c.nome)}</p>`:''}
    <div class="doc-tx">${esc(d.texto)}</div>
    <p class="doc-dt">${esc((p.cidade?p.cidade+', ':'')+dataCheia(d.data))}</p>
    ${d.tipo==='termo'?`<div class="rc-ass">${d.assinatura?`<img src="${d.assinatura}" alt="Assinatura de ${esc(c.nome)}">`:''}<span></span><small>${esc(c.nome)}${c.cpf?' · CPF '+esc(fmtDoc(c.cpf)):''}</small></div>`:''}
    <div class="rc-ass"><span></span><small>${esc(p.nome||'Profissional')}${p.registro?' · '+esc(AREAS[area()].reg)+' '+esc(p.registro):''}</small></div>
    ${p.endereco?`<p class="doc-end">${esc(p.endereco)}</p>`:''}</div>` }

/* ── assinatura na tela (dedo ou caneta) ── */
function quadroAssinatura(cv){
  const r=window.devicePixelRatio||1, larg=cv.clientWidth||320, alt=cv.clientHeight||150;
  cv.width=larg*r; cv.height=alt*r; const g=cv.getContext('2d'); g.scale(r,r); g.lineWidth=2.2; g.lineCap='round'; g.lineJoin='round'; g.strokeStyle='#111';
  let ok=false, ant=null;
  const pt=e=>{ const b=cv.getBoundingClientRect(); return [e.clientX-b.left,e.clientY-b.top] };
  cv.addEventListener('pointerdown',e=>{ e.preventDefault(); cv.setPointerCapture(e.pointerId); ant=pt(e); g.beginPath(); g.arc(ant[0],ant[1],1,0,7); g.fillStyle='#111'; g.fill(); ok=true });
  cv.addEventListener('pointermove',e=>{ if(!ant)return; const p=pt(e); g.beginPath(); g.moveTo(ant[0],ant[1]); g.lineTo(p[0],p[1]); g.stroke(); ant=p });
  const solta=()=>{ ant=null }; cv.addEventListener('pointerup',solta); cv.addEventListener('pointercancel',solta);
  return {limpa(){ g.clearRect(0,0,cv.width,cv.height); ok=false }, tem:()=>ok,
    imagem(){ const o=document.createElement('canvas'); o.width=480; o.height=Math.round(480*alt/larg); const og=o.getContext('2d'); og.drawImage(cv,0,0,o.width,o.height); return o.toDataURL('image/png') }};
}

/* ── a folha de cada documento ── */
function abreDoc(cid,tipo,docId,volta){
  const c=cli(cid); if(!c)return; let d=docId?(S.documentos||[]).find(z=>z.id===docId):null; if(d)tipo=d.tipo;
  const T_=TIPOS_DOC[tipo], h=hojeISO(), ag=S.agenda.filter(a=>a.clienteId===cid&&a.data===h)[0];
  const falta=!(S.perfil||{}).nome;
  let campos='';
  if(d)campos=`<div class="field"><label for="dc-tx">Texto</label><textarea id="dc-tx" rows="9">${esc(d.texto)}</textarea></div>`;
  else if(tipo==='receita'){ const ms=modelosDoc('receita');
    campos=`${ms.length?`<div class="field"><label for="dc-mod">Usar um modelo seu</label><select id="dc-mod"><option value="">Escolha…</option>${ms.map(m=>`<option value="${m.id}">${esc(m.nome)}</option>`).join('')}</select></div>`:''}
      <div class="field"><label for="dc-tx">Prescrição</label><textarea id="dc-tx" rows="9" placeholder="Uso interno&#10;1. Nome do medicamento, concentração ............ quantidade&#10;   Como tomar, de quantas em quantas horas, por quantos dias"></textarea></div>
      <button class="btn-tx" id="dc-salvamod" type="button">Guardar este texto como modelo</button>`; }
  else if(tipo==='atestado'||tipo==='declaracao'){
    campos=`<div class="grid3"><div class="field"><label for="dc-d">Dia</label><input id="dc-d" inputmode="numeric" maxlength="10" value="${dataBRano(h)}"></div>
        <div class="field"><label for="dc-de">Das</label><input id="dc-de" inputmode="numeric" maxlength="5" placeholder="09:00" value="${ag&&ag.hora?ag.hora:''}"></div>
        <div class="field"><label for="dc-ate">Às</label><input id="dc-ate" inputmode="numeric" maxlength="5" placeholder="10:00" value="${ag&&ag.hora?somaMin(ag.hora,num(ag.dur)||num(exped().dur)||60):''}"></div></div>
      ${tipo==='atestado'?`<div class="grid2"><div class="field"><label for="dc-dias">Dias de repouso</label><select id="dc-dias">${[0,1,2,3,4,5,7,10,15].map(n=>`<option value="${n}">${n?n+(n>1?' dias':' dia'):'Só o período do atendimento'}</option>`).join('')}</select></div>
        <div class="field"><label for="dc-cid">CID (opcional)</label><input id="dc-cid" maxlength="8" placeholder="só com autorização"></div></div>`
        :`<div class="field"><label for="dc-ac">Acompanhante (opcional)</label><input id="dc-ac" placeholder="Nome de quem acompanhou"></div>`}
      <div class="field"><label for="dc-tx">Texto</label><textarea id="dc-tx" rows="6"></textarea></div>`; }
  else { const ms=modelosDoc('termo');
    campos=`<div class="grid2"><div class="field"><label for="dc-proc">Procedimento</label><select id="dc-proc">${S.servicos.map(s=>`<option>${esc(s.nome)}</option>`).join('')}<option value="">Outro</option></select></div>
        <div class="field"><label for="dc-mod">Modelo</label><select id="dc-mod"><option value="">Modelo padrão do Lucra</option>${ms.map(m=>`<option value="${m.id}">${esc(m.nome)}</option>`).join('')}</select></div></div>
      <div class="field"><label for="dc-tx">Texto do termo</label><textarea id="dc-tx" rows="10"></textarea></div>
      <p class="sub" style="margin:-4px 0 10px">O modelo padrão é genérico. Inclua os riscos e cuidados de cada procedimento e guarde como modelo para usar de novo.</p>
      <button class="btn-tx" id="dc-salvamod" type="button">Guardar este texto como modelo</button>
      <p class="eyebrow" style="margin-top:14px">Assinatura de ${esc(c.nome.split(' ')[0])}</p>
      <canvas id="dc-ass" class="ass-cv" aria-label="Espaço para assinar com o dedo"></canvas>
      <div class="row" style="justify-content:space-between;margin-top:4px"><small class="sub">Assine com o dedo ou a caneta</small><button class="btn-tx" id="dc-limpa" type="button">Limpar</button></div>`; }
  abrirSheet(d?T_.n:(tipo==='termo'?'Termo de consentimento':T_.n),`${esc(c.nome)}${d?' · '+dataBR(d.data):''}`,
    `${falta?`<div class="nota" style="margin-bottom:12px">Seu nome e ${AREAS[area()].reg} ainda não estão no app. <button class="btn-tx" id="dc-perfil" type="button">Preencher agora</button></div>`:''}
     ${d&&d.assinatura?`<div class="doc-assv"><img src="${d.assinatura}" alt="Assinatura"><small>Assinado na tela em ${dataBR(d.data)}</small></div>`:''}
     ${campos}
     <div class="row" style="margin-top:12px;gap:8px"><button class="btn pri" id="dc-imp" style="flex:1">${ic('file')}Imprimir ou salvar PDF</button>
       ${c.tel&&tipo!=='termo'?`<button class="btn soft" id="dc-zap">${ic('chat',16)}WhatsApp</button>`:''}</div>
     ${d?`<button class="btn-tx" id="dc-del" style="display:block;margin:10px auto 0">Excluir este documento</button>`:''}`,
    fechar=>{
      const tx=$('#dc-tx');
      const dataSel=()=>dataDeBR(($('#dc-d')||{}).value||'')||h;
      const gera=()=>{ if(d)return;
        if(tipo==='atestado')tx.value=textoAtestado(c,{data:dataSel(),de:$('#dc-de').value,ate:$('#dc-ate').value,dias:$('#dc-dias').value,cid:$('#dc-cid').value.trim()});
        if(tipo==='declaracao')tx.value=textoDeclaracao(c,{data:dataSel(),de:$('#dc-de').value,ate:$('#dc-ate').value,acomp:$('#dc-ac').value.trim()});
        if(tipo==='termo'){ const m=modelosDoc('termo').find(z=>z.id===$('#dc-mod').value); tx.value=preencheDoc(m?m.texto:TERMO_PAD,c,{procedimento:$('#dc-proc').value}) } };
      ['#dc-d','#dc-de','#dc-ate','#dc-dias','#dc-cid','#dc-ac','#dc-proc','#dc-mod'].forEach(q=>{ const e=$(q); if(e&&!(tipo==='receita'&&q==='#dc-mod')){ e.addEventListener('input',gera); e.addEventListener('change',gera) } });
      gera();
      if(tipo==='receita'&&$('#dc-mod'))$('#dc-mod').onchange=()=>{ const m=modelosDoc('receita').find(z=>z.id===$('#dc-mod').value); if(m)tx.value=m.texto };
      const ass=$('#dc-ass')?quadroAssinatura($('#dc-ass')):null;
      if($('#dc-limpa'))$('#dc-limpa').onclick=()=>ass.limpa();
      if($('#dc-perfil'))$('#dc-perfil').onclick=()=>{ fechar(); setTimeout(()=>ir('ajustes'),220) };
      if($('#dc-salvamod'))$('#dc-salvamod').onclick=()=>{ const t=tx.value.trim(); if(!t)return toast('Escreva o texto antes');
        pedeTexto('Nome do modelo',tipo==='termo'?'ex.: Clareamento':'ex.: Pós-extração',nome=>{ if(!S.modelosDoc)S.modelosDoc=[];
          S.modelosDoc.push({id:uid(),tipo,nome,texto:tipo==='termo'?t.split(c.nome).join('{paciente}'):t}); salvar(); toast('Modelo guardado') }) };
      const guarda=()=>{ const t=tx.value.trim(); if(!t){ toast('O documento está vazio'); return null }
        if(d){ d.texto=t; salvar(); return d }
        d={id:uid(),clienteId:cid,tipo,data:tipo==='atestado'||tipo==='declaracao'?dataSel():h,texto:t,
          titulo:tipo==='termo'?'Termo de consentimento'+($('#dc-proc').value?' · '+$('#dc-proc').value:''):'',assinatura:ass&&ass.tem()?ass.imagem():''};
        if(!S.documentos)S.documentos=[]; S.documentos.push(d); salvar(); return d };
      $('#dc-imp').onclick=()=>{ const x=guarda(); if(!x)return; imprimir(docHTML(x)) };
      if($('#dc-zap'))$('#dc-zap').onclick=()=>{ const x=guarda(); if(!x)return; const p=S.perfil||{};
        zapAbrir(zap(c.tel,`*${TIPOS_DOC[x.tipo].n}*${topoRecibo()?' · '+topoRecibo():''}\n\n${x.tipo==='receita'?'Paciente: '+c.nome+'\n\n':''}${x.texto}\n\n${(p.cidade?p.cidade+', ':'')+dataCheia(x.data)}\n${p.nome||''}${p.registro?' · '+AREAS[area()].reg+' '+p.registro:''}`)) };
      if($('#dc-del'))$('#dc-del').onclick=()=>confirmar('Excluir este documento?','Ele sai da ficha do paciente.','Excluir',()=>{ S.documentos=S.documentos.filter(z=>z.id!==d.id); salvar(); fechar(); toast('Documento excluído'); if(volta)volta() },true);
    });
}
/* pergunta curta numa folha (sem prompt do navegador) */
function pedeTexto(tit,ph,fn){ setTimeout(()=>{ const bg=document.createElement('div'); bg.className='mini-bg';
  bg.innerHTML=`<div class="mini" role="dialog" aria-modal="true" aria-label="${esc(tit)}"><label for="mini-i"><b>${esc(tit)}</b></label><input id="mini-i" placeholder="${esc(ph||'')}">
    <div class="row" style="margin-top:10px;gap:8px"><button class="btn pri" id="mini-ok" style="flex:1">Guardar</button><button class="btn soft" id="mini-no">Cancelar</button></div></div>`;
  document.body.appendChild(bg); const i=bg.querySelector('#mini-i'); i.focus();
  const sai=()=>bg.remove(), ok=()=>{ const v=i.value.trim(); if(!v)return i.focus(); sai(); fn(v) };
  bg.querySelector('#mini-ok').onclick=ok; bg.querySelector('#mini-no').onclick=sai; i.onkeydown=e=>{ if(e.key==='Enter')ok(); if(e.key==='Escape')sai() } },0) }
const somaMin=(hh,m)=>{ const [a,b]=String(hh).split(':').map(Number), t=a*60+b+m; return String(Math.floor(t/60)%24).padStart(2,'0')+':'+String(t%60).padStart(2,'0') };
MASC.push(['#dc-d',v=>molde(soDig(v).slice(0,8),'##/##/####')],['#dc-de,#dc-ate',v=>molde(soDig(v).slice(0,4),'##:##')]);

/* ── na ficha ── */
function secDocsFicha(cid){ if(!podeClinico())return ''; const ts=tiposDoc(); if(!ts.length)return '';
  const ds=docsDe(cid);
  return `<div class="sec" id="h-docs"><div class="sec-top"><h2>Documentos</h2>${ds.length?`<span class="pill">${ds.length}</span>`:''}</div><div class="card">
    <div class="row" style="gap:8px;flex-wrap:wrap">${ts.map(t=>`<button class="btn sm soft" data-doc-novo="${t}">${ic('plus',16)}${TIPOS_DOC[t].n}</button>`).join('')}</div>
    ${ds.length?`<div style="margin-top:8px">${ds.slice(0,8).map(d=>`<button type="button" class="item pr-it" data-doc="${d.id}"><div class="mn"><b>${esc(d.tipo==='termo'?(d.titulo||'Termo'):TIPOS_DOC[d.tipo].n)}</b>
      <small>${dataBR(d.data)}${d.tipo==='termo'?(d.assinatura?' · assinado na tela':' · sem assinatura na tela'):' · '+esc(d.texto.slice(0,60))+(d.texto.length>60?'…':'')}</small></div>${ic('right',18)}</button>`).join('')}</div>`:''}</div></div>` }
const _topoDc=topoHist, _ligaDc=ligarTopoHist;
topoHist=c=>_topoDc(c)+secDocsFicha(c.id);
ligarTopoHist=function(id,fechar){ _ligaDc(id,fechar);
  const volta=()=>setTimeout(()=>historico(id),300);
  document.querySelectorAll('.sheet [data-doc-novo]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>abreDoc(id,b.dataset.docNovo,'',volta),260) });
  document.querySelectorAll('.sheet [data-doc]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>abreDoc(id,'',b.dataset.doc,volta),260) });
};
