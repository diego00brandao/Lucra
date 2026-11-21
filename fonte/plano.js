/* ══════════ PLANO DE TRATAMENTO E ODONTOGRAMA ══════════
   Plano: etapas em ordem, cada uma com dente/região, valor e situação (a fazer, agendada, feita).
   Odontograma: situação de cada dente; tocar no dente já põe o procedimento no plano. */
const temPlano=()=>area()==='odonto'||area()==='estetica';
const planosDe=cid=>(S.planos||[]).filter(p=>p.clienteId===cid);
const ETAPA_ST={pendente:['A fazer',''],agendado:['Agendada','ac'],feito:['Feita','ok']};
function arrumaEtapas(p){   /* agendamento apagado, cancelado ou falta: a etapa volta para "a fazer" */
  p.etapas.forEach(e=>{ if(e.status==='agendado'){ const a=S.agenda.find(z=>z.id===e.agId);
    if(!a||a.status==='cancelado'||a.status==='faltou'){ e.status='pendente'; e.agId='' } else if(a.status==='concluido'){ e.status='feito'; e.feitoEm=a.data } } }) }
function totPlano(p){ arrumaEtapas(p);
  const t=p.etapas.reduce((a,e)=>a+num(e.valor),0), feitas=p.etapas.filter(e=>e.status==='feito');
  const f=feitas.reduce((a,e)=>a+num(e.valor),0); return {t,f,falta:t-f,n:p.etapas.length,nf:feitas.length} }
function novoPlano(cid,etapas){ if(!S.planos)S.planos=[];
  const p={id:uid(),clienteId:cid,criado:hojeISO(),status:'aberto',etapas:etapas||[]}; S.planos.push(p); return p }
const planoAberto=cid=>planosDe(cid).find(p=>p.status==='aberto');
function etapaDe(s,regiao,valor){ return {id:uid(),servicoId:s?s.id:'',nome:s?s.nome:'Procedimento',regiao:regiao||'',valor:valor!=null?num(valor):(s?num(s.preco):0),status:'pendente',agId:''} }

