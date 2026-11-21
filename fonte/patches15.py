# ── décima quinta leva: conta na nuvem (Supabase), clínica com área fixa, equipe com papéis ──
js = js.replace('/* ══════════ BOAS-VINDAS', rd('nuvem.js') + rd('clientes-obrig.js') + '/* ══════════ BOAS-VINDAS', 1)
rep("""const iniciar=()=>{ if(T[telaIni]&&telaIni!=='painel')ir(telaIni); else render(); animar();
  if(!UI.boasVindas&&!S.servicos.length&&!S.vendas.length&&!S.clientes.length)boasVindas() };""",
"""const iniciarLocal=()=>{ marcaMenu(tela); if(T[telaIni]&&telaIni!=='painel')ir(telaIni); else render(); animar();
  if(!UI.boasVindas&&!S.servicos.length&&!S.vendas.length&&!S.clientes.length)boasVindas() };
const iniciar=()=>{ if(NUVEM)return nuvemIniciar(iniciarLocal); iniciarLocal() };""")
