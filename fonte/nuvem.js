/* ══════════ NUVEM: conta, clínica, equipe e sincronização (Supabase) ══════════
   Sem biblioteca: o app conversa com o Supabase por fetch.
   Aberto como arquivo (file://) ou com ?local, o Lucra continua funcionando só no aparelho, como antes. */
const SB_URL='https://eilpdeyqrhtpfbrqjlqt.supabase.co', SB_KEY='sb_publishable_rhlQds-nbHwxNNHhz3qtIg_ENuHR4Bp';
const NUVEM=(()=>{ try{ const q=new URLSearchParams(location.search); if(q.has('local'))return false; return location.protocol==='https:'||q.has('nuvem') }catch(e){ return false } })();
const CLINICO=['anamneses','prontuario','evolucoes'];          /* dados de saúde: ficam numa tabela que a recepção não lê */
const K_SES='lucra:sessao', K_CONTA='lucra:conta';
let SES=null, CONTA=null, BASE={}, syncEst='', syncFila=null, syncRodando=false, renderPendente=false;
const lerJ=k=>{ try{ return JSON.parse(localStorage.getItem(k)||'null') }catch(e){ return null } };
const gravarJ=(k,v)=>{ try{ v==null?localStorage.removeItem(k):localStorage.setItem(k,JSON.stringify(v)) }catch(e){} };
const OLHO=['<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.5 12s3.500-6.500 9.500-6.500S21.500 12 21.500 12 18 18.500 12 18.500 2.500 12 2.500 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4l16 16"/><path d="M10.600 6.100A9.700 9.700 0 0 1 12 6c6 0 9.500 6 9.500 6a16.600 16.600 0 0 1-2.900 3.600M6.600 7.700C4 9.400 2.500 12 2.500 12S6 18 12 18c1.700 0 3.200-.4 4.500-1.100"/><path d="M9.900 9.900a3 3 0 0 0 4.200 4.200"/></svg>'];
const SITE=()=>location.origin+location.pathname;
function podeClinico(){ return !CONTA||CONTA.papel!=='recepcao' }
function ehDono(){ return !CONTA||CONTA.papel==='dono' }

/* ── conversa com o servidor ── */
async function sb(caminho,{metodo='GET',corpo,auth=true}={}){
  const h={apikey:SB_KEY,'Content-Type':'application/json'};
  if(auth&&SES)h.Authorization='Bearer '+SES.access_token;
  let r;
  try{ r=await fetch(SB_URL+caminho,{method:metodo,headers:h,body:corpo==null?undefined:JSON.stringify(corpo)}) }
  catch(e){ const x=new Error('sem_internet'); x.rede=true; throw x }
  const t=await r.text(); let d=null; try{ d=t?JSON.parse(t):null }catch(e){ d=t }
  if(!r.ok){ const x=new Error((d&&(d.msg||d.message||d.error_description||d.error_code||d.error))||('erro '+r.status)); x.status=r.status; x.dados=d; throw x }
  return d;
}
function guardaSessao(d){
  if(!d||!d.access_token)return;
  SES={access_token:d.access_token,refresh_token:d.refresh_token,
    expires_at:d.expires_at?+d.expires_at:Math.floor(Date.now()/1000)+(+d.expires_in||3600),
    user:{id:(d.user||{}).id||(SES&&SES.user.id),email:(d.user||{}).email||(SES&&SES.user.email)}};
  gravarJ(K_SES,SES);
}
async function garanteToken(){
  if(!SES)throw Object.assign(new Error('sem_login'),{status:401});
  if(Date.now()/1000<SES.expires_at-90)return;
  try{ guardaSessao(await sb('/auth/v1/token?grant_type=refresh_token',{metodo:'POST',corpo:{refresh_token:SES.refresh_token},auth:false})) }
  catch(e){ if(!e.rede){ e.status=401 } throw e }
}
async function api(c,o){ await garanteToken(); return sb(c,o) }
const rpc=(n,a)=>api('/rest/v1/rpc/'+n,{metodo:'POST',corpo:a||{}});
function msgErro(e){
  const m=String(e&&e.message||'');
  if(e&&e.rede)return 'Sem conexão com a internet. Confira e tente de novo.';
  if(/Invalid login/i.test(m))return 'E-mail ou senha não conferem.';
  if(/not confirmed/i.test(m))return 'Falta confirmar o e-mail: abra o link que enviamos para você.';
  if(/already registered|already been registered|user_already_exists/i.test(m))return 'Já existe uma conta com esse e-mail. Entre com a sua senha.';
  if(/at least 6|weak_password|Password should/i.test(m))return 'A senha precisa ter pelo menos 6 caracteres.';
  if(/rate limit|over_email_send_rate/i.test(m))return 'O servidor atingiu o limite de e-mails por hora. Tente de novo mais tarde.';
  if(/valid email|email_address_invalid|invalid format/i.test(m))return 'Esse e-mail não parece válido.';
  if(/ja_tem_clinica/.test(m))return 'Esta conta já faz parte de uma clínica.';
  if(/so_dono/.test(m))return 'Só o dono da clínica pode fazer isso.';
  if(/otp_expired|expired/i.test(m))return 'O link expirou. Peça um novo.';
  return 'Não deu certo agora ('+m+'). Tente de novo.';
}

