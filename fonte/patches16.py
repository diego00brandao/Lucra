# ── décima sexta leva: psicologia sem estoque, backup com texto certo, rodapé só "Lucra" ──
js = js.replace('/* ══════════ BOAS-VINDAS', rd('ajustes2.js') + rd('barra.js') + rd('hoje.js') + '/* ══════════ BOAS-VINDAS', 1)
rep("const modOn=k=>UI.mod[k]!=null?!!UI.mod[k]:MODS[k][2]();", "const modOn=k=>k==='estoque'&&area()==='psico'?false:UI.mod[k]!=null?!!UI.mod[k]:MODS[k][2]();")
rep("    ${Object.keys(MODS).map(k=>`<div class=\"ck-l\">", "    ${Object.keys(MODS).filter(k=>!(k==='estoque'&&area()==='psico')).map(k=>`<div class=\"ck-l\">")
rep("Guarde uma cópia antes de limpar o navegador ou trocar de aparelho. O backup leva junto as fotos de antes e depois.",
    "${typeof CONTA!=='undefined'&&CONTA?'Seus dados já ficam salvos na nuvem. Baixe uma cópia se quiser guardar uma com você.':'Guarde uma cópia antes de limpar o navegador ou trocar de aparelho.'}${area()==='psico'?'':' O backup leva junto as fotos de antes e depois.'}")
rep('<p class="sub" style="text-align:center;margin-top:26px">Lucra · versão 1</p>', '<p class="sub" style="text-align:center;margin-top:26px">Lucra</p>')

# tela inicial: Hoje
rep("let tela='painel'", "let tela='hoje'")
