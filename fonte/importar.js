/* ══════════ IMPORTAR PACIENTES (Clinicorp, outro sistema ou planilha) ══════════
   Lê .xlsx (Excel) e .csv sem biblioteca: o .xlsx é um zip, aberto com o descompactador do navegador. */
async function lerZip(buf){
  const v=new DataView(buf), u8=new Uint8Array(buf); let fim=-1;
  for(let i=u8.length-22;i>=Math.max(0,u8.length-65557);i--)if(v.getUint32(i,true)===0x06054b50){ fim=i; break }
  if(fim<0)throw new Error('zip');
  const n=v.getUint16(fim+10,true); let p=v.getUint32(fim+16,true); const arqs={};
  for(let k=0;k<n;k++){ const met=v.getUint16(p+10,true), tam=v.getUint32(p+20,true), ln=v.getUint16(p+28,true), lx=v.getUint16(p+30,true), lc=v.getUint16(p+32,true), off=v.getUint32(p+42,true);
    const nome=new TextDecoder().decode(u8.subarray(p+46,p+46+ln)); arqs[nome]={met,tam,off}; p+=46+ln+lx+lc }
  const abre=async nome=>{ const a=arqs[nome]; if(!a)return null; const lo=a.off, ini=lo+30+v.getUint16(lo+26,true)+v.getUint16(lo+28,true), dado=u8.subarray(ini,ini+a.tam);
    if(a.met===0)return new TextDecoder().decode(dado);
    const s=new Blob([dado]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return await new Response(s).text() };
  return {arqs:Object.keys(arqs),abre};
}
const colNum=ref=>{ const m=/^([A-Z]+)/.exec(ref||''); let n=0; if(m)for(const ch of m[1])n=n*26+ch.charCodeAt(0)-64; return n-1 };
async function lerXlsx(buf){
  const z=await lerZip(buf), xml=t=>new DOMParser().parseFromString(t,'application/xml');
  const ss=[]; const tss=await z.abre('xl/sharedStrings.xml');
  if(tss)xml(tss).querySelectorAll('si').forEach(si=>ss.push([...si.getElementsByTagName('t')].map(t=>t.textContent).join('')));
  const folha=z.arqs.filter(a=>/^xl\/worksheets\/sheet\d+\.xml$/.test(a)).sort((a,b)=>parseInt(a.match(/\d+/)[0])-parseInt(b.match(/\d+/)[0]))[0];
  if(!folha)throw new Error('sem planilha');
  const linhas=[];
  xml(await z.abre(folha)).querySelectorAll('sheetData > row').forEach(r=>{ const l=[];
    r.querySelectorAll('c').forEach(c=>{ const t=c.getAttribute('t'), vv=c.getElementsByTagName('v')[0], is=c.getElementsByTagName('is')[0];
      let val=t==='s'?ss[+(vv&&vv.textContent)]:t==='inlineStr'?(is?is.textContent:''):(vv?vv.textContent:'');
      l[colNum(c.getAttribute('r'))]=val==null?'':String(val) });
    linhas.push(Array.from(l,x=>x==null?'':x)) });
  return linhas;
}
function lerCsv(txt){
  const pl=txt.split(/\r?\n/,1)[0]||'', sep=[';',',','\t'].sort((a,b)=>pl.split(b).length-pl.split(a).length)[0];
  const linhas=[]; let l=[], c='', q=false;
  for(let i=0;i<txt.length;i++){ const ch=txt[i];
    if(q){ if(ch==='"'){ if(txt[i+1]==='"'){ c+='"'; i++ } else q=false } else c+=ch; continue }
    if(ch==='"')q=true; else if(ch===sep){ l.push(c); c='' } else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&txt[i+1]==='\n')i++; l.push(c); linhas.push(l); l=[]; c='' } else c+=ch }
  if(c||l.length){ l.push(c); linhas.push(l) }
  return linhas.filter(x=>x.some(y=>String(y).trim()));
}
async function lerPlanilha(arq){
  const buf=await arq.arrayBuffer();
  if(/\.xlsx$/i.test(arq.name)||(new Uint8Array(buf)[0]===0x50&&new Uint8Array(buf)[1]===0x4b))return lerXlsx(buf);
  if(/\.xls$/i.test(arq.name))throw new Error('xls');
  let t=new TextDecoder('utf-8').decode(buf); if(t.includes('�'))t=new TextDecoder('windows-1252').decode(buf);
  return lerCsv(t.replace(/^﻿/,''));
}
const CAMPOS_IMP=[['nome','Nome',/^(nome|paciente|cliente|nome completo|nome do paciente)/i],['tel','WhatsApp ou celular',/(celular|whats|telefone|fone|contato)/i],
  ['email','E-mail',/e-?mail/i],['nasc','Nascimento',/(nasc|anivers)/i],['cpf','CPF',/^cpf/i],['obs','Observação',/(obs|nota|anota)/i]];
