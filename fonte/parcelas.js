/* ══════════ PARCELAMENTO DO TRATAMENTO ══════════
   O valor do plano vira parcelas com vencimento. Cada parcela entra no caixa quando é paga.
   Atrasada aparece no Hoje e em Registrar atendimento. */
const parcDe=pid=>(S.parcelas||[]).filter(p=>p.planoId===pid).sort((a,b)=>a.n-b.n);
const parcAbertas=()=>(S.parcelas||[]).filter(p=>!p.pago);
const parcAtrasada=p=>!p.pago&&p.venc<hojeISO();
function stParc(p){ if(p.pago)return `<span class="pill ok">paga em ${dataBR(p.pago)}</span>`; const d=diasEntre(hojeISO(),p.venc);
  return d<0?`<span class="pill bad">atrasada ${-d} ${d===-1?'dia':'dias'}</span>`:d===0?'<span class="pill war">vence hoje</span>':`<span class="pill">vence ${dataBR(p.venc)}</span>` }
function abreParcelas(pid,volta,refazer){
  const pl=(S.planos||[]).find(z=>z.id===pid); if(!pl)return; const c=cli(pl.clienteId);
  let refaz=!!refazer;
  abrirSheet('Parcelas do tratamento',esc(c?c.nome:''),`<div id="pc-corpo"></div>`,fechar=>{
    const pinta=()=>{ const b=$('#pc-corpo'); if(!b)return; const ps=parcDe(pid), t=totPlano(pl), jaPago=ps.filter(p=>p.pago).reduce((a,p)=>a+num(p.valor),0);
      if(!ps.length||refaz){
        b.innerHTML=`<p class="sub" style="margin-bottom:12px">O plano soma <b>${brl(t.t)}</b>${jaPago?`, e ${brl(jaPago)} já foram recebidos`:''}. Divida em parcelas: cada uma entra no caixa quando for paga, e o Lucra avisa quando atrasar.</p>
          <div class="grid2"><div class="field"><label for="pc-tot">Valor a parcelar (R$)</label><input id="pc-tot" inputmode="decimal" value="${String(Math.max(0,Math.round((t.t-jaPago)*100)/100)).replace('.',',')}"></div>
            <div class="field"><label for="pc-ent">Entrada hoje (R$)</label><input id="pc-ent" inputmode="decimal" placeholder="0,00"></div></div>
          <div class="grid2"><div class="field"><label for="pc-n">Parcelas</label><select id="pc-n">${Array.from({length:24},(_,i)=>i+1).map(n=>`<option value="${n}" ${n===6?'selected':''}>${n}x</option>`).join('')}</select></div>
            <div class="field"><label for="pc-v1">1º vencimento</label><input id="pc-v1" inputmode="numeric" maxlength="10" value="${dataBRano(somaMes(hojeISO(),1))}"></div></div>
          <div class="field" id="pc-entf" style="display:none"><label for="pc-ef">Entrada paga com</label><select id="pc-ef">${FORMAS.map(f=>`<option value="${f.k}">${f.n}</option>`).join('')}</select></div>
          <div class="rap-sobra" id="pc-prev"></div>
          <button class="btn pri full" id="pc-cria" style="margin-top:12px">${ic('check')}Criar parcelas</button>`;
        const prev=()=>{ const tot=num($('#pc-tot').value), en=Math.min(num($('#pc-ent').value),tot), n=+$('#pc-n').value;
          $('#pc-entf').style.display=en>0?'':'none';
          $('#pc-prev').innerHTML=`<span>${en>0?'Entrada de '+brl(en)+' + ':''}${n}x de</span><b>${brl((tot-en)/n)}</b>` };
        ['#pc-tot','#pc-ent','#pc-n'].forEach(q=>{ $(q).addEventListener('input',prev); $(q).addEventListener('change',prev) }); prev();
        $('#pc-cria').onclick=()=>{ const tot=num($('#pc-tot').value), en=Math.min(num($('#pc-ent').value),tot), n=+$('#pc-n').value, v1=dataDeBR($('#pc-v1').value);
          if(tot<=0)return toast('Informe o valor'); if(!v1)return toast('Confira o 1º vencimento: dd/mm/aaaa');
          if(!S.parcelas)S.parcelas=[];
          const cada=Math.floor((tot-en)/n*100)/100, resto=Math.round(((tot-en)-cada*n)*100)/100;
          if(en>0){ const p={id:uid(),planoId:pid,clienteId:pl.clienteId,n:0,de:n,valor:en,venc:hojeISO(),pago:''}; S.parcelas.push(p); recebeParc(p,$('#pc-ef').value) }
          for(let i=1;i<=n;i++)S.parcelas.push({id:uid(),planoId:pid,clienteId:pl.clienteId,n:i,de:n,valor:i===1?Math.round((cada+resto)*100)/100:cada,venc:somaMes(v1,i-1),pago:''});
          refaz=false; salvar(); toast(n+' parcelas criadas'); pinta() };
        return;
      }
      const pagas=ps.filter(p=>p.pago), tp=pagas.reduce((a,p)=>a+num(p.valor),0), tt=ps.reduce((a,p)=>a+num(p.valor),0), atr=ps.filter(parcAtrasada);
      b.innerHTML=`<div class="pl-res"><div><span>Total</span><b>${brl(tt)}</b></div><div><span>Recebido</span><b class="v-ok">${brl(tp)}</b></div><div><span>Falta</span><b class="${atr.length?'v-bad':''}">${brl(tt-tp)}</b></div></div>
        <div class="card" style="padding:4px 14px;margin-top:12px">${ps.map(p=>`<div class="item"><div class="mn"><b>${p.n?`Parcela ${p.n} de ${p.de}`:'Entrada'}</b><small>${stParc(p)}</small></div>
          <div class="vr">${brl(num(p.valor))}</div>
          <div class="acts">${p.pago?`<button class="btn sm soft" data-pc-volta="${p.id}">Desfazer</button>`:`<button class="btn sm pri" data-pc-ok="${p.id}">${ic('check',16)}Recebi</button>`}</div></div>`).join('')}</div>
        <div class="row" style="margin-top:12px;gap:8px">${c&&c.tel&&ps.some(p=>!p.pago)?`<button class="btn soft" id="pc-zap">${ic('chat',16)}${atr.length?'Cobrar atrasadas':'Mandar o carnê'}</button>`:''}
          <button class="btn soft" id="pc-refaz">Refazer parcelas</button></div>`;
      b.querySelectorAll('[data-pc-ok]').forEach(x=>x.onclick=()=>{ const p=ps.find(z=>z.id===x.dataset.pcOk); escolheForma(f=>{ recebeParc(p,f); salvar(); toast('Parcela recebida · lançada no caixa'); pinta() }) });
      b.querySelectorAll('[data-pc-volta]').forEach(x=>x.onclick=()=>{ const p=ps.find(z=>z.id===x.dataset.pcVolta);
        confirmar('Desfazer o recebimento?','O valor sai do caixa e a parcela volta a ficar em aberto.','Desfazer',()=>{ S.vendas=S.vendas.filter(v=>v.id!==p.vendaId); p.pago=''; p.vendaId=''; salvar(); toast('Desfeito'); setTimeout(()=>abreParcelas(pid,volta),260) }) });
      if($('#pc-zap'))$('#pc-zap').onclick=()=>{ const ab=ps.filter(p=>!p.pago), at=ab.filter(parcAtrasada);
        const tx=at.length?`Oi, ${c.nome.split(' ')[0]}! Tudo bem? Passando para lembrar ${at.length>1?'das parcelas':'da parcela'} do seu tratamento em aberto:\n\n`+at.map(p=>`• Parcela ${p.n}/${p.de} · ${brl(num(p.valor))} · venceu em ${dataBR(p.venc)}`).join('\n')+`\n\nPode acertar pelo Pix quando puder. Qualquer dúvida, me chama!`
          :`Oi, ${c.nome.split(' ')[0]}! Seguem as parcelas do seu tratamento${UI.clinica?' · '+UI.clinica:''}:\n\n`+ab.map(p=>`• ${p.n?'Parcela '+p.n+'/'+p.de:'Entrada'} · ${brl(num(p.valor))} · vence ${dataBR(p.venc)}`).join('\n');
        zapAbrir(zap(c.tel,tx)) };
      $('#pc-refaz').onclick=()=>confirmar('Refazer as parcelas?','As parcelas em aberto são apagadas para você criar de novo. As que já foram pagas continuam no caixa.','Refazer',()=>{
        S.parcelas=S.parcelas.filter(p=>p.planoId!==pid||p.pago); salvar(); setTimeout(()=>{ abreParcelas(pid,volta,true) },260) });
    };
    pinta();
  });
}
function recebeParc(p,forma){ const c=cli(p.clienteId);
  const v={id:uid(),data:hojeISO(),servicoId:'',valor:num(p.valor),forma,parcelas:1,sessoes:1,usadas:[],desloc:0,clienteId:p.clienteId,cliente:c?c.nome:'',
    desc:'Plano de tratamento · '+(p.n?`parcela ${p.n}/${p.de}`:'entrada')};
  S.vendas.push(v); p.pago=hojeISO(); p.vendaId=v.id; p.forma=forma; mesSel=mesAtual() }
