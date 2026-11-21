# ── décima quarta leva: menu com uma tela por pergunta, agendamento em botões, pacientes, WhatsApp numa aba ──
# Caixa: cada parte ganha uma marca para virar tela própria
rep("""  x+=`<div class="sec"><div class="card" ${edV?'style="border-color:var(--ac)"':''}>""", """  x+=`<div class="sec" data-cx="reg"><div class="card" ${edV?'style="border-color:var(--ac)"':''}>""")
rep("""x+=`<div class="sec"><input id="x-busca\"""", """x+=`<div class="sec" data-cx="busca"><input id="x-busca\"""")
rep("""x+=`<div class="sec"><div class="sec-top"><h2>Atendimentos do mês</h2>""", """x+=`<div class="sec" data-cx="atd"><div class="sec-top"><h2>Atendimentos do mês</h2>""")
rep("  x+=secReceber();\n  x+=secContas();", "  x+=cxTag('atd',secReceber());\n  x+=cxTag('sai',secContas());")
rep("""  x+=`<div class="sec"><div class="card" ${edD?'style="border-color:var(--ac)"':''}>""", """  x+=`<div class="sec" data-cx="sreg"><div class="card" ${edD?'style="border-color:var(--ac)"':''}>""")
rep("""x+=`<div class="sec"><div class="sec-top"><h2>Saídas do mês</h2>""", """x+=`<div class="sec" data-cx="sai"><div class="sec-top"><h2>Saídas do mês</h2>""")
# Taxas e encargos: tela própria
rep("""x+=`<div class="sec"><div class="card">\n    <h2 style="margin-bottom:4px">Taxas e encargos</h2>""", """x+=`<div class="sec" data-cx="tax"><div class="card">\n    <h2 style="margin-bottom:4px">Taxas e encargos</h2>""")
# Agenda: formulário e retornos marcados; dia escolhido numa faixa da semana
rep("""  x+=`<div class="sec"><div class="card" ${ed?'style="border-color:var(--ac)"':''}>\n    <h2 style="margin-bottom:12px">${ed?'Editar agendamento'""",
    """  x+=`<div class="sec" data-parte="novo"><div class="card" ${ed?'style="border-color:var(--ac)"':''}>\n    <h2 style="margin-bottom:12px">${ed?'Editar agendamento'""")
rep("""x+=`<div class="sec"><div class="sec-top"><h2>Hora de chamar de volta</h2>""", """x+=`<div class="sec" data-parte="ret"><div class="sec-top"><h2>Hora de chamar de volta</h2>""")
a=js.index('      <div class="row" style="margin-bottom:10px;flex-wrap:nowrap">\n        <button class="btn soft" id="ag-ant"')
b=js.index('</div><div class="card">`;', a)
js=js[:a]+'      ${faixaSemana()}<div class="card">`;'+js[b+len('</div><div class="card">`;'):]
rep("""    return `<div class="item" style="opacity:.62"><div class="mn">""", """    return `<div class="item" data-item-ag="${a.id}" style="opacity:.62"><div class="mn">""")
rep("""  return `<div class="item"><div class="mn">\n    <b>${c?esc(c.nome):'Sem cadastro'} ${pillsMsg(a)}</b>""", """  return `<div class="item" data-item-ag="${a.id}"><div class="mn">\n    <b>${c?esc(c.nome):'Sem cadastro'} ${pillsMsg(a)}</b>""")
# Clientes / Pacientes
rep("cadastrado(s) · quem mais deixa lucro para a clínica</p>", "cadastrado(s)${ehPsico()?'':' · quem mais deixa lucro para a clínica'}</p>")
a=js.index("      <small>${i.qtd?`${i.qtd} atendimento(s) · última em")
b=js.index("sobrou ${brl(i.lucro)}</small></div>", a)+len("sobrou ${brl(i.lucro)}</small></div>")
js=js[:a]+"      ${ehPsico()?infoPac(i):linhaCliFin(i)}"+js[b:]
rep("""data-ver-c="${i.c.id}">${ic('clock',16)}Histórico</button>""", """data-ver-c="${i.c.id}">${ic('clock',16)}${ehPsico()?'Ficha':'Histórico'}</button>""")
rep("  const o=[['lucro','Mais lucro'],['total','Mais faturamento'],['sumidos','Sumidos'],['nome','A–Z']];",
    "  const o=ehPsico()?[['nome','A–Z'],['prox','Próxima sessão'],['sumidos','Sumidos']]:[['lucro','Mais lucro'],['total','Mais faturamento'],['sumidos','Sumidos'],['nome','A–Z']];")
rep("    }).filter(filtroCli).sort(ORD_CLI[ordCli]||ORD_CLI.lucro);",
    "    }).filter(filtroCli).sort(ORD_CLI[ehPsico()&&(ordCli==='lucro'||ordCli==='total')?(ordCli='nome'):ordCli]||ORD_CLI.lucro);")
