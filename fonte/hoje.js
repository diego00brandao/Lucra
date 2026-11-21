/* ══════════ HOJE: a tela inicial só com os avisos do dia ══════════
   Cada aviso leva para a tela onde se resolve. O que não pede atenção não aparece. */
IC.sol='<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>';
T.hoje=function(el){
  const h=hojeISO(), am=somaDias(h,1), hr=new Date().toTimeString().slice(0,5), pode=t=>typeof permitido!=='function'||permitido(t);
  const nm=c=>c?esc(c.nome):'—', cl=id=>cli(id), sv=id=>serv(id);
  const quem=(CONTA&&CONTA.nome)||(S.perfil&&S.perfil.nome)||'';
  const sauda=+hr.slice(0,2)<12?'Bom dia':+hr.slice(0,2)<18?'Boa tarde':'Boa noite';
  const av=[];   /* {tipo,ic,tit,det,lista,acao,tela} */
  const card=(o)=>av.push(o);
  /* atendimentos de hoje */
  const doDia=S.agenda.filter(a=>a.data===h&&a.status==='marcado').sort((a,b)=>(a.hora||'').localeCompare(b.hora||''));
  if(doDia.length&&pode('agenda')){ const prox=doDia.find(a=>(a.hora||'')>=hr)||null;
    card({tipo:'ac',ic:'calendar',tit:`${doDia.length} ${doDia.length>1?(ehPsico()?'sessões':'atendimentos'):(ehPsico()?'sessão':'atendimento')} hoje`,
      det:prox?`Próximo às ${prox.hora} com ${nm(cl(prox.clienteId))}`:'Os horários de hoje já passaram',
      lista:doDia.slice(0,6).map(a=>`<li><b>${a.hora||'--:--'}</b> ${nm(cl(a.clienteId))}${sv(a.servicoId)?` <small>${esc(sv(a.servicoId).nome)}</small>`:''}${a.inicio?' <span class="pill ok">em andamento</span>':''}</li>`).join('')+(doDia.length>6?`<li><small>e mais ${doDia.length-6}</small></li>`:''),
      acao:'Abrir a agenda',ir:()=>{ agDia=h; ir('agenda') }}) }
  /* ficou sem marcar se atendeu */
  const atr=S.agenda.filter(a=>a.status==='marcado'&&(a.data<h||(a.data===h&&a.hora&&a.hora<hr&&!a.inicio&&false)));
  if(atr.length&&pode('agenda'))card({tipo:'war',ic:'clock',tit:`${atr.length} ${atr.length>1?'horários ficaram':'horário ficou'} sem resposta`,
    det:'Marque se atendeu ou se faltou, para o caixa e os retornos ficarem certos.',acao:'Resolver',ir:()=>{ agDia=atr[0].data; ir('agenda') }});
  /* lembretes de amanhã */
  const lem=S.agenda.filter(a=>a.data===am&&a.status==='marcado'&&!a.avisado&&a.clienteId);
  if(lem.length&&pode('agenda'))card({tipo:'ac',ic:'chat',tit:`Lembrar ${lem.length} ${lem.length>1?'pessoas':'pessoa'} de amanhã`,
    det:lem.slice(0,3).map(a=>`${a.hora||''} ${nm(cl(a.clienteId))}`).join(' · ')+(lem.length>3?' …':''),acao:'Enviar lembretes',ir:()=>{ agDia=am; ir('agenda') }});
  /* quem está devendo */
  const rec=S.receber||[];
  if(rec.length&&pode('registrar')){ const tot=rec.reduce((a,r)=>a+num(r.valor),0), ps=[...new Set(rec.map(r=>r.clienteId))];
    card({tipo:'war',ic:'coins',tit:`${brl(tot)} para receber`,det:`${ps.length} ${ps.length>1?'pessoas devendo':'pessoa devendo'}: ${ps.slice(0,3).map(id=>nm(cl(id))).join(', ')}${ps.length>3?'…':''}`,
      acao:'Ver quem deve',ir:()=>ir('registrar')}) }
  /* pacotes pagos com sessões para usar (dinheiro já entrou, atendimento ainda não) */
  const pac=typeof pacotesAbertos==='function'?pacotesAbertos():[];
  if(pac.length&&pode('clientes')){ const r=pac.reduce((a,p)=>a+p.c.restam,0);
    card({tipo:'ac',ic:'box',tit:`${r} ${r>1?'sessões pagas':'sessão paga'} para usar`,det:`Em ${pac.length} ${pac.length>1?'pacotes':'pacote'}: ${pac.slice(0,3).map(p=>nm(cl(p.venda.clienteId))).join(', ')}`,acao:'Ver pacientes',ir:()=>ir('clientes')}) }
  /* contas a pagar */
  if(modOn('contas')&&pode('saida')){ const cs=S.contas.filter(c=>diasEntre(h,c.venc)<=3).sort((a,b)=>a.venc.localeCompare(b.venc));
    if(cs.length){ const venc=cs.filter(c=>c.venc<h).length, tot=cs.reduce((a,c)=>a+num(c.valor),0);
      card({tipo:venc?'bad':'war',ic:'file',tit:venc?`${venc} ${venc>1?'contas vencidas':'conta vencida'}`:`${cs.length} ${cs.length>1?'contas vencem':'conta vence'} até ${dataBR(somaDias(h,3))}`,
        det:`${brl(tot)} · ${cs.slice(0,3).map(c=>`${esc(c.desc||'conta')} (${dataBR(c.venc)})`).join(', ')}`,acao:'Ver contas',ir:()=>ir('saida')}) } }
  /* aniversário hoje */
  const niv=S.clientes.filter(c=>c.nasc&&c.nasc.slice(5)===h.slice(5));
  if(niv.length&&pode('clientes'))card({tipo:'ok',ic:'spark',tit:`${niv.length>1?'Aniversários':'Aniversário'} hoje`,
    det:'',lista:niv.map(c=>{ const l=zap(c.tel,`Oi, ${c.nome.split(' ')[0]}! Hoje é o seu dia: feliz aniversário! 🎉`);
      return `<li>${nm(c)} ${l?`<a class="btn sm soft" href="${l}" target="_blank" rel="noopener">${ic('chat',16)}Dar parabéns</a>`:'<small>sem telefone</small>'}</li>` }).join('')});
  /* retornos */
  const ret=typeof retornos==='function'?retornos():[];
  if(ret.length&&pode('retornos'))card({tipo:'ac',ic:'undo',tit:`${ret.length} ${ret.length>1?'pessoas':'pessoa'} na hora de voltar`,
    det:ret.slice(0,3).map(r=>nm(r.cliente)).join(', ')+(ret.length>3?'…':''),acao:'Chamar de volta',ir:()=>ir('retornos')});
  /* etapas de tratamento esperando data */
  if(typeof planosDe==='function'&&temPlano()&&pode('novoag')){ const pend=[]; (S.planos||[]).filter(p=>p.status==='aberto').forEach(p=>{ totPlano(p); const e=p.etapas.find(z=>z.status==='pendente'); if(e)pend.push({p,e}) });
    if(pend.length)card({tipo:'ac',ic:'file',tit:`${pend.length} ${pend.length>1?'tratamentos com etapa':'tratamento com etapa'} para agendar`,
      det:pend.slice(0,3).map(x=>`${nm(cl(x.p.clienteId))} (${esc(x.e.nome)})`).join(', ')+(pend.length>3?'…':''),acao:'Agendar a próxima',ir:()=>abrePlano(pend[0].p.id)}) }
  /* parcelas de tratamento atrasadas ou vencendo hoje */
  if(typeof parcAbertas==='function'&&pode('registrar')){ const ps=parcAbertas().filter(p=>p.venc<=h); if(ps.length){ const at=ps.filter(parcAtrasada).length;
    card({tipo:at?'bad':'war',ic:'coins',tit:at?`${at} ${at>1?'parcelas atrasadas':'parcela atrasada'}`:`${ps.length} ${ps.length>1?'parcelas vencem':'parcela vence'} hoje`,
      det:`${brl(ps.reduce((a,p)=>a+num(p.valor),0))} · ${[...new Set(ps.map(p=>p.clienteId))].slice(0,3).map(id=>nm(cl(id))).join(', ')}`,acao:'Ver parcelas',ir:()=>ir('registrar')}) } }
  /* laboratório */
  if(typeof temLab==='function'&&temLab()&&pode('lab')){ const at=(S.lab||[]).filter(labAtrasado), vh=(S.lab||[]).filter(l=>(l.status==='enviado'||l.status==='refazer')&&l.prevista===h);
    if(at.length)card({tipo:'war',ic:'box',tit:`${at.length} ${at.length>1?'trabalhos atrasados':'trabalho atrasado'} no laboratório`,det:at.slice(0,3).map(l=>`${esc(l.trabalho)} de ${nm(cl(l.clienteId))}`).join(', '),acao:'Ver laboratório',ir:()=>ir('lab')});
    else if(vh.length)card({tipo:'ac',ic:'box',tit:`${vh.length} ${vh.length>1?'trabalhos voltam':'trabalho volta'} do laboratório hoje`,det:vh.slice(0,3).map(l=>`${esc(l.trabalho)} de ${nm(cl(l.clienteId))}`).join(', '),acao:'Ver laboratório',ir:()=>ir('lab')}) }
  /* orçamentos sem resposta */
  if(typeof orcParaChamar==='function'&&pode('orcamentos')){ const os=orcParaChamar(); if(os.length)card({tipo:'ac',ic:'chat',tit:`${os.length} ${os.length>1?'orçamentos esperando resposta':'orçamento esperando resposta'}`,
    det:os.slice(0,3).map(o=>nm(cl(o.clienteId))).join(', ')+(os.length>3?'…':''),acao:'Chamar de novo',ir:()=>{ funVer='abertos'; ir('orcamentos') }}) }
  /* convênio: guias paradas */
  if(typeof temConv==='function'&&temConv()&&pode('convenios')){ const gs=(S.guias||[]).filter(g=>g.status==='aberta'); if(gs.length>=1&&gs.some(g=>diasEntre(g.data,h)>=7))card({tipo:'war',ic:'file',tit:`${gs.length} ${gs.length>1?'guias':'guia'} de convênio para enviar`,
    det:`${brl(gs.reduce((a,g)=>a+num(g.valor),0))} esperando você mandar para o convênio`,acao:'Ver convênios',ir:()=>ir('convenios')}) }
  /* validade */
  const venc=typeof vencendo==='function'?vencendo():[];
  if(venc.length&&ehDono()){ const ja=venc.filter(p=>diasParaVencer(p)<0).length;
    card({tipo:ja?'bad':'war',ic:'box',tit:ja?`${ja} ${ja>1?'produtos vencidos':'produto vencido'}`:`${venc.length} ${venc.length>1?'produtos vencem':'produto vence'} em até 30 dias`,
      det:venc.slice(0,3).map(p=>`${esc(p.nome)} (${dataBRano(p.validade)})`).join(', '),acao:'Ver estoque',ir:()=>ir('reserva')}) }
  /* estoque */
  const est=typeof estoqueBaixo==='function'?estoqueBaixo():[];
  if(est.length&&ehDono())card({tipo:'war',ic:'box',tit:`${est.length} ${est.length>1?'produtos acabando':'produto acabando'}`,det:est.slice(0,3).map(p=>esc(p.nome)).join(', '),acao:'Ver estoque',ir:()=>ir('reserva')});

  const dia=`${DOW_L[dowDe(h)]}, ${+h.slice(8)} de ${MES_L[+h.slice(5,7)-1]}`;
  el.innerHTML=`<h1>${sauda}${quem?', '+esc(quem.split(' ')[0]):''}</h1><p class="sub">${dia[0].toUpperCase()+dia.slice(1)}</p>
    ${av.length?`<div class="avisos">${av.map((a,i)=>`<section class="aviso ${a.tipo}" aria-label="${esc(a.tit)}">
      <div class="av-top"><span class="av-ic">${ic(a.ic,20)}</span><div><h2>${a.tit}</h2>${a.det?`<p>${a.det}</p>`:''}</div></div>
      ${a.lista?`<ul class="av-l">${a.lista}</ul>`:''}
      ${a.acao?`<button class="btn sm soft" data-av="${i}">${a.acao}${ic('right',16)}</button>`:''}</section>`).join('')}</div>`
    :`<div class="card" style="margin-top:16px"><div class="vazio"><span class="av-ic ok" style="margin:0 auto 10px">${ic('check',22)}</span><b>Tudo em dia</b><p>Nenhum atendimento, cobrança ou conta pedindo atenção hoje.</p></div></div>`}`;
  el.querySelectorAll('[data-av]').forEach(b=>b.onclick=()=>av[+b.dataset.av].ir());
};
