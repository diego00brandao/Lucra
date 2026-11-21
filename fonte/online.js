/* ══════════ AGENDAMENTO ONLINE E PESQUISA DE SATISFAÇÃO ══════════
   A clínica publica só os horários livres (sem nomes). O paciente pede um horário por um link;
   o pedido aparece no Hoje para aceitar ou recusar. Depois do atendimento, um link de avaliação de 0 a 10. */
const onl=()=>Object.assign({ativo:false,servicos:[],dias:21,antes:2,titulo:'',aviso:'',codigo:'',preco:false},S.online||{});
const linkAgendar=()=>onl().codigo?SITE()+'?agendar='+onl().codigo:'';
function livresAgora(){ const o=onl(), e=exped(), h=hojeISO(), agora=new Date(), r={};
  const dur=Math.max(15,num(e.dur)||60), mi=t=>{ const [a,b]=String(t).split(':').map(Number); return a*60+(b||0) }, hm=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
  const limite=agora.getHours()*60+agora.getMinutes()+num(o.antes)*60;
  for(let i=0;i<Math.min(60,num(o.dias)||21);i++){ const d=somaDias(h,i); if(!e.dias.includes(dowDe(d)))continue;
    const ocup=S.agenda.filter(a=>a.data===d&&a.status==='marcado'&&a.hora).map(a=>mi(a.hora));
    const ls=[]; for(let m=mi(e.ini);m+dur<=mi(e.fim);m+=dur){ if(i===0&&m<limite)continue; if(num(o.antes)>=24&&i<Math.ceil(num(o.antes)/24))continue;
      if(ocup.some(x=>Math.abs(x-m)<dur))continue; ls.push(hm(m)) }
    if(ls.length)r[d]=ls }
  return r }
/* publica os horários livres quando a agenda muda */
let pubUlt='', pubT=0;
function publicaLivres(){ if(!CONTA||!onl().ativo||!onl().codigo)return; clearTimeout(pubT);
  pubT=setTimeout(async()=>{ const l=livresAgora(), k=JSON.stringify(l); if(k===pubUlt)return;
    try{ await rpc('atualizar_livres',{p_cid:CONTA.cid,p_livres:l}); pubUlt=k }catch(e){} },2500) }
const _salvarOn=salvar;
salvar=function(){ _salvarOn(); publicaLivres() };
setInterval(()=>{ pubUlt=''; publicaLivres() },15*60*1000);   /* horários que já passaram saem da lista */

