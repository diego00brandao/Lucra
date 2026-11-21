/* ══════════ TODO ATENDIMENTO TEM UM CLIENTE ══════════
   Sai o "Sem cadastro". Quem chegou sem cadastro é cadastrado ali mesmo, com nome e WhatsApp. */
const SEL_CLI={'f-cli':['#f-add'],'a-cli':['#a-add'],'r-cli':['#r-ok'],'o-cli':['#o-salva','#o-zap']};
const quemTx=()=>ehPsico()||area()==='odonto'?'o paciente':'o cliente';
function preparaSelCli(sel){
  if(!sel||sel.dataset.obrig)return; sel.dataset.obrig='1';
  const vazio=sel.querySelector('option[value=""]');
  if(vazio){ vazio.textContent='Escolha '+quemTx(); vazio.disabled=true; vazio.hidden=true }
  else if(!sel.value)sel.insertAdjacentHTML('afterbegin',`<option value="" disabled hidden selected>Escolha ${quemTx()}</option>`);
  sel.insertAdjacentHTML('beforeend','<option value="__novo">+ Cadastrar novo</option>');
  sel.dataset.ant=sel.value;
  sel.addEventListener('change',e=>{
    if(sel.value!=='__novo'){ sel.dataset.ant=sel.value; return }
    e.stopImmediatePropagation(); sel.value=sel.dataset.ant||''; novoCliRapido(sel) },true);
}
function novoCliRapido(sel){
  abrirSheet('Novo cadastro','Só o nome já basta. O resto dá para completar depois.',
    `<div class="field"><label for="nc-nome">Nome</label><input id="nc-nome" autocomplete="off"></div>
     <div class="field"><label for="nc-tel">WhatsApp</label><input id="nc-tel" inputmode="tel" placeholder="(11) 90000-0000"></div>
     <button class="btn pri full" id="nc-ok">${ic('check')}Cadastrar e usar</button>`,
    fechar=>{ setTimeout(()=>$('#nc-nome').focus(),80);
      const ok=()=>{ const n=$('#nc-nome').value.trim(); if(!n){ toast('Escreva o nome'); return $('#nc-nome').focus() }
        const c={id:uid(),nome:n,tel:$('#nc-tel').value.trim(),email:'',nasc:'',obs:''}; S.clientes.push(c); salvar();
        const novo=sel.querySelector('option[value="__novo"]'); novo.insertAdjacentHTML('beforebegin',`<option value="${c.id}">${esc(c.nome)}</option>`);
        sel.value=c.id; sel.dataset.ant=c.id; fechar(); toast('Cadastrado'); sel.dispatchEvent(new Event('change',{bubbles:true})) };
      $('#nc-ok').onclick=ok; $('#nc-nome').onkeydown=e=>{ if(e.key==='Enter'){ e.preventDefault(); ok() } } });
}
new MutationObserver(()=>Object.keys(SEL_CLI).forEach(id=>{ const s=document.getElementById(id); if(s&&!s.dataset.obrig)preparaSelCli(s) }))
  .observe(document.body,{childList:true,subtree:true});
/* salvar sem escolher quem foi atendido: avisa e não deixa passar */
document.addEventListener('click',e=>{
  for(const id in SEL_CLI){ const s=document.getElementById(id); if(!s)continue;
    if(SEL_CLI[id].some(q=>e.target.closest&&e.target.closest(q))&&(!s.value||s.value==='__novo')){
      e.preventDefault(); e.stopImmediatePropagation(); toast('Escolha '+quemTx()+' ou cadastre um novo'); s.focus(); return } }
},true);

/* ══════════ INICIAR O ATENDIMENTO: anotações abertas desde o começo ══════════ */
IC.play='<path d="M8 5.500v13l10.500-6.500Z"/>';
const temAnot=a=>S.evolucoes.some(e=>e.agId===a.id)||(S.prontuario||[]).some(p=>p.agId===a.id);
function abreAnot(a){ if(ehPsico())anotarSessao(a.clienteId,a.id,a.data); else prontuario(a.clienteId,a.id,a.data) }
const _agIni=T.agenda;
T.agenda=function(el){ _agIni(el);
  if(!podeClinico()||!(ehPsico()||temPront()))return;
  const agora=()=>new Date().toTimeString().slice(0,5);
  el.querySelectorAll('[data-item-ag]').forEach(it=>{
    const a=S.agenda.find(z=>z.id===it.dataset.itemAg); if(!a||a.status!=='marcado'||!a.clienteId)return;
    const acts=it.querySelector('.acts'); if(!acts)return;
    const ses=ehPsico()?'sessão':'atendimento';
    if(a.inicio){ const b=it.querySelector('.mn > b'); if(b)b.insertAdjacentHTML('beforeend',` <span class="pill ok">em ${ses} desde ${a.inicio}</span>`) }
    acts.insertAdjacentHTML('afterbegin',`<button class="btn sm ${a.inicio?'soft':'pri'}" data-ini="${a.id}">${ic(a.inicio?'edit':'play',16)}${a.inicio?'Anotações':'Iniciar '+ses}</button>`);
    if(!a.inicio){ const at=acts.querySelector('[data-acao=concluir]'); if(at){ at.classList.remove('pri'); at.classList.add('soft') } }
    acts.querySelector('[data-ini]').onclick=()=>{ if(!a.inicio){ a.inicio=agora(); salvar(); render() } abreAnot(a) };
  });
};
/* depois do "Atendeu", só abre a anotação sozinha se ela ainda não foi feita */
const _posIni=posAtender;
posAtender=function(a){ if(temAnot(a))return; _posIni(a) };
