const dataLonga=iso=>{ const [a,m,d]=iso.split('-'); return `${+d} de ${MESES[+m-1]} de ${a}` };
const dataCheia=iso=>{ const [a,m,d]=String(iso).split('-'); return `${d}/${m}/${a}` };
const PROFISSAO={estetica:'',odonto:'Cirurgião-dentista',psico:'Psicólogo(a)'};
const DESCR={estetica:'procedimentos estéticos',odonto:'atendimentos odontológicos',psico:'atendimentos psicoterapêuticos'};
/* uma linha por sessão do mês: avulsa pelo valor pago, pacote pelo valor de cada sessão */
function linhasRecibo(cid,mes){
  const hj=hojeISO(), ls=[];
  S.vendas.filter(v=>v.clienteId===cid).forEach(v=>{ const k=conta(v); if(k.estornado&&k.devolvido>=k.bruto)return;
    const fator=k.bruto?(k.bruto-k.devolvido)/k.bruto:1;
    if(k.sessoes>1)(v.usadas||[]).forEach(d=>{ if(mesDe(d)===mes&&d<=hj)ls.push({data:d,valor:k.porSessao*fator}) });
    else { const d=v.sessao||v.data; if(mesDe(d)===mes)ls.push({data:d,valor:k.bruto*fator}) } });
  return ls.sort((a,b)=>a.data.localeCompare(b.data));
}
function dadosRecibo(cid,mes){ const ls=linhasRecibo(cid,mes); return {linhas:ls,total:ls.reduce((a,l)=>a+l.valor,0)} }
function reciboHTML(cid,mes,cpf){
  const c=cli(cid), p=S.perfil||{}, r=dadosRecibo(cid,mes), ar=area();
  const pagNome=(c.pagNome||'').trim(), pagCpf=(c.pagCpf||'').trim();
  const prof=[(p.profissao||PROFISSAO[ar]||'').trim(),(p.registro||'').trim()].filter(Boolean).join(' - ');
  const bloco=(t,ls)=>`<div class="rc-b"><span class="rc-l">${t}</span>${ls.filter(Boolean).map(l=>`<span>${l}</span>`).join('')}</div>`;
  return `<div class="recibo">
    <div class="rc-cab"><b class="rc-t">Recibo</b>${UI.clinica?`<span>${esc(UI.clinica)}</span>`:''}</div>
    <div class="rc-tot"><span>${dataCheia(hojeISO())}</span><b>${brl(r.total)}</b></div>
    ${bloco('Pagador',[esc(pagCpf||cpf||''),esc((pagNome||c.nome).toUpperCase())])}
    ${bloco('Beneficiário',[esc(cpf||''),esc(c.nome.toUpperCase())])}
    ${bloco('Profissional',[esc(p.doc||''),esc((p.nome||UI.clinica||'Nome do profissional').toUpperCase()),esc(prof),esc([p.endereco,p.cidade].filter(Boolean).join(' · '))])}
    <div class="rc-b"><span class="rc-l">Data do atendimento e descrição</span>
      <span>Correspondente a ${DESCR[ar]} conforme abaixo</span>
      <div class="rc-lin">${r.linhas.length?r.linhas.map(l=>`<span>Atendimento no dia ${dataCheia(l.data)} - ${brl(l.valor)}</span>`).join(''):`<span>Nenhum atendimento pago em ${mesNome(mes)}</span>`}</div>
      <span class="rc-ext">Total: ${brl(r.total)} (${extenso(r.total)})</span></div>
    ${bloco('Emissão',[`${dataCheia(hojeISO())}${p.doc?' por '+esc(p.doc):''}`])}
    ${p.assinatura?`<div class="rc-ass"><img src="${p.assinatura}" alt="Assinatura do profissional"><span></span><small>${esc(p.nome||'')}</small></div>`:''}
  </div>`;
}
function reciboTexto(cid,mes,cpf){ const d=document.createElement('div'); d.innerHTML=reciboHTML(cid,mes,cpf);
  const t=d.querySelector('.rc-cab').textContent.trim().replace(/^Recibo/,'*RECIBO*'+(UI.clinica?' · ':'')).replace(/·\s+/,'· ');
  const tot=d.querySelector('.rc-tot'); let s=`${t}\n${tot.children[0].textContent} · *${tot.children[1].textContent}*`;
  d.querySelectorAll('.rc-b').forEach(b=>{ const l=b.querySelector('.rc-l').textContent;
    const xs=[...b.querySelectorAll(':scope > span:not(.rc-l), .rc-lin > span')].map(e=>e.textContent.trim()).filter(Boolean);
    s+=`\n\n*${l}*\n`+xs.join('\n') });
  return s }
