/* ══════════ LGPD E SEGURANÇA ══════════
   Política de privacidade e termos (páginas abertas), termo de ciência do paciente, exportar os dados
   de um paciente e travar a tela depois de um tempo parado. */

/* ── termo de ciência de dados (todas as áreas), com assinatura na tela ── */
TIPOS_DOC.lgpd={n:'Termo de ciência de dados (LGPD)',areas:['estetica','odonto','psico'],modelo:1};
ASSINA.push('lgpd');
MODELO_PSI.lgpd='Eu, {paciente}{cpf}, declaro estar ciente de que {clinica} guarda os meus dados pessoais e de saúde (cadastro, histórico de atendimentos, {registros}, pagamentos e documentos) para prestar o atendimento, cumprir obrigações legais e manter o registro exigido pelo conselho profissional, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).\n\nOs dados ficam guardados com acesso restrito, por senha, em serviço de nuvem, e não são vendidos nem compartilhados para fins de propaganda.\n\nSei que posso pedir a qualquer momento uma cópia dos meus dados, a correção do que estiver errado e informações sobre como eles são usados. Os registros de saúde são guardados pelo prazo mínimo que a lei e o conselho profissional exigem, mesmo depois do fim do atendimento.\n\n{autoriza_fotos}';
const _gerDocL=preencheDoc;
preencheDoc=function(t,c,extra){ return _gerDocL(t,c,extra).replace(/\{clinica\}/g,UI.clinica||(S.perfil||{}).nome||'a clínica')
  .replace(/\{registros\}/g,ehPsico()?'anotações das sessões e prontuário psicológico':area()==='odonto'?'prontuário, odontograma e fotos':'fichas de avaliação e fotos de antes e depois')
  .replace(/\{autoriza_fotos\}/g,ehPsico()?'':'Autorizo o registro de fotos para acompanhamento do tratamento. Elas não serão divulgadas sem a minha autorização por escrito.') };

/* ── exportar os dados de um paciente (direito de acesso e portabilidade) ── */
const CHAVES_PAC=['agenda','vendas','receber','evolucoes','anamneses','prontuario','documentos','planos','odontogramas','periogramas','escalas','prontPsi','lab','parcelas','guias','fotosIdx'];
function dadosDoPaciente(cid){ const c=cli(cid), o={paciente:c,exportado_em:new Date().toISOString(),clinica:UI.clinica||'',profissional:(S.perfil||{}).nome||''};
  CHAVES_PAC.forEach(k=>{ const l=(S[k]||[]).filter(x=>x&&x.clienteId===cid); if(l.length)o[k]=l }); return o }
function baixarArquivo(nome,txt,tipo){ const b=new Blob([txt],{type:tipo||'application/json'}), a=document.createElement('a');
  a.href=URL.createObjectURL(b); a.download=nome; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove() },500) }
function secLgpdFicha(cid){ if(!ehDono())return '';
  return `<div class="sec"><div class="card row" style="justify-content:space-between;gap:10px;align-items:center"><div><b>Dados de ${esc(cli(cid).nome.split(' ')[0])} (LGPD)</b><br><small class="sub">Se a pessoa pedir uma cópia de tudo o que está guardado</small></div><button class="btn sm soft" id="h-lgpd">${ic('download',16)}Baixar</button></div></div>` }
const _topoLg=topoHist, _ligaLg=ligarTopoHist;
topoHist=c=>_topoLg(c)+secLgpdFicha(c.id);
ligarTopoHist=function(id,fechar){ _ligaLg(id,fechar);
  if($('#h-lgpd'))$('#h-lgpd').onclick=()=>{ const c=cli(id), nm=c.nome.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').toLowerCase();
    baixarArquivo(`dados-${nm}-${hojeISO()}.json`,JSON.stringify(dadosDoPaciente(id),null,2)); toast('Arquivo baixado. Envie à pessoa por um canal seguro.') } };

