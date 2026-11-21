# ── quarta leva: mensagens do WhatsApp (reserva, lembrete, orçamento) ──
troca_bloco('/* ── 1 · confirmar horário pelo WhatsApp ── */', '/* ── 2 · aniversariantes', '')
a = js.index('function textoOrc(o){'); b = js.index('function telaOrc(el,x){'); js = js[:a] + js[b:]
js = js.replace('/* ══════════ BOAS-VINDAS', rd('mensagens.js') + '/* ══════════ BOAS-VINDAS', 1)
rep("S.orcamentos.forEach(o=>{ if(!Array.isArray(o.itens))o.itens=[] });",
    "S.orcamentos.forEach(o=>{ if(!Array.isArray(o.itens))o.itens=[] });\n  if(S.msgs&&(typeof S.msgs!=='object'||Array.isArray(S.msgs)))delete S.msgs;")
# agenda
rep("${btnConf(a)}", "${btnMsg(a)}")
rep("${a.avisado?'<span class=\"pill ac\">aviso enviado</span>':''}", "${pillsMsg(a)}")
rep("  ligarConf();", "  ligarMsg();")
rep("else { S.agenda.push(Object.assign({id:uid()},dados)); salvar(); toast('Agendado'); render() }",
    "else { const novo=Object.assign({id:uid()},dados); S.agenda.push(novo); salvar(); render();\n      if(cli(novo.clienteId)&&novo.data>=hojeISO())msgAgenda(novo,'reserva'); else toast('Agendado') }")
# orçamento
rep('<div id="o-res"></div>', '<div class="field"><label>Orçamento válido até</label><input id="o-val" type="date" value="${orc.validade||proxMes(hojeISO())}"></div>\n    <div id="o-res"></div>')
rep("""<a class="btn pri" id="o-zap" style="flex:1" target="_blank" rel="noopener" href="#">${ic('chat')}Enviar no WhatsApp</a>""",
    """<button class="btn pri" id="o-zap" style="flex:1">${ic('chat')}Enviar orçamento</button>""")
rep("\n    $('#o-zap').href=c&&c.tel?zap(c.tel,textoOrc(orc)):'https://wa.me/?text='+encodeURIComponent(textoOrc(orc)) };", " };")
rep("$('#o-parc').onchange=()=>{orc.parcelas=parseInt($('#o-parc').value)||2;pinta()};",
    "$('#o-parc').onchange=()=>{orc.parcelas=parseInt($('#o-parc').value)||2;pinta()};\n    $('#o-val').onchange=()=>{orc.validade=$('#o-val').value};\n    $('#o-zap').onclick=()=>{ if(calcOrc(orc).total<=0)return toast('O orçamento está zerado'); msgOrc(orc) };")
rep("clienteId:orc.clienteId,desc:num(orc.desc),forma:orc.forma,parcelas:orc.parcelas,", "clienteId:orc.clienteId,desc:num(orc.desc),forma:orc.forma,parcelas:orc.parcelas,validade:orc.validade||proxMes(hojeISO()),")
rep("""<a class="btn sm soft" href="${c&&c.tel?zap(c.tel,textoOrc(o)):'https://wa.me/?text='+encodeURIComponent(textoOrc(o))}" target="_blank" rel="noopener">${ic('chat',16)}Reenviar</a>""",
    """<button class="btn sm soft" data-o-envia="${o.id}">${ic('chat',16)}Enviar orçamento</button>""")
rep("<small>${dataBR(o.data)} · ${o.itens.map(", "<small>${dataBR(o.data)}${ab&&o.validade?(o.validade<hojeISO()?' · <b class=\"v-bad\">venceu em '+dataBR(o.validade)+'</b>':' · vale até '+dataBR(o.validade)):''} · ${o.itens.map(")
rep("  document.querySelectorAll('[data-o-fecha]')", "  document.querySelectorAll('[data-o-envia]').forEach(b=>b.onclick=()=>{ const o=S.orcamentos.find(z=>z.id===b.dataset.oEnvia); if(o)msgOrc(o) });\n  document.querySelectorAll('[data-o-fecha]')")
# ajustes
rep("${secAparencia()}", "${secMsgs()}\n  ${secAparencia()}")
rep("  ligarAparencia();", "  ligarAparencia(); ligarMsgs();")