/* ── folha do plano ── */
function abrePlano(pid,voltaFicha){
  const p=(S.planos||[]).find(z=>z.id===pid); if(!p)return; const c=cli(p.clienteId);
  abrirSheet('Plano de tratamento',`${esc(c?c.nome:'')} · começou em ${dataBR(p.criado)}`,`<div id="pl-corpo"></div>`,fechar=>{
    const pinta=()=>{ const t=totPlano(p), b=$('#pl-corpo'); if(!b)return;
      b.innerHTML=`<div class="pl-res"><div><span>Total</span><b>${brl(t.t)}</b></div><div><span>Já feito</span><b class="v-ok">${brl(t.f)}</b></div><div><span>Falta</span><b>${brl(t.falta)}</b></div></div>
        <div class="pl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="${t.n}" aria-valuenow="${t.nf}" aria-label="${t.nf} de ${t.n} etapas feitas"><i style="width:${t.n?Math.round(t.nf/t.n*100):0}%"></i></div>
        <p class="sub" style="margin:6px 0 12px">${t.nf} de ${t.n} ${t.n===1?'etapa feita':'etapas feitas'}</p>
        ${p.etapas.length?`<ol class="pl-et">${p.etapas.map((e,i)=>{ const a=e.agId&&S.agenda.find(z=>z.id===e.agId);
          return `<li class="${e.status}"><span class="pl-n">${e.status==='feito'?ic('check',14):i+1}</span>
            <div class="pl-mn"><b>${esc(e.nome)}</b><small>${e.regiao?esc((area()==='odonto'&&/^\d+$/.test(e.regiao)?'dente ':'')+e.regiao)+' · ':''}${brl(num(e.valor))}${a&&e.status==='agendado'?` · ${dataBR(a.data)}${a.hora?' às '+a.hora:''}`:''}${e.status==='feito'&&e.feitoEm?' · feita em '+dataBR(e.feitoEm):''}</small></div>
            <span class="pill ${ETAPA_ST[e.status][1]}">${ETAPA_ST[e.status][0]}</span>
            <div class="pl-acts">${e.status==='pendente'&&p.status==='aberto'?`<button class="btn sm pri" data-pl-ag="${e.id}">${ic('calendar',16)}Agendar</button>`:''}
              ${e.status!=='feito'?`<button class="btn sm soft" data-pl-ok="${e.id}">${ic('check',16)}Feita</button>`:`<button class="btn sm soft" data-pl-volta="${e.id}">Desfazer</button>`}
              <button class="ibtn" data-pl-sobe="${i}" aria-label="Subir ${esc(e.nome)}" ${i?'':'disabled'}>${ic('left',16)}</button>
              <button class="ibtn" data-pl-x="${e.id}" aria-label="Tirar ${esc(e.nome)} do plano">${ic('trash',16)}</button></div></li>` }).join('')}</ol>`
          :`<div class="vazio"><b>Nenhuma etapa ainda</b><p>Adicione os procedimentos na ordem em que vão ser feitos.</p></div>`}
        ${p.status==='aberto'?`<div class="pl-add"><p class="eyebrow">Adicionar etapa</p>
          <div class="field"><label for="pl-s">Procedimento</label><select id="pl-s">${S.servicos.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join('')}</select></div>
          <div class="grid2"><div class="field"><label for="pl-r">${area()==='odonto'?'Dente ou região':'Região'}</label><input id="pl-r" placeholder="${area()==='odonto'?'ex.: 36':'ex.: rosto'}"></div>
            <div class="field"><label for="pl-v">Valor (R$)</label><input id="pl-v" inputmode="decimal" value="${S.servicos[0]?String(S.servicos[0].preco).replace('.',','):''}"></div></div>
          <button class="btn soft full" id="pl-add">${ic('plus')}Adicionar ao plano</button></div>`:''}
        <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">${typeof abreParcelas==='function'&&ehDono()?`<button class="btn soft" id="pl-parc">${ic('coins',16)}${parcDe(p.id).length?'Parcelas':'Parcelar'}${parcDe(p.id).some(parcAtrasada)?' · atrasada':''}</button>`:''}${c&&c.tel?`<button class="btn soft" id="pl-zap">${ic('chat',16)}Mandar o plano</button>`:''}
          ${p.status==='aberto'?`<button class="btn soft" id="pl-fim">Encerrar plano</button>`:`<button class="btn soft" id="pl-reabre">Reabrir plano</button>`}
          <button class="btn danger ic" id="pl-del" aria-label="Excluir plano">${ic('trash',18)}</button></div>`;
      const acha=id=>p.etapas.find(e=>e.id===id), muda=()=>{ salvar(); pinta() };
      b.querySelectorAll('[data-pl-ok]').forEach(x=>x.onclick=()=>{ const e=acha(x.dataset.plOk); e.status='feito'; e.feitoEm=hojeISO(); muda(); toast('Etapa feita') });
      b.querySelectorAll('[data-pl-volta]').forEach(x=>x.onclick=()=>{ const e=acha(x.dataset.plVolta); e.status=e.agId&&S.agenda.some(a=>a.id===e.agId&&a.status==='marcado')?'agendado':'pendente'; e.feitoEm=''; muda() });
      b.querySelectorAll('[data-pl-sobe]').forEach(x=>x.onclick=()=>{ const i=+x.dataset.plSobe; if(i<1)return; [p.etapas[i-1],p.etapas[i]]=[p.etapas[i],p.etapas[i-1]]; muda() });
      b.querySelectorAll('[data-pl-x]').forEach(x=>x.onclick=()=>{ p.etapas=p.etapas.filter(e=>e.id!==x.dataset.plX); muda() });
      b.querySelectorAll('[data-pl-ag]').forEach(x=>x.onclick=()=>{ const e=acha(x.dataset.plAg); preAg={clienteId:p.clienteId,servicoId:e.servicoId,pid:p.id,eid:e.id,nome:e.nome}; fechar(); setTimeout(()=>ir('novoag'),220) });
      if($('#pl-s'))$('#pl-s').onchange=()=>{ const s=serv($('#pl-s').value); if(s)$('#pl-v').value=String(s.preco).replace('.',',') };
      if($('#pl-add'))$('#pl-add').onclick=()=>{ const s=serv($('#pl-s').value); if(!s)return toast('Cadastre um serviço antes');
        p.etapas.push(etapaDe(s,$('#pl-r').value.trim(),$('#pl-v').value)); muda(); toast('Etapa adicionada') };
      if($('#pl-zap'))$('#pl-zap').onclick=()=>{ const t=totPlano(p);
        const tx=`Oi, ${c.nome.split(' ')[0]}! Este é o seu plano de tratamento${UI.clinica?' · '+UI.clinica:''}:\n\n`+p.etapas.map((e,i)=>`${i+1}. ${e.nome}${e.regiao?' ('+e.regiao+')':''}: ${brl(num(e.valor))}${e.status==='feito'?' ✓':''}`).join('\n')+`\n\nTotal: ${brl(t.t)}`;
        zapAbrir(zap(c.tel,tx)) };
      if($('#pl-parc'))$('#pl-parc').onclick=()=>{ fechar(); setTimeout(()=>abreParcelas(p.id),260) };
      if($('#pl-fim'))$('#pl-fim').onclick=()=>{ p.status='concluido'; muda(); toast('Plano encerrado') };
      if($('#pl-reabre'))$('#pl-reabre').onclick=()=>{ p.status='aberto'; muda() };
      $('#pl-del').onclick=()=>confirmar('Excluir este plano?','As etapas somem. Os atendimentos e pagamentos já lançados continuam.','Excluir',()=>{ S.planos=S.planos.filter(z=>z.id!==p.id); S.parcelas=(S.parcelas||[]).filter(z=>z.planoId!==p.id||z.pago); salvar(); fechar(); toast('Plano excluído'); if(voltaFicha)setTimeout(()=>historico(p.clienteId),300) });
    };
    pinta();
  });
}

