/* ══════════ AGENDA: horário fixo que se repete e link da sessão online ══════════ */
function addMes(iso,n){ const [a,m,d]=iso.split('-').map(Number); const u=new Date(a,m-1+n+1,0).getDate(), x=new Date(a,m-1+n,Math.min(d,u));
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}` }
function camposAgenda(ed){
  const p=ehPsico();
  let x='';
  if(!ed)x+=`<div class="grid2">
      <div class="field"><label>Repetir</label><select id="a-rep">
        ${[['','Não repete'],['7','Toda semana'],['14','A cada 2 semanas'],['m','Todo mês']].map(o=>`<option value="${o[0]}">${o[1]}</option>`).join('')}</select></div>
      <div class="field" id="a-vezes-box" style="display:none"><label>Por quanto tempo</label><select id="a-vezes"><option value="" selected>Escolha</option>
        ${[4,8,12,24].map(n=>`<option value="${n}">${n} vezes</option>`).join('')}</select></div></div>`;
  if(p||(ed&&ed.link))x+=`<div class="field"><label>Link da sessão online (opcional)</label>
      <input id="a-link" type="url" inputmode="url" placeholder="https://meet.google.com/..." value="${esc(ed&&ed.link||'')}"></div>`;
  return x;
}
/* cria as próximas datas da série; devolve quantas criou */
function repete(a){
  const r=$('#a-rep'), v=$('#a-vezes'); if(!r||!r.value)return 0;
  const n=Math.max(1,parseInt(v&&v.value)||1); a.serie=uid();
  for(let i=1;i<n;i++){ const d=r.value==='m'?addMes(a.data,i):somaDias(a.data,i*parseInt(r.value));
    S.agenda.push({id:uid(),data:d,hora:a.hora,clienteId:a.clienteId,servicoId:a.servicoId,obs:a.obs,link:a.link||'',status:'marcado',serie:a.serie}) }
  return n-1;
}
function excluirAg(a){
  const futuros=a.serie?S.agenda.filter(z=>z.serie===a.serie&&z.id!==a.id&&z.status==='marcado'&&z.data>a.data):[];
  if(!futuros.length)return confirmar('Excluir este agendamento?','O horário some da agenda. Não dá para desfazer.','Excluir',
    ()=>{ S.agenda=S.agenda.filter(z=>z.id!==a.id); salvar(); render(); toast('Excluído') },true);
  abrirSheet('Excluir horário','Este horário faz parte de uma série que se repete',
    `<p class="conf-tx">Há mais <b>${futuros.length}</b> horário(s) marcados depois deste na mesma série.</p>
     <div style="display:grid;gap:8px;margin-top:16px">
       <button class="btn soft full" id="xs-um">Excluir só este</button>
       <button class="btn perigo full" id="xs-todos">Excluir este e os próximos</button>
       <button class="btn-tx" id="xs-no">Voltar</button></div>`,
    fechar=>{ $('#xs-no').onclick=fechar; $('#xs-no').focus();
      $('#xs-um').onclick=()=>{ S.agenda=S.agenda.filter(z=>z.id!==a.id); salvar(); fechar(); render(); toast('Excluído') };
      $('#xs-todos').onclick=()=>{ const ids=new Set(futuros.map(z=>z.id).concat(a.id)); S.agenda=S.agenda.filter(z=>!ids.has(z.id));
        salvar(); fechar(); render(); toast(ids.size+' horários excluídos') } });
}
/* aceita o link colado sem "https://" (ex.: meet.google.com/abc-defg-hij) */
const urlSessao=l=>{ l=String(l||'').trim(); if(!l)return ''; if(/^https?:\/\//i.test(l))return l; return /^[\w-]+(\.[\w-]+)+/.test(l)?'https://'+l:'' };
const btnLink=a=>urlSessao(a.link)?`<a class="btn sm soft" href="${esc(urlSessao(a.link))}" target="_blank" rel="noopener">${ic('arrow',16)}Entrar na sessão</a>`:'';
const btnNota=a=>ehPsico()&&a.status==='concluido'&&a.clienteId
  ?`<button class="btn sm ${S.evolucoes.some(e=>e.agId===a.id)?'soft':'pri'}" data-nota-a="${a.id}">${ic('edit',16)}${S.evolucoes.some(e=>e.agId===a.id)?'Anotação':'Anotar sessão'}</button>`:'';

/* depois de "Atendeu": pacote, pagar depois e, na psicologia, a anotação */
function extrasFechar(a,s){
  const c=cli(a.clienteId); if(!c)return '';
  const p=pacotesAbertos().filter(z=>z.venda.clienteId===c.id).sort((x,y)=>(y.venda.servicoId===s.id)-(x.venda.servicoId===s.id))[0];
  return `<div class="ou"><span>ou</span></div>
    ${p?`<button class="btn soft full" id="k-pac">${ic('check')}Usar sessão do pacote · restam ${p.c.restam}</button>`:''}
    <button class="btn soft full" id="k-dep" style="margin-top:8px">${ic('clock')}Atendido, vai pagar depois</button>`;
}
function ligarExtrasFechar(a,s,fechar){
  const c=cli(a.clienteId); if(!c)return;
  const p=pacotesAbertos().filter(z=>z.venda.clienteId===c.id).sort((x,y)=>(y.venda.servicoId===s.id)-(x.venda.servicoId===s.id))[0];
  if($('#k-pac'))$('#k-pac').onclick=()=>{ fechar(); setTimeout(()=>usarSessao(p.venda.id,()=>{ a.status='concluido'; salvar(); render(); posAtender(a) }),260) };
  $('#k-dep').onclick=()=>{ const v=num($('#k-valor').value); if(v<=0)return toast('Informe o valor');
    S.receber.push({id:uid(),clienteId:c.id,servicoId:s.id,valor:v,data:a.data,desc:s.nome,agId:a.id});
    a.status='concluido'; salvar(); fechar(); toast('Anotado em A receber'); render(); posAtender(a) };
}
function posAtender(a){ if(ehPsico()&&a.clienteId)setTimeout(()=>anotarSessao(a.clienteId,a.id,a.data),340) }
function aposFalta(a){
  const f=regraFalta(), c=cli(a.clienteId), s=serv(a.servicoId);
  if(!f.cobrar||!c||!s){ toast('Marcado como falta'); return }
  abrirSheet('Cobrar a falta?',`${esc(c.nome)} · ${dataBR(a.data)}${a.hora?' às '+a.hora:''}`,
    `<p class="conf-tx">Pela sua regra, falta sem aviso de <b>${f.horas} horas</b> é cobrada. Se o paciente avisou a tempo, é só não cobrar.</p>
     <div class="field" style="margin-top:12px"><label for="fc-v">Valor</label><input id="fc-v" inputmode="decimal" value="${vg(s.preco)}"></div>
     <div class="row"><button class="btn pri" id="fc-ok" style="flex:1">Cobrar · vai para A receber</button>
       <button class="btn soft" id="fc-no">Não cobrar</button></div>`,
    fechar=>{ $('#fc-no').onclick=()=>{ fechar(); toast('Falta registrada, sem cobrança') };
      $('#fc-ok').onclick=()=>{ const v=num($('#fc-v').value); if(v<=0)return toast('Informe o valor');
        S.receber.push({id:uid(),clienteId:c.id,servicoId:s.id,valor:v,data:a.data,desc:'Falta sem aviso',agId:a.id});
        salvar(); fechar(); toast('Falta lançada em A receber'); render() } });
}

/* ══════════ A RECEBER: atendido e ainda não pago (fiado, boleto, falta cobrada) ══════════
   Só vira faturamento quando o dinheiro entra, igual ao resto do Lucra. */
const totalReceber=()=>S.receber.reduce((a,r)=>a+num(r.valor),0);
function gruposReceber(){ const g={};
  S.receber.forEach(r=>{ const k=r.clienteId||'x', a=g[k]||(g[k]={cid:k,itens:[],total:0}); a.itens.push(r); a.total+=num(r.valor) });
  return Object.values(g).map(x=>(x.itens.sort((a,b)=>a.data.localeCompare(b.data)),x)).sort((a,b)=>a.itens[0].data.localeCompare(b.itens[0].data)) }
function tileReceber(){ if(!S.receber.length&&!ehPsico())return '';
  const gs=gruposReceber();
  return `<button class="tile" id="ir-rec"><span class="tile-top"><span class="ico">${ic('coins',17)}</span><span class="eyebrow">A receber</span></span>
    <div class="tile-n ${gs.length?'v-war':'v-ok'}">${gs.length?brl(totalReceber()):'Tudo pago'}</div>
    <div class="sub">${gs.length?gs.length+' cliente(s) com valor em aberto':'ninguém devendo'}</div></button>` }
function secReceber(){ const gs=gruposReceber(); if(!gs.length)return '';
  let x=`<div class="sec"><div class="sec-top"><h2>A receber</h2><span class="pill war">${brl(totalReceber())}</span></div><div class="card">`;
  gs.forEach(g=>{ const c=cli(g.cid), d=diasEntre(g.itens[0].data,hojeISO());
    x+=`<div class="item"><div class="mn"><b>${esc(c?c.nome:'Sem cadastro')}</b>
      <small>${g.itens.length} item(ns) · ${g.itens.map(i=>dataBR(i.data)).join(', ')}${d>=30?` · <b class="v-bad">há ${d} dias</b>`:''}</small></div>
      <div class="vr">${brl(g.total)}</div>
      <div class="acts"><button class="btn sm pri" data-rec="${g.cid}">${ic('check',16)}Recebi</button>
        ${c?`<button class="btn sm soft" data-cob="${g.cid}">${ic('chat',16)}Cobrar</button>`:''}</div></div>` });
  return x+`</div></div>`;
}
function ligarReceber(){
  document.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>receberSheet(b.dataset.rec));
  document.querySelectorAll('[data-cob]').forEach(b=>b.onclick=()=>cobrar(b.dataset.cob));
}
function textoCobranca(cid){ const c=cli(cid), its=S.receber.filter(r=>r.clienteId===cid).sort((a,b)=>a.data.localeCompare(b.data));
  return preenche(msgDe('cobranca'),{nome:c?c.nome.split(' ')[0]:'',total:brl(its.reduce((a,r)=>a+num(r.valor),0)),
    itens:its.map(r=>`${r.desc||'atendimento'} de ${dataBR(r.data)}`).join(', '),clinica:UI.clinica||''}) }
function cobrar(cid){ const c=cli(cid);
  folhaMsg('Cobrar pelo WhatsApp',`${esc(c?c.nome:'')} · ${brl(S.receber.filter(r=>r.clienteId===cid).reduce((a,r)=>a+num(r.valor),0))}`,
    c,['cobranca'],()=>textoCobranca(cid),()=>{}) }
function receberSheet(cid){
  const c=cli(cid), its=S.receber.filter(r=>(r.clienteId||'x')===cid).sort((a,b)=>a.data.localeCompare(b.data)); if(!its.length)return;
  abrirSheet('Recebi',`${esc(c?c.nome:'Sem cadastro')}`,
    `<p class="sub" style="margin-bottom:6px">Marque o que foi pago agora. Vai para o caixa com a data de hoje.</p>
     <div class="card" style="padding:4px 14px;margin-bottom:12px">${its.map(r=>`<div class="ck-l"><label class="sw"><input type="checkbox" data-rc="${r.id}" checked>
       <span style="flex:1">${esc(r.desc||'Atendimento')} · ${dataBR(r.data)}</span><b>${brl(num(r.valor))}</b></label></div>`).join('')}</div>
     <div class="grid2"><div class="field"><label for="rc-f">Como pagou</label><select id="rc-f">${FORMAS.map(f=>`<option value="${f.k}">${f.n}</option>`).join('')}</select></div>
       <div class="field" id="rc-bp" style="display:none"><label for="rc-p">Parcelas</label><select id="rc-p">${Array.from({length:11},(_,i)=>i+2).map(n=>`<option value="${n}">${n}x</option>`).join('')}</select></div></div>
     <div class="rap-sobra" id="rc-s"></div>
     <div class="row" style="margin-top:12px"><button class="btn pri" id="rc-ok" style="flex:1">${ic('check')}Confirmar recebimento</button>
       <button class="btn soft" id="rc-no">Cancelar</button></div>
     <button class="btn-tx" id="rc-tira" style="display:block;margin:8px auto 0">Tirar os marcados da lista sem receber</button>`,
    fechar=>{
      const sel=()=>its.filter(r=>{ const k=document.querySelector(`[data-rc="${r.id}"]`); return k&&k.checked });
      const venda=r=>({servicoId:r.servicoId,valor:num(r.valor),forma:$('#rc-f').value,parcelas:$('#rc-f').value==='parc'?parseInt($('#rc-p').value)||2:1,sessoes:1,desloc:0});
      const pinta=()=>{ $('#rc-bp').style.display=$('#rc-f').value==='parc'?'':'none';
        const ss=sel(), t=ss.reduce((a,r)=>a+num(r.valor),0), l=ss.reduce((a,r)=>a+conta(venda(r)).lucro,0);
        $('#rc-s').innerHTML=`<span>${brl(t)} entram · sobra</span><b class="${l>=0?'v-ok':'v-bad'}">${brl(l)}</b>` };
      document.querySelectorAll('[data-rc],#rc-f,#rc-p').forEach(e=>e.addEventListener('change',pinta)); pinta();
      $('#rc-no').onclick=fechar;
      $('#rc-ok').onclick=()=>{ const ss=sel(); if(!ss.length)return toast('Marque pelo menos um item');
        ss.forEach(r=>S.vendas.push(Object.assign({id:uid(),data:hojeISO(),sessao:r.data,usadas:[],clienteId:r.clienteId||'',cliente:c?c.nome:''},venda(r))));
        const ids=new Set(ss.map(r=>r.id)); S.receber=S.receber.filter(r=>!ids.has(r.id));
        mesSel=mesAtual(); salvar(); fechar(); toast('Recebido · lançado no caixa'); render() };
      $('#rc-tira').onclick=()=>{ const ss=sel(); if(!ss.length)return toast('Marque pelo menos um item');
        confirmar('Tirar da lista?','Os itens marcados saem de “A receber” sem entrar no caixa. Use quando você decidiu não cobrar.','Tirar da lista',
          ()=>{ const ids=new Set(ss.map(r=>r.id)); S.receber=S.receber.filter(r=>!ids.has(r.id)); salvar(); fechar(); render(); toast('Removido') },true) };
    });
}

/* ══════════ EVOLUÇÃO POR SESSÃO (psicologia) ══════════ */
const SINAIS=['Sinais depressivos','Ansiedade intensa','Alteração de sono','Alteração de apetite','Isolamento social','Uso de substâncias','Sinais de risco'];
const EVOL={melhora:['Evoluindo','ok'],estavel:['Estável',''],piora:['Regredindo','bad']};
const evolucoesDe=cid=>S.evolucoes.filter(e=>e.clienteId===cid).sort((a,b)=>a.data.localeCompare(b.data)||String(a.id).localeCompare(String(b.id)));
function anotarSessao(cid,agId,data,evoId){
  const c=cli(cid); if(!c)return;
  const e=S.evolucoes.find(z=>evoId?z.id===evoId:(agId&&z.agId===agId))||null;
  const d=e?JSON.parse(JSON.stringify(e)):{data:data||hojeISO(),humor:5,sinais:[],evolucao:'',foco:'',chegada:'',notas:'',proximo:''};
  const ant=evolucoesDe(cid).filter(z=>(!e||z.id!==e.id)&&z.data<=d.data).pop();
  abrirSheet(e?'Anotação da sessão':'Anotar sessão',`${esc(c.nome)}`,
    `${ant?`<div class="nota" style="margin-bottom:14px">Sessão anterior (${dataBR(ant.data)}): humor <b>${ant.humor}/10</b>${ant.evolucao?' · '+EVOL[ant.evolucao][0].toLowerCase():''}${ant.proximo?`<br>Combinado: <b>${esc(ant.proximo)}</b>`:''}</div>`:''}
     <div class="field"><label for="ev-data">Data da sessão</label><input id="ev-data" type="date" value="${d.data}"></div>
     <div class="field"><label for="ev-foco">Foco da sessão</label><textarea id="ev-foco" rows="2" placeholder="tema principal trabalhado">${esc(d.foco)}</textarea></div>
     <div class="field"><label for="ev-cheg">Como chegou hoje</label><textarea id="ev-cheg" rows="2" placeholder="estado geral, queixas, acontecimentos da semana">${esc(d.chegada)}</textarea></div>
     <label for="ev-humor">Humor hoje: <b id="ev-hv">${d.humor}</b> de 10</label>
     <input id="ev-humor" class="faixa" type="range" min="1" max="10" step="1" value="${d.humor}">
     <div class="faixa-rot"><span>1 · muito baixo</span><span>10 · muito bom</span></div>
     <label id="ev-ls" style="margin-top:16px">Sinais observados</label>
     <div class="chips" role="group" aria-labelledby="ev-ls">${SINAIS.map(s=>`<button class="chip" data-sinal="${s}" aria-pressed="${d.sinais.includes(s)}">${s}</button>`).join('')}</div>
     <div class="nota risco" id="ev-risco" ${d.sinais.includes('Sinais de risco')?'':'hidden'} style="margin-top:10px">Registre nas anotações a avaliação feita e a conduta adotada.</div>
     <label id="ev-le" style="margin-top:16px">Evolução</label>
     <div class="abas" role="group" aria-labelledby="ev-le" style="margin-top:0">${Object.keys(EVOL).map(k=>`<button data-evol="${k}" aria-pressed="${d.evolucao===k}">${EVOL[k][0]}</button>`).join('')}</div>
     <div class="field" style="margin-top:16px"><label for="ev-notas">Anotações</label><textarea id="ev-notas" rows="5">${esc(d.notas)}</textarea></div>
     <div class="field"><label for="ev-prox">Para a próxima sessão</label><input id="ev-prox" placeholder="tarefa, tema para retomar..." value="${esc(d.proximo)}"></div>
     <div class="row"><button class="btn pri" id="ev-ok" style="flex:1">${ic('check')}Salvar anotação</button><button class="btn soft" id="ev-no">Cancelar</button></div>
     ${e?`<button class="btn-tx" id="ev-del" style="display:block;margin:8px auto 0">Excluir anotação</button>`:''}
     <p class="sub" style="margin-top:10px">A anotação fica só neste aparelho e entra no backup junto com o resto dos dados.</p>`,
    fechar=>{
      const h=$('#ev-humor'); h.addEventListener('input',()=>$('#ev-hv').textContent=h.value);
      document.querySelectorAll('[data-sinal]').forEach(b=>b.onclick=()=>{ b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));
        $('#ev-risco').hidden=document.querySelector('[data-sinal="Sinais de risco"]').getAttribute('aria-pressed')!=='true' });
      document.querySelectorAll('[data-evol]').forEach(b=>b.onclick=()=>{ const on=b.getAttribute('aria-pressed')==='true';
        document.querySelectorAll('[data-evol]').forEach(z=>z.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed',String(!on)) });
      $('#ev-no').onclick=fechar;
      const depois=()=>{ if($('#h-evo'))pintaEvolucao(cid); render() };
      $('#ev-ok').onclick=()=>{
        const ev=document.querySelector('[data-evol][aria-pressed="true"]');
        const n={id:e?e.id:uid(),clienteId:cid,agId:e?e.agId:(agId||''),data:$('#ev-data').value||hojeISO(),
          foco:$('#ev-foco').value.trim(),chegada:$('#ev-cheg').value.trim(),humor:parseInt(h.value)||5,
          sinais:[...document.querySelectorAll('[data-sinal][aria-pressed="true"]')].map(b=>b.dataset.sinal),
          evolucao:ev?ev.dataset.evol:'',notas:$('#ev-notas').value.trim(),proximo:$('#ev-prox').value.trim()};
        if(e)Object.assign(e,n); else S.evolucoes.push(n);
        salvar(); fechar(); toast('Anotação salva'); depois() };
      if($('#ev-del'))$('#ev-del').onclick=()=>confirmar('Excluir esta anotação?','A anotação desta sessão é apagada deste aparelho. Não dá para desfazer.','Excluir',
        ()=>{ S.evolucoes=S.evolucoes.filter(z=>z.id!==e.id); salvar(); fechar(); toast('Anotação excluída'); depois() },true);
    });
}
function graficoHumor(evs){
  const pts=evs.slice(-16); if(pts.length<2)return '';
  const W=320,H=120,px=14,py=12, X=i=>px+i*(W-2*px)/(pts.length-1), Y=v=>H-py-(v-1)*(H-2*py)/9;
  return `<svg class="humor" viewBox="0 0 ${W} ${H}" role="img" aria-label="Humor nas últimas ${pts.length} sessões, de ${pts[0].humor} para ${pts[pts.length-1].humor}">
    ${[1,5,10].map(v=>`<line x1="${px}" x2="${W-px}" y1="${Y(v)}" y2="${Y(v)}" class="g"/><text x="0" y="${Y(v)+3}">${v}</text>`).join('')}
    <polyline points="${pts.map((e,i)=>X(i)+','+Y(e.humor)).join(' ')}" class="l"/>
    ${pts.map((e,i)=>`<circle cx="${X(i)}" cy="${Y(e.humor)}" r="${e.sinais.includes('Sinais de risco')?5:3.5}" class="${e.sinais.includes('Sinais de risco')?'r':'p'}"><title>${dataBR(e.data)}: humor ${e.humor}</title></circle>`).join('')}
  </svg><div class="humor-x"><span>${dataBR(pts[0].data)}</span><span>${dataBR(pts[pts.length-1].data)}</span></div>`;
}
function pintaEvolucao(cid){
  const el=$('#h-evo'); if(!el)return;
  const evs=evolucoesDe(cid), ult=evs[evs.length-1];
  const med=a=>a.length?a.reduce((s,e)=>s+e.humor,0)/a.length:0, rec=evs.slice(-4), antes=evs.slice(-8,-4);
  const sin={}; rec.forEach(e=>e.sinais.forEach(s=>sin[s]=(sin[s]||0)+1));
  let h=`<div class="sec-top"><h2>Evolução</h2><button class="btn sm pri" id="ev-nova">${ic('plus',16)}Anotar sessão</button></div>`;
  if(!evs.length)h+=`<div class="card"><div class="vazio"><b>Nenhuma sessão anotada</b><p>Anote o foco, o humor de 1 a 10 e como o paciente está evoluindo. Com algumas sessões, aparece aqui o gráfico do humor ao longo dos meses.</p></div></div>`;
  else{
    h+=`<div class="card">${graficoHumor(evs)||`<p class="sub">O gráfico aparece a partir da segunda sessão anotada.</p>`}
      <div class="stats" style="margin-top:12px">
        <div class="stat"><span class="lb">Humor médio recente</span><span class="vl">${med(rec).toLocaleString('pt-BR',{maximumFractionDigits:1})}</span>
          <span class="ex">${antes.length?`antes: ${med(antes).toLocaleString('pt-BR',{maximumFractionDigits:1})} · ${med(rec)>med(antes)+.4?'<b class="v-ok">subiu</b>':med(rec)<med(antes)-.4?'<b class="v-bad">caiu</b>':'estável'}`:'últimas sessões'}</span></div>
        <div class="stat"><span class="lb">Última sessão</span><span class="vl">${dataBR(ult.data)}</span>
          <span class="ex">${ult.evolucao?`<span class="pill ${EVOL[ult.evolucao][1]}">${EVOL[ult.evolucao][0]}</span>`:'sem avaliação'} · ${evs.length} anotada(s)</span></div></div>
      ${Object.keys(sin).length?`<p class="sub" style="margin-top:12px">Nas últimas ${rec.length} sessões: ${Object.keys(sin).map(s=>`<span class="pill ${s==='Sinais de risco'?'bad':'war'}">${s} · ${sin[s]}x</span>`).join(' ')}</p>`:''}
    </div><div class="card">`;
    evs.slice().reverse().forEach(e=>{ h+=`<button class="item ev-it" data-ev="${e.id}"><div class="mn"><b>${dataBR(e.data)} · ${esc(e.foco||'sem foco anotado')}</b>
      <small>humor ${e.humor}/10${e.evolucao?' · '+EVOL[e.evolucao][0].toLowerCase():''}${e.sinais.length?' · '+e.sinais.length+' sinal(is)':''}${e.proximo?' · combinado: '+esc(e.proximo):''}</small></div>${ic('right',18)}</button>` });
    h+=`</div>`;
  }
  el.innerHTML=h;
  $('#ev-nova').onclick=()=>anotarSessao(cid,'',hojeISO());
  el.querySelectorAll('[data-ev]').forEach(b=>b.onclick=()=>anotarSessao(cid,'','',b.dataset.ev));
}

/* ══════════ RECIBO ══════════ */
function extenso(v){
  const U=['','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez','onze','doze','treze','quatorze','quinze','dezesseis','dezessete','dezoito','dezenove'],
    D=['','','vinte','trinta','quarenta','cinquenta','sessenta','setenta','oitenta','noventa'],
    C=['','cento','duzentos','trezentos','quatrocentos','quinhentos','seiscentos','setecentos','oitocentos','novecentos'];
  const ate999=n=>{ if(n===100)return 'cem'; const c=Math.floor(n/100), r=n%100, p=[];
    if(c)p.push(C[c]); if(r<20){ if(r)p.push(U[r]) } else { p.push(D[Math.floor(r/10)]+(r%10?' e '+U[r%10]:'')) } return p.join(' e ') };
  const inteiro=n=>{ if(!n)return 'zero'; const mi=Math.floor(n/1e6), mil=Math.floor(n%1e6/1000), r=n%1000, p=[];
    if(mi)p.push(mi===1?'um milhão':ate999(mi)+' milhões'); if(mil)p.push(mil===1?'mil':ate999(mil)+' mil');
    if(r){ if(p.length&&(r<100||r%100===0))return p.join(' ')+' e '+ate999(r); p.push(ate999(r)) }
    return p.join(' ') };
  const ct=Math.round(v*100), r=Math.floor(ct/100), c=ct%100;
  const pr=r?inteiro(r)+(r===1?' real':(r%1e6===0?' de reais':' reais')):'', pc=c?ate999(c)+(c===1?' centavo':' centavos'):'';
  return [pr,pc].filter(Boolean).join(' e ')||'zero reais';
}
const dataLonga=iso=>{ const [a,m,d]=iso.split('-'); return `${+d} de ${MESES[+m-1]} de ${a}` };
const dataCheia=iso=>{ const [a,m,d]=String(iso).split('-'); return `${d}/${m}/${a}` };
const PROFISSAO={estetica:'',odonto:'Cirurgião-dentista',psico:'Psicólogo(a)'};
const DESCR={estetica:'procedimentos estéticos',odonto:'atendimentos odontológicos',psico:'atendimentos psicoterapêuticos'};
/* uma linha por sessão do mês: avulsa pelo valor pago, pacote pelo valor de cada sessão */
function linhasRecibo(cid,mes){
  const hj=hojeISO(), ls=[];
  S.vendas.filter(v=>v.clienteId===cid).forEach(v=>{ const k=conta(v); if(k.estornado&&k.devolvido>=k.bruto)return;
    const fator=k.bruto?(k.bruto-k.devolvido)/k.bruto:1;
    if(k.sessoes>1)(v.usadas||[]).forEach(d=>{ if(mesDe(d)===mes&&d<=hj)ls.push({data:d,valor:k.porSessao*fator}) });
    else { const d=v.sessao||v.data; if(mesDe(d)===mes)ls.push({data:d,valor:k.bruto*fator}) } });
  return ls.sort((a,b)=>a.data.localeCompare(b.data));
}
function dadosRecibo(cid,mes){ const ls=linhasRecibo(cid,mes); return {linhas:ls,total:ls.reduce((a,l)=>a+l.valor,0)} }
function reciboHTML(cid,mes,cpf){
  const c=cli(cid), p=S.perfil||{}, r=dadosRecibo(cid,mes), ar=area();
  const pagNome=(c.pagNome||'').trim(), pagCpf=(c.pagCpf||'').trim();
  const prof=[(p.profissao||PROFISSAO[ar]||'').trim(),(p.registro||'').trim()].filter(Boolean).join(' - ');
  const bloco=(t,ls)=>`<div class="rc-b"><span class="rc-l">${t}</span>${ls.filter(Boolean).map(l=>`<span>${l}</span>`).join('')}</div>`;
  return `<div class="recibo">
    <div class="rc-cab"><b class="rc-t">Recibo</b>${topoRecibo()?`<span>${esc(topoRecibo())}</span>`:''}</div>
    <div class="rc-tot"><span>${dataCheia(hojeISO())}</span><b>${brl(r.total)}</b></div>
    ${bloco('Pagador',[esc(fmtDoc(pagCpf||cpf||'')),esc((pagNome||c.nome).toUpperCase())])}
    ${bloco('Beneficiário',[esc(fmtDoc(cpf||'')),esc(c.nome.toUpperCase())])}
    ${bloco('Profissional',[esc(fmtDoc(p.doc||'')),esc((p.nome||UI.clinica||'Nome do profissional').toUpperCase()),esc(prof),esc([p.endereco,p.cidade].filter(Boolean).join(' · '))])}
    <div class="rc-b"><span class="rc-l">Data do atendimento e descrição</span>
      <span>Correspondente a ${DESCR[ar]} conforme abaixo</span>
      <div class="rc-lin">${r.linhas.length?r.linhas.map(l=>`<span>Atendimento no dia ${dataCheia(l.data)} - ${brl(l.valor)}</span>`).join(''):`<span>Nenhum atendimento pago em ${mesNome(mes)}</span>`}</div>
      <span class="rc-ext">Total: ${brl(r.total)} (${extenso(r.total)})</span></div>
    ${bloco('Emissão',[`${dataCheia(hojeISO())}${p.doc?' por '+esc(fmtDoc(p.doc)):''}`])}
    ${p.assinatura?`<div class="rc-ass"><img src="${p.assinatura}" alt="Assinatura do profissional"><span></span><small>${esc(p.nome||'')}</small></div>`:''}
  </div>`;
}
function reciboTexto(cid,mes,cpf){ const d=document.createElement('div'); d.innerHTML=reciboHTML(cid,mes,cpf);
  const t=d.querySelector('.rc-cab').textContent.trim().replace(/^Recibo/,'*RECIBO*'+(topoRecibo()?' · ':'')).replace(/·\s+/,'· ');
  const tot=d.querySelector('.rc-tot'); let s=`${t}\n${tot.children[0].textContent} · *${tot.children[1].textContent}*`;
  d.querySelectorAll('.rc-b').forEach(b=>{ const l=b.querySelector('.rc-l').textContent;
    const xs=[...b.querySelectorAll(':scope > span:not(.rc-l), .rc-lin > span')].map(e=>e.textContent.trim()).filter(Boolean);
    s+=`\n\n*${l}*\n`+xs.join('\n') });
  return s }
function imprimir(html){
  let d=$('#impressao'); if(!d){ d=document.createElement('div'); d.id='impressao'; document.body.appendChild(d) }
  d.innerHTML=html; document.body.classList.add('imprime');
  const fim=()=>{ document.body.classList.remove('imprime'); window.removeEventListener('afterprint',fim) };
  window.addEventListener('afterprint',fim); window.print();
}
function recibo(cid){
  const c=cli(cid); if(!c)return;
  const meses=[...new Set(S.vendas.filter(v=>v.clienteId===cid).flatMap(v=>[mesDe(v.sessao||v.data)].concat((v.usadas||[]).map(mesDe))))].sort().reverse();
  if(!meses.length)return toast('Ainda não há pagamento para gerar recibo');
  const p=S.perfil||{}, falta=!p.nome||!p.doc, ar=area();
  abrirSheet('Recibo',esc(c.nome),
    `<div class="grid2"><div class="field"><label for="rb-m">Mês</label><select id="rb-m">${meses.map(m=>`<option value="${m}">${mesNome(m)}</option>`).join('')}</select></div>
       <div class="field"><label for="rb-cpf">CPF do ${ar==='estetica'?'cliente':'paciente'}</label><input id="rb-cpf" inputmode="numeric" placeholder="000.000.000-00" value="${esc(c.cpf||'')}"></div></div>
     <div class="ck-l" style="border:none"><label class="sw"><input type="checkbox" id="rb-outro" ${c.pagNome?'checked':''}> <span>Quem pagou é outra pessoa</span></label>
       <small>Por exemplo, mãe ou pai de um paciente menor de idade.</small></div>
     <div class="grid2" id="rb-pag" ${c.pagNome?'':'hidden'}>
       <div class="field"><label for="rb-pn">Nome de quem pagou</label><input id="rb-pn" value="${esc(c.pagNome||'')}"></div>
       <div class="field"><label for="rb-pc">CPF de quem pagou</label><input id="rb-pc" inputmode="numeric" value="${esc(c.pagCpf||'')}"></div></div>
     <details class="rb-eu" ${falta?'open':''}><summary class="btn soft full">${ic('user')}${falta?'Preencha os seus dados':'Meus dados no recibo'}</summary>
       <div class="field" style="margin-top:12px"><label for="rb-n">Seu nome completo</label><input id="rb-n" value="${esc(p.nome||'')}" autocomplete="name"></div>
       <div class="grid2">
         <div class="field"><label for="rb-d">Seu CPF ou CNPJ</label><input id="rb-d" inputmode="numeric" value="${esc(p.doc||'')}"></div>
         <div class="field"><label for="rb-r">${AREAS[ar].reg}</label><input id="rb-r" value="${esc(p.registro||'')}" placeholder="${ar==='psico'?'06/123456':ar==='odonto'?'SP 12345':''}"></div></div>
       <div class="grid2">
         <div class="field"><label for="rb-p">Profissão</label><input id="rb-p" value="${esc(p.profissao||'')}" placeholder="${PROFISSAO[ar]||'Esteticista'}"></div>
         <div class="field"><label for="rb-c">Cidade</label><input id="rb-c" value="${esc(p.cidade||'')}" placeholder="São Paulo"></div></div>
       <p class="sub" style="margin:-4px 0 4px">Fica salvo para os próximos recibos.</p></details>
     <div id="rb-prev" style="margin-top:14px"></div>
     <div class="row" style="margin-top:12px"><button class="btn pri" id="rb-pr" style="flex:1">${ic('download')}Imprimir ou salvar PDF</button>
       <button class="btn soft" id="rb-zap">${ic('chat')}WhatsApp</button></div>
     <p class="sub" style="margin-top:10px">Este recibo serve para o reembolso do plano de saúde. ${ar==='psico'||ar==='odonto'?'Para o imposto de renda, o profissional pessoa física também emite o recibo no app Receita Saúde, da Receita Federal.':''}</p>`,
    fechar=>{
      const pinta=()=>{ $('#rb-prev').innerHTML=reciboHTML(cid,$('#rb-m').value,$('#rb-cpf').value.trim()) };
      const guarda=()=>{ c.cpf=$('#rb-cpf').value.trim();
        if($('#rb-outro').checked){ c.pagNome=$('#rb-pn').value.trim(); c.pagCpf=$('#rb-pc').value.trim() } else { delete c.pagNome; delete c.pagCpf }
        S.perfil=Object.assign({},S.perfil,{nome:$('#rb-n').value.trim(),doc:$('#rb-d').value.trim(),registro:$('#rb-r').value.trim(),
          profissao:$('#rb-p').value.trim(),cidade:$('#rb-c').value.trim()});
        salvar(); pinta() };
      document.querySelectorAll('.sheet [id^="rb-"]').forEach(e=>{ if(e.matches('input'))e.addEventListener('input',guarda) });
      $('#rb-m').onchange=pinta;
      $('#rb-outro').onchange=()=>{ $('#rb-pag').hidden=!$('#rb-outro').checked; guarda() };
      pinta();
      $('#rb-pr').onclick=()=>{ guarda(); imprimir(reciboHTML(cid,$('#rb-m').value,$('#rb-cpf').value.trim())) };
      $('#rb-zap').onclick=()=>{ guarda(); window.open(linkZap(c,reciboTexto(cid,$('#rb-m').value,$('#rb-cpf').value.trim())),'_blank','noopener') };
    });
}

/* topo do histórico: recibo, a receber e (psicologia) a evolução */
function topoHist(c){
  const rec=S.receber.filter(r=>r.clienteId===c.id), tr=rec.reduce((a,r)=>a+num(r.valor),0);
  return `<div class="row" style="margin-top:12px">
      ${area()!=='estetica'?`<button class="btn sm soft" id="h-rec">${ic('file',16)}Recibo</button>`:''}
      ${rec.length?`<button class="btn sm soft" id="h-rcb">${ic('coins',16)}Deve ${brl(tr)}</button>`:''}</div>
    ${ehPsico()?'<div class="sec" id="h-evo"></div>':''}`;
}
function ligarTopoHist(id,fechar){
  if($('#h-rec'))$('#h-rec').onclick=()=>recibo(id);
  if($('#h-rcb'))$('#h-rcb').onclick=()=>{ fechar(); setTimeout(()=>receberSheet(id),260) };
  if(ehPsico())pintaEvolucao(id);
}

/* liga o que cada tela ganhou com as áreas */
function ligarArea(el){
  if(tela==='painel'){ if(ehPsico()&&$('#ir-res'))$('#ir-res').remove(); if($('#ir-rec'))$('#ir-rec').onclick=()=>ir('vendas') }
  if(tela==='agenda')el.querySelectorAll('[data-nota-a]').forEach(b=>b.onclick=()=>{ const a=S.agenda.find(z=>z.id===b.dataset.notaA); if(a)anotarSessao(a.clienteId,a.id,a.data) });
}

