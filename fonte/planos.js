/* ══════════ PLANOS: Básico, Médio e Premium ══════════
   O plano vem da clínica no servidor (só o administrador muda). Sem login, ou antes de rodar planos.sql,
   tudo fica liberado. Para ver como fica cada plano: ?plano=basico, ?plano=medio ou ?plano=premium no endereço. */
const PLANOS={
  basico:{n:'Básico',preco:'R$ 39,90',depois:'R$ 59,90',itens:['Agenda, retornos e pacientes','Valor do atendimento com o lucro real','Saídas, caixa do dia, painel e lucro','Recibo e informe para o IR','Só você (sem equipe)']},
  medio:{n:'Médio',preco:'R$ 79,90',depois:'R$ 99,90',itens:['Tudo do Básico','Pacotes de sessões','Lembretes e cobranças pelo WhatsApp','Agenda online por link','Documentos com assinatura e modelos','Prontuário, anamnese, odontograma e plano de tratamento','Orçamentos, convênios, laboratório e estoque','Equipe com até 3 pessoas e comissões']},
  premium:{n:'Premium',preco:'a definir',depois:'',itens:['Tudo do Médio','Equipe sem limite','Várias unidades','Inteligência artificial (em breve)']}};
const ORDEM_PL=['basico','medio','premium'];
const RECURSO_PL={orcamentos:'medio',sim:'medio',ocupacao:'medio',lab:'medio',convenios:'medio',online:'medio',fechamento:'medio',usuarios:'medio',
  documentos:'medio',prontuario:'medio',pacotes:'medio',whatsapp:'medio',equipe:'medio',estoque:'medio',unidades:'premium',ia:'premium'};
const NOME_REC={orcamentos:'Orçamentos',sim:'Simulador e orçamentos',ocupacao:'Ocupação da agenda',lab:'Laboratório',convenios:'Convênios',online:'Agenda online',fechamento:'Fechamento do mês',usuarios:'Equipe',
  documentos:'Documentos com assinatura',prontuario:'Prontuário e ficha clínica',pacotes:'Pacotes de sessões',whatsapp:'Mensagens pelo WhatsApp',equipe:'Equipe',estoque:'Estoque',unidades:'Várias unidades',ia:'Inteligência artificial'};
function planoAtual(){ let q=''; try{ q=new URLSearchParams(location.search).get('plano')||'' }catch(e){}
  if(ORDEM_PL.includes(q))return q;
  return typeof CONTA!=='undefined'&&CONTA&&ORDEM_PL.includes(CONTA.plano)?CONTA.plano:'premium' }
function temRecurso(k){ const min=RECURSO_PL[k]; return !min||ORDEM_PL.indexOf(planoAtual())>=ORDEM_PL.indexOf(min) }
const limiteEquipe=()=>({basico:1,medio:3,premium:1000})[planoAtual()];
function planoSheet(k){ const min=RECURSO_PL[k]||'medio', p=PLANOS[min];
  abrirSheet(`${NOME_REC[k]||'Este recurso'} · plano ${p.n}`,`Você está no plano ${PLANOS[planoAtual()].n}`,
    `<p class="conf-tx">Isso faz parte do plano <b>${p.n}</b>${p.preco!=='a definir'?` (${p.preco} por mês nos 3 primeiros meses, depois ${p.depois})`:''}.</p>
     <ul class="pl-lista">${p.itens.map(i=>`<li>${esc(i)}</li>`).join('')}</ul>
     <button class="btn pri full" id="pl-ver" style="margin-top:14px">Ver os planos</button>`,fechar=>{ $('#pl-ver').onclick=()=>{ fechar(); setTimeout(()=>{ ir('ajustes'); setTimeout(()=>{ const e=$('#sec-plano'); if(e)e.scrollIntoView({block:'start'}) },150) },220) } }) }