T.online=function(el){ const o=onl(), lk=linkAgendar();
  if(!CONTA){ el.innerHTML=`<h1>Agenda online</h1><p class="sub">O paciente escolhe um horário livre por um link</p><div class="card" style="margin-top:16px"><div class="vazio"><b>Precisa da conta na nuvem</b><p>O link de agendamento funciona quando o Lucra está com login. Abra pelo endereço do app e entre na sua conta.</p></div></div>`; return }
  const l=livresAgora(), nd=Object.keys(l).length, nh=Object.values(l).reduce((a,x)=>a+x.length,0);
  el.innerHTML=`<h1>Agenda online</h1><p class="sub">O paciente escolhe um horário livre por um link. Você confirma.</p>
    <div class="sec"><div class="card">
      <label class="sw"><input type="checkbox" id="on-at" ${o.ativo?'checked':''}><span><b>Receber pedidos de horário pelo link</b></span></label>
      ${o.ativo&&lk?`<div class="on-link"><span>${esc(lk)}</span><div class="row" style="gap:8px;margin-top:8px"><button class="btn sm pri" id="on-cp">${ic('file',16)}Copiar link</button><a class="btn sm soft" href="${esc(lk)}&previa=1" target="_blank" rel="noopener">${ic('arrow',16)}Ver como o paciente vê</a></div>
        <p class="sub" style="margin-top:8px">Coloque na bio do Instagram, no WhatsApp Business ou mande para quem pedir horário.</p></div>`:''}
    </div></div>
    <div class="sec"><div class="card"><h2 style="margin-bottom:10px">O que o paciente pode marcar</h2>
      <div class="chips" role="group" aria-label="Procedimentos no link">${S.servicos.map(s=>`<button class="chip" data-on-s="${s.id}" aria-pressed="${o.servicos.includes(s.id)}">${esc(s.nome)}</button>`).join('')}</div>
      <label class="sw" style="margin-top:12px"><input type="checkbox" id="on-pr" ${o.preco?'checked':''}><span>Mostrar o preço</span></label>
      <div class="grid2" style="margin-top:10px"><div class="field"><label for="on-d">Mostrar os próximos</label><select id="on-d">${[7,14,21,30,45,60].map(n=>`<option value="${n}" ${n===num(o.dias)?'selected':''}>${n} dias</option>`).join('')}</select></div>
        <div class="field"><label for="on-an">Antecedência mínima</label><select id="on-an">${[[1,'1 hora'],[2,'2 horas'],[4,'4 horas'],[12,'12 horas'],[24,'1 dia'],[48,'2 dias']].map(([v,n])=>`<option value="${v}" ${v===num(o.antes)?'selected':''}>${n}</option>`).join('')}</select></div></div>
      <div class="field"><label for="on-tit">Nome que aparece</label><input id="on-tit" placeholder="${esc(UI.clinica||'Nome da clínica')}" value="${esc(o.titulo)}"></div>
      <div class="field"><label for="on-av">Recado para o paciente (opcional)</label><input id="on-av" maxlength="300" placeholder="ex.: Rua das Flores, 120 · sala 3. Chegue 10 min antes." value="${esc(o.aviso)}"></div>
      <p class="sub">Os horários seguem o seu expediente (${e2txt()}) e somem quando alguém marca. <button class="btn-tx" id="on-exp">Mudar expediente</button></p>
      <button class="btn pri full" id="on-ok" style="margin-top:6px">${ic('check')}Salvar</button>
      ${o.ativo?`<p class="sub" style="margin-top:10px">Agora: ${nh} horário(s) livre(s) em ${nd} dia(s).</p>`:''}</div></div>`;
  const tog=new Set(o.servicos.filter(id=>serv(id)));
  el.querySelectorAll('[data-on-s]').forEach(b=>b.onclick=()=>{ const id=b.dataset.onS; tog.has(id)?tog.delete(id):tog.add(id); b.setAttribute('aria-pressed',tog.has(id)) });
  $('#on-exp').onclick=()=>ir('ocupacao');
  const prev=el.querySelector('a[href$="&previa=1"]'); if(prev)prev.onclick=e=>{ e.preventDefault();
    abrirSheet('Como o paciente vê','A página do link, aqui dentro do app',`<iframe class="prev-fr" src="${esc(lk)}&previa=1&dentro=1" title="Página de agendamento"></iframe>`,()=>{}) };
  if($('#on-cp'))$('#on-cp').onclick=()=>{ try{ navigator.clipboard.writeText(lk); toast('Link copiado') }catch(e){ toast('Não deu para copiar') } };
  $('#on-ok').onclick=async()=>{ const at=$('#on-at').checked; if(at&&!tog.size)return toast('Escolha pelo menos um procedimento');
    const n=Object.assign(onl(),{ativo:at,servicos:[...tog],preco:$('#on-pr').checked,dias:+$('#on-d').value,antes:+$('#on-an').value,titulo:$('#on-tit').value.trim(),aviso:$('#on-av').value.trim()});
    const svs=n.servicos.map(id=>{ const s=serv(id); return {id,nome:s.nome,preco:n.preco?num(s.preco):null} });
    const b=$('#on-ok'); b.disabled=true;
    try{ n.codigo=await rpc('configurar_vitrine',{p_cid:CONTA.cid,p_ativo:at,p_titulo:n.titulo||UI.clinica||'',p_aviso:n.aviso,p_servicos:svs}); S.online=n; pubUlt=''; salvar(); toast(at?'Agenda online ligada':'Agenda online desligada'); render() }
    catch(e){ b.disabled=false; toast(/configurar_vitrine|PGRST202|404/.test(String(e.message)+e.status)?'Falta rodar o script publico.sql no Supabase':msgErro(e)) } };
};
const e2txt=()=>{ const e=exped(), D=['dom','seg','ter','qua','qui','sex','sáb']; return e.dias.slice().sort().map(d=>D[d]).join(', ')+', '+e.ini+' às '+e.fim };