/* ── travar a tela depois de um tempo parado (computador da recepção, celular esquecido) ── */
let travaT=0, travada=false, ocultoEm=0;
const travaMin=()=>num((UI.seg||{}).trava);
function armaTrava(){ clearTimeout(travaT); if(!travaMin()||travada||!document.body.classList.contains('nuvem'))return; travaT=setTimeout(travar,travaMin()*60000) }
['pointerdown','keydown','scroll','touchstart'].forEach(ev=>document.addEventListener(ev,()=>{ if(!travada)armaTrava() },{passive:true,capture:true}));
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ ocultoEm=Date.now() } else if(ocultoEm&&travaMin()&&Date.now()-ocultoEm>travaMin()*60000)travar(); else armaTrava() });
function travar(){ if(travada||typeof CONTA==='undefined'||!CONTA)return; travada=true;
  const d=document.createElement('div'); d.id='trava'; d.setAttribute('role','dialog'); d.setAttribute('aria-modal','true'); d.setAttribute('aria-label','Tela travada');
  d.innerHTML=`<div class="tv-c"><span class="av-ic">${ic('user',22)}</span><h2>Tela travada</h2><p class="sub">Ficou parado por ${travaMin()} min. Digite a senha de ${esc(CONTA.email||'')} para continuar.</p>
    <form id="tv-f"><div class="field pt-senha"><label for="tv-s" class="sr-only">Senha</label><input id="tv-s" type="password" autocomplete="current-password" placeholder="Senha"></div>
    <p class="pt-aviso" id="tv-e" role="alert" hidden></p><button class="btn pri full" id="tv-ok">Destravar</button></form>
    <button class="lnk" id="tv-sair" style="margin-top:10px">Sair da conta</button></div>`;
  document.body.appendChild(d); document.body.classList.add('travada'); setTimeout(()=>$('#tv-s').focus(),50);
  $('#tv-f').onsubmit=async e=>{ e.preventDefault(); const s=$('#tv-s').value; if(!s)return; const b=$('#tv-ok'); b.disabled=true;
    try{ guardaSessao(await sb('/auth/v1/token?grant_type=password',{metodo:'POST',corpo:{email:CONTA.email,password:s},auth:false})); destravar() }
    catch(er){ b.disabled=false; const t=$('#tv-e'); t.hidden=false; t.textContent=er.rede?'Sem internet. Conecte para destravar.':'Senha errada.'; $('#tv-s').select() } };
  $('#tv-sair').onclick=()=>{ destravar(); sairDaConta(true) } }
function destravar(){ travada=false; const d=$('#trava'); if(d)d.remove(); document.body.classList.remove('travada'); armaTrava() }

/* ── Ajustes: privacidade, termos e trava ── */
const SITE_PRIV=()=>SITE()+'?privacidade', SITE_TERMOS=()=>SITE()+'?termos';
const _posLg=posRender;
posRender=function(el){ _posLg(el); if(tela!=='ajustes'||$('#sec-lgpd'))return;
  const html=`<div class="sec" id="sec-lgpd"><div class="card"><h2 style="margin-bottom:10px">Privacidade e segurança</h2>
    ${document.body.classList.contains('nuvem')?`<div class="field"><label for="sg-tr">Travar a tela depois de parado</label><select id="sg-tr">${[[0,'Nunca'],[5,'5 minutos'],[15,'15 minutos'],[30,'30 minutos'],[60,'1 hora']].map(([v,n])=>`<option value="${v}" ${v===travaMin()?'selected':''}>${n}</option>`).join('')}</select></div>
      <p class="sub" style="margin:-4px 0 12px">Para destravar, pede a senha da conta. Bom para o computador da recepção.</p>`:''}
    <p class="sub" style="margin:0 0 10px">Você é responsável pelos dados dos seus pacientes. Peça a cada um o termo de ciência (fica em Documentos, na ficha) e, se alguém pedir uma cópia dos próprios dados, baixe pela ficha.</p>
    <div class="row" style="gap:8px;flex-wrap:wrap"><a class="btn sm soft" href="${SITE_PRIV()}" target="_blank" rel="noopener">Política de privacidade</a><a class="btn sm soft" href="${SITE_TERMOS()}" target="_blank" rel="noopener">Termos de uso</a></div></div></div>`;
  const ref=$('#sec-conta'); if(ref)ref.insertAdjacentHTML('afterend',html); else { const h=el.querySelector('.sub')||el.querySelector('h1'); if(h)h.insertAdjacentHTML('afterend',html) }
  if($('#sg-tr'))$('#sg-tr').onchange=()=>{ UI.seg=Object.assign({},UI.seg,{trava:+$('#sg-tr').value}); salvarUI(); armaTrava(); toast('Salvo') } };