/* ── porta de entrada: entrar, criar conta, esqueci a senha ── */
function porta(modo,aviso,extra){
  modo=modo||'entrar';
  let p=$('#porta'); if(!p){ p=document.createElement('div'); p.id='porta'; p.className='porta'; p.setAttribute('role','dialog'); p.setAttribute('aria-modal','true'); document.body.appendChild(p) }
  document.body.classList.add('porta-on');
  const e=(extra&&extra.email)||(lerJ('lucra:ultimo-email')||'');
  const cab=(t,s)=>`<div class="pt-marca">${MARCA||''}<b>Lucra</b></div><h1>${t}</h1>${s?`<p class="sub">${s}</p>`:''}${aviso?`<div class="pt-aviso" role="alert">${esc(aviso)}</div>`:''}`;
  const campo=(id,rot,tipo,val,ac,ph)=>`<div class="field"><label for="${id}">${rot}</label>${tipo==='password'
    ?`<div class="pt-senha"><input id="${id}" type="password" value="" autocomplete="${ac}" ${ph?`placeholder="${ph}"`:''}><button type="button" class="pt-olho" data-olho="${id}" aria-label="Mostrar senha" aria-pressed="false">${OLHO[0]}</button></div>`
    :`<input id="${id}" type="${tipo}" value="${esc(val||'')}" autocomplete="${ac}" ${ph?`placeholder="${ph}"`:''}>`}</div>`;
  let h='';
  if(modo==='entrar')h=cab('Entrar','O financeiro da clínica em qualquer aparelho')+
    `<form id="pt-f" novalidate>${campo('pt-email','E-mail','email',e,'email')}${campo('pt-senha','Senha','password','','current-password')}
      <button class="btn pri full" id="pt-ok">Entrar</button></form>
     <div class="pt-links"><button class="lnk" data-pt="esqueci">Esqueci a senha</button><button class="lnk" data-pt="criar">Criar conta</button></div>`;
  else if(modo==='criar')h=cab('Criar conta','Se você recebeu um convite da sua clínica, use o mesmo e-mail do convite.')+
    `<form id="pt-f" novalidate>${campo('pt-nome','Seu nome','text',(extra&&extra.nome)||'','name')}${campo('pt-email','E-mail','email',e,'email')}
      ${campo('pt-senha','Crie uma senha','password','','new-password','pelo menos 6 caracteres')}
      <button class="btn pri full" id="pt-ok">Criar conta</button></form>
     <div class="pt-links"><button class="lnk" data-pt="entrar">Já tenho conta</button></div>`;
  else if(modo==='esqueci')h=cab('Esqueci a senha','Mandamos um link para você criar uma senha nova.')+
    `<form id="pt-f" novalidate>${campo('pt-email','E-mail','email',e,'email')}<button class="btn pri full" id="pt-ok">Enviar link</button></form>
     <div class="pt-links"><button class="lnk" data-pt="entrar">Voltar</button></div>`;
  else if(modo==='nova')h=cab('Nova senha','Escolha a senha que você vai usar daqui para frente.')+
    `<form id="pt-f" novalidate>${campo('pt-senha','Nova senha','password','','new-password','pelo menos 6 caracteres')}<button class="btn pri full" id="pt-ok">Salvar senha</button></form>`;
  else if(modo==='confira')h=cab('Confira o seu e-mail',`Enviamos um link para <b>${esc(e)}</b>. Abra o e-mail, toque no link e você volta para cá já com a conta ativa.`)+
    `<p class="sub" style="margin-top:10px">Não chegou? Veja a caixa de spam ou promoções.</p>
     <div class="pt-links"><button class="lnk" data-pt="entrar">Já confirmei, quero entrar</button></div>`;
  else if(modo==='carregando')h=`<div class="pt-marca">${MARCA||''}<b>Lucra</b></div><p class="sub pt-carr" aria-live="polite">${esc(aviso||'Abrindo a sua clínica…')}</p>`;
  p.innerHTML=`<div class="pt-caixa">${h}</div>`;
  p.querySelectorAll('[data-olho]').forEach(b=>b.onclick=()=>{ const i=$('#'+b.dataset.olho), ver=i.type==='password';
    i.type=ver?'text':'password'; b.setAttribute('aria-pressed',String(ver)); b.setAttribute('aria-label',ver?'Esconder senha':'Mostrar senha'); b.innerHTML=OLHO[ver?1:0]; i.focus() });
  p.querySelectorAll('[data-pt]').forEach(b=>b.onclick=ev=>{ ev.preventDefault(); const em=$('#pt-email'); porta(b.dataset.pt,'',{email:em?em.value.trim():e}) });
  const f=$('#pt-f'); if(!f)return;
  const ok=$('#pt-ok'), ocupado=s=>{ ok.disabled=s; ok.textContent=s?'Um instante…':ok.dataset.tx||ok.textContent };
  ok.dataset.tx=ok.textContent;
  f.onsubmit=async ev=>{ ev.preventDefault();
    const em=$('#pt-email')?$('#pt-email').value.trim().toLowerCase():'', se=$('#pt-senha')?$('#pt-senha').value:'';
    const nm=$('#pt-nome')?$('#pt-nome').value:'';
    if($('#pt-email')&&!/^\S+@\S+\.\S+$/.test(em))return porta(modo,'Digite um e-mail válido.',{email:em,nome:nm});
    if($('#pt-senha')&&se.length<6)return porta(modo,'A senha precisa ter pelo menos 6 caracteres.',{email:em,nome:nm});
    if(em)gravarJ('lucra:ultimo-email',em);
    ocupado(true);
    try{
      if(modo==='entrar'){ guardaSessao(await sb('/auth/v1/token?grant_type=password',{metodo:'POST',corpo:{email:em,password:se},auth:false})); return entrar() }
      if(modo==='criar'){ const nome=$('#pt-nome').value.trim();
        const d=await sb('/auth/v1/signup?redirect_to='+encodeURIComponent(SITE()),{metodo:'POST',corpo:{email:em,password:se,data:{nome}},auth:false});
        gravarJ('lucra:nome-novo',nome);
        if(d&&d.access_token){ guardaSessao(d); return entrar() }
        return porta('confira','',{email:em}) }
      if(modo==='esqueci'){ await sb('/auth/v1/recover?redirect_to='+encodeURIComponent(SITE()),{metodo:'POST',corpo:{email:em},auth:false});
        return porta('entrar','Se esse e-mail tem conta, o link para criar uma senha nova já está a caminho.',{email:em}) }
      if(modo==='nova'){ await api('/auth/v1/user',{metodo:'PUT',corpo:{password:se}}); toast('Senha nova salva'); return entrar() }
    }catch(err){ porta(modo,msgErro(err),{email:em,nome:nm}) }
  };
  const pri=p.querySelector('input'); if(pri&&!pri.value)setTimeout(()=>pri.focus(),60);
}
function fechaPorta(){ const p=$('#porta'); if(p)p.remove(); document.body.classList.remove('porta-on') }

