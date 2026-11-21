# ── segunda leva: contas, ranking, orçamento, equipe, estoque, fotos ──
rep("servicos:[], vendas:[], despesas:[], retiradas:[], clientes:[], agenda:[]\n};",
    "servicos:[], vendas:[], despesas:[], retiradas:[], clientes:[], agenda:[],\n  contas:[], produtos:[], orcamentos:[], equipe:[]   /* listas novas: backups antigos abrem com elas vazias */\n};")
rep("['servicos','vendas','despesas','retiradas','clientes','agenda'].forEach(k=>{ if(!Array.isArray(S[k]))S[k]=[] });",
    "['servicos','vendas','despesas','retiradas','clientes','agenda','contas','produtos','orcamentos','equipe'].forEach(k=>{ if(!Array.isArray(S[k]))S[k]=[] });\n  S.contas.forEach(c=>{ if(!c.venc)c.venc=hojeISO() });\n  S.orcamentos.forEach(o=>{ if(!Array.isArray(o.itens))o.itens=[] });")
js = js.replace('/* ══════════ BOAS-VINDAS', rd('extras.js') + '/* ══════════ BOAS-VINDAS', 1)

# 1 · confirmar na agenda
rep("data-acao=\"concluir\">${ic('check',16)}Atendeu</button>", "data-acao=\"concluir\">${ic('check',16)}Atendeu</button>\n      ${btnConf(a)}")
rep("<b>${c?esc(c.nome):'Sem cadastro'}</b>", "<b>${c?esc(c.nome):'Sem cadastro'} ${a.avisado?'<span class=\"pill ac\">aviso enviado</span>':''}</b>")
rep("document.querySelectorAll('[data-ed-a]').forEach(b=>b.onclick=()=>abrirEdicao('ag',b.dataset.edA));",
    "document.querySelectorAll('[data-ed-a]').forEach(b=>b.onclick=()=>abrirEdicao('ag',b.dataset.edA));\n  ligarConf();")

# 2 + 3 + 6 + 7 · painel
rep("'estoque em dia'} · ver reservas</div></button>\n  </div></div>`;",
    """'estoque em dia'}${estoqueBaixo().length?' · '+estoqueBaixo().length+' produto(s) acabando':''} · ver reservas</div></button>
    ${S.contas.length?(()=>{ const cw=contasDaSemana(), tw=cw.reduce((a,c)=>a+num(c.valor),0);
      return `<button class="tile" id="ir-contas">
      <span class="tile-top"><span class="ico">${ic('file',17)}</span><span class="eyebrow">Contas da semana</span></span>
      <div class="tile-n ${cw.length?'v-war':'v-ok'}">${cw.length?brl(tw):'Nada vence'}</div>
      <div class="sub">${cw.length?cw.length+' conta(s) vencendo ou atrasada(s)':S.contas.length+' agendada(s) para depois'}</div></button>` })():''}
  </div></div>`;
  x+=secNiver();""")
rep("  const pacs=pacotesAbertos();\n  if(pacs.length){", "  x+=secRepasses(mesSel);\n\n  const pacs=pacotesAbertos();\n  if(pacs.length){")
rep("$('#ir-res').onclick=()=>ir('reserva');", "$('#ir-res').onclick=()=>ir('reserva');\n  if($('#ir-contas'))$('#ir-contas').onclick=()=>ir('vendas');")

# 3 · contas a pagar no Caixa
rep("  const edD=S.despesas.find(d=>d.id===emEdicao('desp'));", "  x+=secContas();\n\n  const edD=S.despesas.find(d=>d.id===emEdicao('desp'));")
rep("  const bx=$('#x-busca');", "  ligarContas();\n  const bx=$('#x-busca');")

# 4 · ranking de clientes
rep("}).sort((a,b)=>b.total-a.total);\n\n  let x=`<h1>Clientes</h1>", "}).filter(filtroCli).sort(ORD_CLI[ordCli]||ORD_CLI.lucro);\n\n  let x=`<h1>Clientes</h1>")
rep("quem mais traz dinheiro para a clínica</p>`;", "quem mais deixa lucro para a clínica</p>`;")
rep('value="${esc(buscaCli)}"></div>`;', 'value="${esc(buscaCli)}">${chipsCli()}</div>`;')
rep('<div class="item"><div class="mn"><b>${esc(i.c.nome)}</b>', '<div class="item"><div class="mn"><b>${rankCli(i,lista)}${esc(i.c.nome)}</b>')
rep("· última em ${dataBR(i.ult)}`:'ainda sem atendimento'}", "· última em ${dataBR(i.ult)} · há ${diasEntre(i.ult,hojeISO())} dia(s)`:'ainda sem atendimento'}")
rep("const l=zap(i.c.tel,`Oi, ${i.c.nome.split(' ')[0]}! Tudo bem?`);", "const l=zap(i.c.tel,msgCli(i.c));")
rep("S.clientes.length?'Tente outro nome.'", "S.clientes.length?(ordCli==='sumidos'&&!q?'Ninguém está sem aparecer há '+sumidoDias+' dias ou mais. Bom sinal.':'Tente outro nome.')")
rep("document.querySelectorAll('[data-ver-c]').forEach(b=>b.onclick=()=>historico(b.dataset.verC));",
    "document.querySelectorAll('[data-ver-c]').forEach(b=>b.onclick=()=>historico(b.dataset.verC));\n  ligarChipsCli();")
