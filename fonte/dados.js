/* ══════════ DADOS POR ÁREA ══════════
   Cada área tem a sua gaveta: o paciente da psicologia nunca aparece na odontologia.
   O 'lucra:v1' continua existindo e fica com a área que já estava nele. */
const CHAVE_BASE='lucra:v1', AREAS_OK=['estetica','odonto','psico'];
function chaveDe(a){
  if(UI.chaves[a])return UI.chaves[a];
  const usada=Object.values(UI.chaves).includes(CHAVE_BASE);
  UI.chaves[a]=a==='estetica'&&!usada?CHAVE_BASE:CHAVE_BASE+':'+a; salvarUI(); return UI.chaves[a];
}
function prepararArea(){
  if(!AREAS_OK.includes(UI.area)){
    let a='estetica';
    try{ const d=JSON.parse(localStorage.getItem(CHAVE_BASE)||'null'); if(d&&AREAS_OK.includes(d.area))a=d.area }catch(e){}
    UI.area=a; UI.chaves={}; UI.chaves[a]=CHAVE_BASE; UI.clinicas={}; UI.clinicas[a]=UI.clinica; salvarUI();
  }
  CHAVE=chaveDe(UI.area);
  if(UI.clinicas[UI.area]!=null)UI.clinica=UI.clinicas[UI.area];
}
/* troca a gaveta inteira: salva a área atual e carrega a outra */
function trocaGaveta(k){
  salvar(); UI.clinicas[UI.area]=UI.clinica;
  const t=S.tema; UI.clinica=UI.clinicas[k]||''; UI.area=k; CHAVE=chaveDe(k);   /* nome primeiro: chaveDe já grava as preferências */
  S=JSON.parse(JSON.stringify(PAD)); carregar(); S.area=k; S.tema=t;
  mesSel=mesAtual(); salvar(); salvarUI();
}
/* fotos de quem não existe em nenhuma área são apagadas; as das outras áreas ficam */
function fotosOrfas(){
  const ids=new Set(S.clientes.map(c=>c.id));
  AREAS_OK.filter(a=>a!==UI.area&&UI.chaves[a]).forEach(a=>{ try{ const d=JSON.parse(localStorage.getItem(UI.chaves[a])||'null');
    if(d&&Array.isArray(d.clientes))d.clientes.forEach(c=>ids.add(c.id)) }catch(e){} });
  return FOTOS.todos().then(rs=>Promise.all(rs.filter(r=>!ids.has(r.clienteId)).map(r=>FOTOS.apagar(r.id)))).catch(()=>{});
}

/* ══════════ AVISO QUANDO NÃO DÁ PARA SALVAR ══════════ */
let falhaSalvar=false, dadosCorrompidos=false;
function avisoSalvar(){
  let b=$('#aviso-salvar');
  if(!falhaSalvar&&!dadosCorrompidos){ if(b)b.remove(); return }
  if(!b){ b=document.createElement('div'); b.id='aviso-salvar'; b.className='aviso-salvar'; b.setAttribute('role','alert'); document.body.prepend(b) }
  b.innerHTML=falhaSalvar
    ?`<span><b>Não consegui salvar neste aparelho.</b> O que você lançou agora pode se perder ao fechar o app. Baixe um backup e libere espaço no navegador.</span>
      <button class="btn sm soft" id="as-bk">Baixar backup</button>`
    :`<span><b>Os dados salvos estavam danificados</b> e não puderam ser abertos. Guardei uma cópia deles neste aparelho. Se você tem um backup, restaure em Ajustes.</span>
      <button class="btn sm soft" id="as-ok">Entendi</button>`;
  if($('#as-bk'))$('#as-bk').onclick=()=>exportarBackup();
  if($('#as-ok'))$('#as-ok').onclick=()=>{ dadosCorrompidos=false; avisoSalvar() };
}

