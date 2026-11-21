# ── décima oitava leva: documentos, laboratório, parcelas, convênios, orçamentos, agenda online e satisfação ──
js = js.replace('/* ══════════ BOAS-VINDAS', rd('docs.js') + rd('lab.js') + rd('parcelas.js') + rd('convenios.js') + rd('funil.js') + rd('online.js') + rd('psi.js') + rd('perio.js') + rd('lgpd.js') + rd('voltar.js') + """
/* transferência não tem taxa; entrada sem procedimento (parcela, convênio) mostra a descrição.
   As contas originais ficam intactas: só embrulhamos. */
const _taxaDeT=taxaDe; taxaDe=function(f,p){ return f==='transf'?0:_taxaDeT(f,p) };
const _contaN=conta; conta=function(v){ const k=_contaN(v); if(!serv(v.servicoId)&&v.desc)k.nome=String(v.desc).split(' · ')[0]; return k };
/* telas que só fazem sentido em algumas áreas */
const NAV_AREA={lab:['odonto'],convenios:['odonto','psico'],orcamentos:['estetica','odonto'],fechamento:['psico']};
const SO_NUVEM=['online','satisfacao'];
const areaOk=t=>(!NAV_AREA[t]||NAV_AREA[t].includes(area()))&&(!SO_NUVEM.includes(t)||(typeof CONTA!=='undefined'&&!!CONTA));
const _permA=permitido;
permitido=function(t){ return areaOk(t)&&_permA(t) };
const _aNavA=aplicaNav;
aplicaNav=function(){ _aNavA(); if(typeof aplicarPapel==='function')aplicarPapel() };
const _irA=ir;
ir=function(t){ if(!areaOk(t))t='hoje'; _irA(t) };
/* ══════════ BOAS-VINDAS""", 1)
for k in ["'receber','evolucoes','anamneses','prontuario','planos','odontogramas'].forEach(k=>{ if(!Array.isArray(S[k]))S[k]=[] });"]:
    rep(k, k.replace("'planos','odontogramas'","'planos','odontogramas','documentos','modelosDoc','lab','parcelas','convenios','guias','pesquisas','prontPsi','escalas','periogramas'"))
rep("planos:[], odontogramas:[], area:", "planos:[], odontogramas:[], documentos:[], modelosDoc:[], lab:[], parcelas:[], convenios:[], guias:[], pesquisas:[], prontPsi:[], escalas:[], periogramas:[], area:")
rep("S.planos=S.planos.filter(e=>e.clienteId!==id); S.odontogramas=S.odontogramas.filter(e=>e.clienteId!==id);",
    "S.planos=S.planos.filter(e=>e.clienteId!==id); S.odontogramas=S.odontogramas.filter(e=>e.clienteId!==id); ['documentos','lab','parcelas','guias','prontPsi','escalas','periogramas'].forEach(k=>{ S[k]=(S[k]||[]).filter(e=>e.clienteId!==id) });")
# transferência como forma de pagamento (convênio paga assim), sem taxa
rep("{k:'cred1',n:'Crédito à vista'},{k:'parc',n:'Crédito parcelado'}", "{k:'cred1',n:'Crédito à vista'},{k:'parc',n:'Crédito parcelado'},{k:'transf',n:'Transferência'}")
# entrada sem procedimento (parcela, convênio): mostra a descrição
rep("  vs.forEach(v=>{ const k=v.servicoId||'x', s=serv(k);\n    const a=porServ[k]||(porServ[k]={nome:s?s.nome:'Serviço removido',",
    "  vs.forEach(v=>{ const s=serv(v.servicoId), k=s?v.servicoId:(v.desc?'d:'+String(v.desc).split(' · ')[0]:'x');\n    const a=porServ[k]||(porServ[k]={nome:s?s.nome:(v.desc?String(v.desc).split(' · ')[0]:'Serviço removido'),")
# link público (?agendar= / ?avaliar=) abre antes do login
rep("const iniciar=()=>{ if(NUVEM)return nuvemIniciar(iniciarLocal); iniciarLocal() };", "const iniciar=()=>{ if(paginaPublica())return; if(NUVEM)return nuvemIniciar(iniciarLocal); iniciarLocal() };")
# o nome da tela agora é "Valor do atendimento"
rep("${edV?'Editar atendimento':'Registrar atendimento'}</h2>", "${edV?'Editar atendimento':'Valor do atendimento'}</h2>")
rep("${edV?'Salvar alterações':'Registrar atendimento'}</button>", "${edV?'Salvar alterações':'Registrar valor'}</button>")
