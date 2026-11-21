/* ══════════ MENOS NA TELA ══════════
   Registro rápido (botão +), seções que abrem só quando a pessoa quer,
   recursos opcionais desligados por padrão e lembrete de backup. */

/* ── recursos opcionais: aparecem se a pessoa ligar nos Ajustes ou se já houver dados ── */
const MODS={equipe:['Equipe e comissões','Quem atendeu cada cliente e quanto repassar de comissão.',()=>S.equipe.length>0],
  estoque:['Estoque de produtos','Quantidade de cada produto e aviso quando estiver acabando.',()=>S.produtos.length>0],
  contas:['Contas a pagar','Boletos e contas com vencimento, com aviso na semana.',()=>S.contas.length>0]};
const modOn=k=>UI.mod[k]!=null?!!UI.mod[k]:MODS[k][2]();
function secMods(){
  return `<div class="sec"><div class="card">
    <h2 style="margin-bottom:4px">O que aparece no app</h2>
    <p class="sub" style="margin-bottom:8px">Ligue só o que você usa. Desligar esconde a parte do app, sem apagar nenhum dado.</p>
    ${Object.keys(MODS).map(k=>`<div class="ck-l"><label class="sw"><input type="checkbox" data-mod="${k}" ${modOn(k)?'checked':''}> <span>${MODS[k][0]}</span></label>
      <small>${MODS[k][1]}</small></div>`).join('')}
  </div></div>`;
}
function ligarMods(){ document.querySelectorAll('[data-mod]').forEach(c=>c.onchange=()=>{ UI.mod[c.dataset.mod]=c.checked; salvarUI();
  toast(c.checked?'Ligado':'Escondido') }) }

/* ── seções que começam fechadas: o título vira um botão de abrir ── */
const DOBRAS={
  painel:['Aniversariantes','Comissões a repassar','Lucro por procedimento','Lucro por dia'],
  vendas:['Valor do atendimento','Contas a pagar','Registrar saída'],
  agenda:['Novo agendamento','Aniversariantes'], clientes:['Novo cliente'],
  servicos:['Novo serviço','Taxas e encargos','Equipe'],
  ajustes:['O que aparece no app','Mensagens do WhatsApp','Aparência','Exemplo','Apagar']
};
let dobra={};
function abertoPadrao(t){
  if(t==='Novo cliente')return !S.clientes.length;
  if(t==='Novo serviço')return !S.servicos.length;
  if(t==='Novo agendamento')return !S.agenda.length;
  if(t==='Aniversariantes'){ const h=hojeISO().slice(5); return S.clientes.some(c=>c.nasc&&String(c.nasc).slice(5)===h) }
  return false;
}
function dobrar(el){
  const ts=DOBRAS[tela]; if(!ts||window.__tudoAberto)return;
  el.querySelectorAll(':scope > .sec').forEach(sec=>{
    const h=sec.querySelector('h2'); if(!h)return;
    const tit=h.textContent.trim(), t=ts.find(z=>tit.startsWith(z)); if(!t)return;
    const cab=h.closest('.sec-top')||h, cont=cab.parentElement, k=tela+':'+t;
    let ab=k in dobra?dobra[k]:abertoPadrao(t);
    cab.classList.add('dobravel'); cab.setAttribute('role','button'); cab.tabIndex=0;
    cab.insertAdjacentHTML('beforeend',`<span class="seta">${ic('right',18)}</span>`);
    const aplica=()=>{ Array.from(cont.children).forEach(c=>{ if(c!==cab)c.hidden=!ab });
      cab.setAttribute('aria-expanded',String(ab)); cont.classList.toggle('fechada',!ab) };
    const troca=()=>{ ab=!ab; dobra[k]=ab; aplica() };
    cab.addEventListener('click',e=>{ const a=e.target.closest('button,a,input,select'); if(a&&a!==cab)return; troca() });
    cab.addEventListener('keydown',e=>{ if(e.target===cab&&(e.key==='Enter'||e.key===' ')){ e.preventDefault(); troca() } });
    aplica();
  });
}

/* ── backup: função única, e um lembrete discreto no Painel ── */
function baixaArq(n,t,m){ const u=URL.createObjectURL(new Blob([t],{type:m})), a=document.createElement('a');
  a.href=u; a.download=n; a.style.display='none'; document.body.appendChild(a); a.click();
  setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},3000) }
function exportarBackup(){ return FOTOS.todos().catch(()=>[]).then(fs=>{
  baixaArq('lucra-backup.json',JSON.stringify(fs&&fs.length?Object.assign({},S,{fotos:fs}):S),'application/json');
  UI.backupEm=hojeISO(); salvarUI(); toast('Backup baixado') }) }
