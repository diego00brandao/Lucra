/* ══════════ PERIOGRAMA (odontologia) ══════════
   Por dente: profundidade de sondagem e recessão em 6 pontos (3 por vestibular, 3 por lingual/palatina),
   sangramento, mobilidade e furca. Mostra % de sangramento e bolsas, e compara com o exame anterior. */
const PER_SITIOS=['DV','V','MV','DL','L','ML'];
const periosDe=cid=>(S.periogramas||[]).filter(p=>p.clienteId===cid).sort((a,b)=>a.data.localeCompare(b.data));
const molar=d=>[6,7,8].includes(d%10);
function resumoPerio(p){ let s=0,sg=0,b4=0,b6=0,n=0; Object.entries(p.dentes||{}).forEach(([k,d])=>{ if(d.aus)return; n++;
  (d.ps||[]).forEach((v,i)=>{ if(v===''||v==null)return; s++; if(num(v)>=4)b4++; if(num(v)>=6)b6++; if(d.sg&&d.sg[i])sg++ }) });
  return {dentes:n,sitios:s,sang:s?sg/s*100:0,b4,b6} }
function abrePerio(cid,id,volta){ const c=cli(cid); if(!c)return;
  let p=id?(S.periogramas||[]).find(x=>x.id===id):null; const ant=periosDe(cid).filter(x=>!p||x.data<p.data).pop();
  const novo=!p; if(novo)p={id:uid(),clienteId:cid,data:hojeISO(),dentes:{},obs:''};
  const W=JSON.parse(JSON.stringify(p)); let sel=null;
  abrirSheet('Periograma',`${esc(c.nome)} · ${dataBR(W.data)}`,`<div id="pr-c"></div>`,fechar=>{
    const dd=k=>W.dentes[k]||(W.dentes[k]={ps:['','','','','',''],rc:['','','','','',''],sg:[0,0,0,0,0,0],mob:0,fu:0,aus:0});
    const cor=k=>{ const d=W.dentes[k]; if(!d)return ''; if(d.aus)return 'aus'; const mx=Math.max(0,...d.ps.map(v=>num(v)||0)); return mx>=6?'p6':mx>=4?'p4':d.ps.some(v=>v!=='')?'ok':'' };
    const pinta=()=>{ const r=resumoPerio(W), ra=ant&&resumoPerio(ant), b=$('#pr-c'); if(!b)return;
      b.innerHTML=`<div class="pl-res"><div><span>Sangramento</span><b class="${r.sang>=30?'v-bad':r.sang>=10?'':'v-ok'}">${r.sang.toFixed(0)}%</b>${ra?`<small>antes ${ra.sang.toFixed(0)}%</small>`:''}</div>
          <div><span>Bolsas ≥ 4 mm</span><b>${r.b4}</b>${ra?`<small>antes ${ra.b4}</small>`:''}</div><div><span>Bolsas ≥ 6 mm</span><b class="${r.b6?'v-bad':''}">${r.b6}</b>${ra?`<small>antes ${ra.b6}</small>`:''}</div></div>
        <p class="sub" style="margin:10px 0 6px">Toque no dente para anotar. ${r.dentes} dente(s) examinado(s).</p>
        ${DENTES.perm.map((q,i)=>`<div class="odg-q"><small>${['Superior direito','Superior esquerdo','Inferior direito','Inferior esquerdo'][i]}</small><div class="odg-l">${q.map(k=>`<button class="dt pr-${cor(k)}" data-pr-d="${k}" aria-pressed="${sel===k}">${k}</button>`).join('')}</div></div>`).join('')}
        <div class="pr-leg"><span><i class="pr-ok"></i>até 3 mm</span><span><i class="pr-p4"></i>4 a 5 mm</span><span><i class="pr-p6"></i>6 mm ou mais</span><span><i class="pr-aus"></i>ausente</span></div>
        ${sel?(()=>{ const d=dd(sel), da=ant&&ant.dentes&&ant.dentes[sel];
          return `<div class="card pr-ed"><div class="row" style="justify-content:space-between"><b>Dente ${sel}</b><label class="sw" style="min-height:0"><input type="checkbox" id="pr-aus" ${d.aus?'checked':''}><span>Ausente</span></label></div>
            ${d.aus?'':`<table class="pr-tab"><thead><tr><th></th>${PER_SITIOS.map(s=>`<th>${s}</th>`).join('')}</tr></thead><tbody>
              <tr><th>Sondagem</th>${d.ps.map((v,i)=>`<td><input data-ps="${i}" inputmode="numeric" maxlength="2" value="${v}" aria-label="Sondagem ${PER_SITIOS[i]}"${da&&da.ps&&da.ps[i]!==''?` placeholder="${da.ps[i]}"`:''}></td>`).join('')}</tr>
              <tr><th>Recessão</th>${d.rc.map((v,i)=>`<td><input data-rc="${i}" inputmode="numeric" maxlength="2" value="${v}" aria-label="Recessão ${PER_SITIOS[i]}"></td>`).join('')}</tr>
              <tr><th>Sangra</th>${d.sg.map((v,i)=>`<td><button type="button" class="pr-sg" data-sg="${i}" aria-pressed="${!!v}" aria-label="Sangramento ${PER_SITIOS[i]}">●</button></td>`).join('')}</tr></tbody></table>
            <div class="grid2" style="margin-top:8px"><div class="field"><label for="pr-mob">Mobilidade</label><select id="pr-mob">${[0,1,2,3].map(n=>`<option ${d.mob==n?'selected':''}>${n}</option>`).join('')}</select></div>
              ${molar(sel)?`<div class="field"><label for="pr-fu">Furca</label><select id="pr-fu">${[0,1,2,3].map(n=>`<option ${d.fu==n?'selected':''}>${n}</option>`).join('')}</select></div>`:''}</div>
            ${da?`<small class="sub">Exame anterior aparece em cinza nos campos vazios.</small>`:''}`}
            <button class="btn sm soft" id="pr-prox" style="margin-top:8px">Próximo dente${ic('right',16)}</button></div>` })():''}
        <div class="field" style="margin-top:10px"><label for="pr-obs">Observações</label><textarea id="pr-obs" rows="2">${esc(W.obs||'')}</textarea></div>
        <div class="row" style="gap:8px;margin-top:8px"><button class="btn pri" id="pr-ok" style="flex:1">${ic('check')}Salvar exame</button><button class="btn soft" id="pr-imp">${ic('file',16)}Imprimir</button></div>
        ${!novo?`<button class="btn-tx" id="pr-del" style="display:block;margin:10px auto 0">Excluir este exame</button>`:''}`;
      b.querySelectorAll('[data-pr-d]').forEach(x=>x.onclick=()=>{ guardaObs(); sel=+x.dataset.prD; pinta(); const e=b.querySelector('[data-ps="0"]'); if(e)e.focus() });
      if(sel){ const d=dd(sel);
        b.querySelectorAll('[data-ps]').forEach(i=>i.oninput=()=>{ i.value=soDig(i.value).slice(0,2); d.ps[+i.dataset.ps]=i.value;
          const t=b.querySelectorAll('[data-ps]'), k=+i.dataset.ps; if(i.value.length===1&&k<5&&num(i.value)>1)t[k+1].focus(); recolore() });
        b.querySelectorAll('[data-rc]').forEach(i=>i.oninput=()=>{ i.value=soDig(i.value).slice(0,2); d.rc[+i.dataset.rc]=i.value });
        b.querySelectorAll('[data-sg]').forEach(x=>x.onclick=()=>{ const k=+x.dataset.sg; d.sg[k]=d.sg[k]?0:1; x.setAttribute('aria-pressed',!!d.sg[k]); atualizaResumo() });
        if($('#pr-aus'))$('#pr-aus').onchange=()=>{ d.aus=$('#pr-aus').checked?1:0; pinta() };
        if($('#pr-mob'))$('#pr-mob').onchange=()=>{ d.mob=+$('#pr-mob').value };
        if($('#pr-fu'))$('#pr-fu').onchange=()=>{ d.fu=+$('#pr-fu').value };
        $('#pr-prox').onclick=()=>{ guardaObs(); const ord=DENTES.perm.flat(), i=ord.indexOf(sel); sel=ord[(i+1)%ord.length]; pinta(); const e=b.querySelector('[data-ps="0"]'); if(e)e.focus() } }
      $('#pr-ok').onclick=()=>{ guardaObs(); limpa(); if(!S.periogramas)S.periogramas=[]; const i=S.periogramas.findIndex(x=>x.id===W.id); if(i>=0)S.periogramas[i]=W; else S.periogramas.push(W);
        salvar(); fechar(); toast('Periograma salvo'); if(volta)volta() };
      $('#pr-imp').onclick=()=>{ guardaObs(); imprimir(perioHTML(W,ant)) };
      if($('#pr-del'))$('#pr-del').onclick=()=>confirmar('Excluir este periograma?','O exame sai da ficha.','Excluir',()=>{ S.periogramas=S.periogramas.filter(x=>x.id!==W.id); salvar(); if(volta)volta() },true);
    };
    const recolore=()=>{ document.querySelectorAll('#pr-c [data-pr-d]').forEach(x=>{ x.className='dt pr-'+cor(+x.dataset.prD) }); atualizaResumo() };
    const atualizaResumo=()=>{ const r=resumoPerio(W), bs=document.querySelectorAll('#pr-c .pl-res b'); if(bs.length===3){ bs[0].textContent=r.sang.toFixed(0)+'%'; bs[1].textContent=r.b4; bs[2].textContent=r.b6 } };
    const guardaObs=()=>{ const o=$('#pr-obs'); if(o)W.obs=o.value.trim() };
    const limpa=()=>{ Object.keys(W.dentes).forEach(k=>{ const d=W.dentes[k]; if(!d.aus&&!d.mob&&!d.fu&&d.ps.every(v=>v==='')&&d.rc.every(v=>v==='')&&!d.sg.some(Boolean))delete W.dentes[k] }) };
    pinta() }) }