/* ── primeira entrada: criar a clínica (quem foi convidado pula isso) ── */
function dadosDoAparelho(a){
  try{ const k=(UI.chaves||{})[a]; const d=k&&JSON.parse(localStorage.getItem(k)||'null');
    if(d&&((d.vendas||[]).length||(d.clientes||[]).length||(d.servicos||[]).length))return d }catch(e){}
  return null;
}
function criarClinica(aviso){
  let p=$('#porta'); if(!p){ porta('carregando'); p=$('#porta') }
  document.body.classList.add('porta-on');
  let ar=AREAS_OK.includes(UI.area)?UI.area:'';
  const pinta=()=>{ const loc=ar&&dadosDoAparelho(ar);
    p.innerHTML=`<div class="pt-caixa"><div class="pt-marca">${MARCA||''}<b>Lucra</b></div>
      <h1>Sua clínica</h1><p class="sub">Você é o dono desta conta. Depois dá para chamar a sua equipe.</p>
      ${aviso?`<div class="pt-aviso" role="alert">${esc(aviso)}</div>`:''}
      <div class="field"><label for="cc-nome">Nome do consultório ou clínica</label><input id="cc-nome" value="${esc(UI.clinica||'')}" placeholder="ex.: Studio Bella"></div>
      <div class="field"><label for="cc-voce">Seu nome</label><input id="cc-voce" value="${esc(lerJ('lucra:nome-novo')||'')}"></div>
      <p class="pt-lb" id="cc-al">Área de atendimento</p>
      <div class="areas" role="group" aria-labelledby="cc-al">${Object.keys(AREAS).map(k=>
        `<button type="button" class="area-op" data-livre data-cc="${k}" aria-pressed="${ar===k}" style="--c:${AREAS[k].cor}"><i></i><b>${AREAS[k].n}</b><small>${AREAS[k].d}</small></button>`).join('')}</div>
      <p class="sub" style="margin-top:8px">A área fica fixa nesta conta.</p>
      ${loc?`<label class="pt-chk"><input type="checkbox" id="cc-levar" checked> Levar o que já está neste aparelho (${(loc.clientes||[]).length} cliente(s), ${(loc.vendas||[]).length} lançamento(s))</label>`:''}
      <button class="btn pri full" id="cc-ok" style="margin-top:14px">Criar minha clínica</button>
      <div class="pt-links"><button class="lnk" id="cc-sair">Entrar com outra conta</button></div></div>`;
    p.querySelectorAll('[data-cc]').forEach(b=>b.onclick=()=>{ UI.clinica=$('#cc-nome').value; gravarJ('lucra:nome-novo',$('#cc-voce').value); ar=b.dataset.cc; pinta() });
    $('#cc-sair').onclick=()=>sairDaConta(true);
    $('#cc-ok').onclick=async()=>{
      const nome=$('#cc-nome').value.trim(), voce=$('#cc-voce').value.trim();
      if(!ar){ aviso='Escolha a área de atendimento.'; UI.clinica=nome; return pinta() }
      const levar=$('#cc-levar')&&$('#cc-levar').checked?dadosDoAparelho(ar):null;
      $('#cc-ok').disabled=true; $('#cc-ok').textContent='Criando…';
      try{ await rpc('criar_clinica',{p_nome:nome,p_area:ar,p_pessoa:voce}); gravarJ('lucra:nome-novo',null); entrar({importar:levar}) }
      catch(err){ aviso=msgErro(err); pinta() }
    };
  };
  pinta();
}