function lembreteBackup(el){
  if(tela!=='painel'||S.vendas.length<3)return;
  const d=UI.backupEm?diasEntre(UI.backupEm,hojeISO()):-1; if(d>=0&&d<7)return;
  el.insertAdjacentHTML('beforeend',`<div class="sec"><div class="nota bk"><span>Seus dados ficam só neste aparelho.
    ${d<0?'Você ainda não fez nenhum backup.':`O último backup foi há <b>${d} dias</b>.`}</span>
    <button class="btn sm soft" id="bk-ja">${ic('download',16)}Baixar backup</button></div></div>`);
  $('#bk-ja').onclick=()=>exportarBackup().then(render);
}

/* ── registro rápido: o atendimento do dia em poucos toques, de qualquer tela ── */
let rapForma='pix';
function servMaisUsado(){ const m={}; S.vendas.slice(-40).forEach(v=>m[v.servicoId]=(m[v.servicoId]||0)+1);
  return S.servicos.slice().sort((a,b)=>(m[b.id]||0)-(m[a.id]||0))[0] }
function registroRapido(){
  if(!S.servicos.length)return ir('servicos');
  const s0=servMaisUsado(), cs=S.clientes.slice().sort((a,b)=>a.nome.localeCompare(b.nome));
  if(!FORMAS.some(f=>f.k===rapForma))rapForma=FORMAS[0].k;
  abrirSheet('Valor do atendimento','Hoje, '+dataBR(hojeISO()),
    `<div class="field"><label>Procedimento</label><select id="r-serv">${S.servicos.map(s=>
        `<option value="${s.id}" ${s.id===s0.id?'selected':''}>${esc(s.nome)}</option>`).join('')}</select></div>
     <div class="grid2">
       <div class="field"><label>Valor cobrado</label><input id="r-valor" inputmode="decimal" value="${String(s0.preco).replace('.',',')}"></div>
       <div class="field"><label>Cliente (opcional)</label><select id="r-cli"><option value="">Sem cadastro</option>
         ${cs.map(c=>`<option value="${c.id}">${esc(c.nome)}</option>`).join('')}</select></div></div>
     <label id="r-lf">Como pagou</label>
     <div class="chips" role="group" aria-labelledby="r-lf" style="margin:0 0 12px">${FORMAS.map(f=>
       `<button class="chip" data-rf="${f.k}" aria-pressed="${f.k===rapForma}">${f.n}</button>`).join('')}</div>
     <div class="field" id="r-boxparc" hidden><label>Parcelas</label><select id="r-parc">${Array.from({length:11},(_,i)=>i+2).map(n=>`<option value="${n}">${n}x</option>`).join('')}</select></div>
     ${modOn('equipe')?campoProf('r-prof',''):''}
     <div class="rap-sobra" id="r-sobra" aria-live="polite"></div>
     <button class="btn pri full lg" id="r-ok" style="margin-top:12px">${ic('check')}Registrar</button>
     <button class="btn-tx" id="r-mais" style="display:block;margin:6px auto 0">Pacote, outra data ou atendimento em domicílio</button>`,
    fechar=>{
      const rs=$('#r-serv'), rv=$('#r-valor'), rp=$('#r-parc');
      const dados=()=>({servicoId:rs.value,valor:num(rv.value),forma:rapForma,parcelas:rapForma==='parc'?parseInt(rp.value)||2:1,sessoes:1,desloc:0});
      const pinta=()=>{ $('#r-boxparc').hidden=rapForma!=='parc'; const k=conta(dados());
        $('#r-sobra').innerHTML=`<span>Sobra para você</span><b class="${k.lucro>=0?'v-ok':'v-bad'}">${brl(k.lucro)}</b>` };
      rs.onchange=()=>{ const s=serv(rs.value); if(s)rv.value=String(s.preco).replace('.',','); pinta() };
      rv.addEventListener('input',pinta); rp.onchange=pinta;
      document.querySelectorAll('[data-rf]').forEach(b=>b.onclick=()=>{ rapForma=b.dataset.rf;
        document.querySelectorAll('[data-rf]').forEach(z=>z.setAttribute('aria-pressed',String(z===b))); pinta() });
      $('#r-mais').onclick=()=>{ fechar(); dobra['vendas:Registrar atendimento']=true; ir('vendas') };
      $('#r-ok').onclick=()=>{ const d=dados(); if(d.valor<=0)return toast('Informe o valor cobrado');
        const cid=$('#r-cli').value, lucro=conta(d).lucro;
        S.vendas.push(Object.assign({id:uid(),usadas:[],data:hojeISO(),profId:$('#r-prof')?$('#r-prof').value:'',
          clienteId:cid,cliente:cid?(cli(cid)||{}).nome:''},d));
        mesSel=mesAtual(); salvar(); fechar(); toast('Registrado · sobra '+brl(lucro)); render() };
      pinta();
    });
}
function fab(){
  let b=$('#fab');
  if(!b){ b=document.createElement('button'); b.id='fab'; b.className='fab'; b.setAttribute('aria-label','Valor do atendimento');
    b.innerHTML=ic('plus',26)+'<span>Registrar</span>'; b.onclick=registroRapido; document.body.appendChild(b) }
  b.hidden=!S.servicos.length||tela==='ajustes';
}
function posRender(el){ dobrar(el); lembreteBackup(el); fab() }

