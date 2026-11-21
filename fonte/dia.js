/* ══════════ IMPREVISTO NO DIA ══════════
   Faltou luz, alguém adoeceu: avisa cada cliente do dia pelo WhatsApp, marca como cancelado
   e guarda numa lista "Para remarcar" até a pessoa ganhar um novo horário. */
MSG_PAD.cancelamento='Oi, {nome}! Tive um imprevisto ({motivo}) e não vou conseguir te atender no dia {data}, às {hora}. Peço desculpas pelo transtorno. Qual o melhor dia e horário para a gente remarcar?';
MSG_ROT.cancelamento='Cancelamento por imprevisto';
function textoCancel(a,motivo){ const c=cli(a.clienteId), s=serv(a.servicoId);
  let t=msgDe('cancelamento'); if(!motivo)t=t.replace(/\s*\(\{motivo\}\)/g,'').replace(/\{motivo\}/g,'um imprevisto');
  return preenche(t,{nome:c?c.nome.split(' ')[0]:'',data:dataMsg(a.data),hora:a.hora||'',procedimento:s?s.nome:'',motivo:motivo,clinica:UI.clinica||''}) }
function cancelarDia(dia){
  const ids=S.agenda.filter(a=>a.status==='marcado'&&a.data===dia).sort((a,b)=>(a.hora||'').localeCompare(b.hora||'')).map(a=>a.id);
  let motivo='';
  abrirSheet('Imprevisto no dia',`${dataBR(dia)} · ${diaSemana(dia)} · ${ids.length} horário(s) marcado(s)`,
    `<div class="field"><label for="cd-mot">O que aconteceu? (entra na mensagem)</label>
       <input id="cd-mot" placeholder="falta de energia, problema de saúde..." maxlength="60">
       <div class="chips" style="margin-top:8px">${['falta de energia','problema de saúde','um problema no espaço'].map(m=>`<button class="chip" data-cd-m="${m}">${m}</button>`).join('')}</div></div>
     <div class="nota" id="cd-previa" style="margin-bottom:12px"></div>
     <div id="cd-lista"></div>
     <p class="sub" style="margin:12px 0">O WhatsApp abre uma conversa por vez, com a mensagem pronta. Quem você avisa sai da agenda do dia e vai para a lista “Para remarcar”.</p>
     <div class="row"><button class="btn pri" id="cd-fim" style="flex:1">${ic('check')}Concluir</button>
       <button class="btn soft" id="cd-todos">Cancelar os restantes sem avisar</button></div>`,
    fechar=>{
      const pinta=()=>{ const as=ids.map(i=>S.agenda.find(a=>a.id===i)).filter(Boolean), rest=as.filter(a=>a.status==='marcado');
        $('#cd-previa').textContent=as.length?textoCancel(rest[0]||as[0],motivo):'';
        $('#cd-todos').hidden=!rest.length;
        $('#cd-lista').innerHTML=`<p class="eyebrow" style="margin-bottom:4px">${as.length-rest.length} de ${as.length} cancelado(s)</p>`+as.map(a=>{ const c=cli(a.clienteId), s=serv(a.servicoId), ok=a.status!=='marcado';
          return `<div class="item"><div class="mn"><b>${esc(c?c.nome:'Sem cadastro')} ${ok?`<span class="pill ${a.cancelMsg?'ok':''}">${a.cancelMsg?'avisada':'cancelado'}</span>`:''}</b>
            <small>${a.hora||'sem hora'}${s?' · '+esc(s.nome):''}${c&&!c.tel?' · sem telefone':''}</small></div>
            <div class="acts">${c?`<a class="btn sm ${ok?'soft':'pri'}" data-cd-env="${a.id}" target="_blank" rel="noopener" href="#">${ic('chat',16)}${a.cancelMsg?'Reenviar':'Avisar'}</a>`
              :`<button class="btn sm soft" data-cd-so="${a.id}" ${ok?'disabled':''}>Cancelar</button>`}</div></div>` }).join('');
        document.querySelectorAll('[data-cd-env]').forEach(b=>b.addEventListener('click',()=>{ const a=S.agenda.find(z=>z.id===b.dataset.cdEnv); if(!a)return;
          b.href=linkZap(cli(a.clienteId),textoCancel(a,motivo)); a.status='cancelado'; a.cancelMsg=true; a.remarcar=true; salvar(); setTimeout(pinta,400) }));
        document.querySelectorAll('[data-cd-so]').forEach(b=>b.onclick=()=>{ const a=S.agenda.find(z=>z.id===b.dataset.cdSo); if(a){ a.status='cancelado'; salvar(); pinta() } }) };
      const mi=$('#cd-mot'); mi.addEventListener('input',()=>{ motivo=mi.value.trim(); $('#cd-previa').textContent=textoCancel(S.agenda.find(a=>a.id===ids[0])||{},motivo) });
      document.querySelectorAll('[data-cd-m]').forEach(b=>b.onclick=()=>{ mi.value=b.dataset.cdM; motivo=mi.value; pinta() });
      $('#cd-fim').onclick=()=>{ fechar(); render() };
      $('#cd-todos').onclick=()=>{ ids.forEach(i=>{ const a=S.agenda.find(z=>z.id===i); if(a&&a.status==='marcado'){ a.status='cancelado'; a.remarcar=!!cli(a.clienteId) } }); salvar(); pinta() };
      pinta();
    });
}
function remarcar(a){ const c=cli(a.clienteId), s=serv(a.servicoId);
  abrirSheet('Remarcar',`${esc(c?c.nome:'Sem cadastro')}${s?' · '+esc(s.nome):''} · era ${dataBR(a.data)}${a.hora?' às '+a.hora:''}`,
    `<div class="grid2"><div class="field"><label>Novo dia</label><input id="rm-data" type="date" value="${a.data>hojeISO()?a.data:somaDias(hojeISO(),1)}" min="${hojeISO()}"></div>
       <div class="field"><label>Hora</label><input id="rm-hora" type="time" value="${esc(a.hora||'')}"></div></div>
     <div class="row"><button class="btn pri" id="rm-ok" style="flex:1">${ic('check')}Remarcar</button><button class="btn soft" id="rm-no">Cancelar</button></div>`,
    fechar=>{ $('#rm-no').onclick=fechar;
      $('#rm-ok').onclick=()=>{ const d=$('#rm-data').value; if(!d)return toast('Escolha o novo dia');
        Object.assign(a,{data:d,hora:$('#rm-hora').value||'',status:'marcado'}); delete a.remarcar; delete a.cancelMsg; delete a.avisado; delete a.reservaMsg;
        agDia=d; salvar(); fechar(); render(); setTimeout(()=>{ if(cli(a.clienteId))msgAgenda(a,'reserva') },320) } });
}
function extrasAgenda(el){
  if(tela!=='agenda')return;
  const pend=S.agenda.filter(a=>a.status==='cancelado'&&a.remarcar).sort((a,b)=>a.data.localeCompare(b.data)||(a.hora||'').localeCompare(b.hora||''));
  const prim=el.querySelector(':scope > .sec');
  if(pend.length&&prim){
    prim.insertAdjacentHTML('afterend',`<div class="sec"><div class="sec-top"><h2>Para remarcar</h2><span class="pill war">${pend.length}</span></div><div class="card">${pend.map(a=>{
      const c=cli(a.clienteId), s=serv(a.servicoId);
      return `<div class="item"><div class="mn"><b>${esc(c?c.nome:'Sem cadastro')}</b><small>era ${dataBR(a.data)}${a.hora?' às '+a.hora:''}${s?' · '+esc(s.nome):''}</small></div>
        <div class="acts"><button class="btn sm pri" data-rm="${a.id}">${ic('calendar',16)}Remarcar</button>
          <button class="btn sm soft" data-rm-x="${a.id}">Não vai remarcar</button></div></div>` }).join('')}</div></div>`);
    el.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{ const a=S.agenda.find(z=>z.id===b.dataset.rm); if(a)remarcar(a) });
    el.querySelectorAll('[data-rm-x]').forEach(b=>b.onclick=()=>{ const a=S.agenda.find(z=>z.id===b.dataset.rmX); if(a){ delete a.remarcar; salvar(); render() } });
  }
  const di=el.querySelector('#ag-data'), hoje=hojeISO();
  if(di&&agDia>=hoje&&S.agenda.some(a=>a.status==='marcado'&&a.data===agDia)){
    di.closest('.sec').insertAdjacentHTML('beforeend',`<button class="btn-tx" id="ag-imprev" style="display:block;margin:6px auto 0">Imprevisto? Cancelar os horários deste dia</button>`);
    $('#ag-imprev').onclick=()=>cancelarDia(agDia);
  }
}