rep("S.clientes=S.clientes.filter(c=>c.id!==id);", "S.clientes=S.clientes.filter(c=>c.id!==id); apagaFotosDe(id);")

# 5 · orçamento no Simulador
rep("let x=`<h1>Simulador</h1><p class=\"sub\">Antes de fechar o pacote, veja quanto sobra em cada forma de pagamento</p>`;",
    "let x=`<h1>Simulador</h1><p class=\"sub\">Antes de fechar o preço, veja quanto sobra para você</p>${S.servicos.length?abasSim():''}`;\n  if(simAba==='orc'&&S.servicos.length)return telaOrc(el,x);")

# 6 · equipe
rep_ws("el.innerHTML=x; $('#s-add').onclick=()=>{", "x+=secEquipe();\n  el.innerHTML=x; ligarEquipe();\n  $('#s-add').onclick=()=>{")
rep_ws('<div class="field"><label>Cliente</label> <select id="f-cli">', "${campoProf('f-prof',edV?edV.profId:'')}\n    <div class=\"field\"><label>Cliente</label>\n      <select id=\"f-cli\">")
rep("sessoes:n,desloc:num(fd.value),\n", "sessoes:n,desloc:num(fd.value),profId:$('#f-prof')?$('#f-prof').value:((edV&&edV.profId)||''),\n")
rep('<div class="nota" id="k-previa"></div>', "${campoProf('k-prof','')}\n       <div class=\"nota\" id=\"k-previa\"></div>")
rep("clienteId:a.clienteId,cliente:nomeCli(a)});", "clienteId:a.clienteId,cliente:nomeCli(a),profId:$('#k-prof')?$('#k-prof').value:''});")
rep("${c.desloc?' · domicílio':''}", "${nomeProf(v)?' · atendeu '+esc(nomeProf(v)):''}${c.desloc?' · domicílio':''}")

# 7 · estoque na tela de Reservas
rep_ws("el.innerHTML=x; ligarMes(); }; /* ══════════ AGENDA ══════════ */", "x+=secEstoque();\n  el.innerHTML=x; ligarMes(); ligarEstoque();\n};\n\n/* ══════════ AGENDA ══════════ */")
rep("<h1>Reservas</h1>\n    <p class=\"sub\">O dinheiro que não é seu: é da reposição</p>", "<h1>Reservas e estoque</h1>\n    <p class=\"sub\">O dinheiro que não é seu: é da reposição</p>")

# 8 · fotos no histórico do cliente + backup
rep('corpo+=`<button class="btn soft full" id="h-fechar" style="margin-top:14px">Fechar</button>`;',
    'corpo+=`<div class="sec" id="h-fotos"></div>`;\n  corpo+=`<button class="btn soft full" id="h-fechar" style="margin-top:14px">Fechar</button>`;')
rep("$('#h-fechar').onclick=fechar;", "$('#h-fechar').onclick=fechar;\n    pintaFotos(id);")
rep("$('#a-exp').onclick=()=>baixa('lucra-backup.json',JSON.stringify(S),'application/json');",
    "$('#a-exp').onclick=()=>FOTOS.todos().catch(()=>[]).then(fs=>\n    baixa('lucra-backup.json',JSON.stringify(fs&&fs.length?Object.assign({},S,{fotos:fs}):S),'application/json'));")
rep("if(!d||typeof d!=='object'||Array.isArray(d))throw 0;", "if(!d||typeof d!=='object'||Array.isArray(d))throw 0;\n        const fts=Array.isArray(d.fotos)?d.fotos:null; delete d.fotos;")
rep("toast('Backup restaurado'); ir('painel');", """if(fts)FOTOS.limpar().then(()=>Promise.all(fts.filter(f=>f&&typeof f.id==='string'&&typeof f.clienteId==='string')
          .map(f=>FOTOS.salvar({id:f.id,clienteId:f.clienteId,titulo:String(f.titulo||''),data:String(f.data||''),
            antes:fotoOk(f.antes)?f.antes:'',depois:fotoOk(f.depois)?f.depois:''})))).catch(()=>{});
        toast('Backup restaurado'); ir('painel');""")
rep("()=>{ demo(); UI.boasVindas=true; salvarUI(); toast('Exemplo carregado'); ir('painel') },true);",
    "()=>{ demo(); FOTOS.limpar().catch(()=>{}); UI.boasVindas=true; salvarUI(); toast('Exemplo carregado'); ir('painel') },true);")
rep("S.tema=t; salvar(); toast('Tudo apagado');", "S.tema=t; salvar(); FOTOS.limpar().catch(()=>{}); toast('Tudo apagado');")
rep("Serviços, atendimentos, clientes, agenda, saídas e taxas serão removidos", "Serviços, atendimentos, clientes, fotos, agenda, contas, estoque e taxas serão removidos")
rep("Guarde uma cópia antes de limpar o navegador ou trocar de aparelho.", "Guarde uma cópia antes de limpar o navegador ou trocar de aparelho. O backup leva junto as fotos de antes e depois.")