function imprimir(html){
  let d=$('#impressao'); if(!d){ d=document.createElement('div'); d.id='impressao'; document.body.appendChild(d) }
  d.innerHTML=html; document.body.classList.add('imprime');
  const fim=()=>{ document.body.classList.remove('imprime'); window.removeEventListener('afterprint',fim) };
  window.addEventListener('afterprint',fim); window.print();
}
function recibo(cid){
  const c=cli(cid); if(!c)return;
  const meses=[...new Set(S.vendas.filter(v=>v.clienteId===cid).flatMap(v=>[mesDe(v.sessao||v.data)].concat((v.usadas||[]).map(mesDe))))].sort().reverse();
  if(!meses.length)return toast('Ainda não há pagamento para gerar recibo');
  const p=S.perfil||{}, falta=!p.nome||!p.doc, ar=area();
  abrirSheet('Recibo',esc(c.nome),
    `<div class="grid2"><div class="field"><label for="rb-m">Mês</label><select id="rb-m">${meses.map(m=>`<option value="${m}">${mesNome(m)}</option>`).join('')}</select></div>
       <div class="field"><label for="rb-cpf">CPF do ${ar==='estetica'?'cliente':'paciente'}</label><input id="rb-cpf" inputmode="numeric" placeholder="000.000.000-00" value="${esc(c.cpf||'')}"></div></div>
     <div class="ck-l" style="border:none"><label class="sw"><input type="checkbox" id="rb-outro" ${c.pagNome?'checked':''}> <span>Quem pagou é outra pessoa</span></label>
       <small>Por exemplo, mãe ou pai de um paciente menor de idade.</small></div>
     <div class="grid2" id="rb-pag" ${c.pagNome?'':'hidden'}>
       <div class="field"><label for="rb-pn">Nome de quem pagou</label><input id="rb-pn" value="${esc(c.pagNome||'')}"></div>
       <div class="field"><label for="rb-pc">CPF de quem pagou</label><input id="rb-pc" inputmode="numeric" value="${esc(c.pagCpf||'')}"></div></div>
     <details class="rb-eu" ${falta?'open':''}><summary class="btn soft full">${ic('user')}${falta?'Preencha os seus dados':'Meus dados no recibo'}</summary>
       <div class="field" style="margin-top:12px"><label for="rb-n">Seu nome completo</label><input id="rb-n" value="${esc(p.nome||'')}" autocomplete="name"></div>
       <div class="grid2">
         <div class="field"><label for="rb-d">Seu CPF ou CNPJ</label><input id="rb-d" inputmode="numeric" value="${esc(p.doc||'')}"></div>
         <div class="field"><label for="rb-r">${AREAS[ar].reg}</label><input id="rb-r" value="${esc(p.registro||'')}" placeholder="${ar==='psico'?'06/123456':ar==='odonto'?'SP 12345':''}"></div></div>
       <div class="grid2">
         <div class="field"><label for="rb-p">Profissão</label><input id="rb-p" value="${esc(p.profissao||'')}" placeholder="${PROFISSAO[ar]||'Esteticista'}"></div>
         <div class="field"><label for="rb-c">Cidade</label><input id="rb-c" value="${esc(p.cidade||'')}" placeholder="São Paulo"></div></div>
       <p class="sub" style="margin:-4px 0 4px">Fica salvo para os próximos recibos.</p></details>
     <div id="rb-prev" style="margin-top:14px"></div>
     <div class="row" style="margin-top:12px"><button class="btn pri" id="rb-pr" style="flex:1">${ic('download')}Imprimir ou salvar PDF</button>
       <button class="btn soft" id="rb-zap">${ic('chat')}WhatsApp</button></div>
     <p class="sub" style="margin-top:10px">Este recibo serve para o reembolso do plano de saúde. ${ar==='psico'||ar==='odonto'?'Para o imposto de renda, o profissional pessoa física também emite o recibo no app Receita Saúde, da Receita Federal.':''}</p>`,
    fechar=>{
      const pinta=()=>{ $('#rb-prev').innerHTML=reciboHTML(cid,$('#rb-m').value,$('#rb-cpf').value.trim()) };
      const guarda=()=>{ c.cpf=$('#rb-cpf').value.trim();
        if($('#rb-outro').checked){ c.pagNome=$('#rb-pn').value.trim(); c.pagCpf=$('#rb-pc').value.trim() } else { delete c.pagNome; delete c.pagCpf }
        S.perfil=Object.assign({},S.perfil,{nome:$('#rb-n').value.trim(),doc:$('#rb-d').value.trim(),registro:$('#rb-r').value.trim(),
          profissao:$('#rb-p').value.trim(),cidade:$('#rb-c').value.trim()});
        salvar(); pinta() };
      document.querySelectorAll('.sheet [id^="rb-"]').forEach(e=>{ if(e.matches('input'))e.addEventListener('input',guarda) });
      $('#rb-m').onchange=pinta;
      $('#rb-outro').onchange=()=>{ $('#rb-pag').hidden=!$('#rb-outro').checked; guarda() };
      pinta();
      $('#rb-pr').onclick=()=>{ guarda(); imprimir(reciboHTML(cid,$('#rb-m').value,$('#rb-cpf').value.trim())) };
      $('#rb-zap').onclick=()=>{ guarda(); window.open(linkZap(c,reciboTexto(cid,$('#rb-m').value,$('#rb-cpf').value.trim())),'_blank','noopener') };
    });
}