/* ── pedidos que chegaram pelo link ── */
let PEDIDOS=[], pedT=0;
async function buscaPedidos(){ if(!CONTA||!onl().ativo)return PEDIDOS=[];
  if(Date.now()-pedT<20000)return PEDIDOS; pedT=Date.now();
  try{ PEDIDOS=await api(`/rest/v1/pedidos?clinica_id=eq.${CONTA.cid}&status=eq.novo&order=criado_em.asc`)||[] }catch(e){} return PEDIDOS }
function abrePedidos(){ if(!PEDIDOS.length)return toast('Nenhum pedido novo');
  abrirSheet('Pedidos de horário',`${PEDIDOS.length} pelo link de agendamento`,`<div id="pd-l"></div>`,fechar=>{
    const pinta=()=>{ const b=$('#pd-l'); if(!b)return; if(!PEDIDOS.length){ fechar(); render(); return }
      b.innerHTML=PEDIDOS.map(p=>{ const ja=S.agenda.find(a=>a.data===p.data&&a.hora===p.hora&&a.status==='marcado'), c=cliPorTel(p.tel);
        return `<div class="item"><div class="mn"><b>${esc(p.nome)}${c?' <span class="pill ok">já é paciente</span>':' <span class="pill ac">novo</span>'}</b>
          <small>${esc(p.servico)} · ${DOW_L[dowDe(p.data)]}, ${dataBR(p.data)} às ${esc(p.hora)} · ${esc(fmtTel(p.tel))}${p.obs?' · '+esc(p.obs):''}${ja?' · <b class="v-bad">horário já ocupado</b>':''}</small></div>
          <div class="acts"><button class="btn sm pri" data-pd-ok="${p.id}">${ic('check',16)}Aceitar</button><button class="btn sm soft" data-pd-no="${p.id}">Recusar</button></div></div>` }).join('');
      const tira=id=>{ PEDIDOS=PEDIDOS.filter(p=>p.id!==id); pinta() };
      b.querySelectorAll('[data-pd-ok]').forEach(x=>x.onclick=async()=>{ const p=PEDIDOS.find(z=>z.id===x.dataset.pdOk); x.disabled=true;
        try{ await rpc('responder_pedido',{p_id:p.id,p_status:'aceito'}) }catch(e){ x.disabled=false; return toast(msgErro(e)) }
        let c=cliPorTel(p.tel); if(!c){ c={id:uid(),nome:p.nome,tel:fmtTel(p.tel),email:'',nasc:'',obs:'Veio pelo agendamento online',cpf:''}; S.clientes.push(c) }
        const a={id:uid(),clienteId:c.id,servicoId:serv(p.servico_id)?p.servico_id:'',data:p.data,hora:p.hora,status:'marcado',obs:p.obs?'Online: '+p.obs:'Pelo agendamento online'};
        S.agenda.push(a); salvar(); tira(p.id); toast('Agendado');
        if(c.tel)zapAbrir(zap(c.tel,`Oi, ${c.nome.split(' ')[0]}! Seu horário está confirmado: ${DOW_L[dowDe(a.data)]}, ${dataBR(a.data)} às ${a.hora}${serv(a.servicoId)?' ('+serv(a.servicoId).nome+')':''}.${onl().aviso?'\n\n'+onl().aviso:''}\n\nAté lá!`)) });
      b.querySelectorAll('[data-pd-no]').forEach(x=>x.onclick=async()=>{ const p=PEDIDOS.find(z=>z.id===x.dataset.pdNo); x.disabled=true;
        try{ await rpc('responder_pedido',{p_id:p.id,p_status:'recusado'}) }catch(e){ x.disabled=false; return toast(msgErro(e)) }
        tira(p.id); pubUlt=''; publicaLivres();
        zapAbrir(zap(p.tel,`Oi, ${p.nome.split(' ')[0]}! Recebi o seu pedido para ${dataBR(p.data)} às ${p.hora}, mas esse horário não vai dar. Posso te oferecer outro? Me diz qual dia e período ficam melhor para você.`)) });
    }; pinta() }) }
