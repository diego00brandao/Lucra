/* ══════════ TELAS SEPARADAS (versão 4) ══════════
   Cada item do menu responde uma pergunta só. As telas antigas continuam gerando o conteúdo;
   aqui cada tela nova fica só com a parte dela. */
const _T={painel:T.painel,vendas:T.vendas,servicos:T.servicos,sim:T.sim,agenda:T.agenda};
/* mantém só as seções marcadas; o resto (título, avisos sem marca) fica */
function soPartes(el,attr,manter){
  [...el.children].forEach(c=>{ if(!c.classList.contains('sec'))return; const k=c.getAttribute(attr); if(!manter.includes(k))c.remove() }) }
function tituloTela(el,h,sub){ const t=el.querySelector('h1'); if(t)t.textContent=h; const s=t&&(t.nextElementSibling&&t.nextElementSibling.classList.contains('sub')?t.nextElementSibling:null);
  if(s&&sub!=null)s.textContent=sub }
const cxTag=(k,h)=>h?h.replace('class="sec"',`class="sec" data-cx="${k}"`):'';

/* ── edição: o formulário abre na tela de registro e volta para a lista ── */
const ED_TELA={ag:'novoag',venda:'registrar',desp:'saida'};
let reabreFicha='';
let voltaEd='';
abrirEdicao=function(t,id){ edit={t,id}; const alvo=ED_TELA[t];
  if(alvo&&tela!=='vendas'&&tela!==alvo){ voltaEd=tela; tela=alvo; marcaMenu(alvo) }
  render(); window.scrollTo({top:0,behavior:'smooth'}) };
fecharEdicao=function(){ edit={t:'',id:''}; if(voltaEd){ tela=voltaEd; voltaEd=''; marcaMenu(tela) } render() };
const _ir=ir;
ir=function(t){ voltaEd=''; reabreFicha=''; if(t!=='novoag')pkPendente=''; _ir(t) };

/* ── Analítico ── */
T.painel=function(el){ _T.painel(el); el.querySelectorAll(':scope > [data-pn=esq]').forEach(s=>s.remove()) };
T.lucro=function(el){ _T.painel(el);
  el.querySelectorAll(':scope > [data-pn=kpis], :scope > [data-pn=dir]').forEach(s=>s.remove());
  /* pacotes e comissões vão para o fim: o lucro vem primeiro */
  [...el.querySelectorAll(':scope > .sec')].forEach(s=>{ const h=s.querySelector('h2'), t=h?h.textContent.trim():'';
    if(/^Pacotes em aberto/.test(t))s.remove(); else if(/^Comissões/.test(t))el.appendChild(s) });
  tituloTela(el,'Lucro',null); const s=el.querySelector('.sec-top .sub'); if(s)s.textContent='para onde foi o dinheiro e quanto cada um deixa'; };

/* ── Financeiro ── */
T.registrar=function(el){ const ed=!!emEdicao('venda'); _T.vendas(el); soPartes(el,'data-cx',['reg','busca','atd']);
  tituloTela(el,ed?'Editar atendimento':'Valor do atendimento','Encaixe, venda de pacote ou sessão fora da agenda. Quem veio pela agenda entra pelo “Atendeu”.');
  const h=el.querySelector('[data-cx=reg] h2'); if(h&&!ed)h.remove() };
T.saida=function(el){ const ed=!!emEdicao('desp'); _T.vendas(el); soPartes(el,'data-cx',['sreg','busca','sai']);
  tituloTela(el,ed?'Editar saída':'Registrar saída','Aluguel, contas e compras de produto');
  const h=el.querySelector('[data-cx=sreg] h2'); if(h&&!ed)h.remove() };
T.atendmes=T.registrar; T.saidas=T.saida;
T.servicos=function(el){ _T.servicos(el); const t=el.querySelector('[data-cx=tax]'); if(t)t.remove();
  const s=el.querySelector(':scope > .sub'); if(s)s.textContent=ehPsico()?'O valor de cada tipo de sessão':'Preço e custo de produto de cada serviço' };
T.taxas=function(el){ _T.servicos(el); soPartes(el,'data-cx',['tax']);
  tituloTela(el,'Taxas e encargos','Maquininha e imposto. Entram em toda venda e nos simuladores.');
  const h=el.querySelector('[data-cx=tax] h2'); if(h){ const p=h.nextElementSibling; h.remove(); if(p&&p.classList.contains('sub'))p.remove() } };
T.sim=function(el){ _T.sim(el); tituloTela(el,'Simulador','Antes de fechar o preço, veja quanto sobra para você') };
T.simpag=el=>{ simAba='formas'; T.sim(el) }; T.simorc=el=>{ simAba='orc'; T.sim(el) };

/* ── Atendimento ── */
const DOW=['dom','seg','ter','qua','qui','sex','sáb'], DOW_L=['domingo','segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado'],
  MES_L=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