/* ── agendar uma etapa: o Novo agendamento já vem com paciente e procedimento ── */
let preAg=null;
const _novoP=T.novoag;
T.novoag=function(el){ const pa=preAg; _novoP(el); if(!pa||!$('#a-add'))return;
  if($('#a-cli')){ $('#a-cli').value=pa.clienteId; $('#a-cli').dataset.ant=pa.clienteId }
  if($('#a-serv')&&pa.servicoId)$('#a-serv').value=pa.servicoId;
  const card=el.querySelector('[data-parte=novo] .card'); if(card)card.insertAdjacentHTML('afterbegin',`<div class="nota" style="margin-bottom:12px">Etapa do plano: <b>${esc(pa.nome)}</b></div>`);
  const add=$('#a-add'), orig=add.onclick;
  add.onclick=()=>{ const antes=new Set(S.agenda.map(a=>a.id)); orig();
    const novo=S.agenda.find(a=>!antes.has(a.id));
    if(novo){ const p=(S.planos||[]).find(z=>z.id===pa.pid), e=p&&p.etapas.find(z=>z.id===pa.eid);
      if(e){ e.agId=novo.id; e.status='agendado'; salvar() } preAg=null } };
};
const _irP=ir;
ir=function(t){ if(t!=='novoag')preAg=null; _irP(t) };
/* atendeu: a etapa ligada ao horário fica feita */
const _posP=posAtender;
posAtender=function(a){ (S.planos||[]).forEach(p=>p.etapas.forEach(e=>{ if(e.agId===a.id&&e.status!=='feito'){ e.status='feito'; e.feitoEm=a.data } })); salvar(); _posP(a) };

/* ── orçamento vira plano ── */
const _simP=T.sim;
T.sim=function(el){ _simP(el); if(!temPlano())return;
  el.querySelectorAll('[data-o-apaga]').forEach(b=>{ const o=S.orcamentos.find(z=>z.id===b.dataset.oApaga); if(!o||!o.clienteId)return;
    const ja=(S.planos||[]).find(p=>p.orcId===o.id);
    b.insertAdjacentHTML('beforebegin',`<button class="btn sm soft" data-o-plano="${o.id}">${ic('file',16)}${ja?'Ver plano':'Virar plano'}</button>`) });
  el.querySelectorAll('[data-o-plano]').forEach(b=>b.onclick=()=>{ const o=S.orcamentos.find(z=>z.id===b.dataset.oPlano);
    let p=(S.planos||[]).find(z=>z.orcId===o.id);
    if(!p){ const f=calcOrc(o).f; const ets=[]; o.itens.forEach(i=>{ const s=serv(i.servicoId), n=Math.max(1,parseInt(i.sessoes)||1);
        for(let k=0;k<n;k++)ets.push(etapaDe(s,'',num(i.valor)*f/n)) });
      p=novoPlano(o.clienteId,ets); p.orcId=o.id; if(o.status!=='fechado')o.status='fechado'; salvar(); toast('Plano criado') }
    abrePlano(p.id) });
};

/* ── odontograma ── */
const DENTES={perm:[[18,17,16,15,14,13,12,11],[21,22,23,24,25,26,27,28],[48,47,46,45,44,43,42,41],[31,32,33,34,35,36,37,38]],
  dec:[[55,54,53,52,51],[61,62,63,64,65],[85,84,83,82,81],[71,72,73,74,75]]};
