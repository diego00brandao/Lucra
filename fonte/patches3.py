# ── terceira leva: aparência (cor, letra, tamanho) ──
rep("let UI={clinica:'',boasVindas:false};", "let UI={clinica:'',boasVindas:false,ap:{fonte:'padrao',tam:'m',cor:'#7A2E4D'}};")
rep("UI.boasVindas=!!r.boasVindas}}", "UI.boasVindas=!!r.boasVindas;\n  if(r.ap&&typeof r.ap==='object')['fonte','tam','cor'].forEach(k=>{ if(typeof r.ap[k]==='string')UI.ap[k]=r.ap[k] })}}")
rep("function tema(){ document.documentElement.dataset.t=S.tema;", "function tema(){ document.documentElement.dataset.t=S.tema; aparencia();")
js = js.replace('/* ══════════ BOAS-VINDAS', rd('aparencia.js') + '/* ══════════ BOAS-VINDAS', 1)
rep_ws('<div class="sec"><div class="card"> <h2 style="margin-bottom:10px">Backup</h2>', '${secAparencia()}\n  <div class="sec"><div class="card">\n    <h2 style="margin-bottom:10px">Backup</h2>')
rep("$('#a-ob').onclick=()=>boasVindas();", "$('#a-ob').onclick=()=>boasVindas();\n  ligarAparencia();")