const dowDe=iso=>new Date(iso+'T12:00:00').getDay();
const diaCurto=iso=>`${DOW[dowDe(iso)]} ${dataBR(iso)}`;
const horaTx=h=>{ if(!h)return ''; const [a,b]=h.split(':'); return `${a}h${b&&b!=='00'?b:''}` };

/* agenda do dia: semana em faixa no lugar do calendário cinza do navegador */
function faixaSemana(){
  const hoje=hojeISO(), ini=somaDias(agDia,-dowDe(agDia)), dias=Array.from({length:7},(_,i)=>somaDias(ini,i));
  const [a,m]=agDia.split('-').map(Number);
  return `<div class="sem">
    <div class="sem-cab"><button type="button" class="ibtn" id="sem-ant" aria-label="Semana anterior">${ic('left')}</button>
      <b>${MES_L[m-1][0].toUpperCase()+MES_L[m-1].slice(1)} de ${a}</b>
      ${agDia!==hoje?'<button type="button" class="btn sm soft" id="ag-hoje">Hoje</button>':''}
      <button type="button" class="ibtn" id="sem-prox" aria-label="Próxima semana">${ic('right')}</button></div>
    <div class="sem-dias">${dias.map(d=>{ const n=S.agenda.filter(z=>z.data===d&&z.status==='marcado').length;
      return `<button type="button" data-dia-ag="${d}" aria-pressed="${d===agDia}" class="${d===hoje?'hoje':''}" aria-label="${DOW_L[dowDe(d)]}, ${dataBR(d)}${n?', '+n+' marcado(s)':''}">
        <span>${DOW[dowDe(d)]}</span><b>${+d.slice(8)}</b><i class="${n?'tem':''}"></i></button>` }).join('')}</div>
    <input type="hidden" id="ag-data" value="${agDia}"></div>`;
}
T.agenda=function(el){ _T.agenda(el);
  if(!S.servicos.length)return;
  soPartes(el,'data-parte',[null]);
  const sub=el.querySelector(':scope > .sub'); if(sub)sub.textContent='Quem vem, quem atendeu e quem faltou';
  if(sub)sub.insertAdjacentHTML('afterend',`<button class="btn pri" id="ag-novo" style="margin-top:12px">${ic('plus')}Novo agendamento</button>`);
  $('#ag-novo').onclick=()=>{ pkPendente=agDia>=hojeISO()?agDia:''; ir('novoag') };
  el.querySelectorAll('[data-dia-ag]').forEach(b=>b.onclick=()=>{ agDia=b.dataset.diaAg; render() });
  if($('#sem-ant'))$('#sem-ant').onclick=()=>{ agDia=somaDias(agDia,-7); render() };
  if($('#sem-prox'))$('#sem-prox').onclick=()=>{ agDia=somaDias(agDia,7); render() };
  if($('#ag-hoje'))$('#ag-hoje').onclick=()=>{ agDia=hojeISO(); render() };
  /* psicologia: tocar no horário abre a anotação da sessão */
  if(ehPsico()&&podeClinico())el.querySelectorAll('[data-item-ag] > .mn').forEach(m=>{
    const a=S.agenda.find(z=>z.id===m.parentElement.dataset.itemAg); if(!a||!a.clienteId)return;
    const tem=S.evolucoes.some(e=>e.agId===a.id);
    m.classList.add('toca'); m.setAttribute('role','button'); m.tabIndex=0;
    m.setAttribute('aria-label',`${tem?'Abrir a anotação':'Anotar a sessão'} de ${(cli(a.clienteId)||{}).nome||''}`);
    m.insertAdjacentHTML('beforeend',`<span class="toca-dica">${ic('edit',14)}${tem?'Ver anotação':'Toque para anotar'}</span>`);
    const abre=()=>anotarSessao(a.clienteId,a.id,a.data);
    m.onclick=e=>{ if(e.target.closest('a,button'))return; abre() };
    m.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); abre() } };
  });
  if(temPront())el.querySelectorAll('[data-item-ag] > .mn').forEach(m=>{
    const a=S.agenda.find(z=>z.id===m.parentElement.dataset.itemAg); if(!a||!a.clienteId)return;
    const al=alertasDe(a.clienteId), tem=(S.prontuario||[]).some(p=>p.agId===a.id);
    if(al.length){ const b=m.querySelector('b'); if(b)b.insertAdjacentHTML('beforeend',` <span class="pill bad" title="${esc(al.join(' · '))}">${ic('alert',12)}${esc(al[0].split(':')[0])}${al.length>1?' +'+(al.length-1):''}</span>`) }
    m.classList.add('toca'); m.setAttribute('role','button'); m.tabIndex=0;
    m.setAttribute('aria-label',`Prontuário de ${(cli(a.clienteId)||{}).nome||''}`);
    m.insertAdjacentHTML('beforeend',`<span class="toca-dica">${ic('edit',14)}${tem?'Ver prontuário':'Toque para o prontuário'}</span>`);
    const abre=()=>prontuario(a.clienteId,a.id,a.data);
    m.onclick=e=>{ if(e.target.closest('a,button'))return; abre() };
    m.onkeydown=e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); abre() } };
  });
};
T.retornos=function(el){ _T.agenda(el); if(!S.servicos.length)return tituloTela(el,'Retornos',null);
  soPartes(el,'data-parte',['ret']); tituloTela(el,'Retornos',ehPsico()?'Quem passou do tempo sem vir':'Quem já passou do tempo de voltar');
  const h=el.querySelector('[data-parte=ret] h2'); if(h)h.textContent='Na hora de chamar'; };