const EST_D={carie:['Cárie','bad'],rest:['Restaurado','ac'],canal:['Canal','war'],coroa:['Coroa','roxo'],impl:['Implante','ok'],aus:['Ausente','cinza'],extr:['Extrair','bad2']};
const odgDe=cid=>{ if(!S.odontogramas)S.odontogramas=[]; let o=S.odontogramas.find(z=>z.clienteId===cid); if(!o){ o={clienteId:cid,dentes:{},leite:false}; S.odontogramas.push(o) } return o };
function abreOdonto(cid,voltaFicha){
  const c=cli(cid); if(!c)return; const o=odgDe(cid); let sel=null;
  abrirSheet('Odontograma',esc(c.nome),`<div id="og-corpo"></div>`,fechar=>{
    const pinta=()=>{ const b=$('#og-corpo'); if(!b)return; const ds=o.leite?DENTES.dec:DENTES.perm;
      const dente=n=>{ const d=o.dentes[n]||{}, e=EST_D[d.e];
        return `<button type="button" class="dt ${e?e[1]:''}" data-dt="${n}" aria-pressed="${sel===n}" aria-label="Dente ${n}${e?': '+e[0]:''}"><span>${n}</span><i></i></button>` };
      const cont={}; Object.values(o.dentes).forEach(d=>{ if(d.e)cont[d.e]=(cont[d.e]||0)+1 });
      b.innerHTML=`<div class="chips" role="group" aria-label="Dentição" style="margin-bottom:10px">
          <button class="chip" data-og-l="0" aria-pressed="${!o.leite}">Permanentes</button><button class="chip" data-og-l="1" aria-pressed="${!!o.leite}">De leite</button></div>
        <div class="odg ${o.leite?'leite':''}">
          <p class="odg-lb">Superior direito</p><div class="odg-r">${ds[0].map(dente).join('')}</div>
          <p class="odg-lb">Superior esquerdo</p><div class="odg-r">${ds[1].map(dente).join('')}</div>
          <div class="odg-sep"></div>
          <p class="odg-lb">Inferior direito</p><div class="odg-r">${ds[2].map(dente).join('')}</div>
          <p class="odg-lb">Inferior esquerdo</p><div class="odg-r">${ds[3].map(dente).join('')}</div></div>
        <div class="odg-leg">${Object.keys(EST_D).map(k=>`<span class="${EST_D[k][1]}"><i></i>${EST_D[k][0]}${cont[k]?' ('+cont[k]+')':''}</span>`).join('')}</div>
        <div id="og-dt"></div>`;
      b.querySelectorAll('[data-og-l]').forEach(x=>x.onclick=()=>{ o.leite=x.dataset.ogL==='1'; sel=null; salvar(); pinta() });
      b.querySelectorAll('[data-dt]').forEach(x=>x.onclick=()=>{ sel=+x.dataset.dt; pinta(); const f=$('#og-dt'); if(f)f.scrollIntoView({behavior:'smooth',block:'nearest'}) });
      if(sel==null){ $('#og-dt').innerHTML=`<p class="sub" style="margin-top:12px">Toque num dente para marcar o que ele tem ou o que vai ser feito.</p>`; return }
      const d=o.dentes[sel]||{}, pl=planoAberto(cid), noPlano=pl?pl.etapas.filter(e=>e.regiao===String(sel)):[];
      $('#og-dt').innerHTML=`<div class="og-det"><h3>Dente ${sel}</h3>
        <div class="chips" role="group" aria-label="Situação do dente ${sel}"><button class="chip" data-og-e="" aria-pressed="${!d.e}">Saudável</button>${Object.keys(EST_D).map(k=>`<button class="chip" data-og-e="${k}" aria-pressed="${d.e===k}">${EST_D[k][0]}</button>`).join('')}</div>
        <div class="field" style="margin-top:10px"><label for="og-obs">Observação</label><input id="og-obs" value="${esc(d.obs||'')}" placeholder="ex.: face oclusal, dor ao frio"></div>
        ${noPlano.length?`<p class="sub">No plano: ${noPlano.map(e=>esc(e.nome)+' ('+ETAPA_ST[e.status][0].toLowerCase()+')').join(', ')}</p>`:''}
        <p class="eyebrow" style="margin-top:12px">Pôr no plano de tratamento</p>
        <div class="grid2"><div class="field"><label for="og-s">Procedimento</label><select id="og-s">${S.servicos.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join('')}</select></div>
          <div class="field"><label for="og-v">Valor (R$)</label><input id="og-v" inputmode="decimal" value="${S.servicos[0]?String(S.servicos[0].preco).replace('.',','):''}"></div></div>
        <button class="btn pri full" id="og-pl">${ic('plus')}Pôr no plano</button></div>`;
      b.querySelectorAll('[data-og-e]').forEach(x=>x.onclick=()=>{ const k=x.dataset.ogE; o.dentes[sel]=Object.assign({},o.dentes[sel]||{},{e:k||''}); if(!k&&!o.dentes[sel].obs)delete o.dentes[sel];
        o.atualizado=hojeISO(); salvar(); pinta() });
      $('#og-obs').onchange=()=>{ o.dentes[sel]=Object.assign({},o.dentes[sel]||{},{obs:$('#og-obs').value.trim()}); o.atualizado=hojeISO(); salvar() };
      $('#og-s').onchange=()=>{ const s=serv($('#og-s').value); if(s)$('#og-v').value=String(s.preco).replace('.',',') };
      $('#og-pl').onclick=()=>{ const s=serv($('#og-s').value); if(!s)return toast('Cadastre um serviço antes');
        const p=planoAberto(cid)||novoPlano(cid); p.etapas.push(etapaDe(s,String(sel),$('#og-v').value)); salvar(); toast(`${s.nome} no dente ${sel} foi para o plano`); pinta() };
    };
    pinta();
  });
}