/* ── entrar: descobre a clínica e o papel; sem internet usa o que ficou guardado ── */
let depoisDeEntrar=()=>{};
async function entrar(op){
  op=op||{}; porta('carregando');
  let conta=null;
  try{
    await rpc('aceitar_convites');
    const ms=await api(`/rest/v1/membros?select=clinica_id,papel,nome,email&user_id=eq.${SES.user.id}`);
    const m=(ms||[])[0];
    if(!m)return criarClinica();
    const c=((await api(`/rest/v1/clinicas?select=id,nome,area&id=eq.${m.clinica_id}`))||[])[0];
    if(!c)return criarClinica();
    conta={cid:c.id,area:c.area,clinica:c.nome,papel:m.papel,nome:m.nome,email:SES.user.email,uid:SES.user.id};
    gravarJ(K_CONTA,conta);
  }catch(e){
    if(e.status===401){ sairDaConta(true,'A sessão expirou. Entre de novo.'); return }
    const cache=lerJ(K_CONTA);
    if(e.rede&&cache&&cache.uid===(SES.user||{}).id){ conta=cache; syncEst='off' }
    else return porta('entrar',msgErro(e));
  }
  ativar(conta,op);
}
function ativar(conta,op){
  CONTA=conta;
  document.body.classList.add('nuvem','papel-'+CONTA.papel);
  UI.area=CONTA.area; UI.clinica=CONTA.clinica||''; if(!ehDono())UI.boasVindas=true;
  CHAVE='lucra:nuvem:'+CONTA.cid;
  const t=S.tema;
  S=JSON.parse(JSON.stringify(PAD));
  if(op&&op.importar){ Object.assign(S,JSON.parse(JSON.stringify(op.importar))); normalizar(); salvarLocal(); BASE={} }
  else { carregar(); BASE=lerJ(CHAVE+':base')||{} }
  if(!podeClinico())CLINICO.forEach(k=>S[k]=[]);
  S.area=CONTA.area; S.tema=S.tema||t;
  salvarUI(); tema(); aparencia(); aplicaNav(); marca(); aplicarPapel();
  fechaPorta(); mesSel=mesAtual();
  if(!permitido(tela))tela=telaInicial(); marcaMenu(tela);
  depoisDeEntrar(); depoisDeEntrar=()=>render();
  pintaSync(); sincronizar();
}

/* ── sincronização: junta as mudanças daqui com as da equipe ── */
const canon=v=>Array.isArray(v)?'['+v.map(canon).join(',')+']'
  :v&&typeof v==='object'?'{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+canon(v[k])).join(',')+'}':JSON.stringify(v===undefined?null:v);
const igual=(a,b)=>canon(a)===canon(b);
const chaveItem=x=>x&&typeof x==='object'&&!Array.isArray(x)?(x.id!=null?'i:'+x.id:x.clienteId!=null?'c:'+x.clienteId:null):null;
function mergeLista(b,l,r){
  const mapa=a=>new Map(a.map(x=>[chaveItem(x),x])), mb=mapa(b), ml=mapa(l), mr=mapa(r);
  const ordem=[...new Set([...r.map(chaveItem),...l.map(chaveItem)])], res=[];
  ordem.forEach(k=>{ const xb=mb.get(k), xl=ml.get(k), xr=mr.get(k);
    const v=igual(xl,xb)?xr:igual(xr,xb)?xl:(xl!==undefined?xl:xr);   /* os dois mexeram: vale o daqui */
    if(v!==undefined)res.push(v) });
  return res;
}
function merge3(b,l,r){
  b=b||{}; l=l||{}; r=r||{}; const out={};
  new Set([...Object.keys(l),...Object.keys(r)]).forEach(k=>{
    const vb=b[k], vl=l[k], vr=r[k]; let v;
    if(Array.isArray(vl)&&Array.isArray(vr)&&vl.concat(vr).every(chaveItem))v=mergeLista(Array.isArray(vb)?vb:[],vl,vr);
    else v=igual(vl,vb)?vr:vl;
    if(v!==undefined)out[k]=v });
  return out;
}
function parteDe(obj,p){ const o={};
  Object.keys(obj).forEach(k=>{ if(k==='tema'||k==='area')return; if(CLINICO.includes(k)===(p==='clinico'))o[k]=obj[k] });
  return JSON.parse(JSON.stringify(o)) }