const cliPorTel=t=>{ const d=soDig(t).slice(-9); return d.length>=8?S.clientes.find(c=>soDig(c.tel).slice(-9)===d):null };

/* ── pesquisa de satisfação ── */
const pesqFeitas=()=>new Set((S.pesquisas||[]).map(p=>p.agId));
function paraAvaliar(){ return [];   /* pesquisa de satisfação desligada: as avaliações ficam no Google */
  if(!CONTA||onl().pesquisa===false)return []; const h=hojeISO(), ont=somaDias(h,-2), ja=pesqFeitas();
  return S.agenda.filter(a=>a.status==='concluido'&&a.data>=ont&&a.data<=h&&!ja.has(a.id)&&cli(a.clienteId)&&cli(a.clienteId).tel) }
async function pedirAvaliacao(a,depois){ const c=cli(a.clienteId);
  try{ const t=await rpc('criar_pesquisa',{p_cid:CONTA.cid,p_cliente:c.id,p_ag:a.id});
    if(!S.pesquisas)S.pesquisas=[]; S.pesquisas.push({agId:a.id,clienteId:c.id,token:t,data:hojeISO()}); salvar();
    zapAbrir(zap(c.tel,`Oi, ${c.nome.split(' ')[0]}! Obrigado por vir${UI.clinica?' à '+UI.clinica:''}. Você pode dar uma nota rápida para o atendimento? Leva 10 segundos:\n\n${SITE()}?avaliar=${t}`)); if(depois)depois() }
  catch(e){ toast(/criar_pesquisa|PGRST202|404/.test(String(e.message)+e.status)?'Falta rodar o script publico.sql no Supabase':msgErro(e)) } }
function abreAvaliar(){ const as=paraAvaliar(); if(!as.length)return;
  abrirSheet('Pedir avaliação','Quem foi atendido nos últimos dias',`<div id="av-l"></div><button class="btn-tx" id="av-pula" style="display:block;margin:10px auto 0">Não pedir para estes</button>`,fechar=>{
    const pinta=()=>{ const l=paraAvaliar(); if(!l.length){ fechar(); render(); return }
      $('#av-l').innerHTML=l.map(a=>{ const c=cli(a.clienteId), s=serv(a.servicoId); return `<div class="item"><div class="mn"><b>${esc(c.nome)}</b><small>${dataBR(a.data)}${s?' · '+esc(s.nome):''}</small></div>
        <div class="acts"><button class="btn sm pri" data-av-ag="${a.id}">${ic('chat',16)}Pedir nota</button></div></div>` }).join('');
      document.querySelectorAll('[data-av-ag]').forEach(b=>b.onclick=()=>{ b.disabled=true; pedirAvaliacao(S.agenda.find(a=>a.id===b.dataset.avAg),pinta) }) };
    $('#av-pula').onclick=()=>{ if(!S.pesquisas)S.pesquisas=[]; paraAvaliar().forEach(a=>S.pesquisas.push({agId:a.id,clienteId:a.clienteId,token:'',data:hojeISO()})); salvar(); fechar(); render() };
    pinta() }) }

