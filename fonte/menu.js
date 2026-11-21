/* ══════════ MENU ══════════
   Computador: menu lateral fixo. Celular: o mesmo menu abre como gaveta pelo botão do topo,
   e embaixo ficam só os atalhos (Painel, Agenda, Caixa e Registrar). */
function abreMenu(abre){
  document.body.classList.toggle('menu-on',abre);
  const b=$('#b-menu'); if(b){ b.setAttribute('aria-expanded',String(abre)); b.setAttribute('aria-label',abre?'Fechar menu':'Abrir menu') }
  if(abre){ const a=document.querySelector('#menu button[aria-current="true"]')||document.querySelector('#menu button'); if(a)a.focus({preventScroll:true}) }
  else if(document.activeElement&&document.activeElement.closest('#menu')&&b&&getComputedStyle(b).display!=='none')b.focus({preventScroll:true});
}
function marcaMenu(t){ document.querySelectorAll('#menu button[data-t]').forEach(b=>b.setAttribute('aria-current',String(b.dataset.t===t||(t==='reserva'&&b.dataset.t==='vendas')))) }
/* painel em duas colunas: o dinheiro à esquerda, o dia e os avisos à direita */
function arrumaPainel(el){
  el.classList.toggle('pn',tela==='painel');
  const k=el.querySelector(':scope > [data-pn=kpis]'); if(tela!=='painel'||!k)return;
  const cols=document.createElement('div'); cols.className='pn-cols';
  const esq=document.createElement('div'); esq.className='pn-esq'; const dir=document.createElement('div'); dir.className='pn-dir';
  cols.append(esq,dir);
  [...el.children].forEach(c=>{ if(c===k||c.classList.contains('sec-top'))return; (c.dataset.pn==='dir'?dir:esq).appendChild(c) });
  k.after(cols);
}

/* Sair: só existe de verdade quando houver login. Até lá, explica e não finge que protege os dados. */
function sair(){
  abrirSheet('Sair','',`<p class="conf-tx">Por enquanto o Lucra não tem login: os dados ficam guardados só neste aparelho, sem conta para sair.</p>
    <p class="conf-tx" style="margin-top:10px">Quando a versão com conta e nuvem chegar, este botão encerra a sessão e pede a senha na próxima vez.</p>
    <div class="row" style="margin-top:18px"><button class="btn pri" data-fecha-ok style="flex:1">Entendi</button></div>`,
    fechar=>{ document.querySelector('.sheet [data-fecha-ok]').onclick=fechar });
}