/* novo agendamento: calendário do mês, atalhos da semana, horas e minutos em botões */
let pkPendente='', pk={mes:'',h:'',m:'00'};
T.novoag=function(el){
  if(edit.t==='ag'&&!S.agenda.some(a=>a.id===edit.id)){ edit={t:'',id:''}; tela=voltaEd||'agenda'; voltaEd=''; marcaMenu(tela); return T[tela](el) }
  const ed=S.agenda.find(a=>a.id===emEdicao('ag'));
  _T.agenda(el);
  if(!S.servicos.length)return tituloTela(el,'Novo agendamento','Escolha o dia e o horário');
  soPartes(el,'data-parte',['novo']);
  tituloTela(el,ed?'Editar agendamento':'Novo agendamento',ed?'Mude o dia, o horário ou a situação':'Escolha o dia e o horário');
  const card=el.querySelector('[data-parte=novo] .card'); card.querySelector('h2').remove();
  /* procedimento primeiro, como no exemplo */
  const fc=$('#a-cli').closest('.field'), fs=$('#a-serv').closest('.field'); fc.parentElement.insertBefore(fs,fc); fc.parentElement.classList.replace('grid2','pk-campos');
  if(!ed)$('#a-st').closest('.field').style.display='none';
  const hoje=hojeISO(), d0=ed?ed.data:(pkPendente&&pkPendente>=hoje?pkPendente:hoje), h0=ed?(ed.hora||''):'';
  pkPendente='';
  pk={mes:d0.slice(0,7),h:h0?h0.slice(0,2):'',m:h0?h0.slice(3,5):'00'};
  const g=$('#a-data').closest('.grid2');
  g.outerHTML=`<input type="hidden" id="a-data" value="${d0}"><input type="hidden" id="a-hora" value="${h0}"><div id="pk"></div>`;
  pintaPicker();
  const rep=$('#a-rep'), vb=$('#a-vezes-box');
  if(rep&&vb)rep.onchange=()=>{ vb.style.display=rep.value?'':'none'; if(!rep.value)$('#a-vezes').value='' };
  if(ed){ card.insertAdjacentHTML('beforeend',`<div class="pk-del"><button type="button" class="btn-tx perigo-tx" id="a-del">${ic('trash',18)}Excluir agendamento</button></div>`);
    $('#a-del').onclick=()=>excluirAg(ed) }
  const add=$('#a-add'), orig=add.onclick;
  add.onclick=()=>{
    if(!$('#a-hora').value){ toast('Escolha o horário'); $('#pk-horas').scrollIntoView({behavior:'smooth',block:'center'}); return }
    if(soEu()&&S.agenda.some(a=>a.data===$('#a-data').value&&a.status==='marcado'&&a.id!==(ed&&ed.id)&&a.hora&&a.hora.slice(0,2)===$('#a-hora').value.slice(0,2))){ toast('Esse horário já está ocupado. Escolha outro.'); return }
    if(rep&&rep.value&&!$('#a-vezes').value){ toast('Escolha por quanto tempo repete'); $('#a-vezes').focus(); return }
    const antes=S.agenda.length, d=$('#a-data').value;
    orig();
    if(S.agenda.length>antes){ agDia=d; if(tela!=='agenda'){ tela='agenda'; marcaMenu('agenda') } render() }
    else if(ed&&!emEdicao('ag')){ agDia=d; render(); if(reabreFicha&&tela==='clientes'){ const c=reabreFicha; setTimeout(()=>historico(c),200) } reabreFicha='' }
  };
};
function pintaPicker(){
  const box=$('#pk'); if(!box)return;
  const di=$('#a-data'), hi=$('#a-hora'), data=di.value, hoje=hojeISO(), editando=!!emEdicao('ag');
  hi.value=pk.h?pk.h+':'+pk.m:'';
  const [ya,ma]=pk.mes.split('-').map(Number), off=new Date(ya,ma-1,1).getDay(), nd=new Date(ya,ma,0).getDate();
  const iso=n=>`${pk.mes}-${String(n).padStart(2,'0')}`;
  const horas=Array.from({length:15},(_,i)=>String(i+7).padStart(2,'0')); if(pk.h&&!horas.includes(pk.h)){ horas.push(pk.h); horas.sort() }
  const mins=['00','15','30','45'], fora=!!pk.h&&!mins.includes(pk.m);
  const doDia=S.agenda.filter(a=>a.data===data&&a.status==='marcado'&&a.id!==emEdicao('ag')&&a.hora).sort((a,b)=>a.hora.localeCompare(b.hora));
  const ocupDe=h=>doDia.filter(a=>a.hora.slice(0,2)===h), ocup=new Set(doDia.map(a=>a.hora.slice(0,2))), so=soEu();
  const quem=a=>{ const c=cli(a.clienteId); return c?c.nome.split(' ')[0]:'sem cadastro' };
  box.innerHTML=`<div class="pk-res" aria-live="polite"><span>${DOW_L[dowDe(data)]}</span>
      <b>${+data.slice(8)} de ${MES_L[+data.slice(5,7)-1]} ${pk.h?`<em>${horaTx(hi.value)}</em>`:'<small>escolha o horário abaixo</small>'}</b></div>
    <div class="pk-cal"><div class="pk-cab">
      <button type="button" class="ibtn" id="pk-ant" aria-label="Mês anterior" ${!editando&&pk.mes<=hoje.slice(0,7)?'disabled':''}>${ic('left')}</button>
      <b>${MES_L[ma-1][0].toUpperCase()+MES_L[ma-1].slice(1)} de ${ya}</b>
      <button type="button" class="ibtn" id="pk-prox" aria-label="Próximo mês">${ic('right')}</button></div>
      <div class="pk-g">${['D','S','T','Q','Q','S','S'].map(l=>`<span aria-hidden="true">${l}</span>`).join('')}${'<i></i>'.repeat(off)}${Array.from({length:nd},(_,i)=>{ const d=iso(i+1);
        return `<button type="button" data-pk-d="${d}" aria-pressed="${d===data}" class="${d===hoje?'hoje':''}" ${!editando&&d<hoje?'disabled':''} aria-label="${i+1} de ${MES_L[ma-1]}">${i+1}</button>` }).join('')}</div></div>
    <div class="chips pk-sem" role="group" aria-label="Mesmo dia nas próximas semanas">${[0,1,2,3].map(i=>{ const d=somaDias(data,i*7);
      return `<button type="button" class="chip" data-pk-d="${d}" aria-pressed="${d===data}">${diaCurto(d).slice(0,9)}</button>` }).join('')}</div>
    <p class="pk-lb" id="pk-lh">Horário</p>
    ${doDia.length?`<p class="pk-ocup">Já marcado neste dia: ${doDia.map(a=>`<b>${horaTx(a.hora)}</b> ${esc(quem(a))}`).join(' · ')}${so?'. Esses horários ficam bloqueados.':''}</p>`:''}
    <div class="pk-horas" id="pk-horas" role="group" aria-labelledby="pk-lh">${horas.map(h=>`<button type="button" data-pk-h="${h}" aria-pressed="${h===pk.h}" class="${ocup.has(h)?(so?'ocup bloq':'ocup'):''}"${ocup.has(h)?` aria-disabled="${so}" title="${esc(ocupDe(h).map(a=>a.hora+' '+quem(a)).join(', '))}"`:''}>${h}h</button>`).join('')}</div>
    <div class="pk-min" role="group" aria-label="Minutos">${mins.map(m=>`<button type="button" data-pk-m="${m}" aria-pressed="${m===pk.m&&!!pk.h}">:${m}</button>`).join('')}</div>
    <div class="pk-outro">${pk.outro?`<label for="pk-hm">Outro horário</label>
      <div class="row" style="flex-wrap:nowrap"><input id="pk-hm" inputmode="numeric" maxlength="5" placeholder="ex.: 14:10" autocomplete="off" value="${pk.h?pk.h+':'+pk.m:''}" style="flex:1">
      <button type="button" class="btn pri" id="pk-hm-ok">Usar</button></div>`
      :`<button type="button" class="btn-tx${fora?' on':''}" id="pk-outro" aria-pressed="${fora}">${ic('clock',16)}${fora?`Outro horário: ${pk.h}:${pk.m} · trocar`:'Outro horário (ex.: 14:10)'}</button>`}</div>`;
  const vai=d=>{ di.value=d; pk.mes=d.slice(0,7); pintaPicker() };
  box.querySelectorAll('[data-pk-d]').forEach(b=>b.onclick=()=>vai(b.dataset.pkD));
  box.querySelectorAll('[data-pk-h]').forEach(b=>b.onclick=()=>{ const oc=ocupDe(b.dataset.pkH);
    if(oc.length){ const t=oc.map(a=>`${quem(a)} às ${a.hora}`).join(' e ');
      if(so)return toast(`Ocupado: ${t}. Escolha outro horário.`);
      toast(`Atenção: ${t} já está marcado nessa hora`) }
    pk.h=b.dataset.pkH; pintaPicker(); const f=box.querySelector(`[data-pk-h="${pk.h}"]`); if(f)f.focus({preventScroll:true}) });
  box.querySelectorAll('[data-pk-m]').forEach(b=>b.onclick=()=>{ pk.m=b.dataset.pkM; if(!pk.h)toast('Escolha a hora também'); pintaPicker(); const f=box.querySelector(`[data-pk-m="${pk.m}"]`); if(f)f.focus({preventScroll:true}) });
  if($('#pk-outro'))$('#pk-outro').onclick=()=>{ pk.outro=true; pintaPicker(); $('#pk-hm').focus() };
  const hm=$('#pk-hm');
  if(hm){ hm.oninput=()=>{ const d=hm.value.replace(/\D/g,'').slice(0,4); hm.value=d.length>2?d.slice(0,2)+':'+d.slice(2):d };
    const usar=()=>{ const d=hm.value.replace(/\D/g,''); const h=d.length<=2?d:d.slice(0,d.length-2), m=d.length<=2?'00':d.slice(-2);
      if(!d||+h>23||+m>59)return toast('Digite um horário como 14:10');
      const hh=h.padStart(2,'0'), oc=ocupDe(hh).filter(a=>a.hora===hh+':'+m);
      if(oc.length&&so)return toast(`Ocupado: ${oc.map(a=>quem(a)+' às '+a.hora).join(' e ')}. Escolha outro horário.`);
      if(oc.length)toast(`Atenção: ${oc.map(a=>quem(a)).join(' e ')} já está às ${hh}:${m}`);
      pk.h=hh; pk.m=m; pk.outro=false; pintaPicker() };
    $('#pk-hm-ok').onclick=usar; hm.onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); usar() } } }
  const mv=n=>{ const [a,m]=pk.mes.split('-').map(Number), x=new Date(a,m-1+n,1); pk.mes=`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}`; pintaPicker() };
  $('#pk-ant').onclick=()=>mv(-1); $('#pk-prox').onclick=()=>mv(1);
}