# ficha do paciente (psicologia): sem "quanto sobrou", sem lista de procedimentos
rep("  let corpo=`<div class=\"stats\">\n    <div class=\"stat\"><span class=\"lb\">Já pagou</span>", "  let corpo=ehPsico()?fichaPac(c,vs,ags):`<div class=\"stats\">\n    <div class=\"stat\"><span class=\"lb\">Já pagou</span>")
rep("  corpo+=`<p class=\"sub\" style=\"margin-top:10px\">${primeiro?", "  if(!ehPsico())corpo+=`<p class=\"sub\" style=\"margin-top:10px\">${primeiro?")
rep("<div class=\"sec-top\"><h2>Já agendado</h2></div><div class=\"card\">`;\n    ags.forEach(", "<div class=\"sec-top\"><h2>${ehPsico()?'Próximas sessões':'Já agendado'}</h2><span class=\"pill\">${ags.length}</span></div><div class=\"card\">`;\n    ags.slice(0,ehPsico()?4:99).forEach(")
rep("    corpo+=`<div class=\"sec\"><div class=\"sec-top\"><h2>Procedimentos que já fez</h2></div><div class=\"card\">`;\n    grupos.forEach(", "    if(!ehPsico()){ corpo+=`<div class=\"sec\"><div class=\"sec-top\"><h2>Procedimentos que já fez</h2></div><div class=\"card\">`;\n    grupos.forEach(")
rep("    corpo+=`</div></div>`;\n\n    corpo+=`<div class=\"sec\"><div class=\"sec-top\"><h2>Cada atendimento</h2>", "    corpo+=`</div></div>`; }\n\n    corpo+=`<div class=\"sec\"><div class=\"sec-top\"><h2>${ehPsico()?'Pagamentos':'Cada atendimento'}</h2>")
rep("  abrirSheet(c.nome,'Histórico completo',corpo,", "  abrirSheet(c.nome,ehPsico()?'Ficha do paciente':'Histórico completo',corpo,")
# destinos novos dos atalhos que iam para o Caixa inteiro
rep("  if($('#ir-cx'))$('#ir-cx').onclick=()=>ir('vendas');", "  if($('#ir-cx'))$('#ir-cx').onclick=()=>ir('registrar');")
rep("  if($('#ir-contas'))$('#ir-contas').onclick=()=>ir('vendas');", "  if($('#ir-contas'))$('#ir-contas').onclick=()=>ir('saidas');")
rep("if($('#ir-rec'))$('#ir-rec').onclick=()=>ir('vendas')", "if($('#ir-rec'))$('#ir-rec').onclick=()=>ir('registrar')")
rep("$('#r-mais').onclick=()=>{ fechar(); dobra['vendas:Registrar atendimento']=true; ir('vendas') };", "$('#r-mais').onclick=()=>{ fechar(); ir('registrar') };")
rep("if(q('#ob-cx'))q('#ob-cx').onclick=()=>{ sair(); ir('vendas') };", "if(q('#ob-cx'))q('#ob-cx').onclick=()=>{ sair(); ir('registrar') };")
# menu: telas que não estão no menu acendem a mais próxima
rep("String(b.dataset.t===t||(t==='reserva'&&b.dataset.t==='vendas'))", "String(b.dataset.t===({reserva:'painel',vendas:'registrar',atendmes:'registrar',saidas:'saida',simpag:'sim',simorc:'sim'}[t]||t))")
# painel sem colunas quando só sobram os números e a atenção
rep("  const k=el.querySelector(':scope > [data-pn=kpis]'); if(tela!=='painel'||!k)return;", "  const k=el.querySelector(':scope > [data-pn=kpis]'); if(tela!=='painel'||!k)return;\n  if(!el.querySelector(':scope > [data-pn=esq]')){ const d=document.createElement('div'); d.className='pn-dir pn-so'; el.querySelectorAll(':scope > [data-pn=dir]').forEach(c=>d.appendChild(c)); k.after(d); return }")
# botão + some onde já é a tela de registrar
rep("  b.hidden=!S.servicos.length||tela==='ajustes'||tela==='servicos';\n", "  b.hidden=!S.servicos.length||['ajustes','servicos','taxas','registrar','novoag'].includes(tela);\n")
# WhatsApp: recibo também passa pela aba única
js,n=re.subn(r"window\.open\((linkZap\(c,reciboTexto\([^;]*?\)\)),'_blank','noopener'\)", r"zapAbrir(\1)", js); assert n==1, n
rep("ok.addEventListener('click',()=>{ ok.href=linkZap(c,tx.value);", "ok.addEventListener('click',e=>{ e.preventDefault(); zapAbrir(linkZap(c,tx.value));")
js = js.replace('/* ══════════ BOAS-VINDAS', rd('v4.js') + rd('prontuario.js') + '/* ══════════ BOAS-VINDAS', 1)
# listas novas: anamneses e prontuário (backups antigos abrem com elas vazias)
rep("'receber','evolucoes'].forEach(k=>{ if(!Array.isArray(S[k]))S[k]=[] });", "'receber','evolucoes','anamneses','prontuario'].forEach(k=>{ if(!Array.isArray(S[k]))S[k]=[] });")
rep("receber:[], evolucoes:[], area:", "receber:[], evolucoes:[], anamneses:[], prontuario:[], area:")
rep("S.evolucoes=S.evolucoes.filter(e=>e.clienteId!==id);", "S.evolucoes=S.evolucoes.filter(e=>e.clienteId!==id); S.anamneses=S.anamneses.filter(e=>e.clienteId!==id); S.prontuario=S.prontuario.filter(e=>e.clienteId!==id);")

# ficha: botão de adiantar em cada sessão marcada
rep("""      corpo+=`<div class="item"><div class="mn"><b>${s?esc(s.nome):'serviço removido'}</b>
        <small>${dataBR(a.data)} · ${diaSemana(a.data)}${a.hora?' às '+a.hora:''}</small></div></div>`});""",
"""      corpo+=`<div class="item"><div class="mn"><b>${s?esc(s.nome):'serviço removido'}</b>
        <small>${dataBR(a.data)} · ${diaSemana(a.data)}${a.hora?' às '+a.hora:''}</small></div>
        <div class="acts"><button class="btn sm soft" data-adi="${a.id}">${ic('calendar',16)}Adiantar ou mudar</button></div></div>`});""")
