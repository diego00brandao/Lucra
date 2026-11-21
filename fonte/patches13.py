# ── décima terceira leva: cada tela responde uma pergunta ──
# painel só com dinheiro: aniversariantes vão para a Agenda
rep("  x+=secNiver();", "")
rep("function extrasAgenda(el){\n  if(tela!=='agenda')return;", "function extrasAgenda(el){\n  if(tela!=='agenda')return;\n  const nv=secNiver(); if(nv)el.insertAdjacentHTML('beforeend',nv);")
# editar só com ícone: nome explícito para leitor de tela
js, n = re.subn(r'(data-ed-[acvds]="\$\{[^}]+\}")>', r'\1 aria-label="Editar" title="Editar">', js); assert n==6, n
# bug: "Usar sessão" aparecia em toda venda avulsa (restam=1); só faz sentido em pacote
rep("${c.restam&&!c.estornado?`<button class=\"btn sm pri\" data-ses-v=", "${c.sessoes>1&&c.restam&&!c.estornado?`<button class=\"btn sm pri\" data-ses-v=")
