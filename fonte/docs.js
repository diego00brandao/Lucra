/* ══════════ DOCUMENTOS: receita, atestado, declaração e termo de consentimento ══════════
   Saem com o nome e o registro do profissional, prontos para imprimir ou salvar em PDF.
   Ficam guardados na ficha (dados de saúde: a recepção não vê). */
const TIPOS_DOC={
  receita:{n:'Receita',areas:['odonto'],ic:'file'},
  atestado:{n:'Atestado',areas:['odonto'],ic:'file'},
  declaracao:{n:'Declaração de comparecimento',areas:['odonto','estetica','psico'],ic:'clock'},
  termo:{n:'Termo de consentimento',areas:['odonto','estetica'],ic:'edit'},
  contrato:{n:'Contrato terapêutico',areas:['psico'],modelo:1},
  atestadoPsi:{n:'Atestado psicológico',areas:['psico'],modelo:1},
  relatorio:{n:'Relatório psicológico',areas:['psico'],modelo:1},
  laudo:{n:'Laudo psicológico',areas:['psico'],modelo:1},
  parecer:{n:'Parecer psicológico',areas:['psico'],modelo:1}};
const ASSINA=['termo','contrato'];
const tiposDoc=()=>Object.keys(TIPOS_DOC).filter(k=>TIPOS_DOC[k].areas.includes(area()));
const docsDe=cid=>(S.documentos||[]).filter(d=>d.clienteId===cid).sort((a,b)=>b.data.localeCompare(a.data)||String(b.id).localeCompare(String(a.id)));
const TERMO_PAD='Eu, {paciente}{cpf}, declaro que fui informado(a) de forma clara sobre o procedimento {procedimento}: seus objetivos, benefícios, riscos, cuidados antes e depois, e as alternativas de tratamento.\n\nTive a oportunidade de fazer perguntas e todas foram respondidas. Estou ciente de que o resultado pode variar de pessoa para pessoa e de que devo seguir as orientações recebidas.\n\nAutorizo a realização do procedimento e o registro de fotos para acompanhamento clínico, que não serão divulgadas sem a minha autorização. Sei que posso retirar este consentimento a qualquer momento.';
const modelosDoc=t=>(S.modelosDoc||[]).filter(m=>m.tipo===t);
const profLinha=()=>{ const p=S.perfil||{}, ar=area(); return [(p.profissao||PROFISSAO[ar]||'').trim(),p.registro?AREAS[ar].reg+' '+p.registro:''].filter(Boolean).join(' · ') };
const hojeExtenso=()=>{ const p=S.perfil||{}; return (p.cidade?p.cidade+', ':'')+dataCheia(hojeISO()) };
function preencheDoc(t,c,extra){ extra=extra||{};
  return String(t||'').replace(/\{paciente\}/g,c.nome).replace(/\{cpf\}/g,c.cpf?', CPF '+fmtDoc(c.cpf):'').replace(/\{procedimento\}/g,extra.procedimento||'________')
    .replace(/\{data\}/g,dataBR(hojeISO())).replace(/\{profissional\}/g,(S.perfil||{}).nome||'')
    .replace(/\{registro\}/g,(S.perfil||{}).registro?', '+AREAS[area()].reg+' '+(S.perfil||{}).registro:'') }

/* ── modelos: todo documento sai de um texto com marcadores, que você pode personalizar ── */
const TPL_PAD={receita:'',
  atestado:'Atesto, para os devidos fins, que {paciente}{cpf} esteve sob meus cuidados profissionais no dia {data}{horario}{repouso}{cid}',
  declaracao:'Declaro, para os devidos fins, que {paciente}{cpf} compareceu {a_atendimento} no dia {data}{horario}.{acompanhante}'};
