# ── décima primeira leva: revisão — cálculo, leitura de valores, salvar, exemplos e áreas separadas ──

# 1 · leitura de valores no jeito brasileiro: "1.500" é mil e quinhentos, "1.234,56" funciona
rep("const num=v=>{const n=Number(String(v==null?0:v).replace(',','.'));return isFinite(n)?n:0};",
    """const num=v=>{ if(typeof v==='number')return isFinite(v)?v:0;
  let s=String(v==null?'':v).replace(/[^\\d,.\\-]/g,''); if(!s)return 0;
  if(s.includes(',')){ s=s.replace(/\\./g,'').replace(',','.') }            /* 1.234,56 → 1234.56 */
  else if(/^-?\\d{1,3}(\\.\\d{3})+$/.test(s)){ s=s.replace(/\\./g,'') }       /* 1.500 → 1500 */
  const n=Number(s); return isFinite(n)?n:0 };""")

# 2 · desconto em dobro: a compra de produto já está no custo de cada atendimento
rep("  const r={bruto:0,taxa:0,custo:0,desloc:0,comissao:0,imposto:0,liquido:0,lucroBruto:0,despesas:0,",
    "  const r={bruto:0,taxa:0,custo:0,desloc:0,comissao:0,imposto:0,liquido:0,lucroBruto:0,despesas:0,compras:0,")
rep("  ds.forEach(d=>r.despesas+=num(d.valor));",
    "  /* compra de produto (saída ligada a um serviço) não sai de novo: o custo do produto já é descontado em cada atendimento */\n  ds.forEach(d=>{ if(d.servicoId)r.compras+=num(d.valor); else r.despesas+=num(d.valor) });")
rep("const livre=r.lucroBruto-r.despesas;", "const livre=r.lucro+r.custo-r.compras;   /* sobra, menos o que foi comprado além do que foi usado */")
rep("(r.despesas?'Só saídas até agora.", "(r.despesas||r.compras?'Só saídas até agora.")
rep("['Despesas do mês','aluguel, contas, compras',r.despesas]);", "['Despesas do mês','aluguel, contas e outras saídas',r.despesas]);")
rep("""        <div class="bar"><i style="width:${Math.max(0,Math.min(100,margem))}%"></i></div></div>
    </div></div>`;""",
    """        <div class="bar"><i style="width:${Math.max(0,Math.min(100,margem))}%"></i></div></div>
      ${r.compras?`<p class="sub" style="margin-top:12px">As compras de produto do mês (${brl(r.compras)}) não entram de novo aqui: o produto já é descontado em cada atendimento, em “Produto usado”.</p>`:''}
    </div></div>`;""")

# 3 · salvar e carregar sem engolir erro
rep("const CHAVE='lucra:v1';", "let CHAVE='lucra:v1';   /* muda conforme a área: cada área tem a sua gaveta */")
rep("  try{const r=localStorage.getItem(CHAVE); if(r){const d=JSON.parse(r); if(d&&typeof d==='object')S=Object.assign(JSON.parse(JSON.stringify(PAD)),d)}}catch(e){}",
    """  let r=null;
  try{ r=localStorage.getItem(CHAVE) }catch(e){ falhaSalvar=true }
  if(r){ try{ const d=JSON.parse(r); if(d&&typeof d==='object'&&!Array.isArray(d))S=Object.assign(JSON.parse(JSON.stringify(PAD)),d); else throw 0 }
    catch(e){ dadosCorrompidos=true; try{ localStorage.setItem(CHAVE+':danificado:'+Date.now(),r) }catch(x){} } }""")
rep("function salvar(){ try{localStorage.setItem(CHAVE,JSON.stringify(S))}catch(e){} }",
    "function salvar(){ try{ localStorage.setItem(CHAVE,JSON.stringify(S)); if(falhaSalvar){ falhaSalvar=false; avisoSalvar() } }catch(e){ falhaSalvar=true; avisoSalvar() } }")

# 4 · preferências: área atual, gavetas e nome por área
rep("let UI={clinica:'',boasVindas:false,", "let UI={clinica:'',boasVindas:false,area:'',chaves:{},clinicas:{},")
rep("  if(typeof r.backupEm==='string')UI.backupEm=r.backupEm}}",
    """  if(typeof r.backupEm==='string')UI.backupEm=r.backupEm;
  if(typeof r.area==='string')UI.area=r.area;
  if(r.chaves&&typeof r.chaves==='object')Object.keys(r.chaves).forEach(k=>{ if(typeof r.chaves[k]==='string'&&r.chaves[k].startsWith('lucra:v1'))UI.chaves[k]=r.chaves[k] });
  if(r.clinicas&&typeof r.clinicas==='object')Object.keys(r.clinicas).forEach(k=>{ if(typeof r.clinicas[k]==='string')UI.clinicas[k]=r.clinicas[k] })}}""")
