/* ══════════ ÁREAS: estética, odontologia, psicologia ══════════
   Um núcleo só (agenda, pacientes, caixa, lucro real). A área muda a cor, as palavras
   e liga o que é de cada uma: na psicologia, evolução por sessão, regra de falta e recibo. */
const AREAS={
  estetica:{n:'Estética',cor:'#7A2E4D',sub:'financeiro da clínica',trat:'procedimentos estéticos',reg:'Registro profissional',
    d:'Procedimentos, pacotes, antes e depois'},
  odonto:{n:'Odontologia',cor:'#1F5F78',sub:'financeiro do consultório',trat:'tratamento odontológico',reg:'CRO',
    d:'Tratamentos, pacientes e retornos'},
  psico:{n:'Psicologia',cor:'#5B4A9E',sub:'financeiro do consultório',trat:'psicoterapia',reg:'CRP',
    d:'Sessões semanais, evolução e recibo'}
};
const area=()=>AREAS[S.area]?S.area:'estetica';
const ehPsico=()=>area()==='psico';

/* palavras: troca feita no texto já desenhado, então o resto do app não precisa saber da área */
const PACIENTE=[[/\bclientes\b/g,'pacientes'],[/\bClientes\b/g,'Pacientes'],[/\bcliente\b/g,'paciente'],[/\bCliente\b/g,'Paciente']];
const VOC={
  estetica:[],
  odonto:PACIENTE.concat([
    ['creme, descartável, agulha, toxina','resina, anestésico, descartáveis, laboratório'],
    ['toxina, agulha, descartável, creme','resina, anestésico, descartáveis, laboratório']]),
  psico:[
    ['O Lucra precisa de três coisas: o preço que você cobra, quanto gasta de produto em cada atendimento e as taxas da sua maquininha. Com isso ele mostra o lucro real de cada procedimento.',
     'O Lucra precisa de duas coisas: o valor da sua sessão e as taxas da maquininha. Com isso ele mostra quanto fica com você depois do imposto e das taxas.'],
    ['Registre um atendimento no Caixa e veja aqui quanto cada procedimento deixa de verdade, já sem taxa, produto, comissão e imposto.',
     'Registre uma sessão no Caixa e veja aqui quanto cada tipo de sessão deixa para você, já sem taxa e imposto.'],
    ['O Lucra calcula a sobra a partir do preço e do custo de produto de cada serviço. Cadastre o primeiro e volte aqui para lançar o atendimento.',
     'Cadastre o valor da sua sessão em Valores e volte aqui para lançar os pagamentos.'],
    ['Toque em Registrar a cada cliente atendido. Na hora você já vê quanto sobra depois da maquininha e do produto.',
     'Toque em Registrar a cada sessão paga. Na hora você vê quanto fica com você depois da maquininha e do imposto.'],
    ['Lance aluguel, luz, internet e compras de produto. Sem as saídas, a sobra do mês parece maior do que é.',
     'Lance aluguel da sala, supervisão, plataforma de vídeo e contador. Sem as saídas, a sobra do mês parece maior do que é.'],
    ['Comece pelo procedimento que você mais faz: nome, preço e quanto gasta de produto em cada atendimento.','Comece pela sessão que você mais atende: nome e valor.'],
    ['já sem taxa, produto, comissão e imposto','já sem taxa e imposto'],
    ['O Lucra desconta a maquininha, o produto, a comissão e o imposto, e mostra o que fica com você.','O Lucra desconta a maquininha e o imposto de cada sessão e mostra o que fica com você.'],
    ['Lucro real por procedimento','Quanto fica com você por sessão'],['não só o que entrou no caixa','já sem imposto e taxa do cartão'],
    ['Dinheiro da reposição separado','Quem pagou e quem está devendo'],['para o mês não fechar sem produto','com cobrança pelo WhatsApp'],
    ['Pix ou parcelado?','Agenda semanal e evolução'],['veja a diferença antes de fechar o preço','lembrete, link da sessão e humor de cada paciente'],
    [/\bServiços\b/g,'Valores'],[/\bserviços\b/g,'tipos de sessão'],[/\bServiço\b/g,'Tipo de sessão'],[/\bserviço\b/g,'tipo de sessão']
  ].concat(PACIENTE,[
    ['Lucro por procedimento','Lucro por tipo de sessão'],['Procedimentos que já fez','Sessões que já fez'],
    [/\bprocedimentos\b/g,'tipos de sessão'],[/\bProcedimentos\b/g,'Tipos de sessão'],
    [/\bprocedimento\b/g,'tipo de sessão'],[/\bProcedimento\b/g,'Tipo de sessão'],
    [/\bNenhum atendimento\b/g,'Nenhuma sessão'],[/\bnenhum atendimento\b/g,'nenhuma sessão'],
    [/\bum atendimento\b/g,'uma sessão'],[/\bUm atendimento\b/g,'Uma sessão'],
    [/\bo atendimento\b/g,'a sessão'],[/\bO atendimento\b/g,'A sessão'],
    [/\bdo atendimento\b/g,'da sessão'],[/\bno atendimento\b/g,'na sessão'],
    [/\beste atendimento\b/g,'esta sessão'],[/\bEste atendimento\b/g,'Esta sessão'],
    [/\bprimeiro atendimento\b/g,'primeira sessão'],[/\bnovo atendimento\b/g,'nova sessão'],
    [/\bdos atendimentos\b/g,'das sessões'],[/\bnos atendimentos\b/g,'nas sessões'],[/\bos atendimentos\b/g,'as sessões'],[/\bOs atendimentos\b/g,'As sessões'],
    [/\batendimento\(s\)/g,'sessão(ões)'],[/\batendimentos\b/g,'sessões'],[/\bAtendimentos\b/g,'Sessões'],
    [/\batendimento\b/g,'sessão'],[/\bAtendimento\b/g,'Sessão'],
    [/\bpara a clínica\b/g,'para o consultório'],[/\bda clínica\b/g,'do consultório'],[/\bna clínica\b/g,'no consultório'],
    [/\ba clínica\b/g,'o consultório'],[/\bclínica\b/g,'consultório'],
    ['creme, descartável, agulha, toxina','material, testes, plataforma de vídeo'],
    ['toxina, agulha, descartável, creme','material, testes, plataforma de vídeo'],
    ['Ainda não comprou nada','Ainda sem sessões pagas']])
};
const PH={
  odonto:{'Botox, limpeza de pele, laser...':'Limpeza, restauração, clareamento...',
    'Limpeza de pele, drenagem, laser...':'Limpeza, restauração, clareamento...',
    'alergia, preferência, indicação...':'alergia, medicação, convênio...'},
  psico:{'Botox, limpeza de pele, laser...':'Sessão individual, casal, avaliação...',
    'Limpeza de pele, drenagem, laser...':'Sessão individual, terapia de casal...',
    'alergia, preferência, indicação...':'encaminhamento, medicação, convênio...',
    'retorno, pacote, primeira sessão...':'primeira sessão, retorno, online...'}
};
function trTx(t){ const R=VOC[area()]; if(!R||!R.length||typeof t!=='string'||t.includes('{'))return t;
  R.forEach(([a,b])=>t=t.split?t.replace(a,b):t); return t }