const tplPadrao=t=>t==='termo'?TERMO_PAD:TPL_PAD[t]!=null?TPL_PAD[t]:(typeof MODELO_PSI!=='undefined'&&MODELO_PSI[t])||'';
const modeloPadrao=t=>{ const id=(S.modeloPadrao||{})[t]; return id?modelosDoc(t).find(m=>m.id===id):null };
function pecasDoc(c,o){ o=o||{}; const n=num(o.dias);
  return {data:dataBR(o.data||hojeISO()),horario:o.de?`, das ${o.de}${o.ate?' às '+o.ate:''}`:'',
    repouso:n>0?`, necessitando de ${n} ${n>1?'dias':'dia'} de repouso a partir desta data.`:', devendo se afastar de suas atividades apenas durante esse período.',
    cid:o.cid?`\n\nCID: ${o.cid} (informado com autorização do paciente).`:'',acompanhante:o.acomp?`\n\nEsteve acompanhado(a) por ${o.acomp}.`:'',
    a_atendimento:ehPsico()?'a atendimento psicológico':'a atendimento'} }
function preencheTpl(t,c,o){ let x=String(t||''); const p=pecasDoc(c,o); Object.keys(p).forEach(k=>{ x=x.split('{'+k+'}').join(p[k]) }); return preencheDoc(x,c,o||{}) }
const textoAtestado=(c,o)=>preencheTpl(TPL_PAD.atestado,c,o), textoDeclaracao=(c,o)=>preencheTpl(TPL_PAD.declaracao,c,o);
/* o caminho de volta: tira do texto o que é deste paciente e deste dia, para virar modelo */
function paraModelo(t,c,o,extra){ const p=pecasDoc(c,o), pf=S.perfil||{}, troca=(a,b)=>{ if(a)t=t.split(a).join(b) };
  ['cid','acompanhante','repouso','horario'].forEach(k=>{ if(p[k])troca(p[k],'{'+k+'}') });
  if(c.cpf)troca(', CPF '+fmtDoc(c.cpf),'{cpf}'); troca(c.nome,'{paciente}'); troca(p.data,'{data}');
  if(pf.registro)troca(', '+AREAS[area()].reg+' '+pf.registro,'{registro}'); if(pf.nome)troca(pf.nome,'{profissional}');
  if(UI.clinica)troca(UI.clinica,'{clinica}'); if(extra&&extra.procedimento)troca(extra.procedimento,'{procedimento}'); if(extra&&extra.valor)troca(extra.valor,'{valor}');
  return t }
const MARCADORES='{paciente} {cpf} {data} {profissional} {registro} {clinica}';