/* ── Pacientes (psicologia): informação do paciente, não dinheiro ── */
const proxSes=id=>{ const h=hojeISO(); return S.agenda.filter(a=>a.clienteId===id&&a.status==='marcado'&&a.data>=h)
  .sort((a,b)=>a.data.localeCompare(b.data)||(a.hora||'').localeCompare(b.hora||''))[0] };
ORD_CLI.prox=(a,b)=>{ const x=proxSes(a.c.id), y=proxSes(b.c.id);
  return (x?x.data+(x.hora||''):'9')<(y?y.data+(y.hora||''):'9')?-1:(x?x.data+(x.hora||''):'9')>(y?y.data+(y.hora||''):'9')?1:a.c.nome.localeCompare(b.c.nome) };
function infoPac(i){ const c=i.c, p=proxSes(c.id);
  const feitas=S.agenda.filter(a=>a.clienteId===c.id&&a.status==='concluido').map(a=>a.data);
  const ult=feitas.concat(i.ult?[i.ult]:[]).sort().pop(), deve=S.receber.filter(r=>r.clienteId===c.id).reduce((a,r)=>a+num(r.valor),0);
  return `<small>${p?`<b class="v-ac">próxima ${diaCurto(p.data)}${p.hora?' às '+p.hora:''}</b>`:'sem sessão marcada'}${ult?' · última em '+dataBR(ult):''}${deve?` · <b class="v-war">deve ${brl(deve)}</b>`:''}</small></div>` }