function traduz(raiz){
  const R=VOC[area()]; if(!raiz||!R||!R.length)return;
  const w=document.createTreeWalker(raiz,NodeFilter.SHOW_TEXT,{acceptNode:n=>{ const p=n.parentElement;
    if(!p||p.closest('textarea,script,style,[data-livre]'))return NodeFilter.FILTER_REJECT;
    return /[a-z]/i.test(n.nodeValue)&&!n.nodeValue.includes('{')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT }});
  const ns=[]; while(w.nextNode())ns.push(w.currentNode);
  ns.forEach(n=>{ const t=trTx(n.nodeValue); if(t!==n.nodeValue)n.nodeValue=t });
  const ph=PH[area()]||{};
  raiz.querySelectorAll('[placeholder],[aria-label],[title]').forEach(e=>['placeholder','aria-label','title'].forEach(k=>{
    const v=e.getAttribute(k); if(!v)return; const t=ph[v]!=null?ph[v]:trTx(v); if(t!==v)e.setAttribute(k,t) }));
}
const NAV_ROT={clientes:{estetica:'Clientes',odonto:'Pacientes',psico:'Pacientes'}};
function aplicaNav(){ Object.keys(NAV_ROT).forEach(t=>{ const r=document.querySelector(`nav button[data-t="${t}"] .rot`); if(r)r.textContent=NAV_ROT[t][area()] }) }
function corDaArea(c){ c=/^#[0-9a-f]{6}$/i.test(c)?c:COR_PADRAO; return c.toUpperCase()===COR_PADRAO?AREAS[area()].cor:c }
function mudaArea(k,semRender){ if(!AREAS[k])return; S.area=k;
  if(S.falta&&S.falta.auto)delete S.falta;              /* regra de falta segue a área, até a pessoa mexer nela */
  salvar(); aparencia(); aplicaNav(); marca(); if(!semRender)render() }
const chipsArea=()=>Object.keys(AREAS).map(k=>`<button class="chip" data-livre data-area="${k}" aria-pressed="${area()===k}">${AREAS[k].n}</button>`).join('');

/* ── ajustes da área ── */
function secArea(){
  return `<div class="sec"><div class="card">
    <h2 style="margin-bottom:4px">Sua área</h2>
    <p class="sub" style="margin-bottom:12px">Muda as palavras, a cor e o que aparece no app. Os seus dados continuam os mesmos.</p>
    <div class="areas" role="group" aria-label="Sua área">${Object.keys(AREAS).map(k=>
      `<button class="area-op" data-livre data-area="${k}" aria-pressed="${area()===k}" style="--c:${AREAS[k].cor}"><i></i><b>${AREAS[k].n}</b><small>${AREAS[k].d}</small></button>`).join('')}</div>
  </div></div>`;
}
function secPerfil(){ const p=S.perfil||{};
  return `<div class="sec"><div class="card">
    <h2 style="margin-bottom:4px">Seus dados para recibo</h2>
    <p class="sub" style="margin-bottom:12px">Saem no recibo que o paciente usa no reembolso do plano e no imposto de renda.</p>
    <div class="field"><label for="pf-nome">Nome completo</label><input id="pf-nome" value="${esc(p.nome||'')}" autocomplete="name"></div>
    <div class="grid2">
      <div class="field"><label for="pf-reg">${AREAS[area()].reg}</label><input id="pf-reg" value="${esc(p.registro||'')}" placeholder="${area()==='psico'?'06/123456':area()==='odonto'?'SP 12345':''}"></div>
      <div class="field"><label for="pf-doc">CPF ou CNPJ</label><input id="pf-doc" inputmode="numeric" value="${esc(p.doc||'')}"></div></div>
    <div class="grid2">
      <div class="field"><label for="pf-cid">Cidade</label><input id="pf-cid" value="${esc(p.cidade||'')}" placeholder="São Paulo"></div>
      <div class="field"><label for="pf-end">Endereço (opcional)</label><input id="pf-end" value="${esc(p.endereco||'')}"></div></div>
    <button class="btn pri full" id="pf-ok">${ic('check')}Salvar meus dados</button>
  </div></div>`;
}
const regraFalta=()=>S.falta||{cobrar:ehPsico(),horas:24,auto:true};
function secRegras(){ if(!ehPsico())return ''; const f=regraFalta();
  return `<div class="sec"><div class="card">
    <h2 style="margin-bottom:4px">Regras de falta</h2>
    <p class="sub" style="margin-bottom:8px">Combinadas com o paciente no contrato terapêutico.</p>
    <div class="ck-l"><label class="sw"><input type="checkbox" id="rf-cob" ${f.cobrar?'checked':''}> <span>Cobrar falta sem aviso</span></label>
      <small>Ao marcar “Faltou”, o app oferece lançar o valor em “A receber”.</small></div>
    <div class="field" style="margin-top:10px"><label for="rf-h">Aviso mínimo para não cobrar</label>
      <select id="rf-h">${[12,24,48].map(h=>`<option value="${h}" ${f.horas===h?'selected':''}>${h} horas antes</option>`).join('')}</select></div>
  </div></div>`;
}
function ligarAjustesArea(){
  document.querySelectorAll('.areas [data-area]').forEach(b=>b.onclick=()=>{ mudaArea(b.dataset.area); toast('Área: '+AREAS[area()].n) });
  $('#pf-ok').onclick=()=>{ S.perfil=Object.assign({},S.perfil,{nome:$('#pf-nome').value.trim(),registro:$('#pf-reg').value.trim(),doc:$('#pf-doc').value.trim(),
    cidade:$('#pf-cid').value.trim(),endereco:$('#pf-end').value.trim()}); salvar(); toast('Dados salvos') };
  if($('#rf-cob')){ const sv=()=>{ S.falta={cobrar:$('#rf-cob').checked,horas:parseInt($('#rf-h').value)||24}; salvar(); toast('Regra salva') };
    $('#rf-cob').onchange=sv; $('#rf-h').onchange=sv }
}
DOBRAS.ajustes.push('Seus dados para recibo','Regras de falta');

/* campos de serviço por área: na psicologia, só o valor da sessão e o aviso de quem sumiu */
function camposServ(ed){
  if(ehPsico())return `<div class="grid2">
      <div class="field"><label>Valor da sessão</label><input id="s-preco" inputmode="decimal" placeholder="0,00" value="${ed?vg(ed.preco):''}"></div>
      <div class="field"><label>Avisar após quantos dias sem vir</label><input id="s-ret" inputmode="numeric" placeholder="14" value="${ed?(ed.retorno||''):''}"></div></div>
    ${modOn('equipe')?`<div class="field"><label>Comissão de quem atende (%)</label><input id="s-com" inputmode="decimal" placeholder="0" value="${ed?ed.comissao:''}"></div>`:`<input type="hidden" id="s-com" value="${ed?ed.comissao:''}">`}
    <input type="hidden" id="s-precomax" value="${ed&&ed.precoMax?ed.precoMax:''}"><input type="hidden" id="s-custo" value="${ed?ed.custo:''}">`;
  return `<div class="grid3">
      <div class="field"><label>Preço a partir de</label><input id="s-preco" inputmode="decimal" placeholder="0,00" value="${ed?ed.preco:''}"></div>
      <div class="field"><label>Até (opcional)</label><input id="s-precomax" inputmode="decimal" placeholder="mesmo preço" value="${ed&&ed.precoMax?ed.precoMax:''}"></div>
      <div class="field"><label>Custo de produto</label><input id="s-custo" inputmode="decimal" placeholder="0,00" value="${ed?ed.custo:''}"></div>
    </div>
    <div class="grid2">
      <div class="field"><label>Comissão da equipe (%)</label><input id="s-com" inputmode="decimal" placeholder="0" value="${ed?ed.comissao:''}"></div>
      <div class="field"><label>Retorno em (dias)</label><input id="s-ret" inputmode="numeric" placeholder="60" value="${ed?(ed.retorno||''):''}"></div>
    </div>`;
}
NAV_ROT.servicos={estetica:'Serviços',odonto:'Serviços',psico:'Valores'};

