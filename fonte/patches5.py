# ── quinta leva: registro rápido, seções recolhidas, recursos opcionais, lembrete de backup ──
rep("ap:{fonte:'padrao',tam:'m',cor:'#7A2E4D'}};", "ap:{fonte:'padrao',tam:'m',cor:'#7A2E4D'},mod:{},backupEm:''};")
rep("['fonte','tam','cor'].forEach(k=>{ if(typeof r.ap[k]==='string')UI.ap[k]=r.ap[k] })}}",
    "['fonte','tam','cor'].forEach(k=>{ if(typeof r.ap[k]==='string')UI.ap[k]=r.ap[k] });\n  if(r.mod&&typeof r.mod==='object')Object.keys(r.mod).forEach(k=>{ if(typeof r.mod[k]==='boolean')UI.mod[k]=r.mod[k] });\n  if(typeof r.backupEm==='string')UI.backupEm=r.backupEm}}")
js = js.replace('/* ══════════ BOAS-VINDAS', rd('rapido.js') + '/* ══════════ BOAS-VINDAS', 1)
rep("(T[tela]||T.painel)(el); ligarRotulos(el) }", "(T[tela]||T.painel)(el); ligarRotulos(el); posRender(el) }")
# recursos opcionais
rep("function secEquipe(){\n", "function secEquipe(){\n  if(!modOn('equipe'))return '';\n")
rep("function ligarEquipe(){\n", "function ligarEquipe(){\n  if(!$('#eq-add'))return;\n")
rep("function campoProf(id,sel){ if(!S.equipe.length)return '';", "function campoProf(id,sel){ if(!modOn('equipe')||!S.equipe.length)return '';")
rep("function secRepasses(mes){\n  if(!S.equipe.length)return '';", "function secRepasses(mes){\n  if(!modOn('equipe')||!S.equipe.length)return '';")
rep("function secEstoque(){\n", "function secEstoque(){\n  if(!modOn('estoque'))return '';\n")
rep("const estoqueBaixo=()=>S.produtos.filter(p=>saldo(p)<=num(p.min));", "const estoqueBaixo=()=>modOn('estoque')?S.produtos.filter(p=>saldo(p)<=num(p.min)):[];")
rep("function secContas(){\n", "function secContas(){\n  if(!modOn('contas'))return '';\n")
rep("${S.contas.length?(()=>{ const cw=contasDaSemana()", "${modOn('contas')&&S.contas.length?(()=>{ const cw=contasDaSemana()")
rep("<h1>Reservas e estoque</h1>", "<h1>${modOn('estoque')?'Reservas e estoque':'Reservas'}</h1>")
rep("${secMsgs()}\n  ${secAparencia()}", "${secMods()}\n  ${secMsgs()}\n  ${secAparencia()}")
rep("  ligarAparencia(); ligarMsgs();", "  ligarAparencia(); ligarMsgs(); ligarMods();")
# backup único
rep("$('#a-exp').onclick=()=>FOTOS.todos().catch(()=>[]).then(fs=>\n    baixa('lucra-backup.json',JSON.stringify(fs&&fs.length?Object.assign({},S,{fotos:fs}):S),'application/json'));",
    "$('#a-exp').onclick=()=>exportarBackup();")
# boas-vindas: sozinha ou com equipe
rep('autocomplete="organization"></div></div>', '''autocomplete="organization"></div>
        <label id="ob-leq">Como você trabalha?</label>
        <div class="chips" role="group" aria-labelledby="ob-leq"><button class="chip" data-eq="0" aria-pressed="${!modOn('equipe')}">Sozinha</button>
          <button class="chip" data-eq="1" aria-pressed="${modOn('equipe')}">Com equipe</button></div></div>''')
rep("    bg.querySelectorAll('[data-meta]')", "    bg.querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>{ UI.mod.equipe=b.dataset.eq==='1'; salvarUI();\n      bg.querySelectorAll('[data-eq]').forEach(z=>z.setAttribute('aria-pressed',String(z===b))) });\n    bg.querySelectorAll('[data-meta]')")
# textos que apontavam para "o formulário acima"
rep("'Preencha o formulário acima a cada cliente atendido. Na hora você já vê quanto sobra depois da maquininha e do produto.'",
    "'Toque em Registrar a cada cliente atendido. Na hora você já vê quanto sobra depois da maquininha e do produto.'")
rep("ou marque um horário no formulário acima.", "ou toque em “Novo agendamento” para marcar um horário.")