function fichaPac(c,vs,ags){
  const doc=S.agenda.filter(a=>a.clienteId===c.id), feitas=doc.filter(a=>a.status==='concluido'), faltas=doc.filter(a=>a.status==='faltou').length;
  const desde=feitas.map(a=>a.data).concat(vs.map(v=>v.data)).sort()[0], p=ags[0];
  const L=(r,v)=>v?`<div class="fi-l"><span>${r}</span><b>${v}</b></div>`:'';
  return `<div class="ficha">
    ${L('Próxima sessão',p?`${DOW_L[dowDe(p.data)]}, ${dataBR(p.data)}${p.hora?' às '+p.hora:''}${p.link?' · online':''}`:'nenhuma marcada')}
    ${L('Sessões feitas',`${feitas.length||vs.length}${faltas?` · ${faltas} falta(s)`:''}`)}
    ${L('Paciente desde',desde?dataBR(desde):'')}
    ${L('WhatsApp',esc(c.tel||''))}${L('E-mail',esc(c.email||''))}
    ${L('Aniversário',c.nasc?dataBR(c.nasc):'')}${L('Observação',esc(c.obs||''))}</div>`;
}

/* ── WhatsApp: uma aba só (ou o aplicativo do computador) ── */
const ehCelular=()=>/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
function partesZap(url){ try{ const u=new URL(url,location.href);
  if(u.hostname==='wa.me')return {fone:u.pathname.replace(/\D/g,''),texto:u.searchParams.get('text')||''};
  if(/(^|\.)whatsapp\.com$/.test(u.hostname)&&/send/.test(u.pathname))return {fone:(u.searchParams.get('phone')||'').replace(/\D/g,''),texto:u.searchParams.get('text')||''};
  }catch(e){} return null }
