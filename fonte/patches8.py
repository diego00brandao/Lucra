# ── oitava leva: app instalável (PWA) ──
js = js.replace('/* ══════════ BOAS-VINDAS', rd('instalar.js') + '/* ══════════ BOAS-VINDAS', 1)
rep("${secMods()}\n  ${secMsgs()}", "${secInstalar()}\n  ${secMods()}\n  ${secMsgs()}")
rep("ligarMsgs(); ligarMods();", "ligarMsgs(); ligarMods(); ligarInstalar();")
rep("Lucra · protótipo versão 1", "Lucra · versão 1")
rep("const iniciar=()=>{ render(); animar();", "const telaIni=location.hash.slice(1);   /* atalhos do ícone do app abrem direto na tela */\nconst iniciar=()=>{ if(T[telaIni]&&telaIni!=='painel')ir(telaIni); else render(); animar();")