const partes=()=>podeClinico()?['dados','clinico']:['dados'];
function aplicaParte(p,estado){
  const t=S.tema;
  Object.keys(parteDe(S,p)).forEach(k=>{ if(!(k in estado))delete S[k] });
  Object.assign(S,JSON.parse(JSON.stringify(estado)));
  S.tema=t; S.area=CONTA.area; normalizar(); salvarLocal(); renderSeguro();
}
const pendente=()=>CONTA&&partes().some(p=>!igual(parteDe(S,p),(BASE[p]||{estado:{}}).estado));
async function sincParte(p,tent){
  const cid=CONTA.cid, rem=((await api(`/rest/v1/${p}?select=estado,versao&clinica_id=eq.${cid}`))||[])[0];
  if(!rem||!CONTA||CONTA.cid!==cid)return;
  const base=BASE[p]||{estado:{},versao:-1}, local=parteDe(S,p);
  let fim=local;
  if(base.versao<0){
    /* aparelho sem histórico (acabou de entrar): o que está na nuvem manda. Os valores padrão daqui não são mudanças de ninguém */
    if(rem.versao>0){ fim=JSON.parse(JSON.stringify(rem.estado||{})); aplicaParte(p,fim) }
  }else if(rem.versao!==base.versao){ fim=merge3(base.estado,local,rem.estado||{}); if(!igual(fim,local))aplicaParte(p,fim) }
  BASE[p]={estado:rem.estado||{},versao:rem.versao}; gravarJ(CHAVE+':base',BASE);
  if(igual(fim,rem.estado||{}))return;
  try{ const nova=await rpc('salvar',{p_cid:cid,p_parte:p,p_estado:fim,p_versao:rem.versao});
    BASE[p]={estado:fim,versao:+nova}; gravarJ(CHAVE+':base',BASE) }
  catch(e){ if(/conflito/.test(e.message)&&(tent||0)<3)return sincParte(p,(tent||0)+1); throw e }
}
async function sincronizar(){
  if(!CONTA||!SES)return;
  if(syncRodando){ syncFila=true; return }
  syncRodando=true; syncEst='indo'; pintaSync();
  try{ if(ehDono()&&UI.clinica!==CONTA.clinica){
      await api(`/rest/v1/clinicas?id=eq.${CONTA.cid}`,{metodo:'PATCH',corpo:{nome:UI.clinica}}); CONTA.clinica=UI.clinica; gravarJ(K_CONTA,CONTA) }
    for(const p of partes())await sincParte(p);
    syncEst='ok' }
  catch(e){ syncEst=e.rede?'off':'erro'; if(e.status===401)sairDaConta(true,'A sessão expirou. Entre de novo.') }
  syncRodando=false; pintaSync();
  if(syncFila){ syncFila=null; sincronizar() }
}
let tSync=null;
function agendaSync(){ clearTimeout(tSync); syncEst=syncEst==='off'?'off':'espera'; pintaSync(); tSync=setTimeout(sincronizar,1200) }
function renderSeguro(){
  const at=document.activeElement;
  if(document.querySelector('.sheet-bg')||document.querySelector('.ob')||document.querySelector('#porta')||(at&&/^(INPUT|TEXTAREA|SELECT)$/.test(at.tagName))){ renderPendente=true; return }
  renderPendente=false; render();
}
setInterval(()=>{ if(renderPendente)renderSeguro() },2500);
setInterval(()=>{ if(CONTA&&!document.hidden)sincronizar() },30000);
addEventListener('online',()=>{ if(CONTA)sincronizar() });
document.addEventListener('visibilitychange',()=>{ if(CONTA&&!document.hidden)sincronizar() });
function pintaSync(){
  let s=$('#sync-st');
  if(!CONTA){ if(s)s.remove(); return }
  if(!s){ const l=$('.logo-tx'); if(!l)return; s=document.createElement('span'); s.id='sync-st'; s.setAttribute('role','status'); l.appendChild(s) }
  const m={ok:['ok','Salvo na nuvem'],indo:['indo','Sincronizando…'],espera:['indo','Salvando…'],off:['off','Sem internet · salvo neste aparelho'],erro:['erro','Não sincronizou · tento de novo']}[syncEst]||['indo','Conectando…'];
  s.className='sync '+m[0]; s.textContent=m[1];
}
/* salvar de sempre grava no aparelho; com conta, também manda para a nuvem */
const salvarLocal=salvar;
salvar=function(){ salvarLocal(); if(CONTA)agendaSync() };

