/* ══════════ PSICOLOGIA: prontuário (CFP), questionários, fechamento do mês e informe para o IR ══════════ */

/* ── 1. Prontuário psicológico (Resolução CFP 001/2009): demanda, objetivos, evolução e encerramento ── */
const ABORDAGENS=['Terapia cognitivo-comportamental (TCC)','Psicanálise','Humanista / centrada na pessoa','Gestalt-terapia','Análise do comportamento','Sistêmica','Junguiana','Outra'];
const MOTIVOS_FIM=['Alta','Desistência do paciente','Encaminhamento','Mudança de cidade','Questões financeiras','Outro'];
const prontPsiDe=cid=>(S.prontPsi||[]).find(p=>p.clienteId===cid);
function abreProntPsi(cid,volta){ const c=cli(cid); if(!c)return; const p=prontPsiDe(cid)||{}, f=p.fim||{};
  const evs=typeof evolucoesDe==='function'?evolucoesDe(cid):[];
  abrirSheet('Prontuário',esc(c.nome),`
    <div class="grid2"><div class="field"><label for="pp-ini">Início do atendimento</label><input id="pp-ini" inputmode="numeric" maxlength="10" value="${p.inicio?dataBRano(p.inicio):dataBRano(evs[0]?evs[0].data:hojeISO())}"></div>
      <div class="field"><label for="pp-ab">Abordagem</label><select id="pp-ab"><option value="">Escolha…</option>${ABORDAGENS.map(a=>`<option ${p.abordagem===a?'selected':''}>${esc(a)}</option>`).join('')}</select></div></div>
    <div class="field"><label for="pp-dem">Demanda (o que trouxe a pessoa)</label><textarea id="pp-dem" rows="4">${esc(p.demanda||'')}</textarea></div>
    <div class="field"><label for="pp-obj">Objetivos do trabalho</label><textarea id="pp-obj" rows="3">${esc(p.objetivos||'')}</textarea></div>
    <div class="field"><label for="pp-obs">Observações e hipóteses (opcional)</label><textarea id="pp-obs" rows="3">${esc(p.obs||'')}</textarea></div>
    <p class="eyebrow" style="margin-top:6px">Evolução</p>
    <p class="sub" style="margin:0 0 10px">${evs.length?`${evs.length} sessão(ões) anotada(s), a última em ${dataBR(evs[evs.length-1].data)}. Elas entram no prontuário impresso.`:'As anotações de cada sessão entram aqui automaticamente.'}</p>
    <details class="dobra" ${f.data?'open':''}><summary class="btn soft full">${f.data?'Atendimento encerrado':'Encerrar o atendimento'}</summary>
      <div class="grid2" style="margin-top:10px"><div class="field"><label for="pp-fd">Data</label><input id="pp-fd" inputmode="numeric" maxlength="10" value="${f.data?dataBRano(f.data):''}" placeholder="dd/mm/aaaa"></div>
        <div class="field"><label for="pp-fm">Motivo</label><select id="pp-fm"><option value="">Escolha…</option>${MOTIVOS_FIM.map(m=>`<option ${f.motivo===m?'selected':''}>${m}</option>`).join('')}</select></div></div>
      <div class="field"><label for="pp-fp">Encaminhado para (se houver)</label><input id="pp-fp" value="${esc(f.para||'')}"></div>
      <div class="field"><label for="pp-fo">Como foi o encerramento</label><textarea id="pp-fo" rows="3">${esc(f.obs||'')}</textarea></div></details>
    <div class="row" style="margin-top:14px;gap:8px"><button class="btn pri" id="pp-ok" style="flex:1">${ic('check')}Salvar</button><button class="btn soft" id="pp-imp">${ic('file',16)}Imprimir</button></div>
    <p class="sub" style="margin-top:10px">O prontuário deve ser guardado por no mínimo 5 anos (Resolução CFP 001/2009).</p>`,
  fechar=>{
    const guarda=()=>{ const ini=dataDeBR($('#pp-ini').value), fd=$('#pp-fd').value?dataDeBR($('#pp-fd').value):'';
      if(!ini){ toast('Confira a data de início: dd/mm/aaaa'); return null } if($('#pp-fd').value&&!fd){ toast('Confira a data de encerramento'); return null }
      if(!S.prontPsi)S.prontPsi=[]; let x=prontPsiDe(cid); if(!x){ x={id:uid(),clienteId:cid}; S.prontPsi.push(x) }
      Object.assign(x,{inicio:ini,abordagem:$('#pp-ab').value,demanda:$('#pp-dem').value.trim(),objetivos:$('#pp-obj').value.trim(),obs:$('#pp-obs').value.trim(),
        fim:fd?{data:fd,motivo:$('#pp-fm').value,para:$('#pp-fp').value.trim(),obs:$('#pp-fo').value.trim()}:null}); salvar(); return x };
    $('#pp-ok').onclick=()=>{ if(!guarda())return; fechar(); toast('Prontuário salvo'); if(volta)volta() };
    $('#pp-imp').onclick=()=>{ const x=guarda(); if(x)imprimir(prontPsiHTML(cid)) };
  }) }
