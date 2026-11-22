/* ══════════ BARRA DE BAIXO (celular) ══════════
   Quatro grupos: Analítico, Atendimento, Financeiro e Configurações. Tocar abre as opções do grupo.
   As opções vêm do próprio menu, então papéis e áreas continuam valendo. */
function gruposMenu(){
  const gs=[]; let g=null;
  document.querySelectorAll('#menu ul > li').forEach(li=>{
    if(li.classList.contains('nav-grupo')){ g={nome:li.textContent.trim(),itens:[]}; gs.push(g); return }
    const b=li.querySelector('button'); if(!g||!b||li.hidden)return;
    g.itens.push({t:b.dataset.t||'',id:b.id||'',rot:b.querySelector('.rot').textContent,ico:b.querySelector('.ico').innerHTML,cad:b.querySelector('.cad')?b.querySelector('.cad').textContent:''}) });
  return gs.filter(x=>x.itens.length);
}
const ICO_GRUPO={'Analítico':'<path d="M4 20h16"/><rect x="5" y="12" width="3.5" height="5" rx="1"/><rect x="10.25" y="8" width="3.5" height="9" rx="1"/><rect x="15.5" y="4.5" width="3.5" height="12.5" rx="1"/>',
  'Atendimento':'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M8 3v4m8-4v4M3.5 10h17"/>',
  'Financeiro':'<path d="M3.5 8A2.5 2.5 0 0 1 6 5.5h10.5a2 2 0 0 1 2 2V9"/><path d="M3.5 8v9A2.5 2.5 0 0 0 6 19.5h12.5a2 2 0 0 0 2-2V11a2 2 0 0 0-2-2H6A2.5 2.5 0 0 1 3.5 8Z"/>',
  'Configurações':'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-2.82-1.17l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.09 14H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.17-2.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9.91 3.1V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.91 10H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/>'};
const svgG=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
function pintaBarra(){
  let bar=$('#barra'); if(!bar){ bar=document.createElement('nav'); bar.id='barra'; bar.setAttribute('aria-label','Menu'); document.body.appendChild(bar) }
  const gs=gruposMenu(), atual=tela==='vendas'?'registrar':tela;
  bar.innerHTML=gs.map((g,i)=>{ const on=g.itens.some(x=>x.t===atual);
    return `<button type="button" data-g="${i}" ${on?'aria-current="true"':''}>${svgG(ICO_GRUPO[g.nome]||'<circle cx="12" cy="12" r="8"/>')}<span>${esc(g.nome)}</span></button>` }).join('');
  bar.querySelectorAll('[data-g]').forEach(b=>b.onclick=()=>abreGrupo(gs[+b.dataset.g]));
}
function abreGrupo(g){
  const vai=x=>{ if(x.id==='b-sair')return sair(); ir(x.t) };
  if(g.itens.length===1)return vai(g.itens[0]);
  abrirSheet(g.nome,'',`<div class="grupo-l">${g.itens.map((x,i)=>`<button type="button" data-gi="${i}" ${x.t&&x.t===tela?'aria-current="true"':''}>
      <span class="ico">${x.ico}</span><span>${esc(x.rot)}</span>${x.cad?`<span class="cad">${esc(x.cad)}</span>`:''}${ic('right',18)}</button>`).join('')}</div>`,
    fechar=>document.querySelectorAll('.sheet [data-gi]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>vai(g.itens[+b.dataset.gi]),180) }));
}
const _marcaB=marcaMenu;
marcaMenu=function(t){ _marcaB(t); pintaBarra() };
