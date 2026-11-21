/* ── ícones (SVG inline, traço único) ── */
const IC={
  plus:'<path d="M12 5v14M5 12h14"/>',
  check:'<path d="M5 12.5l4.500 4.500L19 7.500"/>',
  x:'<path d="M6 6l12 12M18 6L6 18"/>',
  trash:'<path d="M4.500 7h15M9.500 7V5.500a1.500 1.500 0 0 1 1.500-1.500h2a1.500 1.500 0 0 1 1.500 1.500V7M6.500 7l.800 11.200a2 2 0 0 0 2 1.800h5.400a2 2 0 0 0 2-1.800L17.500 7M10 11v5m4-5v5"/>',
  edit:'<path d="M4.500 19.500l.700-3.800L16 4.900a2 2 0 0 1 2.900 0l.200.200a2 2 0 0 1 0 2.900L8.300 18.800Z"/><path d="M14.500 6.500l3 3"/>',
  chat:'<path d="M20 11.500a8 8 0 0 1-11.800 7L4 20l1.500-4.200A8 8 0 1 1 20 11.500Z"/>',
  left:'<path d="M14.500 6l-6 6 6 6"/>',
  right:'<path d="M9.500 6l6 6-6 6"/>',
  arrow:'<path d="M5 12h14m0 0l-5-5m5 5l-5 5"/>',
  download:'<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19.500h14"/>',
  upload:'<path d="M12 15V4m0 0L8 8m4-4l4 4M5 19.500h14"/>',
  file:'<path d="M7 3.500h7l4 4V19a1.500 1.500 0 0 1-1.500 1.500h-9.500A1.500 1.500 0 0 1 5.500 19V5A1.500 1.500 0 0 1 7 3.500Z"/><path d="M14 3.500v4h4M9 13h6M9 16.500h4"/>',
  undo:'<path d="M8 8h7a4.500 4.500 0 0 1 0 9H9"/><path d="M11 5L8 8l3 3"/>',
  clock:'<circle cx="12" cy="12" r="8.500"/><path d="M12 7.500V12l3 2"/>',
  calendar:'<rect x="3.500" y="5" width="17" height="15.500" rx="3"/><path d="M8 3v4m8-4v4M3.500 10h17"/>',
  user:'<circle cx="12" cy="8" r="3.600"/><path d="M4.800 20a7.200 7.200 0 0 1 14.400 0"/>',
  coins:'<circle cx="12" cy="12" r="8.500"/><path d="M14.800 9.300c-.500-.900-1.500-1.400-2.800-1.400-1.700 0-2.900.800-2.900 2 0 2.900 5.900 1.300 5.900 4.200 0 1.200-1.200 2-3 2-1.400 0-2.500-.600-3-1.500M12 6v1.900m0 8.200V18"/>',
  box:'<path d="M4 8l8-4.500L20 8v8l-8 4.500L4 16Z"/><path d="M4 8l8 4.500L20 8M12 12.500v8"/>',
  sliders:'<path d="M5 7h9m4 0h1M5 12h2m4 0h8M5 17h7m4 0h3"/><circle cx="16" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="14" cy="17" r="2"/>',
  target:'<circle cx="12" cy="12" r="8.500"/><circle cx="12" cy="12" r="4.500"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  spark:'<path d="M12 3.500l2.100 5.400 5.400 2.100-5.400 2.100L12 18.500l-2.100-5.400L4.500 11l5.400-2.100Z"/>'
};
const ic=(n,t)=>`<svg class="ic" width="${t||18}" height="${t||18}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||''}</svg>`;
const MARCA='<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="10" fill="#7A2E4D"/><path d="M11 8.500V20a3 3 0 0 0 3 3h7.500" fill="none" stroke="#FFF6EE" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.500 17.500c0-5 3-8.500 8.500-9 0 5.500-3 9-8.500 9Z" fill="#E0B36A"/></svg>';
/* valor em destaque: R$ e centavos menores, para o número inteiro mandar */
const brlG=v=>{ if(!isFinite(v)||Math.abs(v)<0.005)v=0;
  const p=Math.abs(v).toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).split(',');
  return `<span class="g-rs">${v<0?'-':''}R$</span>${p[0]}<span class="g-c">,${p[1]}</span>` };

/* folha deslizante: substitui prompt, alert e confirm do navegador */
let fecharSheet=()=>{};
const pilhaSheets=[];
function abrirSheet(titulo,sub,corpo,aoAbrir){
  const antes=document.activeElement;
  const bg=document.createElement('div'); bg.className='sheet-bg';
  bg.innerHTML=`<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(titulo)}" tabindex="-1"><div class="alca"></div>
    <div class="cab"><div><h2>${esc(titulo)}</h2>${sub?`<p class="sub">${sub}</p>`:''}</div>
      <button class="ibtn" data-fecha-sheet aria-label="Fechar">${ic('x')}</button></div>${corpo}</div>`;
  document.body.appendChild(bg);
  pilhaSheets.push(bg);
  document.body.style.overflow='hidden';
  requestAnimationFrame(()=>requestAnimationFrame(()=>bg.classList.add('on')));
  let fechado=false;
  const fechar=()=>{ if(fechado)return; fechado=true;
    bg.classList.remove('on');
    const i=pilhaSheets.indexOf(bg); if(i>=0)pilhaSheets.splice(i,1);
    if(!pilhaSheets.length&&!document.querySelector('.ob'))document.body.style.overflow='';
    setTimeout(()=>bg.remove(),300); document.removeEventListener('keydown',esc2); fecharSheet=()=>{};
    try{ if(antes&&antes.isConnected)antes.focus({preventScroll:true}) }catch(e){} };
  const esc2=e=>{ if(e.key==='Escape'&&pilhaSheets[pilhaSheets.length-1]===bg)fechar() };
  document.addEventListener('keydown',esc2);
  bg.onclick=e=>{ if(e.target===bg)fechar() };
  bg.querySelector('[data-fecha-sheet]').onclick=fechar;
  fecharSheet=fechar;
  if(aoAbrir)aoAbrir(fechar);
  if(!bg.contains(document.activeElement))bg.querySelector('.sheet').focus({preventScroll:true});
  return fechar;
}
/* confirmação em folha deslizante. perigo=true pinta o botão e deixa o foco em "Voltar" */
function confirmar(titulo,texto,rotulo,aoConfirmar,perigo){
  abrirSheet(titulo,'',`<p class="conf-tx">${texto}</p>
    <div class="row" style="margin-top:18px">
      <button class="btn ${perigo?'perigo':'pri'}" data-cf="ok" style="flex:1">${rotulo}</button>
      <button class="btn soft" data-cf="no">Voltar</button></div>`,
    fechar=>{
      const bg=pilhaSheets[pilhaSheets.length-1];
      const ok=bg.querySelector('[data-cf=ok]'), no=bg.querySelector('[data-cf=no]');
      no.onclick=fechar;
      ok.onclick=()=>{ fechar(); aoConfirmar() };
      (perigo?no:ok).focus({preventScroll:true});
    });
}