/* telas: aparecem com um cadeado; ao tocar, mostra o plano */
const _irPn=ir;
ir=function(t){ if(RECURSO_PL[t]&&!temRecurso(t))return planoSheet(t); return _irPn.apply(this,arguments) };
const _aplNavPn=aplicaNav;
aplicaNav=function(){ _aplNavPn(); document.querySelectorAll('#menu button[data-t]').forEach(b=>{ const t=b.dataset.t, bl=RECURSO_PL[t]&&!temRecurso(t);
  b.classList.toggle('bloq',!!bl); let c=b.querySelector('.cad'); if(bl&&!c)b.insertAdjacentHTML('beforeend',`<span class="cad" aria-label="plano ${PLANOS[RECURSO_PL[t]].n}">${PLANOS[RECURSO_PL[t]].n}</span>`); if(!bl&&c)c.remove() });
  if(typeof pintaBarra==='function')pintaBarra() };
/* WhatsApp, pacotes, documentos, prontuário */
const _zapAbrirPn=zapAbrir;
zapAbrir=function(u){ if(!temRecurso('whatsapp'))return planoSheet('whatsapp'); return _zapAbrirPn(u) };
const _secPsiPn=secPsiFicha;
secPsiFicha=function(cid){ return temRecurso('prontuario')?_secPsiPn(cid):'' };
const _topoPn=topoHist;
topoHist=c=>{ const h=_topoPn(c); if(temRecurso('prontuario')&&temRecurso('documentos'))return h;
  return h+`<div class="sec"><button type="button" class="card pl-trava" id="h-pl-trava">${ic('file',18)}<span><b>Prontuário, documentos e mais</b><small>Disponível no plano Médio</small></span>${ic('right',18)}</button></div>` };
const _ligaPn=ligarTopoHist;
ligarTopoHist=function(id,fechar){ _ligaPn(id,fechar); if($("#h-pl-trava"))$("#h-pl-trava").onclick=()=>{ fechar(); setTimeout(()=>planoSheet('prontuario'),260) } };
/* pacote: no Básico, o atendimento é sempre avulso */
const _posRenderPn=posRender;
posRender=function(el){ _posRenderPn(el);
  if(!temRecurso('pacotes')){ const s=$('#f-sess'); if(s){ s.value='1'; const f=s.closest('.field'); if(f)f.hidden=true }
    const b=$('#a-pac-box'); if(b){ b.remove() } }
  if(tela==='ajustes'&&!$('#sec-plano')&&typeof CONTA!=='undefined'&&CONTA&&ehDono()){ const pa=planoAtual();
    const html=`<div class="sec" id="sec-plano"><div class="card"><div class="row" style="justify-content:space-between;gap:8px"><h2>Seu plano</h2><span class="pill ok">${PLANOS[pa].n}</span></div>
      <div class="pl-grid">${ORDEM_PL.map(k=>`<div class="pl-c ${k===pa?'atual':''}"><b>${PLANOS[k].n}</b><span class="pl-p">${PLANOS[k].preco}${PLANOS[k].preco!=='a definir'?'<small>/mês</small>':''}</span>
        ${PLANOS[k].depois?`<small class="sub">nos 3 primeiros meses, depois ${PLANOS[k].depois}</small>`:''}<ul class="pl-lista">${PLANOS[k].itens.map(i=>`<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>
      <p class="sub" style="margin-top:10px">Para mudar de plano, fale com o suporte do Lucra.</p></div></div>`;
    const ref=$('#sec-conta')||el.querySelector('h1'); if(ref)ref.insertAdjacentHTML('afterend',html) } };
/* equipe: limite do plano */
document.addEventListener('click',e=>{ const b=e.target.closest('#us-conv'); if(!b)return;
  const n=document.querySelectorAll('#us-corpo [data-us-x]').length+1+document.querySelectorAll('#us-corpo [data-cv-x],#us-corpo [data-conv-x]').length;
  if(n>=limiteEquipe()){ e.stopImmediatePropagation(); e.preventDefault(); planoSheet(planoAtual()==='medio'?'unidades':'equipe') } },true);
/* unidades: só no Premium */
document.addEventListener('click',e=>{ const b=e.target.closest('#tu-nova'); if(!b||temRecurso('unidades'))return; e.stopImmediatePropagation(); e.preventDefault(); planoSheet('unidades') },true);