/* ── papéis: o que cada um vê ── */
const NAV_PAPEL={
  profissional:['novoag','agenda','retornos','clientes','registrar','ajustes'],
  recepcao:['novoag','agenda','retornos','clientes','caixa','registrar','saida','ajustes']};
const EXTRA_PAPEL={profissional:[],recepcao:[]};
function permitido(t){ if(!CONTA||CONTA.papel==='dono')return true; return NAV_PAPEL[CONTA.papel].includes(t)||EXTRA_PAPEL[CONTA.papel].includes(t) }
const telaInicial=()=>!CONTA||CONTA.papel==='dono'?'painel':'agenda';
function aplicarPapel(){
  const ul=document.querySelectorAll('#menu ul');
  document.querySelectorAll('#menu button[data-t]').forEach(b=>{ const li=b.closest('li'); if(li)li.hidden=!permitido(b.dataset.t) });
  ul.forEach(u=>{ let grupo=null, vis=false; [...u.children].forEach(li=>{ if(li.classList.contains('nav-grupo')){ if(grupo)grupo.hidden=!vis; grupo=li; vis=false } else if(!li.hidden)vis=true }); if(grupo)grupo.hidden=!vis });
  const u=$('#menu button[data-t=usuarios]'); if(u)u.closest('li').hidden=!(CONTA&&CONTA.papel==='dono');
  const r=$('#b-reg'); if(r)r.hidden=!permitido('registrar');
}
const _irN=ir;
ir=function(t){ if(CONTA&&!permitido(t)&&t!=='usuarios'){ toast('Essa tela é só para o dono da clínica'); t=telaInicial() } if(t==='usuarios'&&!(CONTA&&CONTA.papel==='dono'))t=telaInicial(); _irN(t) };

/* ── sair de verdade ── */
function sairDaConta(sem,aviso){
  const fazer=()=>{ const cid=CONTA&&CONTA.cid;
    if(SES)sb('/auth/v1/logout',{metodo:'POST'}).catch(()=>{});
    if(cid){ try{ localStorage.removeItem('lucra:nuvem:'+cid); localStorage.removeItem('lucra:nuvem:'+cid+':base') }catch(e){} }
    gravarJ(K_SES,null); gravarJ(K_CONTA,null); SES=null; CONTA=null; BASE={};
    document.body.classList.remove('nuvem','papel-dono','papel-profissional','papel-recepcao'); pintaSync();
    S=JSON.parse(JSON.stringify(PAD)); $('#view').innerHTML='';
    porta('entrar',aviso||'') };
  if(sem)return fazer();
  if(pendente())return confirmar('Ainda tem coisa para enviar','O que você lançou por último ainda não chegou na nuvem. Conecte à internet e espere aparecer "Salvo na nuvem". Se sair agora, isso se perde.','Sair mesmo assim',fazer);
  confirmar('Sair da conta?','Para entrar de novo, use o seu e-mail e senha.','Sair',fazer);
}
const _sairVelho=sair;
sair=function(){ if(CONTA)return sairDaConta(); _sairVelho() };

