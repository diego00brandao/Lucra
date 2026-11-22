IC.alert='<path d="M12 4 2.8 19.5h18.4Z"/><path d="M12 10v4.200M12 16.900h.010"/>';
/* ══════════ PRONTUÁRIO E ANAMNESE (odontologia e estética) ══════════
   Psicologia continua com as anotações de sessão próprias. */
const temPront=()=>(area()==='odonto'||area()==='estetica')&&podeClinico()&&(typeof temRecurso!=='function'||temRecurso('prontuario'));
/* perguntas de saúde; "al" = vira alerta quando a resposta é sim */
const ANAM={
  odonto:[
    ['trat','Está em tratamento médico?','qual',0],['rem','Toma algum remédio?','quais',0],
    ['alerg','Tem alergia (remédio, látex, anestesia)?','a quê',1],['anest','Já passou mal com anestesia?','o que aconteceu',1],
    ['pa','Pressão alta?','',1],['diab','Diabetes?','',1],['card','Problema no coração?','qual',1],
    ['sang','Sangra muito ou tem problema de coagulação?','',1],['infec','Hepatite ou outra doença infecciosa?','qual',1],
    ['grav','Está grávida ou amamentando?','',1],['fuma','Fuma?','',0],['bruxo','Range ou aperta os dentes?','',0]],
  estetica:[
    ['rem','Toma algum remédio?','quais',0],['alerg','Tem alergia (remédio, cosmético, anestésico)?','a quê',1],
    ['grav','Está grávida ou amamentando?','',1],['diab','Diabetes?','',1],['pa','Pressão alta?','',1],
    ['pele','Tem acne, rosácea, melasma ou outro problema de pele?','qual',0],['acido','Usa ácido ou retinoide?','qual',1],
    ['proc','Fez botox, preenchimento ou outro procedimento nos últimos 6 meses?','qual e quando',0],
    ['cicat','Cicatriza mal ou tem queloide?','',1],['herpes','Tem herpes?','',1],['metal','Tem marcapasso ou metal no corpo?','',1],
    ['sol','Toma sol com frequência?','',0],['fuma','Fuma?','',0]]
};
const PRONT_CAMPOS={
  odonto:[['regiao','Dente ou região','ex.: 36, 11 e 21, arcada superior'],['feito','O que foi feito','ex.: restauração em resina na face oclusal'],
          ['mat','Material e anestesia','ex.: resina A2, lidocaína 1 tubete'],['prox','Próximo passo','ex.: voltar em 15 dias para o acabamento']],
  estetica:[['regiao','Área tratada','ex.: testa e glabela'],['feito','O que foi feito','ex.: toxina, 20 U na glabela'],
          ['mat','Produto e lote','ex.: marca, lote e validade'],['prox','Próximo passo','ex.: retorno em 15 dias para avaliar']]
};
const anamDe=cid=>(S.anamneses||[]).find(a=>a.clienteId===cid);
function alertasDe(cid){ const a=anamDe(cid); if(!a)return []; const qs=ANAM[area()]||[];
  return qs.filter(q=>q[3]&&a.resp[q[0]]&&a.resp[q[0]].sim).map(q=>{ const det=a.resp[q[0]].det;
    const curto={alerg:'Alergia',anest:'Reação à anestesia',pa:'Pressão alta',diab:'Diabetes',card:'Coração',sang:'Sangramento',infec:'Doença infecciosa',
      grav:'Grávida ou amamentando',acido:'Usa ácido',cicat:'Queloide',herpes:'Herpes',metal:'Marcapasso/metal'}[q[0]]||q[1];
    return curto+(det?': '+det:'') }) }
const prontDe=cid=>(S.prontuario||[]).filter(p=>p.clienteId===cid).sort((a,b)=>b.data.localeCompare(a.data));