function prontPsiHTML(cid){ const c=cli(cid), p=prontPsiDe(cid)||{}, f=p.fim, pf=S.perfil||{}, evs=typeof evolucoesDe==='function'?evolucoesDe(cid):[];
  const bl=(t,v)=>v?`<p class="doc-pac"><b>${t}</b></p><div class="doc-tx" style="margin-top:4px">${esc(v)}</div>`:'';
  return `<div class="recibo doc-imp"><div class="rc-cab"><b class="rc-t">Prontuário psicológico</b>${topoRecibo()?`<span>${esc(topoRecibo())}</span>`:''}${profLinha()?`<span>${esc(profLinha())}</span>`:''}</div>
    <p class="doc-pac"><b>Paciente:</b> ${esc(c.nome)}${c.cpf?' · CPF '+esc(fmtDoc(c.cpf)):''}${c.nasc?' · nascimento '+esc(dataBR(c.nasc)):''}</p>
    <p class="doc-pac"><b>Início:</b> ${p.inicio?dataBR(p.inicio):'—'}${p.abordagem?' · <b>Abordagem:</b> '+esc(p.abordagem):''}</p>
    ${bl('Demanda',p.demanda)}${bl('Objetivos do trabalho',p.objetivos)}${bl('Observações',p.obs)}
    <p class="doc-pac"><b>Evolução</b></p>${evs.map(e=>`<div class="doc-ev"><b>${dataBR(e.data)}</b>${e.foco?' · '+esc(e.foco):''}${e.evolucao?' · '+esc(e.evolucao):''}<div class="doc-tx" style="margin:2px 0 0">${esc([e.chegada,e.notas,e.proximo?'Próximo passo: '+e.proximo:''].filter(Boolean).join('\n'))}</div></div>`).join('')||'<p>Sem sessões anotadas.</p>'}
    ${f?`<p class="doc-pac"><b>Encerramento:</b> ${dataBR(f.data)}${f.motivo?' · '+esc(f.motivo):''}${f.para?' · encaminhado para '+esc(f.para):''}</p>${f.obs?`<div class="doc-tx" style="margin-top:4px">${esc(f.obs)}</div>`:''}`:''}
    <div class="rc-ass">${assProfImg()}<span></span><small>${esc(pf.nome||'Psicólogo(a)')}${pf.registro?' · CRP '+esc(pf.registro):''}</small></div></div>` }
MASC.push(['#pp-ini,#pp-fd',v=>molde(soDig(v).slice(0,8),'##/##/####')]);

/* ── 2. Questionários de uso livre: PHQ-9 (humor) e GAD-7 (ansiedade) ── */
const ESC_OP=['Nenhuma vez','Vários dias','Mais da metade dos dias','Quase todos os dias'];
const ESCALAS={
  phq9:{n:'PHQ-9 · humor',curto:'PHQ-9',max:27,perg:'Nas últimas 2 semanas, com que frequência você se sentiu incomodado(a) por algum destes problemas?',
    itens:['Pouco interesse ou pouco prazer em fazer as coisas','Se sentir para baixo, deprimido(a) ou sem perspectiva','Dificuldade para pegar no sono ou continuar dormindo, ou dormir mais do que de costume','Se sentir cansado(a) ou com pouca energia','Falta de apetite ou comer demais','Se sentir mal consigo mesmo(a), achar que é um fracasso ou que decepcionou a família ou a si mesmo(a)','Dificuldade para se concentrar nas coisas, como ler ou ver televisão','Lentidão para se movimentar ou falar, a ponto de outras pessoas perceberem. Ou o contrário: ficar tão agitado(a) que anda de um lado para o outro mais do que de costume','Pensar em se ferir de alguma maneira ou que seria melhor estar morto(a)'],
    faixas:[[4,'mínimo','ok'],[9,'leve','ac'],[14,'moderado','war'],[19,'moderadamente grave','bad'],[27,'grave','bad']]},
  gad7:{n:'GAD-7 · ansiedade',curto:'GAD-7',max:21,perg:'Nas últimas 2 semanas, com que frequência você se sentiu incomodado(a) por algum destes problemas?',
    itens:['Se sentir nervoso(a), ansioso(a) ou muito tenso(a)','Não conseguir parar ou controlar as preocupações','Se preocupar demais com diversas coisas','Dificuldade para relaxar','Ficar tão agitado(a) que é difícil ficar parado(a)','Ficar facilmente aborrecido(a) ou irritado(a)','Sentir medo, como se algo terrível fosse acontecer'],
    faixas:[[4,'mínimo','ok'],[9,'leve','ac'],[14,'moderado','war'],[21,'grave','bad']]}};
