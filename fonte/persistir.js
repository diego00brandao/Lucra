/* ══════════ NADA SE PERDE AO FECHAR O APP ══════════
   O nome da clínica e os módulos ligados (equipe, estoque…) ficavam só neste aparelho até a próxima
   sincronização: fechando o app logo depois, voltavam ao que estava no servidor. Agora o nome vai na hora
   (e, sem internet, fica guardado para ir depois) e os módulos viajam junto com os dados da clínica. */
const K_NOMEPEND=cid=>'lucra:nomepend:'+cid;
async function gravaNomeClinica(){ if(typeof CONTA==='undefined'||!CONTA||!ehDono()||UI.clinica===CONTA.clinica)return;
  const cid=CONTA.cid, nome=UI.clinica; gravarJ(K_NOMEPEND(cid),nome);
  try{ await api(`/rest/v1/clinicas?id=eq.${cid}`,{metodo:'PATCH',corpo:{nome}});
    if(CONTA&&CONTA.cid===cid){ CONTA.clinica=nome; (CONTA.unidades||[]).forEach(u=>{ if(u.cid===cid)u.nome=nome }); gravarJ(K_CONTA,CONTA) }
    if(lerJ(K_NOMEPEND(cid))===nome)gravarJ(K_NOMEPEND(cid),null) }catch(e){} }
function modsParaDados(){ if(typeof CONTA==='undefined'||!CONTA||!ehDono())return; const m=Object.assign({},UI.mod);
  if(!igual(S.mods||{},m)){ S.mods=m; salvar() } }
const _salvarUIP=salvarUI;
salvarUI=function(){ _salvarUIP.apply(this,arguments); if(typeof CONTA!=='undefined'&&CONTA){ gravaNomeClinica(); modsParaDados() } };
const _ativarP=ativar;
ativar=function(conta,op){
  _ativarP(conta,op);
  /* módulos: vale o que está nos dados da clínica; na primeira vez, sobe o que está neste aparelho */
  if(S.mods&&typeof S.mods==='object'&&Object.keys(S.mods).length){ UI.mod=Object.assign({},S.mods); _salvarUIP() } else modsParaDados();
  /* nome trocado sem internet (ou fechado antes de enviar): retoma */
  const pend=lerJ(K_NOMEPEND(conta.cid)); if(pend!=null&&ehDono()&&pend!==CONTA.clinica){ UI.clinica=pend; _salvarUIP(); marca(); gravaNomeClinica() }
  render() };
const _aplParteP=aplicaParte;
aplicaParte=function(p,est){ _aplParteP(p,est); if(p==='dados'&&S.mods&&typeof S.mods==='object'&&Object.keys(S.mods).length&&!igual(UI.mod,S.mods)){ UI.mod=Object.assign({},S.mods); _salvarUIP() } };