function dataImp(v){ v=String(v||'').trim(); if(!v)return '';
  if(/^\d{4,5}(\.\d+)?$/.test(v)){ const d=new Date(Math.round((+v-25569)*864e5)); return isNaN(d)?'':d.toISOString().slice(0,10) }   /* data do Excel */
  let m=/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/.exec(v); if(m){ let a=+m[3]; if(a<100)a+=a>30?1900:2000; return `${a}-${String(+m[2]).padStart(2,'0')}-${String(+m[1]).padStart(2,'0')}` }
  m=/^(\d{4})-(\d{2})-(\d{2})/.exec(v); return m?m[0]:'' }
const exImp=(h,v)=>{ v=String(v); return /^\d{4,5}(\.\d+)?$/.test(v)&&/(nasc|data|anivers)/i.test(h)?dataBR(dataImp(v)):v.slice(0,24) };
const chaveCli=c=>(soDig(c.cpf)||'')||(String(c.nome||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim()+'|'+soDig(c.tel).slice(-8));
function importarPacientes(){
  const pac=quemTx().replace(/^o /,'');
  abrirSheet('Trazer '+pac+'s de outro sistema','Planilha do Excel (.xlsx) ou arquivo .csv',`<div id="im-corpo">
    <p class="sub" style="margin-bottom:12px">No Clinicorp ou no seu sistema atual, exporte a lista de ${pac}s em Excel ou CSV. Depois escolha o arquivo aqui.</p>
    <button class="btn pri full" id="im-arq">${ic('upload')}Escolher arquivo</button></div>`,fechar=>{
    const corpo=$('#im-corpo');
    const passo2=(linhas,nomeArq)=>{
      let iH=linhas.findIndex(l=>l.filter(x=>String(x).trim()).length>=2); if(iH<0)iH=0;
      const cab=linhas[iH].map((x,i)=>String(x).trim()||'Coluna '+(i+1)), dados=linhas.slice(iH+1).filter(l=>l.some(x=>String(x).trim()));
      const mapa={}; CAMPOS_IMP.forEach(([k,,re])=>{ const i=cab.findIndex((h,j)=>re.test(h)&&!Object.values(mapa).includes(j)); if(i>=0)mapa[k]=i });
      const pinta=()=>{
        const lista=dados.map(l=>{ const g=k=>mapa[k]!=null?String(l[mapa[k]]||'').trim():'';
          return {nome:g('nome'),tel:g('tel')?fmtTel(g('tel')):'',email:g('email'),nasc:dataImp(g('nasc')),cpf:g('cpf')?fmtCpf(g('cpf')):'',obs:g('obs')} }).filter(c=>c.nome);
        const ja=new Set(S.clientes.map(chaveCli)), novos=[], vistos=new Set(); let rep=0;
        lista.forEach(c=>{ const k=chaveCli(c); if(ja.has(k)||vistos.has(k)){ rep++; return } vistos.add(k); novos.push(c) });
        corpo.innerHTML=`<p class="sub" style="margin-bottom:10px"><b>${esc(nomeArq)}</b> · ${dados.length} linha(s). Diga qual coluna é cada informação:</p>
          ${CAMPOS_IMP.map(([k,n])=>`<div class="field"><label for="im-${k}">${n}${k==='nome'?'':' (opcional)'}</label><select id="im-${k}" data-im="${k}"><option value="">${k==='nome'?'Escolha a coluna':'Não trazer'}</option>
            ${cab.map((h,i)=>`<option value="${i}" ${mapa[k]===i?'selected':''}>${esc(h)}${dados[0]&&dados[0][i]?' · ex.: '+esc(exImp(h,dados[0][i])):''}</option>`).join('')}</select></div>`).join('')}
          ${novos.length?`<div class="im-prev"><p class="eyebrow">Prévia</p>${novos.slice(0,4).map(c=>`<div><b>${esc(c.nome)}</b><small>${[c.tel,c.nasc?dataBR(c.nasc):'',c.email].filter(Boolean).map(esc).join(' · ')||'só o nome'}</small></div>`).join('')}</div>`:''}
          <p class="sub" style="margin:10px 0">${mapa.nome==null?'Escolha a coluna do nome para continuar.':`${novos.length} ${novos.length===1?'novo cadastro':'novos cadastros'}${rep?` · ${rep} já ${rep===1?'existia':'existiam'} e ${rep===1?'fica':'ficam'} de fora`:''}.`}</p>
          <button class="btn pri full" id="im-ok" ${mapa.nome==null||!novos.length?'disabled':''}>${ic('check')}Trazer ${novos.length} ${novos.length===1?pac:pac+'s'}</button>`;
        corpo.querySelectorAll('[data-im]').forEach(s=>s.onchange=()=>{ const k=s.dataset.im; if(s.value==='')delete mapa[k]; else mapa[k]=+s.value; pinta() });
        $('#im-ok').onclick=()=>{ novos.forEach(c=>S.clientes.push(Object.assign({id:uid()},c))); salvar(); fechar(); toast(`${novos.length} ${novos.length===1?pac+' trazido':pac+'s trazidos'}`); render() };
      };
      pinta();
    };
    $('#im-arq').onclick=()=>{ const i=document.createElement('input'); i.type='file'; i.accept='.xlsx,.csv,.txt,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      i.onchange=async()=>{ const f=i.files&&i.files[0]; if(!f)return; corpo.innerHTML='<p class="sub">Lendo o arquivo…</p>';
        try{ const ls=await lerPlanilha(f); if(!ls.length)throw new Error('vazio'); passo2(ls,f.name) }
        catch(e){ corpo.innerHTML=`<div class="pt-aviso">${/xls/.test(e.message)?'Esse arquivo é do Excel antigo (.xls). Abra no Excel e salve como .xlsx ou .csv.':'Não consegui ler esse arquivo. Tente salvar a planilha como .xlsx ou .csv.'}</div>
          <button class="btn pri full" id="im-arq2">${ic('upload')}Escolher outro arquivo</button>`; $('#im-arq2').onclick=()=>{ fechar(); setTimeout(importarPacientes,250) } } };
      i.click() };
  });
}
/* em Ajustes, logo depois do Backup (só para quem pode mexer em tudo) */
const _posImp=posRender;
posRender=function(el){ _posImp(el);
  if(tela!=='ajustes'||!ehDono()||$('#sec-imp'))return;
  const h=[...el.querySelectorAll(':scope > .sec h2')].find(z=>z.textContent.trim()==='Backup'), alvo=h?h.closest('.sec'):null;
  const x=`<div class="sec" id="sec-imp"><div class="card"><h2 style="margin-bottom:4px">Trazer de outro sistema</h2>
    <p class="sub" style="margin-bottom:12px">Veio do Clinicorp ou de outro programa? Traga a lista de ${quemTx().replace(/^o /,'')}s de uma planilha.</p>
    <button class="btn soft full" id="a-impcli">${ic('upload')}Importar planilha</button></div></div>`;
  if(alvo)alvo.insertAdjacentHTML('afterend',x); else el.insertAdjacentHTML('beforeend',x);
  $('#a-impcli').onclick=importarPacientes;
};