const faixaEsc=(k,pt)=>ESCALAS[k].faixas.find(f=>pt<=f[0]);
const escalasDe=cid=>(S.escalas||[]).filter(e=>e.clienteId===cid&&e.resp).sort((a,b)=>a.data.localeCompare(b.data));
const item9=e=>e.instr==='phq9'&&e.resp&&e.resp[8]>0;
function questHTML(k,pref){ const E=ESCALAS[k];
  return `<p class="sub" style="margin-bottom:10px">${E.perg}</p>${E.itens.map((t,i)=>`<fieldset class="q-it"><legend>${i+1}. ${esc(t)}</legend><div class="q-op">${ESC_OP.map((o,v)=>`<label><input type="radio" name="${pref}${i}" value="${v}"><span>${o}</span></label>`).join('')}</div></fieldset>`).join('')}` }
const lerQuest=(k,pref,raiz)=>ESCALAS[k].itens.map((_,i)=>{ const r=(raiz||document).querySelector(`input[name="${pref}${i}"]:checked`); return r?+r.value:null });
function aplicarAgora(cid,k,volta){ const c=cli(cid), E=ESCALAS[k];
  abrirSheet(E.n,`${esc(c.nome)} · responde no seu aparelho`,questHTML(k,'qa')+`<button class="btn pri full" id="qa-ok" style="margin-top:14px">${ic('check')}Ver resultado</button>`,fechar=>{
    $('#qa-ok').onclick=()=>{ const r=lerQuest(k,'qa'); if(r.some(v=>v==null))return toast('Faltou responder '+(r.indexOf(null)+1));
      if(!S.escalas)S.escalas=[]; const e={id:uid(),clienteId:cid,instr:k,data:hojeISO(),resp:r,pontos:r.reduce((a,b)=>a+b,0),via:'sessao'}; S.escalas.push(e); salvar();
      const f=faixaEsc(k,e.pontos); fechar(); toast(`${E.curto}: ${e.pontos} pontos · ${f[1]}${item9(e)?' · atenção ao item 9':''}`); if(volta)volta() } }) }
async function mandarQuest(cid,k){ const c=cli(cid);
  if(!CONTA)return toast('O link precisa da conta na nuvem');
  try{ const t=await rpc('criar_questionario',{p_cid:CONTA.cid,p_cliente:cid,p_instr:k});
    if(!S.escalas)S.escalas=[]; S.escalas.push({id:uid(),clienteId:cid,instr:k,data:hojeISO(),resp:null,pontos:null,via:'link',token:t}); salvar();
    zapAbrir(zap(c.tel,`Oi, ${c.nome.split(' ')[0]}! Antes da nossa próxima sessão, você pode responder um questionário rápido? Leva 2 minutos:\n\n${SITE()}?responder=${t}`)); render() }
  catch(e){ toast(/criar_questionario|PGRST202|404/.test(String(e.message)+e.status)?'Falta rodar o script questionarios.sql no Supabase':msgErro(e)) } }
/* traz as respostas que chegaram pelo link */
let questT=0;
async function buscaQuest(){ if(!CONTA||!podeClinico()||Date.now()-questT<30000)return false; const pend=(S.escalas||[]).filter(e=>e.token&&!e.resp); if(!pend.length)return false; questT=Date.now();
  try{ const ls=await api(`/rest/v1/questionarios?clinica_id=eq.${CONTA.cid}&respondido_em=not.is.null&select=token,respostas,pontos,respondido_em`)||[]; let mud=false;
    ls.forEach(r=>{ const e=pend.find(z=>z.token===r.token); if(e){ e.resp=r.respostas; e.pontos=r.pontos; e.data=String(r.respondido_em).slice(0,10); mud=true } });
    if(mud)salvar(); return mud }catch(e){ return false } }
function graficoEsc(ls,max){ if(ls.length<2)return ''; const W=280,H=70, x=i=>8+i*(W-16)/(ls.length-1), y=v=>H-6-(v/max)*(H-12);
  return `<svg class="esc-g" viewBox="0 0 ${W} ${H}" role="img" aria-label="Pontuação ao longo do tempo: ${ls.map(e=>e.pontos).join(', ')}"><polyline fill="none" stroke="var(--ac)" stroke-width="2" points="${ls.map((e,i)=>x(i)+','+y(e.pontos)).join(' ')}"/>${ls.map((e,i)=>`<circle cx="${x(i)}" cy="${y(e.pontos)}" r="3.5" fill="var(--ac)"/>`).join('')}</svg>` }