function abreZap(url){ const p=partesZap(url);
  if(!p||ehCelular()){ window.open(url,'_blank','noopener'); return }
  const q=`${p.fone?'phone='+p.fone+'&':''}text=${encodeURIComponent(p.texto)}`;
  if(UI.zap==='app'){ location.href='whatsapp://send?'+q; return }
  const w=window.open('https://web.whatsapp.com/send?'+q,'lucra-whatsapp');
  if(w){ try{w.focus()}catch(e){} } }
function perguntaZap(depois){
  abrirSheet('WhatsApp neste computador','Pergunto uma vez só. Dá para mudar em Ajustes.',
    `<div style="display:grid;gap:8px">
       <button class="btn pri full" data-zm="app">${ic('chat')}Tenho o aplicativo do WhatsApp</button>
       <button class="btn soft full" data-zm="web">Uso o WhatsApp Web no navegador</button></div>
     <p class="sub" style="margin-top:12px">Com o aplicativo, a conversa abre direto nele, sem carregar nada. No WhatsApp Web, o Lucra usa sempre a mesma aba, em vez de abrir uma nova a cada mensagem.</p>`,
    fechar=>document.querySelectorAll('[data-zm]').forEach(b=>b.onclick=()=>{ UI.zap=b.dataset.zm; salvarUI(); fechar(); depois() }));
}
function zapAbrir(url){ if(!ehCelular()&&!UI.zap&&partesZap(url))return perguntaZap(()=>abreZap(url)); abreZap(url) }
/* os botões de WhatsApp são links: na fase de subida o href já está pronto */
document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey)return;
  const a=e.target.closest&&e.target.closest('a[href]'); if(!a||!partesZap(a.href)||ehCelular())return;
  e.preventDefault(); zapAbrir(a.href);
});
function secZap(){
  if(ehCelular())return '';
  return `<div class="sec" id="sec-zap"><div class="card"><h2 style="margin-bottom:4px">WhatsApp no computador</h2>
    <p class="sub" style="margin-bottom:12px">Onde abrir as mensagens que o Lucra prepara.</p>
    <div class="chips" role="group" aria-label="Onde abrir o WhatsApp">
      <button class="chip" data-zap-m="app" aria-pressed="${UI.zap==='app'}">Aplicativo do WhatsApp</button>
      <button class="chip" data-zap-m="web" aria-pressed="${UI.zap!=='app'}">WhatsApp Web, sempre na mesma aba</button></div>
    <p class="sub" style="margin-top:10px">Se escolher o aplicativo e nada abrir, ele não está instalado: volte para o WhatsApp Web.</p></div></div>`;
}

/* ── depois de montar cada tela ── */
const _pos=posRender;
posRender=function(el){ _pos(el);
  if(tela==='ajustes'&&!$('#sec-zap')){ const h=[...el.querySelectorAll(':scope > .sec h2')].find(z=>z.textContent.trim().startsWith('Mensagens do WhatsApp'));
    const alvo=h?h.closest('.sec'):null; const z=secZap(); if(z){ if(alvo)alvo.insertAdjacentHTML('afterend',z); else el.insertAdjacentHTML('beforeend',z) }
    el.querySelectorAll('[data-zap-m]').forEach(b=>b.onclick=()=>{ UI.zap=b.dataset.zapM; salvarUI();
      el.querySelectorAll('[data-zap-m]').forEach(x=>x.setAttribute('aria-pressed',String(x===b))); toast('Pronto') }) }
};
/* linha de cliente com dinheiro (estética e odonto) */
function linhaCliFin(i){ return `<small>${i.qtd?`${i.qtd} atendimento(s) · última em ${dataBR(i.ult)} · há ${diasEntre(i.ult,hojeISO())} dia(s)`:'ainda sem atendimento'}${i.c.obs?' · '+esc(i.c.obs):''}</small></div>
      <div class="vr">${brl(i.total)}<small class="${i.lucro>=0?'v-ok':'v-bad'}">sobrou ${brl(i.lucro)}</small></div>` }

/* quem trabalha sozinho não marca duas pessoas na mesma hora */
const soEu=()=>!modOn('equipe');
const topoRecibo=()=>((S.perfil||{}).nome||UI.clinica||'').trim();

/* ── telefone, CPF e CNPJ com pontos, parênteses e tracinho ── */
const soDig=v=>String(v||'').replace(/\D/g,'');
const molde=(d,m)=>{ let r='',i=0; for(const ch of m){ if(i>=d.length)break; if(ch==='#')r+=d[i++]; else r+=ch } return r };
function fmtTel(v){ let d=soDig(v); if(d.length>11&&d.startsWith('55'))d=d.slice(2); d=d.slice(0,11);
  return d.length>10?molde(d,'(##) #####-####'):molde(d,'(##) ####-####') }
