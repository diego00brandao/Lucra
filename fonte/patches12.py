# ── décima segunda leva: visual novo, menu lateral/gaveta, ajustes separados, painel em colunas ──
js = js.replace('/* ══════════ BOAS-VINDAS', rd('menu.js') + '/* ══════════ BOAS-VINDAS', 1)
rep("document.querySelectorAll('nav button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.t===t))); render();",
    "marcaMenu(t); abreMenu(false); render();")
rep("function posRender(el){ extrasAgenda(el); dobrar(el); lembreteBackup(el); fab(); ligarArea(el); traduz(el) }",
    "function posRender(el){ extrasAgenda(el); dobrar(el); lembreteBackup(el); arrumaPainel(el); fab(); ligarArea(el); traduz(el) }")
rep("  b.hidden=!S.servicos.length||tela==='ajustes'||tela==='servicos';\n}",
    "  b.hidden=!S.servicos.length||tela==='ajustes'||tela==='servicos';\n  const r=$('#b-reg'); if(r)r.hidden=!S.servicos.length;\n}")
rep("document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>ir(b.dataset.t));",
    """document.querySelectorAll('#menu button[data-t]').forEach(b=>b.onclick=()=>ir(b.dataset.t));
$('#b-sair').onclick=()=>{ abreMenu(false); sair() };
$('#fab').onclick=registroRapido; $('#b-reg').onclick=registroRapido;
$('#b-menu').onclick=()=>abreMenu(!document.body.classList.contains('menu-on'));
$('#menu-fundo').onclick=()=>abreMenu(false);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&document.body.classList.contains('menu-on'))abreMenu(false) });""")