function perioHTML(p,ant){ const c=cli(p.clienteId), r=resumoPerio(p), pf=S.perfil||{};
  const linha=q=>`<tr><th></th>${q.map(k=>`<th>${k}</th>`).join('')}</tr>`+[['ps','Sondagem'],['rc','Recessão']].map(([f,n])=>`<tr><td>${n}</td>${q.map(k=>{ const d=p.dentes[k]; return `<td>${!d?'':d.aus?'aus.':esc((d[f]||[]).map(v=>v===''?'·':v).join(' '))}</td>` }).join('')}</tr>`).join('')
    +`<tr><td>Sangra</td>${q.map(k=>{ const d=p.dentes[k]; return `<td>${d&&!d.aus?(d.sg||[]).filter(Boolean).length||'':''}</td>` }).join('')}</tr>`;
  return `<div class="recibo doc-imp pr-imp"><div class="rc-cab"><b class="rc-t">Periograma</b>${topoRecibo()?`<span>${esc(topoRecibo())}</span>`:''}${profLinha()?`<span>${esc(profLinha())}</span>`:''}</div>
    <p class="doc-pac"><b>Paciente:</b> ${esc(c.nome)} · <b>Data:</b> ${dataBR(p.data)}</p>
    <p class="doc-pac">Sangramento à sondagem: <b>${r.sang.toFixed(0)}%</b> · bolsas ≥ 4 mm: <b>${r.b4}</b> · bolsas ≥ 6 mm: <b>${r.b6}</b>${ant?` (exame de ${dataBR(ant.data)}: ${resumoPerio(ant).sang.toFixed(0)}%, ${resumoPerio(ant).b4}, ${resumoPerio(ant).b6})`:''}</p>
    <table class="doc-tab pr-ptab">${linha(DENTES.perm[0])}${linha(DENTES.perm[1])}${linha(DENTES.perm[2])}${linha(DENTES.perm[3])}</table>
    <p class="sub" style="font-size:11px">Pontos: DV, V, MV, DL, L, ML (mm).</p>${p.obs?`<div class="doc-tx">${esc(p.obs)}</div>`:''}
    <div class="rc-ass">${assProfImg()}<span></span><small>${esc(pf.nome||'Profissional')}${pf.registro?' · CRO '+esc(pf.registro):''}</small></div></div>` }