/* ── o papel impresso ── */
function docHTML(d){ const c=cli(d.clienteId)||{nome:''}, p=S.perfil||{}, tit=d.titulo||TIPOS_DOC[d.tipo].n;
  return `<div class="recibo doc-imp"><div class="rc-cab"><b class="rc-t">${esc(tit)}</b>${topoRecibo()?`<span>${esc(topoRecibo())}</span>`:''}${profLinha()?`<span>${esc(profLinha())}</span>`:''}</div>
    ${d.tipo==='receita'?`<p class="doc-pac"><b>Paciente:</b> ${esc(c.nome)}</p>`:''}
    <div class="doc-tx">${esc(d.texto)}</div>
    <p class="doc-dt">${esc((p.cidade?p.cidade+', ':'')+dataCheia(d.data))}</p>
    ${ASSINA.includes(d.tipo)||d.assinatura?`<div class="rc-ass">${d.assinatura?`<img src="${d.assinatura}" alt="Assinatura de ${esc(c.nome)}">`:''}<span></span><small>${esc(c.nome)}${c.cpf?' · CPF '+esc(fmtDoc(c.cpf)):''}</small></div>`:''}
    <div class="rc-ass">${d.assProf?`<img src="${d.assProf}" alt="Assinatura do profissional">`:''}<span></span><small>${esc(p.nome||'Profissional')}${p.registro?' · '+esc(AREAS[area()].reg)+' '+esc(p.registro):''}</small></div>
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
    campos=`${selModelo(tipo)}
      <div class="field"><label for="dc-tx">Prescrição</label><textarea id="dc-tx" rows="9" placeholder="Uso interno&#10;1. Nome do medicamento, concentração ............ quantidade&#10;   Como tomar, de quantas em quantas horas, por quantos dias"></textarea></div>`; }
  else if(tipo==='atestado'||tipo==='declaracao'){
    campos=`${selModelo(tipo)}<div class="grid3"><div class="field"><label for="dc-d">Dia</label><input id="dc-d" inputmode="numeric" maxlength="10" value="${dataBRano(h)}"></div>
        <div class="field"><label for="dc-de">Das</label><input id="dc-de" inputmode="numeric" maxlength="5" placeholder="09:00" value="${ag&&ag.hora?ag.hora:''}"></div>
        <div class="field"><label for="dc-ate">Às</label><input id="dc-ate" inputmode="numeric" maxlength="5" placeholder="10:00" value="${ag&&ag.hora?somaMin(ag.hora,num(ag.dur)||num(exped().dur)||60):''}"></div></div>
      ${tipo==='atestado'?`<div class="grid2"><div class="field"><label for="dc-dias">Dias de repouso</label><select id="dc-dias">${[0,1,2,3,4,5,7,10,15].map(n=>`<option value="${n}">${n?n+(n>1?' dias':' dia'):'Só o período do atendimento'}</option>`).join('')}</select></div>
        <div class="field"><label for="dc-cid">CID (opcional)</label><input id="dc-cid" maxlength="8" placeholder="só com autorização"></div></div>`
        :`<div class="field"><label for="dc-ac">Acompanhante (opcional)</label><input id="dc-ac" placeholder="Nome de quem acompanhou"></div>`}
      <div class="field"><label for="dc-tx">Texto</label><textarea id="dc-tx" rows="6"></textarea></div>`; }
  else if(T_.modelo){ const ms=modelosDoc(tipo), sv=S.servicos[0];
    campos=`${tipo==='contrato'?`<div class="grid3"><div class="field"><label for="dc-fr">Frequência</label><select id="dc-fr"><option>semanal</option><option>quinzenal</option><option>mensal</option><option>duas vezes por semana</option></select></div>
        <div class="field"><label for="dc-vl">Valor da sessão</label><input id="dc-vl" inputmode="decimal" value="${sv?String(num(sv.preco)).replace('.',','):''}"></div>
        <div class="field"><label for="dc-pg">Pagamento</label><select id="dc-pg"><option>a cada sessão</option><option>no fim do mês</option><option>no início do mês</option></select></div></div>`:''}
      ${selModelo(tipo)}
      <div class="field"><label for="dc-tx">Texto</label><textarea id="dc-tx" rows="14"></textarea></div>
      <p class="sub" style="margin:-4px 0 10px">${tipo==='contrato'?'Ajuste os combinados ao seu jeito de trabalhar e guarde como modelo.':'Estrutura da Resolução CFP nº 06/2019. Preencha cada parte; o conteúdo é de responsabilidade técnica de quem assina.'}</p>`; }
  else { const ms=modelosDoc('termo');
    campos=`<div class="grid2"><div class="field"><label for="dc-proc">Procedimento</label><select id="dc-proc">${S.servicos.map(s=>`<option>${esc(s.nome)}</option>`).join('')}<option value="">Outro</option></select></div>
        <div>${selModelo(tipo)}</div></div>
      <div class="field"><label for="dc-tx">Texto do termo</label><textarea id="dc-tx" rows="10"></textarea></div>
      <p class="sub" style="margin:-4px 0 10px">O modelo padrão é genérico. Inclua os riscos e cuidados de cada procedimento e guarde como modelo para usar de novo.</p>`; }
  abrirSheet(T_.n,`${esc(c.nome)}${d?' · '+dataBR(d.data):''}`,
    `${falta?`<div class="nota" style="margin-bottom:12px">Seu nome e ${AREAS[area()].reg} ainda não estão no app. <button class="btn-tx" id="dc-perfil" type="button">Preencher agora</button></div>`:''}
     ${campos}
     ${d?'':`<div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><button class="btn-tx" id="dc-salvamod" type="button">Guardar este texto como meu modelo</button><small class="sub">Marcadores: ${MARCADORES}</small></div>`}
     ${blocoAssinaturas(c,d,tipo)}
     <button class="btn pri full" id="dc-salva" style="margin-top:14px">${ic('check')}Salvar documento</button>
     <div class="row" style="margin-top:8px;gap:8px"><button class="btn soft" id="dc-imp" style="flex:1">${ic('file')}Imprimir ou salvar PDF</button>
       ${c.tel&&!ASSINA.includes(tipo)&&!T_.modelo?`<button class="btn soft" id="dc-zap">${ic('chat',16)}WhatsApp</button>`:''}</div>
     ${d?`<button class="btn-tx" id="dc-del" style="display:block;margin:10px auto 0">Excluir este documento</button>`:''}`,
    fechar=>{
      const tx=$('#dc-tx');
      const dataSel=()=>dataDeBR(($('#dc-d')||{}).value||'')||h;
      const opc=()=>({data:dataSel(),de:($('#dc-de')||{}).value||'',ate:($('#dc-ate')||{}).value||'',dias:($('#dc-dias')||{}).value||0,cid:(($('#dc-cid')||{}).value||'').trim(),acomp:(($('#dc-ac')||{}).value||'').trim(),procedimento:($('#dc-proc')||{}).value||''});
      const gera=()=>{ if(d)return; const m=$('#dc-mod')&&modelosDoc(tipo).find(z=>z.id===$('#dc-mod').value);
        if(tipo==='receita'){ if(m)tx.value=preencheTpl(m.texto,c,opc()); return }
        tx.value=preencheTpl(m?m.texto:tplPadrao(tipo),c,opc())
          .replace(/\{frequencia\}/g,$('#dc-fr')?$('#dc-fr').value:'semanal').replace(/\{valor\}/g,$('#dc-vl')?brl(num($('#dc-vl').value)):'').replace(/\{pagamento\}/g,$('#dc-pg')?$('#dc-pg').value:'') };
      ['#dc-d','#dc-de','#dc-ate','#dc-dias','#dc-cid','#dc-ac','#dc-proc','#dc-mod','#dc-fr','#dc-vl','#dc-pg'].forEach(q=>{ const e=$(q); if(e){ e.addEventListener('input',gera); e.addEventListener('change',gera) } });
      gera();
      const A=ligaAssinaturas();
      if($('#dc-perfil'))$('#dc-perfil').onclick=()=>{ fechar(); setTimeout(()=>ir('ajustes'),220) };
      if($('#dc-salvamod'))$('#dc-salvamod').onclick=()=>{ const t=tx.value.trim(); if(!t)return toast('Escreva o texto antes');
        const o=opc(), ex={procedimento:o.procedimento,valor:$('#dc-vl')?brl(num($('#dc-vl').value)):''}, at=$('#dc-mod')&&modelosDoc(tipo).find(z=>z.id===$('#dc-mod').value);
        pedeTexto('Nome do modelo',tipo==='termo'?'ex.: Clareamento':tipo==='receita'?'ex.: Pós-extração':'ex.: Meu modelo',nome=>{ if(!S.modelosDoc)S.modelosDoc=[];
          let m=modelosDoc(tipo).find(z=>z.nome.toLowerCase()===nome.toLowerCase());
          if(m)m.texto=paraModelo(t,c,o,ex); else { m={id:uid(),tipo,nome,texto:paraModelo(t,c,o,ex)}; S.modelosDoc.push(m) }
          S.modeloPadrao=Object.assign({},S.modeloPadrao,{[tipo]:m.id}); salvar();
          const sl=$('#dc-mod'); if(sl){ sl.outerHTML=selModeloSo(tipo); $('#dc-mod').addEventListener('change',gera) }
          toast('Modelo guardado. Ele vem pronto nos próximos.') },at?at.nome:'') };
      const guarda=()=>{ const t=tx.value.trim(); if(!t){ toast('O documento está vazio'); return null }
        if(!d){ d={id:uid(),clienteId:cid,tipo,data:tipo==='atestado'||tipo==='declaracao'?dataSel():h,texto:t,
            titulo:tipo==='termo'?'Termo de consentimento'+($('#dc-proc').value?' · '+$('#dc-proc').value:''):''};
          if(!d.titulo)delete d.titulo; if(!S.documentos)S.documentos=[]; S.documentos.push(d) }
        else d.texto=t;
        A.aplica(d); salvar(); return d };
      $('#dc-salva').onclick=()=>{ const x=guarda(); if(!x)return; fechar(); toast(x.assinatura?'Documento salvo com a assinatura':'Documento salvo'); if(volta)volta() };
      $('#dc-imp').onclick=()=>{ const x=guarda(); if(!x)return; imprimir(docHTML(x)) };
      if($('#dc-zap'))$('#dc-zap').onclick=()=>{ const x=guarda(); if(!x)return; const p=S.perfil||{};
        zapAbrir(zap(c.tel,`*${TIPOS_DOC[x.tipo].n}*${topoRecibo()?' · '+topoRecibo():''}\n\n${x.tipo==='receita'?'Paciente: '+c.nome+'\n\n':''}${x.texto}\n\n${(p.cidade?p.cidade+', ':'')+dataCheia(x.data)}\n${p.nome||''}${p.registro?' · '+AREAS[area()].reg+' '+p.registro:''}`)) };
      if($('#dc-del'))$('#dc-del').onclick=()=>confirmar('Excluir este documento?','Ele sai da ficha do paciente.','Excluir',()=>{ S.documentos=S.documentos.filter(z=>z.id!==d.id); salvar(); fechar(); toast('Documento excluído'); if(volta)volta() },true);
    });
}
/* pergunta curta numa folha (sem prompt do navegador) */
function pedeTexto(tit,ph,fn,ini){ setTimeout(()=>{ const bg=document.createElement('div'); bg.className='mini-bg';
  bg.innerHTML=`<div class="mini" role="dialog" aria-modal="true" aria-label="${esc(tit)}"><label for="mini-i"><b>${esc(tit)}</b></label><input id="mini-i" placeholder="${esc(ph||'')}" value="${esc(ini||'')}">
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
    ${ds.length?`<div style="margin-top:8px">${ds.slice(0,8).map(d=>`<button type="button" class="item pr-it" data-doc="${d.id}"><div class="mn"><b>${esc(d.titulo||TIPOS_DOC[d.tipo].n)}</b>
      <small>${dataBR(d.data)}${d.assinatura||d.assProf?' · '+[d.assinatura?'paciente assinou':'',d.assProf?'você assinou':''].filter(Boolean).join(', '):ASSINA.includes(d.tipo)?' · sem assinatura':''}${ASSINA.includes(d.tipo)?'':' · '+esc(d.texto.slice(0,60))+(d.texto.length>60?'…':'')}</small></div>${ic('right',18)}</button>`).join('')}</div>`:''}</div></div>` }
const _topoDc=topoHist, _ligaDc=ligarTopoHist;
topoHist=c=>_topoDc(c)+secDocsFicha(c.id);
ligarTopoHist=function(id,fechar){ _ligaDc(id,fechar);
  const volta=()=>setTimeout(()=>historico(id),300);
  document.querySelectorAll('.sheet [data-doc-novo]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>abreDoc(id,b.dataset.docNovo,'',volta),260) });
  document.querySelectorAll('.sheet [data-doc]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>abreDoc(id,'',b.dataset.doc,volta),260) });
};

const MODELO_PSI={
  contrato:'Paciente: {paciente}{cpf}\nPsicólogo(a): {profissional}{registro}\n\n1. Atendimento: sessões de psicoterapia de 50 minutos, com frequência {frequencia}, em dia e horário combinados.\n\n2. Valor: {valor} por sessão, pago {pagamento}. O valor pode ser reajustado uma vez por ano, com aviso prévio.\n\n3. Faltas e remarcações: avisar com pelo menos 24 horas de antecedência. Faltas sem aviso são cobradas normalmente.\n\n4. Férias e feriados: combinados com antecedência. Nas férias do(a) psicólogo(a) não há cobrança.\n\n5. Sigilo: o conteúdo das sessões é sigiloso, conforme o Código de Ética Profissional do Psicólogo. O sigilo só pode ser quebrado nas situações previstas no Código, como risco à vida do paciente ou de outras pessoas.\n\n6. Atendimento online: quando acontecer, segue as mesmas regras deste contrato.\n\n7. Término: qualquer uma das partes pode encerrar o processo, de preferência conversando sobre isso em sessão.\n\nDe acordo.',
  atestadoPsi:'Interessado(a): {paciente}{cpf}\nFinalidade: ____________________\n\nAtesto, para os devidos fins, que {paciente}, após avaliação psicológica, apresenta ____________________, necessitando de ____________________.\n\nEste atestado vale apenas para a finalidade indicada acima.',
  relatorio:'1. Identificação\nAutor(a): {profissional}{registro}\nInteressado(a): ____________________\nAssunto: ____________________\nAtendido(a): {paciente}{cpf}\n\n2. Descrição da demanda\n\n\n3. Procedimento\n\n\n4. Análise\n\n\n5. Conclusão\n',
  laudo:'1. Identificação\nAutor(a): {profissional}{registro}\nInteressado(a): ____________________\nAssunto: ____________________\nAvaliado(a): {paciente}{cpf}\n\n2. Descrição da demanda\n\n\n3. Procedimento\n\n\n4. Análise\n\n\n5. Conclusão\n\n\n6. Referências\n',
  parecer:'1. Identificação\nParecerista: {profissional}{registro}\nInteressado(a): ____________________\nAssunto: ____________________\n\n2. Descrição da demanda\n\n\n3. Análise\n\n\n4. Conclusão\n\n\n5. Referências\n'};

/* ── assinaturas: do paciente (em cada documento) e a sua (desenhada uma vez, reaproveitada) ── */
const assProfImg=alt=>{ const a=(S.perfil||{}).assinatura; return a?`<img src="${a}" alt="${alt||'Assinatura do profissional'}">`:'' };
function blocoAssinaturas(c,d,tipo){ const p=S.perfil||{}, nm=esc(c.nome.split(' ')[0]), pede=ASSINA.includes(tipo);
  return `<div class="ass-blocos">
    <details class="ass-b" id="dc-pac" ${pede||(d&&d.assinatura)?'open':''}><summary><b>Assinatura de ${nm}</b><small>${d&&d.assinatura?'assinado':pede?'peça para assinar aqui':'opcional'}</small></summary>
      ${d&&d.assinatura?`<div class="doc-assv" id="dc-assv"><img src="${d.assinatura}" alt="Assinatura de ${nm}"><button class="btn-tx" id="dc-refaz" type="button">Assinar de novo</button></div>`:''}
      <div id="dc-asswrap" ${d&&d.assinatura?'hidden':''}><canvas id="dc-ass" class="ass-cv" aria-label="Espaço para ${nm} assinar com o dedo"></canvas>
        <div class="row" style="justify-content:space-between;margin-top:4px"><small class="sub">Assine com o dedo ou a caneta</small><button class="btn-tx" id="dc-limpa" type="button">Limpar</button></div></div></details>
    <details class="ass-b" id="dc-eu" open><summary><b>Sua assinatura</b><small>${p.assinatura?'guardada no app':'desenhe uma vez'}</small></summary>
      ${p.assinatura?`<div class="doc-assv" id="dc-euv"><img src="${p.assinatura}" alt="Sua assinatura"><label class="sw" style="min-height:36px"><input type="checkbox" id="dc-euinc" ${!d||d.assProf?'checked':''}><span>Incluir neste documento</span></label><button class="btn-tx" id="dc-eutroca" type="button">Trocar minha assinatura</button></div>`:''}
      <div id="dc-euwrap" ${p.assinatura?'hidden':''}><canvas id="dc-eucv" class="ass-cv" aria-label="Espaço para você assinar"></canvas>
        <div class="row" style="justify-content:space-between;margin-top:4px"><small class="sub">Fica guardada para os próximos documentos</small><button class="btn-tx" id="dc-eulimpa" type="button">Limpar</button></div></div></details></div>` }
function ligaAssinaturas(){ let pac=null, eu=null;
  const abre=(wrap,cv)=>{ const w=$(wrap); if(w)w.hidden=false; return quadroAssinatura($(cv)) };
  const iniPac=()=>{ if(!pac&&$('#dc-asswrap')&&!$('#dc-asswrap').hidden&&$('#dc-pac').open)pac=quadroAssinatura($('#dc-ass')) };
  const iniEu=()=>{ if(!eu&&$('#dc-euwrap')&&!$('#dc-euwrap').hidden&&$('#dc-eu').open)eu=quadroAssinatura($('#dc-eucv')) };
  setTimeout(()=>{ iniPac(); iniEu() },30);
  if($('#dc-pac'))$('#dc-pac').addEventListener('toggle',()=>setTimeout(iniPac,10));
  if($('#dc-eu'))$('#dc-eu').addEventListener('toggle',()=>setTimeout(iniEu,10));
  if($('#dc-refaz'))$('#dc-refaz').onclick=()=>{ $('#dc-assv').hidden=true; pac=abre('#dc-asswrap','#dc-ass') };
  if($('#dc-eutroca'))$('#dc-eutroca').onclick=()=>{ $('#dc-euv').hidden=true; eu=abre('#dc-euwrap','#dc-eucv') };
  if($('#dc-limpa'))$('#dc-limpa').onclick=()=>{ iniPac(); pac&&pac.limpa() };
  if($('#dc-eulimpa'))$('#dc-eulimpa').onclick=()=>{ iniEu(); eu&&eu.limpa() };
  return { aplica(d){
    if(pac&&pac.tem())d.assinatura=pac.imagem();
    if(eu&&eu.tem()){ S.perfil=Object.assign({},S.perfil,{assinatura:eu.imagem()}); d.assProf=S.perfil.assinatura }
    else if($('#dc-euinc')&&!$('#dc-euv').hidden){ if($('#dc-euinc').checked)d.assProf=S.perfil.assinatura; else delete d.assProf } } } }

function selModeloSo(tipo){ const ms=modelosDoc(tipo), pd=modeloPadrao(tipo);
  return `<select id="dc-mod"><option value="">${tipo==='receita'?'Em branco':'Padrão do Lucra'}</option>${ms.map(m=>`<option value="${m.id}" ${pd&&pd.id===m.id?'selected':''}>${esc(m.nome)}</option>`).join('')}</select>` }
const selModelo=tipo=>`<div class="field"><label for="dc-mod">Modelo</label>${selModeloSo(tipo)}</div>`;

/* ── Ajustes: modelos de documentos (ver, editar, escolher o padrão, apagar) ── */
function editaModelo(tipo,id,volta){ const m=id?modelosDoc(tipo).find(z=>z.id===id):null, pd=modeloPadrao(tipo);
  abrirSheet(m?'Editar modelo':'Novo modelo',TIPOS_DOC[tipo].n,`
    <div class="field"><label for="me-n">Nome do modelo</label><input id="me-n" value="${esc(m?m.nome:'')}" placeholder="ex.: Meu ${esc(TIPOS_DOC[tipo].n.toLowerCase())}"></div>
    <div class="field"><label for="me-t">Texto</label><textarea id="me-t" rows="14">${esc(m?m.texto:tplPadrao(tipo))}</textarea></div>
    <p class="sub" style="margin:-4px 0 10px">Os marcadores viram os dados de cada paciente: ${MARCADORES}${tipo==='atestado'?' {horario} {repouso} {cid}':tipo==='declaracao'?' {horario} {acompanhante}':tipo==='termo'?' {procedimento}':tipo==='contrato'?' {valor} {frequencia} {pagamento}':''}</p>
    <label class="sw"><input type="checkbox" id="me-pd" ${!m||(pd&&pd.id===m.id)?'checked':''}><span>Usar este modelo como padrão</span></label>
    <div class="row" style="gap:8px;margin-top:12px"><button class="btn pri" id="me-ok" style="flex:1">${ic('check')}Salvar modelo</button>${m?`<button class="btn danger" id="me-x">Apagar</button>`:''}</div>`,fechar=>{
    $('#me-ok').onclick=()=>{ const n=$('#me-n').value.trim(), t=$('#me-t').value.trim(); if(!n)return toast('Dê um nome ao modelo'); if(!t)return toast('O texto está vazio');
      if(!S.modelosDoc)S.modelosDoc=[]; let x=m; if(x)Object.assign(x,{nome:n,texto:t}); else { x={id:uid(),tipo,nome:n,texto:t}; S.modelosDoc.push(x) }
      const p=Object.assign({},S.modeloPadrao); if($('#me-pd').checked)p[tipo]=x.id; else if(p[tipo]===x.id)delete p[tipo]; S.modeloPadrao=p;
      salvar(); fechar(); toast('Modelo salvo'); if(volta)setTimeout(volta,260) };
    if($('#me-x'))$('#me-x').onclick=()=>{ S.modelosDoc=S.modelosDoc.filter(z=>z.id!==m.id); const p=Object.assign({},S.modeloPadrao); if(p[tipo]===m.id)delete p[tipo]; S.modeloPadrao=p; salvar(); fechar(); toast('Modelo apagado'); if(volta)setTimeout(volta,260) } }) }
function sheetModelos(){ abrirSheet('Modelos de documentos','O texto que já vem pronto em cada documento',`<div id="md-l"></div>`,fechar=>{
  $('#md-l').innerHTML=tiposDoc().map(t=>{ const ms=modelosDoc(t), pd=modeloPadrao(t);
    return `<div class="md-b"><div class="row" style="justify-content:space-between;gap:8px"><b>${esc(TIPOS_DOC[t].n)}</b><button class="btn sm soft" data-md-novo="${t}">${ic('plus',16)}${ms.length?'Novo':'Personalizar'}</button></div>
      <small class="sub">Padrão: ${pd?esc(pd.nome):t==='receita'?'em branco':'o do Lucra'}</small>
      ${ms.map(m=>`<button type="button" class="item pr-it" data-md-ed="${t}|${m.id}"><div class="mn"><b>${esc(m.nome)}${pd&&pd.id===m.id?' <span class="pill ok">padrão</span>':''}</b><small>${esc(m.texto.slice(0,70))}…</small></div>${ic('edit',16)}</button>`).join('')}</div>` }).join('');
  const volta=()=>sheetModelos();
  document.querySelectorAll('[data-md-novo]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>editaModelo(b.dataset.mdNovo,'',volta),260) });
  document.querySelectorAll('[data-md-ed]').forEach(b=>b.onclick=()=>{ const [t,id]=b.dataset.mdEd.split('|'); fechar(); setTimeout(()=>editaModelo(t,id,volta),260) }) }) }
const _posMd=posRender;
posRender=function(el){ _posMd(el); if(tela!=='ajustes'||$('#sec-modelos')||!podeClinico()||!tiposDoc().length)return;
  const html=`<div class="sec" id="sec-modelos"><div class="card row" style="justify-content:space-between;gap:10px;align-items:center"><div><b>Modelos de documentos</b><br><small class="sub">Personalize o texto de receitas, atestados, termos e os demais</small></div><button class="btn sm soft" id="md-abre">${ic('edit',16)}Abrir</button></div></div>`;
  const ref=$('#sec-conta')||el.querySelector('h1'); if(ref)ref.insertAdjacentHTML('afterend',html); $('#md-abre').onclick=sheetModelos };