rep("function salvarUI(){ try{", "function salvarUI(){ if(UI.area)UI.clinicas[UI.area]=UI.clinica; try{")
js = js.replace('/* ══════════ BOAS-VINDAS', rd('dados.js') + '/* ══════════ BOAS-VINDAS', 1)
rep("carregar(); carregarUI(); tema(); marca(); aplicaNav();",
    "carregarUI(); prepararArea(); carregar(); S.area=UI.area; tema(); marca(); aplicaNav(); avisoSalvar();")
rep("""function mudaArea(k,semRender){ if(!AREAS[k])return; S.area=k;""",
    """function mudaArea(k,semRender){ if(!AREAS[k])return; if(k!==UI.area)trocaGaveta(k); S.area=k;""")

# área do backup: o backup volta para a área de onde veio
rep("        S=Object.assign(JSON.parse(JSON.stringify(PAD)),d); normalizar(); salvar(); tema();",
    """        const aBk=AREAS_OK.includes(d.area)?d.area:UI.area; d.area=aBk;
        if(aBk!==UI.area){ salvar(); UI.clinicas[UI.area]=UI.clinica; UI.clinica=UI.clinicas[aBk]||UI.clinica; UI.area=aBk; CHAVE=chaveDe(aBk); salvarUI() }
        S=Object.assign(JSON.parse(JSON.stringify(PAD)),d); normalizar(); salvar(); tema(); aplicaNav(); marca(); mesSel=mesAtual();""")
rep("if(fts)FOTOS.limpar().then(()=>Promise.all(fts.filter(f=>f&&typeof f.id==='string'&&typeof f.clienteId==='string')",
    "if(fts)Promise.resolve().then(()=>Promise.all(fts.filter(f=>f&&typeof f.id==='string'&&typeof f.clienteId==='string')")
rep("antes:fotoOk(f.antes)?f.antes:'',depois:fotoOk(f.depois)?f.depois:''})))).catch(()=>{});",
    "antes:fotoOk(f.antes)?f.antes:'',depois:fotoOk(f.depois)?f.depois:''})))).then(fotosOrfas).catch(()=>{});")
rep("function exportarBackup(){ return FOTOS.todos().catch(()=>[]).then(fs=>{",
    "function exportarBackup(){ return FOTOS.todos().catch(()=>[]).then(fs=>{ const ids=new Set(S.clientes.map(c=>c.id)); fs=(fs||[]).filter(f=>ids.has(f.clienteId));")
rep("()=>{ demoArea(); FOTOS.limpar().catch(()=>{});", "()=>{ demoArea(); fotosOrfas();")
rep("salvar(); FOTOS.limpar().catch(()=>{}); toast('Tudo apagado');", "salvar(); fotosOrfas(); toast('Tudo apagado');")
rep("Serviços, atendimentos, clientes, fotos, agenda, contas, estoque e taxas serão removidos deste aparelho.",
    "Tudo o que é da área <b>${AREAS[area()].n}</b> sai deste aparelho: serviços, atendimentos, clientes, fotos, agenda, contas e taxas. As outras áreas não mudam.")
rep("Isso <b>substitui os dados atuais</b> por um exemplo fictício da sua área.",
    "Isso <b>substitui os dados da área ${AREAS[area()].n}</b> por um exemplo fictício. As outras áreas não mudam.")
rep("Muda as palavras, a cor e o que aparece no app. Os seus dados continuam os mesmos.",
    "Cada área tem os próprios pacientes, agenda e caixa. Trocar de área não mistura nem apaga nada.")

# 5 · paciente excluído leva junto as anotações de sessão (dado clínico não fica órfão)
rep("S.clientes=S.clientes.filter(c=>c.id!==id); apagaFotosDe(id);",
    "S.clientes=S.clientes.filter(c=>c.id!==id); apagaFotosDe(id); S.evolucoes=S.evolucoes.filter(e=>e.clienteId!==id);")
rep("Esse cliente tem atendimentos registrados. O histórico financeiro continua, e os horários marcados dele saem da agenda.",
    "Esse cliente tem atendimentos registrados. O histórico financeiro continua; os horários marcados, as fotos e as anotações de sessão dele são apagados.")

# 6 · exemplos sem dados de pessoa real
rep("""  S.clientes=[{id:uid(),nome:'Diego Brandão',tel:'(11) 98098-4102',
    email:'diegobrandao118@gmail.com',nasc:'',obs:''}];""",
    """  S.clientes=['Juliana Prado','Camila Torres','Fernanda Lopes','Patrícia Melo','Roberta Dias','Luana Freitas']
    .map(n=>({id:uid(),nome:n,tel:'',email:'',nasc:'',obs:''}));""")
rep("const TEL_DEMO='(11) 98098-4102';", "const TEL_DEMO='';   /* exemplos sem telefone de verdade: o WhatsApp pede para escolher o contato */")
