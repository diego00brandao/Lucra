/* ══════════ APP INSTALÁVEL ══════════
   Só age quando o Lucra está publicado num endereço https. Aberto como arquivo solto, fica quieto. */
const NA_WEB=/^https?:$/.test(location.protocol);
const INSTALADO=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
let convite=null;
window.addEventListener('beforeinstallprompt',e=>{ e.preventDefault(); convite=e; if(tela==='ajustes')render() });
window.addEventListener('appinstalled',()=>{ convite=null; toast('Lucra instalado'); if(tela==='ajustes')render() });
function secInstalar(){
  if(!NA_WEB||INSTALADO())return '';
  const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
  return `<div class="sec"><div class="card">
    <h2 style="margin-bottom:4px">Instalar no celular</h2>
    <p class="sub" style="margin-bottom:12px">O Lucra vira um ícone na tela inicial, abre em tela cheia e funciona sem internet.</p>
    ${convite?`<button class="btn pri full" id="pwa-ok">${ic('download')}Instalar o Lucra</button>`
      :`<div class="nota">${ios?'No iPhone: abra no <b>Safari</b>, toque em <b>Compartilhar</b> e depois em <b>Adicionar à Tela de Início</b>.'
        :'Abra o menu do navegador (os três pontinhos) e toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.'}</div>`}
  </div></div>`;
}
function ligarInstalar(){ const b=$('#pwa-ok'); if(b)b.onclick=()=>{ if(!convite)return; convite.prompt();
  convite.userChoice.then(()=>{ convite=null; render() }) } }
if(NA_WEB&&'serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