/* na ficha, junto do odontograma */
const _topoPr=topoHist, _ligaPr=ligarTopoHist;
topoHist=c=>{ let h=_topoPr(c); if(area()!=='odonto'||!podeClinico()||!temRecurso('prontuario'))return h; const ps=periosDe(c.id), u=ps[ps.length-1], r=u&&resumoPerio(u);
  return h+`<div class="sec"><div class="sec-top"><h2>Periograma</h2>${u?`<span class="pill ${r.sang>=30||r.b6?'bad':r.b4?'war':'ok'}">${r.sang.toFixed(0)}% sangra</span>`:''}</div><div class="card">
    ${ps.slice(-3).reverse().map(p=>{ const x=resumoPerio(p); return `<button type="button" class="item pr-it" data-pr-ex="${p.id}"><div class="mn"><b>${dataBR(p.data)}</b><small>${x.dentes} dentes · sangramento ${x.sang.toFixed(0)}% · ${x.b4} bolsa(s) ≥ 4 mm</small></div>${ic('right',18)}</button>` }).join('')}
    <button class="btn sm ${u?'soft':'pri'}" id="h-pr" style="margin-top:${u?8:0}px">${ic('plus',16)}Novo periograma</button></div></div>` };
ligarTopoHist=function(id,fechar){ _ligaPr(id,fechar); const volta=()=>setTimeout(()=>historico(id),300);
  if($('#h-pr'))$('#h-pr').onclick=()=>{ fechar(); setTimeout(()=>abrePerio(id,'',volta),260) };
  document.querySelectorAll('.sheet [data-pr-ex]').forEach(b=>b.onclick=()=>{ fechar(); setTimeout(()=>abrePerio(id,b.dataset.prEx,volta),260) }) };