/* ── Usuários e acessos (só o dono) ── */
const PAPEL_N={dono:'Dono',profissional:'Profissional',recepcao:'Recepção'};
const PAPEL_D={profissional:'Agenda, pacientes, prontuário e anotações. Não vê o lucro.',recepcao:'Agenda, cadastro, caixa e WhatsApp. Não vê prontuário nem lucro.'};
T.usuarios=function(el){
  el.innerHTML=`<h1>Usuários e acessos</h1><p class="sub">Quem da sua equipe entra no Lucra e o que cada um vê</p><div id="us-corpo"><div class="sk sk-l"></div><div class="sk sk-l"></div></div>`;
  if(!CONTA)return;
  Promise.all([api(`/rest/v1/membros?select=user_id,papel,nome,email&clinica_id=eq.${CONTA.cid}&order=criado_em`),api(`/rest/v1/convites?select=id,email,papel&clinica_id=eq.${CONTA.cid}&order=criado_em`)])
  .then(([ms,cv])=>{ if(tela!=='usuarios')return; const b=$('#us-corpo'); if(!b)return;
    let papelNovo='recepcao';
    b.innerHTML=`<div class="sec"><div class="sec-top"><h2>Equipe</h2><span class="pill">${ms.length}</span></div><div class="card">${ms.map(m=>`<div class="item"><div class="mn"><b>${esc(m.nome||m.email)}${m.user_id===CONTA.uid?' (você)':''}</b><small>${esc(m.email)}</small></div>
        ${m.papel==='dono'?`<span class="pill">Dono</span>`:`<div class="acts"><select data-us-p="${m.user_id}" aria-label="Papel de ${esc(m.nome||m.email)}">${['profissional','recepcao'].map(p=>`<option value="${p}" ${p===m.papel?'selected':''}>${PAPEL_N[p]}</option>`).join('')}</select>
          <button class="btn danger ic" data-us-x="${m.user_id}" aria-label="Tirar ${esc(m.nome||m.email)} da clínica">${ic('trash',18)}</button></div>`}</div>`).join('')}</div></div>
      <div class="sec"><div class="card"><h2 style="margin-bottom:4px">Chamar alguém</h2><p class="sub" style="margin-bottom:12px">A pessoa cria a conta no Lucra com este e-mail e já entra na sua clínica.</p>
        <div class="field"><label for="us-email">E-mail da pessoa</label><input id="us-email" type="email" autocomplete="off" placeholder="nome@email.com"></div>
        <div class="chips" role="group" aria-label="Papel">${['recepcao','profissional'].map(p=>`<button class="chip" data-us-n="${p}" aria-pressed="${p===papelNovo}">${PAPEL_N[p]}</button>`).join('')}</div>
        <p class="sub" id="us-desc" style="margin:8px 0 12px">${PAPEL_D[papelNovo]}</p>
        <button class="btn pri" id="us-conv">${ic('plus')}Convidar</button></div></div>
      ${cv.length?`<div class="sec"><div class="sec-top"><h2>Convites esperando</h2></div><div class="card">${cv.map(c=>`<div class="item"><div class="mn"><b>${esc(c.email)}</b><small>${PAPEL_N[c.papel]} · ainda não criou a conta</small></div>
        <div class="acts"><button class="btn sm soft" data-us-zap="${esc(c.email)}">${ic('chat',16)}Mandar o link</button><button class="btn ic soft" data-us-c="${c.id}" aria-label="Cancelar convite de ${esc(c.email)}">${ic('x',18)}</button></div></div>`).join('')}</div></div>`:''}`;
    b.querySelectorAll('[data-us-n]').forEach(x=>x.onclick=()=>{ papelNovo=x.dataset.usN; b.querySelectorAll('[data-us-n]').forEach(y=>y.setAttribute('aria-pressed',String(y===x))); $('#us-desc').textContent=PAPEL_D[papelNovo] });
    $('#us-conv').onclick=async()=>{ const em=$('#us-email').value.trim().toLowerCase();
      if(!/^\S+@\S+\.\S+$/.test(em))return toast('Digite um e-mail válido');
      try{ await rpc('convidar',{p_cid:CONTA.cid,p_email:em,p_papel:papelNovo}); toast('Convite criado'); render(); setTimeout(()=>linkConvite(em),300) }catch(e){ toast(msgErro(e)) } };
    b.querySelectorAll('[data-us-zap]').forEach(x=>x.onclick=()=>linkConvite(x.dataset.usZap));
    b.querySelectorAll('[data-us-c]').forEach(x=>x.onclick=()=>confirmar('Cancelar o convite?','A pessoa não vai conseguir entrar na clínica com esse e-mail.','Cancelar convite',async()=>{ try{ await rpc('cancelar_convite',{p_id:x.dataset.usC}); render() }catch(e){ toast(msgErro(e)) } }));
    b.querySelectorAll('[data-us-p]').forEach(x=>x.onchange=async()=>{ try{ await rpc('mudar_papel',{p_cid:CONTA.cid,p_user:x.dataset.usP,p_papel:x.value}); toast('Papel trocado') }catch(e){ toast(msgErro(e)); render() } });
    b.querySelectorAll('[data-us-x]').forEach(x=>x.onclick=()=>confirmar('Tirar da clínica?','A pessoa perde o acesso aos dados da clínica na hora.','Tirar',async()=>{ try{ await rpc('remover_membro',{p_cid:CONTA.cid,p_user:x.dataset.usX}); render() }catch(e){ toast(msgErro(e)) } }));
  }).catch(e=>{ const b=$('#us-corpo'); if(b)b.innerHTML=`<div class="card"><div class="vazio"><b>Não consegui abrir a equipe</b><p>${esc(msgErro(e))}</p></div></div>` });
};
function linkConvite(email){
  const tx=`Oi! Te chamei para usar o Lucra${CONTA&&CONTA.clinica?' da '+CONTA.clinica:''}. Abra ${SITE()} , toque em "Criar conta" e use este e-mail: ${email}`;
  abrirSheet('Mandar o convite','A pessoa precisa criar a conta com o mesmo e-mail',
    `<textarea id="lc-tx" rows="5" style="width:100%">${esc(tx)}</textarea>
     <div class="row" style="margin-top:12px;gap:8px"><a class="btn pri" id="lc-zap" href="https://wa.me/?text=${encodeURIComponent(tx)}" target="_blank" rel="noopener">${ic('chat')}Mandar no WhatsApp</a>
       <button class="btn soft" id="lc-cp">Copiar</button></div>`,
    fechar=>{ $('#lc-tx').oninput=()=>{ $('#lc-zap').href='https://wa.me/?text='+encodeURIComponent($('#lc-tx').value) };
      $('#lc-cp').onclick=()=>{ try{ navigator.clipboard.writeText($('#lc-tx').value); toast('Copiado') }catch(e){ toast('Não deu para copiar') } } });
}