/* ── seções da ficha (psicologia) ── */
function secPsiFicha(cid){ if(!ehPsico()||!podeClinico())return ''; const p=prontPsiDe(cid), es=escalasDe(cid), pend=(S.escalas||[]).filter(e=>e.clienteId===cid&&!e.resp);
  const porI=k=>es.filter(e=>e.instr===k);
  return `<div class="sec"><div class="sec-top"><h2>Prontuário</h2>${p&&p.fim?'<span class="pill">encerrado</span>':''}</div><div class="card">
      ${p?`<p class="sub" style="margin:0 0 8px">Desde ${dataBR(p.inicio)}${p.abordagem?' · '+esc(p.abordagem):''}${p.demanda?'<br>'+esc(p.demanda.slice(0,120))+(p.demanda.length>120?'…':''):''}</p>`:'<p class="sub" style="margin:0 0 8px">Registre a demanda e os objetivos. As anotações das sessões entram como evolução.</p>'}
      <button class="btn sm ${p?'soft':'pri'}" id="h-pp">${ic('edit',16)}${p?'Abrir prontuário':'Começar prontuário'}</button></div></div>
    <div class="sec"><div class="sec-top"><h2>Questionários</h2></div><div class="card">
      ${Object.keys(ESCALAS).map(k=>{ const l=porI(k), u=l[l.length-1], f=u&&faixaEsc(k,u.pontos);
        return `<div class="esc-b"><div class="row" style="justify-content:space-between;gap:8px;flex-wrap:wrap"><b>${ESCALAS[k].n}</b>${u?`<span class="pill ${f[2]}">${u.pontos}/${ESCALAS[k].max} · ${f[1]}</span>`:''}</div>
          ${u?`<small class="sub">Último em ${dataBR(u.data)}${l.length>1?` · antes: ${l.slice(-4,-1).map(e=>e.pontos).join(', ')}`:''}${item9(u)?' · <b class="v-bad">item 9 marcado: converse sobre isso</b>':''}</small>`:''}
          ${graficoEsc(l.slice(-10),ESCALAS[k].max)}
          <div class="row" style="gap:8px;margin-top:6px"><button class="btn sm soft" data-q-ag="${k}">Aplicar agora</button>${CONTA&&cli(cid).tel?`<button class="btn sm soft" data-q-link="${k}">${ic('chat',16)}Mandar por link</button>`:''}</div></div>` }).join('')}
      ${pend.length?`<p class="sub" style="margin:8px 0 0">Esperando resposta: ${pend.map(e=>ESCALAS[e.instr].curto+' de '+dataBR(e.data)).join(', ')}</p>`:''}
      <p class="sub" style="margin:8px 0 0;font-size:12.5px">PHQ-9 e GAD-7 são questionários de rastreio de uso livre. Não substituem a avaliação do profissional.</p></div></div>` }
function secInformeFicha(cid){ if(!(ehPsico()||area()==='odonto'))return ''; if(typeof permitido==='function'&&!permitido('registrar'))return '';
  return `<div class="sec"><div class="card row" style="justify-content:space-between;gap:10px;align-items:center"><div><b>Informe para o Imposto de Renda</b><br><small class="sub">Tudo o que ${esc(cli(cid).nome.split(' ')[0])} pagou no ano, para declarar</small></div><button class="btn sm soft" id="h-ir">${ic('file',16)}Gerar</button></div></div>` }