let PESQ=null;
T.satisfacao=function(el){
  el.innerHTML=`<h1>Satisfação</h1><p class="sub">As notas que os pacientes deram, de 0 a 10</p><div id="sa-c"><div class="card" style="margin-top:16px"><p class="sub">Carregando…</p></div></div>`;
  if(!CONTA){ $('#sa-c').innerHTML=`<div class="card" style="margin-top:16px"><div class="vazio"><b>Precisa da conta na nuvem</b><p>O link de avaliação funciona quando o Lucra está com login.</p></div></div>`; return }
  const pinta=ls=>{ const b=$('#sa-c'); if(!b)return; const r=ls.filter(p=>p.nota!=null), env=ls.length;
    const pro=r.filter(p=>p.nota>=9).length, det=r.filter(p=>p.nota<=6).length, nps=r.length?Math.round((pro-det)/r.length*100):0, med=r.length?r.reduce((a,p)=>a+p.nota,0)/r.length:0;
    const ligado=onl().pesquisa!==false;
    b.innerHTML=`<section class="kpis cx-k" aria-label="Resumo">
      <div class="kpi dest"><span class="lb">Nota média</span><div class="kv">${r.length?med.toFixed(1).replace('.',','):'—'}</div><p class="kx">${r.length} de ${env} responderam</p></div>
      <div class="kpi"><span class="lb">Indicariam (9 e 10)</span><div class="kv v-ok">${r.length?Math.round(pro/r.length*100)+'%':'—'}</div><p class="kx">${pro} pessoa(s)</p></div>
      <div class="kpi"><span class="lb">Insatisfeitos (0 a 6)</span><div class="kv ${det?'v-bad':''}">${r.length?Math.round(det/r.length*100)+'%':'—'}</div><p class="kx">NPS ${r.length?nps:'—'}</p></div></section>
      <div class="sec"><div class="sec-top"><h2>O que disseram</h2></div><div class="card">${r.length?r.sort((a,b)=>String(b.respondido_em).localeCompare(String(a.respondido_em))).slice(0,40).map(p=>{ const c=cli(p.cliente_id);
        return `<div class="item"><div class="mn"><b>${esc(c?c.nome:'Paciente')} <span class="pill ${p.nota>=9?'ok':p.nota<=6?'bad':'war'}">${p.nota}</span></b><small>${dataBR(String(p.respondido_em).slice(0,10))}${p.comentario?' · '+esc(p.comentario):''}</small></div>
          ${p.nota<=6&&c&&c.tel?`<div class="acts"><a class="btn sm soft" href="${zap(c.tel,`Oi, ${c.nome.split(' ')[0]}! Vi a sua avaliação e queria entender melhor o que aconteceu, para melhorar. Pode me contar?`)}" target="_blank" rel="noopener">${ic('chat',16)}Conversar</a></div>`:''}</div>` }).join('')
        :'<p class="sub" style="margin:0">Ainda sem respostas. No Hoje, o Lucra lembra de pedir a nota para quem foi atendido.</p>'}</div></div>
      <div class="sec"><div class="card"><label class="sw"><input type="checkbox" id="sa-on" ${ligado?'checked':''}><span>Lembrar no Hoje de pedir avaliação depois do atendimento</span></label></div></div>`;
    $('#sa-on').onchange=()=>{ S.online=Object.assign(onl(),{pesquisa:$('#sa-on').checked}); salvar(); toast('Salvo') } };
  if(PESQ)pinta(PESQ);
  api(`/rest/v1/pesquisas?clinica_id=eq.${CONTA.cid}&order=criado_em.desc&limit=500`).then(ls=>{ PESQ=ls||[]; if(tela==='satisfacao')pinta(PESQ) })
    .catch(e=>{ const b=$('#sa-c'); if(b)b.innerHTML=`<div class="card" style="margin-top:16px"><div class="vazio"><b>Não carregou</b><p>${/404|PGRST/.test(String(e.status)+e.message)?'Falta rodar o script publico.sql no Supabase.':esc(msgErro(e))}</p></div></div>` });
};