/* ── Ajustes com conta: cartão da conta no topo, área fixa, o resto só para o dono ── */
function secConta(){
  if(!CONTA)return '';
  return `<div class="sec" id="sec-conta"><div class="card"><h2 style="margin-bottom:10px">Sua conta</h2>
    <div class="ficha"><div class="fi-l"><span>E-mail</span><b>${esc(CONTA.email||'')}</b></div><div class="fi-l"><span>Clínica</span><b>${esc(CONTA.clinica||'—')}</b></div>
      <div class="fi-l"><span>Área</span><b>${AREAS[CONTA.area].n}</b></div><div class="fi-l"><span>Seu papel</span><b>${PAPEL_N[CONTA.papel]}</b></div></div>
    <div class="row" style="margin-top:12px;gap:8px">${CONTA.papel==='dono'?`<button class="btn soft" id="ct-us">${ic('user',16)}Usuários e acessos</button>`:''}
      <button class="btn soft" id="ct-senha">Trocar senha</button><button class="btn danger" id="ct-sair">Sair da conta</button></div></div></div>`;
}
const _posN=posRender;
posRender=function(el){ _posN(el);
  if(!CONTA)return;
  if(tela==='ajustes'){
    el.querySelectorAll('.areas').forEach(a=>{ const s=a.closest('.sec'); if(s)s.remove() });
    if(!ehDono()){ const fica=/^(Aparência|Instalar|WhatsApp no computador|Mensagens do WhatsApp)/;
      el.querySelectorAll(':scope > .sec').forEach(s=>{ const h=s.querySelector('h2'); if(!h||!fica.test(h.textContent.trim()))s.remove() }) }
    { const t=el.querySelector('h1'), sb=t&&t.nextElementSibling; if(sb&&sb.classList.contains('sub'))sb.textContent=ehDono()?'Conta, equipe, aparência e regras da clínica':'Sua conta, aparência e WhatsApp' }
    if(!$('#sec-conta')){ const t=el.querySelector('h1'); const sub=t&&t.nextElementSibling&&t.nextElementSibling.classList.contains('sub')?t.nextElementSibling:t; if(sub)sub.insertAdjacentHTML('afterend',secConta()) }
    if($('#ct-sair'))$('#ct-sair').onclick=()=>sairDaConta();
    if($('#ct-us'))$('#ct-us').onclick=()=>ir('usuarios');
    if($('#ct-senha'))$('#ct-senha').onclick=()=>porta('nova');
  }
};
mudaArea=(function(orig){ return function(k,semRender){ if(CONTA&&k!==CONTA.area){ toast('A área fica fixa nesta conta'); return } return orig(k,semRender) } })(mudaArea);

/* ── início: link do e-mail, sessão guardada ou porta ── */
async function nuvemIniciar(depois){
  depoisDeEntrar=depois;
  const h=location.hash.slice(1);
  if(/access_token=|error=/.test(h)){
    const q=new URLSearchParams(h); history.replaceState(null,'',location.pathname+location.search);
    if(q.get('error'))return porta('entrar',/expired/i.test(q.get('error_code')||q.get('error_description')||'')?'O link expirou. Entre com e-mail e senha ou peça outro.':'Não deu para usar esse link. Entre com e-mail e senha.');
    SES={access_token:q.get('access_token'),refresh_token:q.get('refresh_token'),expires_at:+q.get('expires_at')||Math.floor(Date.now()/1000)+(+q.get('expires_in')||3600),user:{}};
    try{ const u=await sb('/auth/v1/user'); SES.user={id:u.id,email:u.email}; gravarJ(K_SES,SES) }catch(e){ SES=null; return porta('entrar',msgErro(e)) }
    if(q.get('type')==='recovery')return porta('nova');
    return entrar();
  }
  SES=lerJ(K_SES);
  if(!SES||!SES.access_token||!SES.user||!SES.user.id){ SES=null; return porta('entrar') }
  entrar();
}

const _posAtN=posAtender;
posAtender=function(a){ if(!podeClinico())return; _posAtN(a) };
const _anotN=anotarSessao;
anotarSessao=function(){ if(!podeClinico())return toast('As anotações são só da profissional'); return _anotN.apply(this,arguments) };