function escolheForma(fn){ setTimeout(()=>{ const bg=document.createElement('div'); bg.className='mini-bg';
  bg.innerHTML=`<div class="mini" role="dialog" aria-modal="true" aria-label="Como pagou"><b>Como pagou?</b><div class="grupo-f">${FORMAS.filter(f=>f.k!=='parc').map(f=>`<button class="btn soft" data-mf="${f.k}">${f.n}</button>`).join('')}</div>
    <button class="btn-tx" id="mf-no" style="display:block;margin:8px auto 0">Cancelar</button></div>`;
  document.body.appendChild(bg); bg.querySelector('[data-mf]').focus();
  bg.querySelectorAll('[data-mf]').forEach(b=>b.onclick=()=>{ bg.remove(); fn(b.dataset.mf) }); bg.querySelector('#mf-no').onclick=()=>bg.remove() },0) }
function somaMes(iso,n){ const [a,m,d]=iso.split('-').map(Number), x=new Date(a,m-1+n,1), ult=new Date(x.getFullYear(),x.getMonth()+1,0).getDate();
  return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(Math.min(d,ult)).padStart(2,'0')}` }
MASC.push(['#pc-v1',v=>molde(soDig(v).slice(0,8),'##/##/####')]);

/* em Registrar atendimento: parcelas atrasadas e da semana */
function secParcelas(){ const h=hojeISO(), ps=parcAbertas().filter(p=>p.venc<=somaDias(h,7)).sort((a,b)=>a.venc.localeCompare(b.venc)); if(!ps.length)return '';
  return `<div class="sec" data-cx="parc"><div class="sec-top"><h2>Parcelas de tratamento</h2><span class="pill ${ps.some(parcAtrasada)?'bad':'war'}">${brl(ps.reduce((a,p)=>a+num(p.valor),0))}</span></div><div class="card">
    ${ps.map(p=>{ const c=cli(p.clienteId); return `<div class="item"><div class="mn"><b>${esc(c?c.nome:'—')}</b><small>${p.n?`Parcela ${p.n}/${p.de}`:'Entrada'} · ${stParc(p)}</small></div>
      <div class="vr">${brl(num(p.valor))}</div><div class="acts"><button class="btn sm pri" data-rp-ok="${p.id}">${ic('check',16)}Recebi</button><button class="btn sm soft" data-rp-ver="${p.planoId}">Ver todas</button></div></div>` }).join('')}</div></div>` }
function ligarParcelas(el){
  el.querySelectorAll('[data-rp-ok]').forEach(b=>b.onclick=()=>{ const p=S.parcelas.find(z=>z.id===b.dataset.rpOk); escolheForma(f=>{ recebeParc(p,f); salvar(); toast('Parcela recebida · lançada no caixa'); render() }) });
  el.querySelectorAll('[data-rp-ver]').forEach(b=>b.onclick=()=>abreParcelas(b.dataset.rpVer)) }
const _regPc=T.registrar;
T.registrar=function(el){ _regPc(el); if(!temPlano()||emEdicao('venda'))return; const h=secParcelas(); if(!h)return;
  const alvo=el.querySelector('[data-cx]')||el.querySelector('.sec:last-of-type'); const d=document.createElement('div'); d.innerHTML=h;
  const s=d.firstElementChild; const form=el.querySelector('.sec'); if(form&&form.nextSibling)form.after(s); else el.appendChild(s); ligarParcelas(el) };
