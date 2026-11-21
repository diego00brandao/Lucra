/* ══════════ BOTÃO VOLTAR DO CELULAR ══════════
   No app instalado, o "voltar" do Android fechava o Lucra. Agora ele fecha a folha aberta
   ou volta para a tela anterior; só sai do app quando já está na tela inicial. */
let pilhaTelas=[], guardaArmada=false, voltando=false;
const temOndeVoltar=()=>pilhaSheets.length>0||pilhaTelas.length>0||(typeof tela!=='undefined'&&tela!==telaInicial());
function armaVoltar(){ if(guardaArmada||!temOndeVoltar())return; try{ history.pushState({lucra:1},''); guardaArmada=true }catch(e){} }
window.addEventListener('popstate',()=>{ guardaArmada=false;
  if(document.body.classList.contains('publico'))return;
  if(typeof travada!=='undefined'&&travada){ armaVoltar(); return }
  if(pilhaSheets.length){ const s=pilhaSheets[pilhaSheets.length-1], x=s.querySelector('[data-fecha-sheet]'); if(x)x.click() }
  else if(pilhaTelas.length||tela!==telaInicial()){ const t=pilhaTelas.pop()||telaInicial(); voltando=true; try{ ir(t) }finally{ voltando=false } }
  else { try{ history.back() }catch(e){} return }
  setTimeout(armaVoltar,350) });
const _abrirSheetV=abrirSheet;
abrirSheet=function(){ const r=_abrirSheetV.apply(this,arguments); armaVoltar(); return r };
const _irV=ir;
ir=function(t){ const ant=typeof tela!=='undefined'?tela:''; _irV.apply(this,arguments);
  if(!voltando&&ant&&tela!==ant){ pilhaTelas.push(ant); if(pilhaTelas.length>30)pilhaTelas.shift() }
  if(tela===telaInicial())pilhaTelas=[];
  armaVoltar() };

/* textos longos (privacidade, termos) abrem dentro do app, com o X para fechar */
function abreTexto(qual){ const h=qual==='termos'?TXT_TERMOS:TXT_PRIV, tmp=document.createElement('div'); tmp.innerHTML=h; const t=tmp.querySelector('h1'); const tit=t?t.textContent:''; if(t)t.remove(); const sb=tmp.querySelector('.sub'); if(sb)sb.remove();
  abrirSheet(tit,'Lucra',`<div class="pub-txt">${tmp.innerHTML}<p class="sub" style="margin-top:20px">Atualizada em novembro de 2026.</p></div>`,()=>{}) }
document.addEventListener('click',e=>{ const a=e.target.closest('a[href="?privacidade"],a[href="?termos"],a[href$="?privacidade"],a[href$="?termos"]'); if(!a||document.body.classList.contains('publico'))return;
  e.preventDefault(); abreTexto(/termos$/.test(a.getAttribute('href'))?'termos':'privacidade') },true);
