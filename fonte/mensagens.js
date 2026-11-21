/* ══════════ MENSAGENS DO WHATSAPP ══════════
   Três modelos editáveis nos Ajustes: horário reservado, lembrete e orçamento.
   O texto sempre passa por uma prévia editável antes de abrir o WhatsApp. */
const MSG_PAD={
  reserva:'Oi, *{nome}*! Seu horário está garantido: *{data}*, às *{hora}*, para *{procedimento}*. Se surgir algum imprevisto, me avise com antecedência para eu conseguir remarcar. Até lá!',
  lembrete:'Oi, {nome}! Passando para lembrar do seu horário em {data}, às {hora}. Posso confirmar a sua presença?\nSe não puder vir, me avise assim que souber.',
  orcamento:'Oi, {nome}! Seu orçamento ficou pronto:\n\n*O que está incluso:* {itens}\n*Investimento:* {total}\n*Válido até:* {validade}\n\nFicou com alguma dúvida ou quer ajustar alguma coisa? É só me chamar por aqui.'
};
const MSG_ROT={reserva:'Horário reservado',lembrete:'Lembrete',orcamento:'Orçamento'};
const msgDe=k=>(S.msgs&&typeof S.msgs[k]==='string'&&S.msgs[k].trim())?S.msgs[k]:MSG_PAD[k];
const dataMsg=iso=>{const p=String(iso||'').split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0].slice(2)}`:''};
const dataMsgLonga=iso=>{const p=String(iso||'').split('-');return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:''};
function preenche(t,v){
  if(!v.hora)t=t.replace(/,?\s*às \*?\{hora\}\*?/g,'');            /* sem hora marcada: tira o trecho inteiro */
  if(!v.nome)t=t.replace(/,?\s*\*?\{nome\}(\.\*)?\*?/g,'');        /* sem cadastro: "Oi! Seu orçamento..." */
  if(!v.procedimento)t=t.replace(/,?\s*para (realizar )?\*?\{procedimento\}\*?/g,'');
  return t.replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null&&v[k]!==''?v[k]:m);
}
const linkZap=(c,msg)=>(c&&c.tel&&zap(c.tel,msg))||'https://wa.me/?text='+encodeURIComponent(msg);
function textoAg(a,tipo){ const c=cli(a.clienteId), s=serv(a.servicoId);
  return preenche(msgDe(tipo),{nome:c?c.nome.split(' ')[0]:'',data:dataMsg(a.data),hora:a.hora||'',procedimento:s?s.nome:'',clinica:UI.clinica||''}) }
function textoOrc(o){ const c=cli(o.clienteId), t=calcOrc(o);
  return preenche(msgDe('orcamento'),{nome:c?c.nome.split(' ')[0]:'',clinica:UI.clinica||'',total:brl(t.total),
    validade:dataMsgLonga(o.validade||proxMes(o.data||hojeISO())),
    itens:o.itens.map(i=>{const s=serv(i.servicoId);return `${Math.max(1,parseInt(i.sessoes)||1)}x ${s?s.nome:'Procedimento'}`}).join(', ')}) }

/* prévia editável + botão de envio. marcar(tipo) roda quando a pessoa toca em enviar */
function folhaMsg(titulo,sub,c,tipos,textoDe,marcar){
  let tipo=tipos[0];
  abrirSheet(titulo,sub,
    `${tipos.length>1?`<div class="abas" role="group" aria-label="Qual mensagem" style="margin:0 0 12px">${tipos.map(t=>
        `<button data-mz="${t}" aria-pressed="${t===tipo}">${MSG_ROT[t]}</button>`).join('')}</div>`:''}
     <div class="field"><label for="mz-tx">Mensagem (pode ajustar antes de enviar)</label><textarea id="mz-tx" rows="8"></textarea></div>
     ${c&&c.tel?'':'<div class="nota" style="margin-bottom:12px">Sem telefone no cadastro: o WhatsApp vai pedir para você escolher o contato.</div>'}
     <div class="row"><a class="btn pri" id="mz-ok" style="flex:1" target="_blank" rel="noopener" href="#">${ic('chat')}Enviar no WhatsApp</a>
       <button class="btn soft" id="mz-no">Agora não</button></div>
     <p class="sub" style="margin-top:10px">O texto padrão muda em Ajustes, na parte de mensagens do WhatsApp.</p>`,
    fechar=>{ const tx=$('#mz-tx'), ok=$('#mz-ok'); tx.value=textoDe(tipo);
      document.querySelectorAll('[data-mz]').forEach(b=>b.onclick=()=>{ tipo=b.dataset.mz; tx.value=textoDe(tipo);
        document.querySelectorAll('[data-mz]').forEach(z=>z.setAttribute('aria-pressed',String(z===b))) });
      $('#mz-no').onclick=fechar;
      ok.addEventListener('click',()=>{ ok.href=linkZap(c,tx.value); marcar(tipo); setTimeout(()=>{fechar();render()},500) }) });
}
function msgAgenda(a,tipo){ const c=cli(a.clienteId), s=serv(a.servicoId);
  folhaMsg(tipo==='reserva'?'Avisar a cliente':'Enviar lembrete',
    `${c?esc(c.nome):'Sem cadastro'} · ${dataBR(a.data)}${a.hora?' às '+a.hora:''}${s?' · '+esc(s.nome):''}`,
    c,tipo==='reserva'?['reserva','lembrete']:['lembrete','reserva'],t=>textoAg(a,t),
    t=>{ if(t==='reserva')a.reservaMsg=true; else a.avisado=true; salvar() }) }
function msgOrc(o){ const c=cli(o.clienteId);
  folhaMsg('Enviar orçamento',`${c?esc(c.nome):'Sem cadastro'} · ${brl(calcOrc(o).total)}`,c,['orcamento'],()=>textoOrc(o),()=>{}) }
function btnMsg(a){ if(!cli(a.clienteId)||a.data<hojeISO())return '';
  return `<button class="btn sm soft" data-msg-a="${a.id}">${ic('chat',16)}Lembrete</button>` }
const pillsMsg=a=>(a.reservaMsg?' <span class="pill ac">reserva avisada</span>':'')+(a.avisado?' <span class="pill ac">lembrete enviado</span>':'');
function ligarMsg(){ document.querySelectorAll('[data-msg-a]').forEach(b=>b.onclick=()=>{
  const a=S.agenda.find(z=>z.id===b.dataset.msgA); if(a)msgAgenda(a,'lembrete') }) }

function secMsgs(){
  const campo=(k,dica)=>`<div class="field"><label for="mg-${k}">${MSG_ROT[k]}</label>
    <textarea id="mg-${k}" rows="${k==='orcamento'?9:5}">${esc(msgDe(k))}</textarea><p class="sub">${dica}</p></div>`;
  return `<div class="sec"><div class="card">
    <h2 style="margin-bottom:4px">Mensagens do WhatsApp</h2>
    <p class="sub" style="margin-bottom:14px">Escreva do seu jeito. O que está entre chaves é trocado pelos dados de cada cliente, e os asteriscos deixam o trecho em negrito no WhatsApp.</p>
    ${campo('reserva','Oferecida logo depois de agendar. Usa {nome}, {data}, {hora} e {procedimento}.')}
    ${campo('lembrete','Botão “Lembrete” em cada horário da Agenda. Usa {nome}, {data}, {hora} e {procedimento}.')}
    ${campo('orcamento','Botão “Enviar orçamento” no Simulador. Usa {nome}, {itens}, {total} e {validade}.')}
    <div class="row"><button class="btn pri" id="mg-ok" style="flex:1">${ic('check')}Salvar mensagens</button>
      <button class="btn soft" id="mg-pad">Voltar ao texto original</button></div>
  </div></div>`;
}
function ligarMsgs(){
  $('#mg-ok').onclick=()=>{ S.msgs={}; Object.keys(MSG_PAD).forEach(k=>{ const v=$('#mg-'+k).value; if(v.trim()&&v!==MSG_PAD[k])S.msgs[k]=v });
    salvar(); toast('Mensagens salvas'); render() };
  $('#mg-pad').onclick=()=>confirmar('Voltar ao texto original?','As três mensagens voltam ao texto que veio com o Lucra.','Voltar ao original',
    ()=>{ delete S.msgs; salvar(); toast('Mensagens restauradas'); render() });
}