const fmtCpf=v=>molde(soDig(v).slice(0,11),'###.###.###-##');
const fmtCnpj=v=>molde(soDig(v).slice(0,14),'##.###.###/####-##');
const fmtDoc=v=>{ const d=soDig(v); if(!d)return String(v||''); return d.length>11?fmtCnpj(d):fmtCpf(d) };
const MASC=[['#c-tel,input[inputmode=tel]',fmtTel],['#c-cpf,#rb-cpf,#rb-pc',fmtCpf],['#rb-d,#pf-doc',fmtDoc]];
document.addEventListener('input',e=>{ const t=e.target; if(!t||t.tagName!=='INPUT')return;
  const m=MASC.find(z=>t.matches(z[0])); if(!m)return;
  const fim=t.selectionStart===t.value.length, novo=m[1](t.value); if(novo===t.value)return;
  t.value=novo; if(fim)try{t.setSelectionRange(novo.length,novo.length)}catch(err){} },true);
/* campos que já vêm preenchidos também aparecem formatados */
function formataCampos(raiz){ MASC.forEach(([q,f])=>raiz.querySelectorAll(q).forEach(i=>{ if(i.value)i.value=f(i.value) })) }
new MutationObserver(ms=>ms.forEach(m=>m.addedNodes.forEach(n=>{ if(n.nodeType===1)formataCampos(n) }))).observe(document.body,{childList:true,subtree:true});

/* ── ficha: pacotes do cliente e sessões para adiantar ── */
function secPacCli(cid){ const ps=pacotesAbertos().filter(p=>p.venda.clienteId===cid); if(!ps.length)return '';
  return `<div class="sec"><div class="sec-top"><h2>${ps.length>1?'Pacotes':'Pacote'}</h2></div><div class="card">${ps.map(p=>{ const us=(p.venda.usadas||[]).slice(-6);
    return `<div class="item"><div class="mn"><b>${esc(p.c.nome)}</b>
      <small>${p.c.usadas} de ${p.c.sessoes} feitas · faltam ${p.c.restam} · pago em ${dataBR(p.venda.data)}${us.length?' · feitas em '+us.map(dataBR).join(', '):''}</small></div>
      <div class="acts"><button class="btn sm pri" data-pac-f="${p.venda.id}">${ic('check',16)}Usar sessão</button></div></div>` }).join('')}</div></div>` }
const _topoH=topoHist, _ligaTopo=ligarTopoHist;
topoHist=c=>secPacCli(c.id)+_topoH(c);
ligarTopoHist=function(id,fechar){ _ligaTopo(id,fechar);
  document.querySelectorAll('.sheet [data-pac-f]').forEach(b=>b.onclick=()=>{ const v=b.dataset.pacF; fechar(); setTimeout(()=>usarSessao(v,()=>historico(id)),260) });
  document.querySelectorAll('.sheet [data-adi]').forEach(b=>b.onclick=()=>{ const a=b.dataset.adi; reabreFicha=id; fechar(); setTimeout(()=>abrirEdicao('ag',a),260) });
};

