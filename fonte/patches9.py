# ── nona leva: áreas (estética, odontologia, psicologia) e o pacote da psicologia ──
rep("  contas:[], produtos:[], orcamentos:[], equipe:[]   /* listas novas: backups antigos abrem com elas vazias */",
    "  contas:[], produtos:[], orcamentos:[], equipe:[],  /* listas novas: backups antigos abrem com elas vazias */\n  receber:[], evolucoes:[], area:'estetica', perfil:{}")
rep("['servicos','vendas','despesas','retiradas','clientes','agenda','contas','produtos','orcamentos','equipe'].forEach(k=>{ if(!Array.isArray(S[k]))S[k]=[] });",
    """['servicos','vendas','despesas','retiradas','clientes','agenda','contas','produtos','orcamentos','equipe','receber','evolucoes'].forEach(k=>{ if(!Array.isArray(S[k]))S[k]=[] });
  if(!['estetica','odonto','psico'].includes(S.area))S.area='estetica';
  if(!S.perfil||typeof S.perfil!=='object'||Array.isArray(S.perfil))S.perfil={};
  if(S.falta&&(typeof S.falta!=='object'||Array.isArray(S.falta)))delete S.falta;
  S.receber.forEach(r=>{ r.valor=num(r.valor); if(!r.data)r.data=hojeISO() });
  S.evolucoes.forEach(e=>{ e.humor=Math.min(10,Math.max(1,parseInt(e.humor)||5)); if(!Array.isArray(e.sinais))e.sinais=[]; if(!e.data)e.data=hojeISO() });""")
js = js.replace('/* ══════════ BOAS-VINDAS', rd('area.js') + rd('psico.js') + rd('demos.js') + '/* ══════════ BOAS-VINDAS', 1)

# palavras, cor e navegação
rep("function toast(t){const e=$('#toast');e.textContent=t;", "function toast(t){const e=$('#toast');e.textContent=trTx(t);")
rep("function posRender(el){ extrasAgenda(el); dobrar(el); lembreteBackup(el); fab() }",
    "function posRender(el){ extrasAgenda(el); dobrar(el); lembreteBackup(el); fab(); ligarArea(el); traduz(el) }")
rep("  ligarRotulos(bg);\n  if(aoAbrir)aoAbrir(fechar);", "  ligarRotulos(bg); traduz(bg);\n  if(aoAbrir)aoAbrir(fechar);")
rep("const base=/^#[0-9a-f]{6}$/i.test(a.cor)?a.cor:COR_PADRAO,", "const base=corDaArea(a.cor),")
rep('aria-pressed="${c[1].toUpperCase()===String(a.cor).toUpperCase()}"', 'aria-pressed="${c[1].toUpperCase()===corDaArea(a.cor).toUpperCase()}"')
rep("e.textContent=UI.clinica||'financeiro da clínica';", "e.textContent=UI.clinica||AREAS[area()].sub;")
rep("carregar(); carregarUI(); tema(); marca();", "carregar(); carregarUI(); tema(); marca(); aplicaNav();")

# ajustes
rep("${secInstalar()}", "${secArea()}\n  ${secInstalar()}")
rep("${secMods()}\n  ${secMsgs()}", "${secMods()}\n  ${secPerfil()}${secRegras()}\n  ${secMsgs()}")
rep("ligarInstalar();", "ligarInstalar(); ligarAjustesArea();")
rep("const t=S.tema; S=JSON.parse(JSON.stringify(PAD)); S.tema=t; salvar(); FOTOS",
    "const t=S.tema, ar=S.area; S=JSON.parse(JSON.stringify(PAD)); S.tema=t; S.area=ar; salvar(); FOTOS")

# exemplo de acordo com a área
rep("$('#ir-demo').onclick=()=>{demo();", "$('#ir-demo').onclick=()=>{demoArea();")
rep("'Carregar exemplo',()=>{ demo(); FOTOS", "'Carregar exemplo',()=>{ demoArea(); FOTOS")
rep("q('#ob-demo').onclick=()=>{ demo(); sair(", "q('#ob-demo').onclick=()=>{ demoArea(); sair(")
rep("Isso <b>substitui os dados atuais</b> por uma clínica fictícia.", "Isso <b>substitui os dados atuais</b> por um exemplo fictício da sua área.")

# boas-vindas: área no primeiro passo
rep('<div class="ob-campos"><div class="field"><label for="ob-clinica">Nome</label>',
    '<div class="ob-campos"><label id="ob-la">Sua área</label>\n        <div class="chips" role="group" aria-labelledby="ob-la" style="margin:0 0 18px">${chipsArea()}</div>\n        <div class="field"><label for="ob-clinica">Nome</label>')
rep('aria-pressed="${!modOn(\'equipe\')}">Sozinha</button>', 'aria-pressed="${!modOn(\'equipe\')}">Só eu</button>')
rep("bg.innerHTML=`<div class=\"ob-card\"><div class=\"ob-in\">${P[passo]()}</div></div>`; bg.scrollTop=0;",
    "bg.innerHTML=`<div class=\"ob-card\"><div class=\"ob-in\">${P[passo]()}</div></div>`; bg.scrollTop=0; traduz(bg);")
rep("    bg.querySelectorAll('[data-eq]').forEach(b=>b.onclick", "    bg.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>{ guarda(); mudaArea(b.dataset.area,true); desenha() });\n    bg.querySelectorAll('[data-eq]').forEach(b=>b.onclick")

# painel: a receber
rep("    ${modOn('contas')&&S.contas.length?(()=>{ const cw=contasDaSemana()", "    ${tileReceber()}\n    ${modOn('contas')&&S.contas.length?(()=>{ const cw=contasDaSemana()")
# caixa: a receber
rep("  x+=secContas();", "  x+=secReceber();\n  x+=secContas();")
rep("  ligarContas();", "  ligarContas(); ligarReceber();")