/* ── avisos no Hoje ── */
const _hojeOn=T.hoje;
T.hoje=function(el){ _hojeOn(el);
  const av=[], pode=t=>typeof permitido!=='function'||permitido(t);
  if(PEDIDOS.length&&pode('novoag'))av.push(`<section class="aviso ac"><div class="av-top"><span class="av-ic">${ic('calendar',20)}</span><div><h2>${PEDIDOS.length} ${PEDIDOS.length>1?'pedidos':'pedido'} de horário pelo link</h2><p>${PEDIDOS.slice(0,3).map(p=>esc(p.nome.split(' ')[0])+' ('+dataBR(p.data)+' '+esc(p.hora)+')').join(', ')}</p></div></div><button class="btn sm soft" id="av-ped">Ver e confirmar${ic('right',16)}</button></section>`);
  const pa=paraAvaliar(); if(pa.length&&pode('agenda'))av.push(`<section class="aviso ok"><div class="av-top"><span class="av-ic">${ic('spark',20)}</span><div><h2>Pedir avaliação para ${pa.length} ${pa.length>1?'pessoas':'pessoa'}</h2><p>${pa.slice(0,3).map(a=>esc(cli(a.clienteId).nome.split(' ')[0])).join(', ')}${pa.length>3?'…':''}</p></div></div><button class="btn sm soft" id="av-aval">Pedir nota${ic('right',16)}</button></section>`);
  if(av.length){ let box=el.querySelector('.avisos'); if(!box){ const v=el.querySelector('.card'); if(v)v.remove(); box=document.createElement('div'); box.className='avisos'; el.appendChild(box) }
    box.insertAdjacentHTML('afterbegin',av.join('')); if($('#av-ped'))$('#av-ped').onclick=abrePedidos; if($('#av-aval'))$('#av-aval').onclick=abreAvaliar }
  if(CONTA&&onl().ativo){ const n=PEDIDOS.length; buscaPedidos().then(l=>{ if(tela==='hoje'&&l.length!==n)render() }) }
};