/* ── na ficha do paciente ── */
function secPlanoFicha(cid){
  if(!temPlano())return '';
  const ps=planosDe(cid).sort((a,b)=>(a.status==='aberto'?0:1)-(b.status==='aberto'?0:1)||b.criado.localeCompare(a.criado));
  const og=area()==='odonto'&&podeClinico()?(S.odontogramas||[]).find(z=>z.clienteId===cid):null, marc=og?Object.values(og.dentes).filter(d=>d.e).length:0;
  return `<div class="sec" id="h-plano"><div class="sec-top"><h2>Plano de tratamento</h2>${ps.length?`<span class="pill">${ps.length}</span>`:''}</div><div class="card">
      ${ps.map(p=>{ const t=totPlano(p); return `<button type="button" class="item pr-it" data-pl="${p.id}"><div class="mn"><b>${p.status==='aberto'?'Em andamento':'Encerrado'} · ${t.nf} de ${t.n} ${t.n===1?'etapa':'etapas'}</b>
        <small>${brl(t.t)} no total · falta ${brl(t.falta)} · começou em ${dataBR(p.criado)}${(()=>{ const pc=typeof parcDe==='function'?parcDe(p.id):[]; if(!pc.length)return ''; const at=pc.filter(parcAtrasada).length, ab=pc.filter(x=>!x.pago).length;
          return at?` · <b class="v-bad">${at} parcela(s) atrasada(s)</b>`:ab?` · ${ab} parcela(s) em aberto`:' · parcelas quitadas' })()}</small></div>${ic('right',18)}</button>` }).join('')||`<p class="sub" style="margin:0 0 10px">Monte as etapas do tratamento na ordem e acompanhe o que já foi feito.</p>`}
      <div class="row" style="gap:8px;margin-top:8px">${!planoAberto(cid)?`<button class="btn sm soft" id="h-pl-novo">${ic('plus',16)}Novo plano</button>`:''}
        ${area()==='odonto'&&podeClinico()?`<button class="btn sm soft" id="h-odg">${ic('spark',16)}Odontograma${marc?' · '+marc+' marcado(s)':''}</button>`:''}</div></div></div>`;
}
const _topoPl=topoHist, _ligaPl=ligarTopoHist;
topoHist=c=>_topoPl(c)+secPlanoFicha(c.id);
ligarTopoHist=function(id,fechar){ _ligaPl(id,fechar);
  const s=$('#h-plano'), pr=$('#h-pr-novo')&&$('#h-pr-novo').closest('.sec'); if(s&&pr)pr.after(s);
  const volta=()=>setTimeout(()=>historico(id),300);
  document.querySelectorAll('.sheet [data-pl]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>abrePlano(b.dataset.pl,true),260) });
  if($('#h-pl-novo'))$('#h-pl-novo').onclick=()=>{ const p=novoPlano(id); salvar(); fechar(); setTimeout(()=>abrePlano(p.id,true),260) };
  if($('#h-odg'))$('#h-odg').onclick=()=>{ fechar(); setTimeout(()=>abreOdonto(id,true),260) };
};