# agenda: repetir, link, falta, pagar depois, pacote, anotação
rep_ws("""<option value="${o[0]}" ${ed&&ed.status===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div> </div>""",
    """<option value="${o[0]}" ${ed&&ed.status===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
    </div>
    ${camposAgenda(ed)}""")
rep("      status:ed?$('#a-st').value:'marcado'};", "      status:ed?$('#a-st').value:'marcado',link:$('#a-link')?(urlSessao($('#a-link').value)||$('#a-link').value.trim()):((ed&&ed.link)||'')};")
rep("const novo=Object.assign({id:uid()},dados); S.agenda.push(novo); salvar(); render();",
    "const novo=Object.assign({id:uid()},dados); S.agenda.push(novo); const nr=repete(novo); salvar(); render(); if(nr)toast((nr+1)+' horários marcados');")
rep("if(acao==='faltou'){ a.status='faltou'; salvar(); toast('Marcado como falta'); return render() }",
    "if(acao==='faltou'){ a.status='faltou'; salvar(); render(); return aposFalta(a) }")
rep("    if(acao==='excluir')return confirmar('Excluir este agendamento?','O horário some da agenda. Não dá para desfazer.','Excluir',\n      ()=>{ S.agenda=S.agenda.filter(z=>z.id!==a.id); salvar(); render(); toast('Excluído') },true);",
    "    if(acao==='excluir')return excluirAg(a);")
rep("""         <button class="btn soft" id="k-no">Cancelar</button></div>`,""", """         <button class="btn soft" id="k-no">Cancelar</button></div>
       ${extrasFechar(a,s)}`,""")
rep("        $('#k-no').onclick=fechar;\n", "        $('#k-no').onclick=fechar; ligarExtrasFechar(a,s,fechar);\n")
rep("          a.status='concluido'; salvar(); fechar();\n          toast('Lançado no caixa'); render();",
    "          a.status='concluido'; salvar(); fechar();\n          toast('Lançado no caixa'); render(); posAtender(a);")
rep("""      <div class="acts"><button class="btn sm soft" data-ed-a="${a.id}">${ic('edit',16)}Editar</button>""",
    """      <div class="acts">${btnNota(a)}<button class="btn sm soft" data-ed-a="${a.id}">${ic('edit',16)}Editar</button>""")
rep("      ${btnMsg(a)}\n", "      ${btnLink(a)}${btnMsg(a)}\n")
rep("<small>${a.hora?'<b>'+a.hora+'</b> · ':''}${s?esc(s.nome):'serviço removido'}${atrasado?' · '+dataBR(a.data):''}${a.obs?' · '+esc(a.obs):''}</small>",
    "<small>${a.hora?'<b>'+a.hora+'</b> · ':''}${s?esc(s.nome):'serviço removido'}${atrasado?' · '+dataBR(a.data):''}${a.serie?' · semanal':''}${a.link?' · online':''}${a.obs?' · '+esc(a.obs):''}</small>")

# mensagens: link no lembrete e cobrança
rep("procedimento:s?s.nome:'',clinica:UI.clinica||''}) }\nfunction textoOrc",
    "procedimento:s?s.nome:'',clinica:UI.clinica||'',link:urlSessao(a.link)||a.link||''}) + (a.link&&!msgDe(tipo).includes('{link}')&&tipo!=='cancelamento'?'\\n\\nLink da sessão: '+(urlSessao(a.link)||a.link):'') }\nfunction textoOrc")
js = js.replace("const MSG_ROT={", """MSG_PAD.cobranca='Oi, {nome}! Tudo bem? Passando para lembrar do valor em aberto de {total}, referente a {itens}. Pode acertar pelo Pix quando puder. Qualquer dúvida, me chama!';
const MSG_ROT={""", 1)
rep("const MSG_ROT={reserva:'Horário reservado',", "const MSG_ROT={cobranca:'Cobrança',reserva:'Horário reservado',")
rep("    ${campo('orcamento',", "    ${campo('cobranca','Botão “Cobrar” em A receber, no Caixa. Usa {nome}, {total} e {itens}.')}\n    ${campo('orcamento',")

# pacientes: CPF para o recibo
rep_ws("""<div class="field"><label>E-mail</label><input id="c-email" type="email" inputmode="email" autocomplete="email"
      placeholder="nome@email.com" value="${ed?esc(ed.email||''):''}"></div>""",
    """<div class="grid2"><div class="field"><label>E-mail</label><input id="c-email" type="email" inputmode="email" autocomplete="email"
      placeholder="nome@email.com" value="${ed?esc(ed.email||''):''}"></div>
      <div class="field"><label>CPF (para recibo)</label><input id="c-cpf" inputmode="numeric" placeholder="000.000.000-00" value="${ed?esc(ed.cpf||''):''}"></div></div>""")
rep("nasc:$('#c-nasc').value,obs:$('#c-obs').value.trim()};", "nasc:$('#c-nasc').value,obs:$('#c-obs').value.trim(),cpf:$('#c-cpf').value.trim()};")

# histórico: recibo, a receber, evolução
rep("  if(!vs.length){\n    corpo+=`<div class=\"sec\"><div class=\"card\"><div class=\"vazio\"><b>Ainda não comprou nada</b>",
    "  corpo+=topoHist(c);\n  if(!vs.length){\n    corpo+=`<div class=\"sec\"><div class=\"card\"><div class=\"vazio\"><b>Ainda não comprou nada</b>")
rep("    pintaFotos(id);", "    if(!ehPsico())pintaFotos(id); ligarTopoHist(id,fechar);")