const _topoPsi=topoHist, _ligaPsi=ligarTopoHist;
topoHist=c=>_topoPsi(c)+secPsiFicha(c.id)+secInformeFicha(c.id);
ligarTopoHist=function(id,fechar){ _ligaPsi(id,fechar); const volta=()=>setTimeout(()=>historico(id),300);
  if($('#h-pp'))$('#h-pp').onclick=()=>{ fechar(); setTimeout(()=>abreProntPsi(id,volta),260) };
  if($('#h-ir'))$('#h-ir').onclick=()=>{ fechar(); setTimeout(()=>abreInforme(id),260) };
  document.querySelectorAll('.sheet [data-q-ag]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>aplicarAgora(id,b.dataset.qAg,volta),260) });
  document.querySelectorAll('.sheet [data-q-link]').forEach(b=>b.onclick=()=>{ b.disabled=true; mandarQuest(id,b.dataset.qLink).then(()=>{ fechar(); volta() }) });
  buscaQuest().then(m=>{ if(m&&document.querySelector('.sheet')){ fechar(); volta() } });
};

/* ── 3. Informe anual para o IR ── */
/* o que a pessoa pagou em cada mês, pela data do pagamento (é o que vale para o IR): pacote pago à vista entra inteiro no mês em que foi pago */
function pagosDoMes(cid,mes){ return S.vendas.filter(v=>v.clienteId===cid&&mesDe(v.data)===mes).map(v=>{ const k=conta(v); return {v,valor:Math.max(0,k.bruto-(k.devolvido||0))} }).filter(x=>x.valor>0) }
function pagosNoAno(cid,ano){ const r=[]; for(let m=1;m<=12;m++){ const mes=`${ano}-${String(m).padStart(2,'0')}`, ls=pagosDoMes(cid,mes); r.push({mes,n:ls.length,total:ls.reduce((a,l)=>a+l.valor,0)}) } return r }
function informeHTML(cid,ano){ const c=cli(cid), p=S.perfil||{}, ms=pagosNoAno(cid,ano), tot=ms.reduce((a,m)=>a+m.total,0), pag=(c.pagNome||'').trim();
  return `<div class="recibo doc-imp"><div class="rc-cab"><b class="rc-t">Declaração de pagamentos · ${ano}</b>${topoRecibo()?`<span>${esc(topoRecibo())}</span>`:''}${profLinha()?`<span>${esc(profLinha())}</span>`:''}</div>
    <div class="doc-tx">Declaro, para fins de Imposto de Renda, que recebi${pag?` de ${esc(pag)}${c.pagCpf?', CPF '+esc(fmtDoc(c.pagCpf)):''}, referente a ${esc(c.nome)}${c.cpf?', CPF '+esc(fmtDoc(c.cpf)):''},`:` de ${esc(c.nome)}${c.cpf?', CPF '+esc(fmtDoc(c.cpf)):''},`} o valor total de <b>${brl(tot)}</b> por ${DESCR[area()]||'atendimentos'} prestados no ano de ${ano}.</div>
    <table class="doc-tab"><thead><tr><th>Mês</th><th>Pagamentos</th><th>Valor</th></tr></thead><tbody>${ms.filter(m=>m.n).map(m=>`<tr><td>${esc(mesNome(m.mes))}</td><td>${m.n}</td><td>${brl(m.total)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td>${ms.reduce((a,m)=>a+m.n,0)}</td><td>${brl(tot)}</td></tr></tfoot></table>
    <p class="doc-dt">${esc((p.cidade?p.cidade+', ':'')+dataCheia(hojeISO()))}</p>
    <div class="rc-ass">${assProfImg()}<span></span><small>${esc(p.nome||'Profissional')}${p.doc?' · CPF/CNPJ '+esc(fmtDoc(p.doc)):''}${p.registro?' · '+esc(AREAS[area()].reg)+' '+esc(p.registro):''}</small></div></div>` }
function abreInforme(cid){ const c=cli(cid), a0=+hojeISO().slice(0,4); let ano=new Date().getMonth()<4?a0-1:a0;
  abrirSheet('Informe para o IR',esc(c.nome),`<div class="chips" role="group" aria-label="Ano">${[a0-2,a0-1,a0].map(a=>`<button class="chip" data-ir-a="${a}">${a}</button>`).join('')}</div><div id="ir-c" style="margin-top:12px"></div>`,fechar=>{
    const pinta=()=>{ document.querySelectorAll('[data-ir-a]').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.irA===ano)); const ms=pagosNoAno(cid,ano), tot=ms.reduce((a,m)=>a+m.total,0), p=S.perfil||{};
      $('#ir-c').innerHTML=tot?`<div class="card" style="padding:4px 14px">${ms.filter(m=>m.n).map(m=>`<div class="item"><div class="mn"><b>${esc(mesNome(m.mes))}</b><small>${m.n} pagamento(s)</small></div><div class="vr">${brl(m.total)}</div></div>`).join('')}</div>
        <div class="rap-sobra" style="margin-top:10px"><span>Total em ${ano}</span><b>${brl(tot)}</b></div>
        ${!p.nome||!p.doc?`<div class="nota" style="margin-top:10px">Faltam seu nome e CPF ou CNPJ. Preencha em Configurações → Seus dados profissionais.</div>`:''}
        ${!c.cpf&&!c.pagCpf?`<div class="nota" style="margin-top:10px">Sem o CPF de ${esc(c.nome.split(' ')[0])} no cadastro. A Receita pede o CPF de quem pagou.</div>`:''}
        <button class="btn pri full" id="ir-imp" style="margin-top:12px">${ic('file')}Imprimir ou salvar PDF</button>`
        :`<p class="sub">Nenhum pagamento de ${esc(c.nome.split(' ')[0])} em ${ano}.</p>`;
      if($('#ir-imp'))$('#ir-imp').onclick=()=>imprimir(informeHTML(cid,ano)) };
    document.querySelectorAll('[data-ir-a]').forEach(b=>b.onclick=()=>{ ano=+b.dataset.irA; pinta() }); pinta() }) }

/* ── 4. Fechamento do mês (quem cobra por mês) ── */
let fchMes='';
T.fechamento=function(el){ fchMes=fchMes||mesAtual(); const mes=fchMes;
  const ags=S.agenda.filter(a=>mesDe(a.data)===mes&&a.clienteId);
  const ids=[...new Set(ags.map(a=>a.clienteId).concat(S.vendas.filter(v=>mesDe(v.data)===mes&&v.clienteId).map(v=>v.clienteId),(S.receber||[]).filter(r=>mesDe(r.data)===mes&&r.clienteId).map(r=>r.clienteId)))].filter(id=>cli(id));
  const linhas=ids.map(id=>{ const c=cli(id), as=ags.filter(a=>a.clienteId===id), fe=as.filter(a=>a.status==='concluido').sort((a,b)=>a.data.localeCompare(b.data)), fa=as.filter(a=>a.status==='faltou'), mar=as.filter(a=>a.status==='marcado');
    const pago=pagosDoMes(id,mes).reduce((a,l)=>a+l.valor,0), aberto=(S.receber||[]).filter(r=>r.clienteId===id&&mesDe(r.data)===mes).reduce((a,r)=>a+num(r.valor),0);
    return {c,fe,fa,mar,pago,aberto} }).sort((a,b)=>(b.aberto-a.aberto)||a.c.nome.localeCompare(b.c.nome));
  const tot=k=>linhas.reduce((a,l)=>a+l[k],0);
  const meses=[]; for(let i=0;i<6;i++){ const d=new Date(); d.setDate(1); d.setMonth(d.getMonth()-i); meses.push(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')) }
  el.innerHTML=`<h1>Fechamento do mês</h1><p class="sub">Sessões, faltas, o que já foi pago e o que falta, paciente por paciente</p>
    <div class="field" style="margin-top:12px"><label for="fc-m" class="sr-only">Mês</label><select id="fc-m">${meses.map(m=>`<option value="${m}" ${m===mes?'selected':''}>${mesNome(m)}</option>`).join('')}</select></div>
    <section class="kpis cx-k" aria-label="Resumo"><div class="kpi"><span class="lb">Sessões feitas</span><div class="kv">${linhas.reduce((a,l)=>a+l.fe.length,0)}</div><p class="kx">${linhas.reduce((a,l)=>a+l.fa.length,0)} falta(s)</p></div>
      <div class="kpi"><span class="lb">Recebido</span><div class="kv v-ok">${brl(tot('pago'))}</div><p class="kx">no mês</p></div>
      <div class="kpi"><span class="lb">Em aberto</span><div class="kv ${tot('aberto')?'v-bad':''}">${brl(tot('aberto'))}</div><p class="kx">${linhas.filter(l=>l.aberto).length} paciente(s)</p></div></section>
    <div class="sec"><div class="card">${linhas.map(l=>`<div class="item"><div class="mn"><b>${esc(l.c.nome)} ${l.aberto?`<span class="pill bad">deve ${brl(l.aberto)}</span>`:l.fe.length?'<span class="pill ok">em dia</span>':''}</b>
        <small>${l.fe.length} sessão(ões)${l.fe.length?' · dias '+l.fe.map(a=>+a.data.slice(8)).join(', '):''}${l.fa.length?` · ${l.fa.length} falta(s)`:''}${l.mar.length?` · ${l.mar.length} ainda marcada(s)`:''} · pago ${brl(l.pago)}</small></div>
      <div class="acts">${l.c.tel?`<button class="btn sm soft" data-fc-zap="${l.c.id}">${ic('chat',16)}Mandar fechamento</button>`:''}${l.aberto?`<button class="btn sm pri" data-fc-rec="${l.c.id}">${ic('check',16)}Recebi</button>`:''}${l.pago?`<button class="btn sm soft" data-fc-recibo="${l.c.id}">Recibo</button>`:''}</div></div>`).join('')
      ||`<div class="vazio"><b>Nada neste mês</b><p>As sessões da agenda aparecem aqui, paciente por paciente.</p></div>`}</div></div>`;
  $('#fc-m').onchange=()=>{ fchMes=$('#fc-m').value; render() };
  const acha=id=>linhas.find(l=>l.c.id===id);
  el.querySelectorAll('[data-fc-zap]').forEach(b=>b.onclick=()=>{ const l=acha(b.dataset.fcZap);
    zapAbrir(zap(l.c.tel,`Oi, ${l.c.nome.split(' ')[0]}! Segue o fechamento de ${mesNome(mes).toLowerCase()}:\n\n• Sessões: ${l.fe.length}${l.fe.length?' (dias '+l.fe.map(a=>+a.data.slice(8)).join(', ')+')':''}${l.fa.length?`\n• Faltas: ${l.fa.length}`:''}\n• Já pago: ${brl(l.pago)}${l.aberto?`\n• Em aberto: *${brl(l.aberto)}*`:'\n\nTudo certo, obrigado!'}${l.aberto?`\n\nPode acertar pelo Pix quando puder.${(S.perfil||{}).pix?' Chave: '+S.perfil.pix:''} Qualquer dúvida, me chama!`:''}`)) });
  el.querySelectorAll('[data-fc-rec]').forEach(b=>b.onclick=()=>receberSheet(b.dataset.fcRec));
  el.querySelectorAll('[data-fc-recibo]').forEach(b=>b.onclick=()=>recibo(b.dataset.fcRecibo));
};

/* ── página pública do questionário: ?responder=token ── */
function paginaQuest(tok,pub,pubRpc,cor,erro){
  pubRpc('ver_questionario',{p_token:tok}).then(v=>{ if(!v||!ESCALAS[v.instrumento])return erro('Este link de questionário não existe.'); cor(v.area);
    if(v.respondido)return pub.innerHTML=`<div class="pub-c pub-ok"><span class="av-ic ok">${ic('check',26)}</span><h1>Obrigado!</h1><p class="sub">Este questionário já foi respondido.</p></div>`;
    const k=v.instrumento;
    pub.innerHTML=`<div class="pub-c"><p class="eyebrow">${esc(v.clinica||'')}</p><h1>Questionário</h1>${questHTML(k,'qp')}<button class="btn pri full" id="p-ok" style="margin-top:14px">Enviar respostas</button>
      <p class="sub" style="margin-top:8px;text-align:center">Só o seu psicólogo ou a sua psicóloga vê as respostas.</p></div>`;
    $('#p-ok').onclick=async()=>{ const r=lerQuest(k,'qp',pub); if(r.some(x=>x==null))return toast('Faltou responder a pergunta '+(r.indexOf(null)+1));
      const b=$('#p-ok'); b.disabled=true;
      try{ await pubRpc('responder_questionario',{p_token:tok,p_respostas:r});
        pub.innerHTML=`<div class="pub-c pub-ok"><span class="av-ic ok">${ic('check',26)}</span><h1>Obrigado!</h1><p class="sub">As respostas foram enviadas. Vocês conversam sobre elas na próxima sessão.</p>
          ${k==='phq9'&&r[8]>0?`<div class="card" style="margin-top:18px;text-align:left"><b>Se estiver difícil agora</b><p class="sub" style="margin:6px 0 0">Você não precisa esperar a próxima sessão: fale com a sua psicóloga ou o seu psicólogo. Se precisar conversar com alguém já, o CVV atende 24 horas pelo telefone <a href="tel:188"><b>188</b></a>, de graça, ou pelo chat em cvv.org.br.</p></div>`:''}</div>` }
      catch(e){ b.disabled=false; toast(e.rede?'Sem internet. Tente de novo.':'Este link expirou ou já foi usado.') } } })
  .catch(e=>erro(e.rede?'Sem internet. Confira a conexão e recarregue.':'Este link de questionário não existe.'));
}

/* ── recibos de todos do mês, de uma vez ── */
function recibosLote(mes){ const p=S.perfil||{};
  if(!p.nome||!p.doc)return toast('Preencha seus dados profissionais em Configurações antes');
  const ids=[...new Set(S.clientes.map(c=>c.id))].filter(id=>linhasRecibo(id,mes).length);
  if(!ids.length)return toast('Ninguém pagou neste mês');
  const semCpf=ids.filter(id=>!cli(id).cpf&&!cli(id).pagCpf).length;
  confirmar(`Imprimir ${ids.length} recibo(s)?`,`Um por página, de ${mesNome(mes).toLowerCase()}.${semCpf?` <b>${semCpf} sem CPF</b> no cadastro: o recibo sai sem o CPF.`:''} Na janela de impressão, escolha "Salvar como PDF" para guardar.`,'Imprimir',()=>{
    imprimir(ids.map(id=>`<div class="lote-pg">${reciboHTML(id,mes,cli(id).cpf||'')}</div>`).join('')) }) }

/* ── fatura do mês: um extrato para o paciente, com a chave Pix ── */
function faturaHTML(cid,mes){ const c=cli(cid), p=S.perfil||{}, ags=S.agenda.filter(a=>a.clienteId===cid&&mesDe(a.data)===mes).sort((a,b)=>a.data.localeCompare(b.data));
  const feitas=ags.filter(a=>a.status==='concluido'), faltas=ags.filter(a=>a.status==='faltou');
  const pago=pagosDoMes(cid,mes).reduce((a,l)=>a+l.valor,0), ab=(S.receber||[]).filter(r=>r.clienteId===cid&&mesDe(r.data)===mes), aberto=ab.reduce((a,r)=>a+num(r.valor),0);
  return `<div class="recibo doc-imp"><div class="rc-cab"><b class="rc-t">Fatura · ${esc(mesNome(mes))}</b>${topoRecibo()?`<span>${esc(topoRecibo())}</span>`:''}${profLinha()?`<span>${esc(profLinha())}</span>`:''}</div>
    <p class="doc-pac"><b>Paciente:</b> ${esc(c.nome)}</p>
    <table class="doc-tab"><thead><tr><th>Data</th><th>Situação</th><th>Valor</th></tr></thead><tbody>
      ${feitas.map(a=>{ const r=ab.find(x=>x.agId===a.id); return `<tr><td>${dataBR(a.data)}</td><td>Sessão realizada${r?' · em aberto':''}</td><td>${r?brl(num(r.valor)):''}</td></tr>` }).join('')}
      ${faltas.map(a=>{ const r=ab.find(x=>x.agId===a.id); return `<tr><td>${dataBR(a.data)}</td><td>Falta${r?' (cobrada)':''}</td><td>${r?brl(num(r.valor)):''}</td></tr>` }).join('')}
      ${ab.filter(r=>!ags.some(a=>a.id===r.agId)).map(r=>`<tr><td>${dataBR(r.data)}</td><td>${esc(r.desc||'Em aberto')}</td><td>${brl(num(r.valor))}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td colspan="2">Já pago no mês</td><td>${brl(pago)}</td></tr><tr><td colspan="2">A pagar</td><td>${brl(aberto)}</td></tr></tfoot></table>
    ${aberto&&p.pix?`<p class="doc-pac" style="margin-top:16px"><b>Pix:</b> ${esc(p.pix)}</p>`:''}
    <p class="doc-dt">${esc((p.cidade?p.cidade+', ':'')+dataCheia(hojeISO()))}</p></div>` }
const _fchT=T.fechamento;
T.fechamento=function(el){ _fchT(el); const mes=fchMes, p=S.perfil||{};
  const top=el.querySelector('.kpis'); if(top)top.insertAdjacentHTML('afterend',`<div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn soft" id="fc-lote">${ic('file',16)}Recibos de todos do mês</button>
    ${p.pix?'':`<small class="sub" style="align-self:center">Cadastre sua chave Pix em Configurações para ela ir nas cobranças.</small>`}</div>`);
  if($('#fc-lote'))$('#fc-lote').onclick=()=>recibosLote(mes);
  el.querySelectorAll('[data-fc-zap]').forEach(b=>{ const id=b.dataset.fcZap; b.insertAdjacentHTML('afterend',`<button class="btn sm soft" data-fc-fat="${id}">Fatura</button>`) });
  el.querySelectorAll('[data-fc-fat]').forEach(b=>b.onclick=()=>imprimir(faturaHTML(b.dataset.fcFat,mes)));
};

/* ── contato de emergência (psicologia) ── */
const _cliEm=T.clientes;
T.clientes=function(el){ _cliEm(el); const add=$('#c-add'); if(!add||!ehPsico())return;
  const eid=edit.t==='cli'?edit.id:'', ed=eid&&cli(eid), obs=$('#c-obs'); if(!obs)return;
  obs.closest('.field').insertAdjacentHTML('afterend',`<div class="grid2"><div class="field"><label for="c-emn">Contato de emergência</label><input id="c-emn" placeholder="Nome e parentesco" value="${esc(ed&&ed.emerg?ed.emerg.nome:'')}"></div>
    <div class="field"><label for="c-emt">Telefone dele(a)</label><input id="c-emt" inputmode="tel" placeholder="(11) 90000-0000" value="${esc(ed&&ed.emerg?ed.emerg.tel:'')}"></div></div>`);
  const orig=add.onclick;
  add.onclick=()=>{ const n=$('#c-emn').value.trim(), t=$('#c-emt').value.trim(), antes=new Set(S.clientes.map(c=>c.id));
    orig(); const alvo=eid?cli(eid):S.clientes.find(c=>!antes.has(c.id)); if(alvo){ if(n||t)alvo.emerg={nome:n,tel:t}; else delete alvo.emerg; salvar() } } };
MASC.push(['#c-emt',v=>fmtTel(v)]);
const _topoEm=topoHist;
topoHist=c=>{ const h=_topoEm(c); if(!ehPsico()||!c.emerg||!(c.emerg.nome||c.emerg.tel))return h;
  return `<div class="nota emerg-n"><b>Emergência:</b> ${esc(c.emerg.nome||'')}${c.emerg.tel?` · <a href="tel:+55${soDig(c.emerg.tel)}">${esc(c.emerg.tel)}</a>`:''}</div>`+h };

/* ── quem parou de vir (psicologia): vinha com regularidade e sumiu sem nada marcado ── */
function pararamDeVir(){ if(!ehPsico())return []; const h=hojeISO();
  return S.clientes.map(c=>{ const as=S.agenda.filter(a=>a.clienteId===c.id), fe=as.filter(a=>a.status==='concluido').map(a=>a.data).sort();
    if(fe.length<3||as.some(a=>a.status==='marcado'&&a.data>=h))return null;
    if((prontPsiDe(c.id)||{}).fim)return null;
    const ult=fe[fe.length-1], gaps=fe.slice(-6).map((d,i,l)=>i?diasEntre(l[i-1],d):null).filter(x=>x!=null).sort((a,b)=>a-b), med=gaps[Math.floor(gaps.length/2)]||7;
    const sem=diasEntre(ult,h); return sem>=Math.max(14,med*2)&&sem<=120?{c,sem,med}:null }).filter(Boolean).sort((a,b)=>a.sem-b.sem) }