/* ── Caixa do dia: o que entrou, por forma de pagamento, e o que saiu ── */
let cxDia='';
T.caixa=function(el){
  const hoje=hojeISO(); if(!cxDia)cxDia=hoje;
  const ini=somaDias(cxDia,-dowDe(cxDia)), dias=Array.from({length:7},(_,i)=>somaDias(ini,i)), [a,m]=cxDia.split('-').map(Number);
  const vs=S.vendas.filter(v=>v.data===cxDia), ds=S.despesas.filter(d=>d.data===cxDia);
  const est=S.vendas.filter(v=>v.estorno&&v.estorno.data===cxDia), rec=S.receber.filter(r=>r.data===cxDia);
  const ct=vs.map(v=>({v,c:conta(v)})), entrou=ct.reduce((s,x)=>s+x.c.bruto,0), taxas=ct.reduce((s,x)=>s+x.c.taxa,0);
  const devolv=est.reduce((s,v)=>s+Math.min(num(v.estorno.valor),num(v.valor)),0), saiu=ds.reduce((s,d)=>s+num(d.valor),0);
  const porF=FORMAS.map(f=>({n:f.n,v:ct.filter(x=>x.v.forma===f.k).reduce((s,x)=>s+x.c.bruto,0)})).filter(f=>f.v);
  const saldo=entrou-taxas-devolv-saiu, temDia=d=>S.vendas.some(v=>v.data===d)||S.despesas.some(x=>x.data===d);
  const nomeDia=cxDia===hoje?'hoje':cxDia===somaDias(hoje,-1)?'ontem':DOW_L[dowDe(cxDia)];
  let x=`<h1>Caixa do dia</h1><p class="sub">O que entrou e o que saiu em cada dia</p>
  <div class="sem" style="margin-top:14px">
    <div class="sem-cab"><button type="button" class="ibtn" id="cx-ant" aria-label="Semana anterior">${ic('left')}</button>
      <b>${MES_L[m-1][0].toUpperCase()+MES_L[m-1].slice(1)} de ${a}</b>
      ${cxDia!==hoje?'<button type="button" class="btn sm soft" id="cx-hoje">Hoje</button>':''}
      <button type="button" class="ibtn" id="cx-prox" aria-label="Próxima semana" ${somaDias(ini,7)>hoje?'disabled':''}>${ic('right')}</button></div>
    <div class="sem-dias">${dias.map(d=>`<button type="button" data-cx-d="${d}" aria-pressed="${d===cxDia}" class="${d===hoje?'hoje':''}" ${d>hoje?'disabled':''}
      aria-label="${DOW_L[dowDe(d)]}, ${dataBR(d)}"><span>${DOW[dowDe(d)]}</span><b>${+d.slice(8)}</b><i class="${temDia(d)?'tem':''}"></i></button>`).join('')}</div></div>
  <section class="kpis cx-k" aria-label="Resumo de ${dataBR(cxDia)}">
    <div class="kpi dest"><span class="lb">Ficou no caixa ${nomeDia}</span><div class="kv ${saldo<0?'v-bad':'v-ok'}">${brl(saldo)}</div>
      <p class="kx">o que entrou, menos ${brl(taxas)} da maquininha e o que saiu</p></div>
    <div class="kpi"><span class="lb">Entrou</span><div class="kv">${brl(entrou)}</div><p class="kx">${vs.length} lançamento(s)</p></div>
    <div class="kpi"><span class="lb">Saiu</span><div class="kv">${brl(saiu+devolv)}</div><p class="kx">${ds.length} saída(s)${devolv?' · '+brl(devolv)+' devolvido':''}</p></div></section>`;
  if(porF.length)x+=`<div class="sec"><div class="sec-top"><h2>Por forma de pagamento</h2></div><div class="card">${porF.map(f=>
    `<div class="cx-f"><span>${f.n}</span><i style="--p:${entrou?Math.round(f.v/entrou*100):0}%"></i><b>${brl(f.v)}</b></div>`).join('')}</div></div>`;
  x+=`<div class="sec"><div class="sec-top"><h2>Entradas</h2></div><div class="card">${ct.length?ct.map(({v,c})=>{ const cl=cli(v.clienteId), f=FORMAS.find(z=>z.k===v.forma);
    return `<div class="item"><div class="mn"><b>${cl?esc(cl.nome):'Sem cadastro'}</b><small>${esc(c.nome)} · ${f?f.n:''}${v.forma==='parc'?' '+(parseInt(v.parcelas)||2)+'x':''}${c.estornado?' · estornado':''}</small></div><div class="vr">${brl(c.bruto)}</div></div>` }).join('')
    :`<div class="vazio"><b>Nada entrou ${nomeDia==='hoje'?'hoje ainda':'neste dia'}</b><p>Quando você toca em “Atendeu” na Agenda ou registra um atendimento, ele aparece aqui.</p></div>`}</div></div>`;
  if(ds.length||est.length)x+=`<div class="sec"><div class="sec-top"><h2>Saídas</h2></div><div class="card">${ds.map(d=>`<div class="item"><div class="mn"><b>${esc(d.desc||'Saída')}</b><small>${d.servicoId&&serv(d.servicoId)?'produto de '+esc(serv(d.servicoId).nome):'saída do caixa'}</small></div><div class="vr v-bad">− ${brl(num(d.valor))}</div></div>`).join('')}${est.map(v=>{ const cl=cli(v.clienteId);
    return `<div class="item"><div class="mn"><b>Devolução${cl?' · '+esc(cl.nome):''}</b><small>estorno</small></div><div class="vr v-bad">− ${brl(Math.min(num(v.estorno.valor),num(v.valor)))}</div></div>` }).join('')}</div></div>`;
  if(rec.length)x+=`<div class="sec"><div class="sec-top"><h2>Ficou para receber</h2><span class="pill war">${brl(rec.reduce((s,r)=>s+num(r.valor),0))}</span></div><div class="card">${rec.map(r=>{ const cl=cli(r.clienteId);
    return `<div class="item"><div class="mn"><b>${cl?esc(cl.nome):'Sem cadastro'}</b><small>${esc(r.desc||'')}</small></div><div class="vr">${brl(num(r.valor))}</div></div>` }).join('')}</div></div>`;
  x+=`<div class="row" style="margin-top:16px;gap:8px"><button class="btn pri" id="cx-reg">${ic('plus')}Valor do atendimento</button><button class="btn soft" id="cx-sai">Registrar saída</button></div>`;
  el.innerHTML=x;
  el.querySelectorAll('[data-cx-d]').forEach(b=>b.onclick=()=>{ cxDia=b.dataset.cxD; render() });
  $('#cx-ant').onclick=()=>{ cxDia=somaDias(cxDia,-7); render() };
  $('#cx-prox').onclick=()=>{ const n=somaDias(cxDia,7); cxDia=n>hoje?hoje:n; render() };
  if($('#cx-hoje'))$('#cx-hoje').onclick=()=>{ cxDia=hoje; render() };
  $('#cx-reg').onclick=()=>ir('registrar'); $('#cx-sai').onclick=()=>ir('saida');
};