/* ── Anamnese ── */
function anamnese(cid,depois){
  const c=cli(cid); if(!c)return; const qs=ANAM[area()]; const a=anamDe(cid)||{resp:{},queixa:'',obs:''};
  abrirSheet('Anamnese',`${esc(c.nome)}${a.data?' · atualizada em '+dataBR(a.data):''}`,
    `<div class="field"><label for="an-queixa">Queixa principal</label><textarea id="an-queixa" rows="2" placeholder="o que trouxe o paciente">${esc(a.queixa||'')}</textarea></div>
     <div class="anam">${qs.map(([k,t,det])=>{ const r=a.resp[k]||{};
       return `<div class="an-q" data-an="${k}"><p>${t}</p>
         <div class="chips" role="group" aria-label="${esc(t)}"><button type="button" class="chip" data-an-v="nao" aria-pressed="${r.sim===false}">Não</button><button type="button" class="chip" data-an-v="sim" aria-pressed="${r.sim===true}">Sim</button></div>
         ${det?`<input class="an-det" placeholder="${det}" value="${esc(r.det||'')}" ${r.sim?'':'hidden'} aria-label="${esc(t)}: ${det}">`:''}</div>` }).join('')}</div>
     <div class="field" style="margin-top:12px"><label for="an-obs">Observações</label><textarea id="an-obs" rows="2" placeholder="outras informações de saúde">${esc(a.obs||'')}</textarea></div>
     <div class="row" style="gap:8px"><button class="btn pri" id="an-ok">${ic('check')}Salvar anamnese</button>
       ${a.data?`<button class="btn soft" id="an-imp">${ic('file',16)}Imprimir para assinar</button>`:''}</div>`,
    fechar=>{
      document.querySelectorAll('.an-q').forEach(q=>q.querySelectorAll('[data-an-v]').forEach(b=>b.onclick=()=>{
        q.querySelectorAll('[data-an-v]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
        const i=q.querySelector('.an-det'); if(i){ i.hidden=b.dataset.anV!=='sim'; if(!i.hidden)i.focus() } }));
      const ler=()=>{ const resp={}; document.querySelectorAll('.an-q').forEach(q=>{ const v=q.querySelector('[data-an-v][aria-pressed=true]'), i=q.querySelector('.an-det');
          if(v)resp[q.dataset.an]={sim:v.dataset.anV==='sim',det:i&&v.dataset.anV==='sim'?i.value.trim():''} });
        return {clienteId:cid,data:hojeISO(),resp,queixa:$('#an-queixa').value.trim(),obs:$('#an-obs').value.trim()} };
      $('#an-ok').onclick=()=>{ const n=ler(); S.anamneses=(S.anamneses||[]).filter(z=>z.clienteId!==cid); S.anamneses.push(n); salvar();
        fechar(); toast(alertasDe(cid).length?'Anamnese salva · tem alerta de saúde':'Anamnese salva'); render(); if(depois)setTimeout(depois,260) };
      if($('#an-imp'))$('#an-imp').onclick=()=>imprimir(anamHTML(cid));
    });
}
function anamHTML(cid){ const c=cli(cid), a=anamDe(cid), p=S.perfil||{}; if(!a)return '';
  return `<div class="recibo"><div class="rc-cab"><b class="rc-t">Anamnese</b>${topoRecibo()?`<span>${esc(topoRecibo())}</span>`:''}</div>
    <p><b>Paciente:</b> ${esc(c.nome)}${c.nasc?' · nascimento '+dataBR(c.nasc):''}${c.cpf?' · CPF '+esc(fmtDoc(c.cpf)):''}</p>
    <p><b>Data:</b> ${dataBR(a.data)}</p>${a.queixa?`<p><b>Queixa principal:</b> ${esc(a.queixa)}</p>`:''}
    <table class="an-tab">${ANAM[area()].map(([k,t])=>{ const r=a.resp[k]; return `<tr><td>${t}</td><td>${r?(r.sim?'Sim':'Não'):'—'}${r&&r.det?' · '+esc(r.det):''}</td></tr>` }).join('')}</table>
    ${a.obs?`<p><b>Observações:</b> ${esc(a.obs)}</p>`:''}
    <p style="margin-top:28px">Declaro que as informações acima são verdadeiras.</p>
    <div class="rc-ass"><span></span><small>${esc(c.nome)}</small></div>
    ${p.nome?`<div class="rc-ass"><span></span><small>${esc(p.nome)}${p.registro?' · '+esc(AREAS[area()].reg)+' '+esc(p.registro):''}</small></div>`:''}</div>` }

/* ── Prontuário: uma anotação por atendimento ── */
function prontuario(cid,agId,data,pid){
  const c=cli(cid); if(!c)return; const campos=PRONT_CAMPOS[area()];
  const e=(S.prontuario||[]).find(z=>pid?z.id===pid:(agId&&z.agId===agId))||null;
  const ag=agId?S.agenda.find(a=>a.id===agId):null;
  const d=e?Object.assign({},e):{data:data||hojeISO(),servicoId:ag?ag.servicoId:'',regiao:'',feito:'',mat:'',prox:''};
  const al=alertasDe(cid), ult=prontDe(cid).find(z=>!e||z.id!==e.id);
  abrirSheet(e?'Prontuário':'Anotar no prontuário',esc(c.nome),
    `${al.length?`<div class="alerta-saude" role="note">${ic('alert',16)}<span><b>Atenção:</b> ${al.map(esc).join(' · ')}</span></div>`
      :!anamDe(cid)?`<div class="nota" style="margin-bottom:12px">Sem anamnese ainda. <button type="button" class="lnk" id="pr-anam">Preencher agora</button></div>`:''}
     ${ult?`<div class="nota" style="margin-bottom:12px">Última vez (${dataBR(ult.data)}): ${esc(ult.feito||'—')}${ult.prox?`<br>Combinado: <b>${esc(ult.prox)}</b>`:''}</div>`:''}
     <div class="grid2"><div class="field"><label for="pr-data">Data</label><input id="pr-data" type="date" value="${d.data}"></div>
       <div class="field"><label for="pr-serv">Procedimento</label><select id="pr-serv"><option value="">—</option>${S.servicos.map(s=>`<option value="${s.id}" ${s.id===d.servicoId?'selected':''}>${esc(s.nome)}</option>`).join('')}</select></div></div>
     ${campos.map(([k,l,ph])=>`<div class="field"><label for="pr-${k}">${l}</label>${k==='feito'
       ?`<textarea id="pr-${k}" rows="3" placeholder="${ph}">${esc(d[k]||'')}</textarea>`:`<input id="pr-${k}" placeholder="${ph}" value="${esc(d[k]||'')}">`}</div>`).join('')}
     <div class="row" style="gap:8px"><button class="btn pri" id="pr-ok">${ic('check')}Salvar</button>
       ${e?`<button class="btn danger ic" id="pr-del" aria-label="Excluir anotação">${ic('trash',18)}</button>`:''}</div>`,
    fechar=>{
      if($('#pr-anam'))$('#pr-anam').onclick=()=>{ fechar(); setTimeout(()=>anamnese(cid,()=>prontuario(cid,agId,data,pid)),260) };
      $('#pr-ok').onclick=()=>{
        const n={data:$('#pr-data').value||hojeISO(),servicoId:$('#pr-serv').value}; campos.forEach(([k])=>n[k]=$('#pr-'+k).value.trim());
        if(!n.feito&&!n.regiao&&!n.mat&&!n.prox){ toast('Escreva o que foi feito'); $('#pr-feito').focus(); return }
        if(!S.prontuario)S.prontuario=[];
        if(e)Object.assign(S.prontuario.find(z=>z.id===e.id),n); else S.prontuario.push(Object.assign({id:uid(),clienteId:cid,agId:agId||''},n));
        salvar(); fechar(); toast('Salvo no prontuário'); render() };
      if($('#pr-del'))$('#pr-del').onclick=()=>confirmar('Excluir esta anotação do prontuário?','Ela some do histórico do paciente.','Excluir',()=>{
        S.prontuario=S.prontuario.filter(z=>z.id!==e.id); salvar(); fechar(); toast('Anotação excluída'); render() });
    });
}
/* ficha do paciente: anamnese e prontuário */
function secProntFicha(cid){ if(!temPront())return '';
  const a=anamDe(cid), al=alertasDe(cid), ps=prontDe(cid);
  return `<div class="sec"><div class="sec-top"><h2>Anamnese</h2>${a?`<span class="pill">${dataBR(a.data)}</span>`:''}</div><div class="card">
      ${al.length?`<div class="alerta-saude">${ic('alert',16)}<span>${al.map(esc).join(' · ')}</span></div>`:''}
      ${a?`<p class="sub" style="margin:0 0 10px">${a.queixa?'Queixa: '+esc(a.queixa):'Sem queixa anotada'}${al.length?'':' · nenhum alerta de saúde'}</p>`
        :`<p class="sub" style="margin:0 0 10px">Ainda não preenchida. Leva uns 2 minutos na primeira consulta.</p>`}
      <button class="btn sm ${a?'soft':'pri'}" id="h-anam">${ic('file',16)}${a?'Ver ou atualizar':'Preencher anamnese'}</button></div></div>
    <div class="sec"><div class="sec-top"><h2>Prontuário</h2>${ps.length?`<span class="pill">${ps.length}</span>`:''}</div><div class="card">
      ${ps.length?ps.map(p=>{ const s=serv(p.servicoId);
        return `<button type="button" class="item pr-it" data-pr="${p.id}"><div class="mn"><b>${dataBR(p.data)}${s?' · '+esc(s.nome):''}</b>
          <small>${p.regiao?esc(p.regiao)+' · ':''}${esc(p.feito||'')}${p.prox?` · <b>próximo: ${esc(p.prox)}</b>`:''}</small></div></button>` }).join('')
        :`<p class="sub" style="margin:0 0 10px">Nenhuma anotação ainda. Quando você toca em “Atendeu” na Agenda, o prontuário abre sozinho.</p>`}
      <button class="btn sm soft" id="h-pr-novo" style="margin-top:8px">${ic('plus',16)}Nova anotação</button></div></div>` }
const _topoP=topoHist, _ligaP=ligarTopoHist;
topoHist=c=>_topoP(c)+secProntFicha(c.id);
ligarTopoHist=function(id,fechar){ _ligaP(id,fechar);
  /* saúde primeiro: anamnese e prontuário sobem para logo depois dos números */
  const an=$('#h-anam')&&$('#h-anam').closest('.sec'), pr=$('#h-pr-novo')&&$('#h-pr-novo').closest('.sec'), st=document.querySelector('.sheet .stats');
  if(an&&pr&&st){ let ref=st; if(ref.nextElementSibling&&ref.nextElementSibling.matches('p.sub'))ref=ref.nextElementSibling; ref.after(an); an.after(pr) }
  const volta=()=>setTimeout(()=>historico(id),300);
  if($('#h-anam'))$('#h-anam').onclick=()=>{ fechar(); setTimeout(()=>anamnese(id,volta),260) };
  if($('#h-pr-novo'))$('#h-pr-novo').onclick=()=>{ fechar(); setTimeout(()=>prontuario(id),260) };
  document.querySelectorAll('.sheet [data-pr]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>prontuario(id,'','',b.dataset.pr),260) });
};
/* depois do "Atendeu", o prontuário abre sozinho (como a anotação na psicologia) */
const _posAt=posAtender;
posAtender=function(a){ _posAt(a); if(temPront()&&a.clienteId)setTimeout(()=>prontuario(a.clienteId,a.id,a.data),340) };