/* ══════════ PÁGINAS PÚBLICAS: ?agendar=código e ?avaliar=token ══════════ */
function paginaPublica(){ let q; try{ q=new URLSearchParams(location.search) }catch(e){ return false }
  const ag=q.get('agendar'), avl=q.get('avaliar'), rsp=q.get('responder'), txt=q.has('privacidade')?'privacidade':q.has('termos')?'termos':''; if(!ag&&!avl&&!rsp&&!txt)return false;
  const previa=(q.has('previa')&&!q.has('dentro'))||q.has('privacidade')||q.has('termos');
  document.body.className='publico'; document.body.innerHTML=`${previa?`<button class="btn soft pub-volta" id="pub-volta">${ic('left',18)}Voltar ao Lucra</button>`:''}<main class="pub" id="pub"><div class="pub-c"><p class="sub">Carregando…</p></div></main><div class="toast" id="toast" role="status" aria-live="polite"></div>`;
  if($('#pub-volta'))$('#pub-volta').onclick=()=>{ if(history.length>1)history.back(); else location.href=SITE() };
  const pub=$('#pub'), pubRpc=(n,a)=>sb('/rest/v1/rpc/'+n,{metodo:'POST',corpo:a,auth:false});
  const cor=ar=>{ if(AREAS[ar])document.documentElement.style.setProperty('--ac',AREAS[ar].cor) };
  const erro=t=>{ pub.innerHTML=`<div class="pub-c"><h1>Ops</h1><p class="sub">${t}</p></div>` };
  if(txt){ paginaTexto(txt,pub); document.title=(txt==='termos'?'Termos de uso':'Política de privacidade')+' · Lucra'; return true }
  if(rsp){ paginaQuest(rsp,pub,pubRpc,cor,erro); return true }
  if(ag){
    pubRpc('ver_vitrine',{p_codigo:ag}).then(v=>{ if(!v)return erro('Este link de agendamento não está ativo. Fale direto com a clínica.'); cor(v.area);
      const h=hojeISO(), dias=Object.keys(v.livres||{}).filter(d=>d>=h&&(v.livres[d]||[]).length).sort(); let sv=(v.servicos[0]||{}).id||'', dia=dias[0]||'', hora='';
      const pinta=()=>{ pub.innerHTML=`<div class="pub-c"><p class="eyebrow">Agendar horário</p><h1>${esc(v.titulo||'')}</h1>${v.aviso?`<p class="sub">${esc(v.aviso)}</p>`:''}
        <h2 class="pub-h">O que você quer marcar?</h2><div class="chips" role="group" aria-label="Procedimento">${v.servicos.map(s=>`<button class="chip" data-p-s="${esc(s.id)}" aria-pressed="${s.id===sv}">${esc(s.nome)}${s.preco!=null?' · '+brl(s.preco):''}</button>`).join('')}</div>
        ${dias.length?`<h2 class="pub-h">Dia</h2><div class="pub-dias" role="group" aria-label="Dia">${dias.map(d=>`<button class="chip" data-p-d="${d}" aria-pressed="${d===dia}"><small>${DOW_L[dowDe(d)].slice(0,3)}</small>${dataBR(d).slice(0,5)}</button>`).join('')}</div>
          <h2 class="pub-h">Horário</h2><div class="chips" role="group" aria-label="Horário">${(v.livres[dia]||[]).map(t=>`<button class="chip" data-p-h="${t}" aria-pressed="${t===hora}">${t}</button>`).join('')}</div>
          <div class="field" style="margin-top:16px"><label for="p-n">Seu nome</label><input id="p-n" autocomplete="name"></div>
          <div class="field"><label for="p-t">WhatsApp</label><input id="p-t" inputmode="tel" autocomplete="tel" placeholder="(11) 90000-0000"></div>
          <div class="field"><label for="p-o">Quer avisar algo? (opcional)</label><input id="p-o" maxlength="300"></div>
          <button class="btn pri full" id="p-ok">Pedir este horário</button><p class="sub" style="margin-top:8px;text-align:center">A clínica confirma pelo WhatsApp.</p>`
          :`<div class="card" style="margin-top:16px"><p class="sub" style="margin:0">Não há horários livres nos próximos dias. Fale direto com a clínica.</p></div>`}</div>`;
        pub.querySelectorAll('[data-p-s]').forEach(b=>b.onclick=()=>{ sv=b.dataset.pS; guarda(); pinta() });
        pub.querySelectorAll('[data-p-d]').forEach(b=>b.onclick=()=>{ dia=b.dataset.pD; hora=''; guarda(); pinta() });
        pub.querySelectorAll('[data-p-h]').forEach(b=>b.onclick=()=>{ hora=b.dataset.pH; guarda(); pinta() });
        ['#p-n','#p-t','#p-o'].forEach(q=>{ const e=$(q); if(e&&mem[q])e.value=mem[q] });
        const t=$('#p-t'); if(t)t.addEventListener('input',()=>{ t.value=fmtTel(t.value) });
        if($('#p-ok'))$('#p-ok').onclick=async()=>{ guarda(); const nm=$('#p-n').value.trim(), tl=$('#p-t').value;
          if(!hora)return toast('Escolha o horário'); if(nm.length<2)return toast('Escreva o seu nome'); if(soDig(tl).length<10)return toast('Confira o WhatsApp com DDD');
          const b=$('#p-ok'); b.disabled=true; b.textContent='Enviando…';
          try{ await pubRpc('pedir_horario',{p_codigo:ag,p_nome:nm,p_tel:soDig(tl),p_servico:sv,p_data:dia,p_hora:hora,p_obs:$('#p-o').value.trim()});
            const s=v.servicos.find(x=>x.id===sv);
            pub.innerHTML=`<div class="pub-c pub-ok"><span class="av-ic ok">${ic('check',26)}</span><h1>Pedido enviado!</h1><p class="sub">${esc(s?s.nome:'')} · ${DOW_L[dowDe(dia)]}, ${dataBR(dia)} às ${hora}</p><p>${esc(v.titulo||'A clínica')} vai confirmar pelo WhatsApp.</p></div>` }
          catch(e){ b.disabled=false; b.textContent='Pedir este horário'; const m=String(e.message);
            if(/ocupado/.test(m)){ v.livres[dia]=(v.livres[dia]||[]).filter(x=>x!==hora); hora=''; pinta(); toast('Esse horário acabou de ser pedido. Escolha outro.') }
            else toast(/muitos/.test(m)?'Já recebemos pedidos seus. Aguarde a clínica responder.':e.rede?'Sem internet. Tente de novo.':'Não deu certo. Confira os dados e tente de novo.') } } };
      const mem={}; const guarda=()=>['#p-n','#p-t','#p-o'].forEach(q=>{ const e=$(q); if(e)mem[q]=e.value });
      pinta() }).catch(e=>erro(e.rede?'Sem internet. Confira a conexão e recarregue.':'Este link de agendamento não está ativo. Fale direto com a clínica.'));
  } else {
    pubRpc('ver_pesquisa',{p_token:avl}).then(v=>{ if(!v)return erro('Este link de avaliação não existe.'); cor(v.area);
      if(v.respondida)return pub.innerHTML=`<div class="pub-c pub-ok"><span class="av-ic ok">${ic('check',26)}</span><h1>Obrigado!</h1><p class="sub">Esta avaliação já foi enviada.</p></div>`;
      let nota=null;
      const pinta=()=>{ const cm=$('#p-c')?$('#p-c').value:'';
        pub.innerHTML=`<div class="pub-c"><p class="eyebrow">${esc(v.clinica||'')}</p><h1>Como foi o seu atendimento?</h1>
          <p class="sub">De 0 a 10, quanto você indicaria para um amigo ou parente?</p>
          <div class="pub-nps" role="group" aria-label="Nota de 0 a 10">${Array.from({length:11},(_,i)=>`<button class="chip ${i<=6?'n-b':i<=8?'n-m':'n-a'}" data-p-n="${i}" aria-pressed="${nota===i}">${i}</button>`).join('')}</div>
          <div class="pub-esc"><small>nada provável</small><small>muito provável</small></div>
          <div class="field" style="margin-top:14px"><label for="p-c">${nota!=null&&nota<=6?'O que podemos melhorar?':'Quer deixar um comentário? (opcional)'}</label><textarea id="p-c" rows="3" maxlength="500"></textarea></div>
          <button class="btn pri full" id="p-ok" ${nota==null?'disabled':''}>Enviar avaliação</button></div>`;
        $('#p-c').value=cm;
        pub.querySelectorAll('[data-p-n]').forEach(b=>b.onclick=()=>{ nota=+b.dataset.pN; pinta() });
        $('#p-ok').onclick=async()=>{ const b=$('#p-ok'); b.disabled=true;
          try{ await pubRpc('responder_pesquisa',{p_token:avl,p_nota:nota,p_comentario:$('#p-c').value.trim()});
            pub.innerHTML=`<div class="pub-c pub-ok"><span class="av-ic ok">${ic('check',26)}</span><h1>Obrigado!</h1><p class="sub">A sua avaliação foi enviada${v.clinica?' para '+esc(v.clinica):''}.</p></div>` }
          catch(e){ b.disabled=false; toast(e.rede?'Sem internet. Tente de novo.':'Este link expirou ou já foi usado.') } } };
      pinta() }).catch(e=>erro(e.rede?'Sem internet. Confira a conexão e recarregue.':'Este link de avaliação não existe.'));
  }
  return true;
}