/* ── textos das páginas abertas ── */
const TXT_PRIV=`<h1>Política de privacidade</h1><p class="sub">Lucra · gestão para clínicas e consultórios</p>
<h2>Quem é quem</h2><p>O Lucra é uma ferramenta usada por clínicas e profissionais de saúde para organizar agenda, atendimentos e finanças. A clínica ou o profissional que usa o Lucra decide quais dados guardar e para quê: é o <b>controlador</b> dos dados, nos termos da LGPD (Lei nº 13.709/2018). O Lucra apenas guarda e processa os dados em nome dela, como <b>operador</b>.</p>
<h2>Que dados ficam guardados</h2><p>Dados da conta (nome e e-mail de quem usa o app) e os dados que a clínica registra: cadastro de pacientes, agenda, atendimentos, pagamentos, anotações, prontuário, documentos e fotos. Dados de saúde são dados sensíveis e só aparecem para quem a clínica autorizou: a recepção, por exemplo, não vê prontuário nem fotos.</p>
<h2>Onde ficam</h2><p>Em servidores na nuvem, protegidos por senha e com regras de acesso por clínica e por papel. Uma cópia também fica no próprio aparelho, para o app funcionar sem internet.</p>
<h2>Para que são usados</h2><p>Só para o funcionamento do app para quem o usa. O Lucra não vende dados, não usa os dados para propaganda e não os compartilha com terceiros, exceto o serviço que os armazena na nuvem.</p>
<h2>Pacientes</h2><p>Para pedir uma cópia, correção ou informações sobre seus dados, fale com a clínica ou o profissional que atende você: é ela quem responde por eles. A clínica consegue gerar no app um arquivo com todos os seus dados.</p>
<h2>Quanto tempo</h2><p>Enquanto a clínica mantiver a conta. Registros de saúde devem ser guardados pelo prazo mínimo exigido pela lei e pelo conselho profissional, e cabe a quem usa o app respeitar esse prazo.</p>
<h2>Links de agendamento e questionário</h2><p>Quando você usa um link enviado por quem atende você, o que você preenche vai direto para esse profissional. Não usamos cookies de rastreamento nem ferramentas de análise de terceiros.</p>`;
const TXT_TERMOS=`<h1>Termos de uso</h1><p class="sub">Lucra · gestão para clínicas e consultórios</p>
<h2>O que é</h2><p>O Lucra ajuda clínicas e profissionais a organizar agenda, pacientes, atendimentos e finanças. Os cálculos de lucro, taxas e impostos são estimativas para apoiar decisões e não substituem a contabilidade.</p>
<h2>Responsabilidade pelos dados</h2><p>Quem cria a conta é responsável pelos dados que registra, por informar os pacientes e por ter base legal para tratá-los (LGPD). Também é responsável pelo conteúdo técnico dos documentos que emite (receitas, atestados, laudos, relatórios), que precisam seguir as normas do seu conselho profissional.</p>
<h2>Acesso da equipe</h2><p>O dono da conta decide quem entra e com qual papel. Cada pessoa deve usar o próprio login e não compartilhar a senha.</p>
<h2>Documentos e assinaturas</h2><p>A assinatura feita na tela é um registro simples de concordância. Ela não tem a validade de uma assinatura digital com certificado ICP-Brasil.</p>
<h2>Disponibilidade</h2><p>O serviço pode passar por manutenção ou ficar fora do ar. Recomendamos baixar backups periodicamente, pelo app, em Ajustes.</p>
<h2>Fim do uso</h2><p>Você pode parar de usar quando quiser. Antes, baixe o backup dos seus dados.</p>`;
function paginaTexto(qual,pub){ pub.innerHTML=`<article class="pub-c pub-txt">${qual==='termos'?TXT_TERMOS:TXT_PRIV}<p class="sub" style="margin-top:24px">Atualizada em novembro de 2026.</p></article>` }
