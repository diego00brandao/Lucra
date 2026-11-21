/* ══════════ APARÊNCIA: cor, letra e tamanho escolhidos por quem usa ══════════
   Fica em 'lucra:ui'. A cor escolhida é ajustada sozinha para manter o contraste nos dois temas. */
const FONTES={
  padrao:{n:'Lucra (padrão)'},
  redonda:{n:'Arredondada',sans:"'Nunito'",serif:"'Nunito'",url:'family=Nunito:wght@400;500;600;700;800'},
  elegante:{n:'Elegante',sans:"'DM Sans'",serif:"'Playfair Display',Georgia",url:'family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@600;700'},
  legivel:{n:'Alta legibilidade',sans:"'Atkinson Hyperlegible'",serif:"'Atkinson Hyperlegible'",url:'family=Atkinson+Hyperlegible:wght@400;700'},
  aparelho:{n:'Do aparelho (sem baixar nada)',sans:'system-ui',serif:'system-ui'}
};
const TAMS=[['p','Pequeno',.92],['m','Padrão',1],['g','Grande',1.1],['gg','Maior',1.2]];
const CORES=[['Ameixa','#7A2E4D'],['Sálvia','#2F6B57'],['Petróleo','#1F5F78'],['Terracota','#A4502F'],['Lavanda','#6A4C9C'],['Grafite','#3F4450']];
const COR_PADRAO='#7A2E4D';
const rgbDe=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const hexDe=r=>'#'+r.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mistura=(a,b,t)=>{const x=rgbDe(a),y=rgbDe(b);return hexDe(x.map((v,i)=>v+(y[i]-v)*t))};
const lumin=h=>{const c=rgbDe(h).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*c[0]+.7152*c[1]+.0722*c[2]};
const contraste=(a,b)=>{const x=lumin(a),y=lumin(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
/* a mesma cor em duas versões: escura o bastante para o tema claro, clara o bastante para o escuro */
function tonsDe(base){ let cl=base, es=base, i=0;
  while(contraste(cl,'#FFFFFF')<5.5&&i++<30)cl=mistura(cl,'#000000',.07);
  i=0; while(contraste(es,'#221820')<6.5&&i++<40)es=mistura(es,'#FFFFFF',.07);
  return {cl,es} }
function aparencia(){
  const a=UI.ap, r=document.documentElement.style, f=FONTES[a.fonte]||FONTES.padrao;
  const RESTO="-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif";
  if(f.sans){ r.setProperty('--sans',f.sans+','+RESTO); r.setProperty('--serif',f.serif+','+RESTO) }
  else{ r.removeProperty('--sans'); r.removeProperty('--serif') }
  if(f.url&&!document.getElementById('fonte-'+a.fonte)){ const l=document.createElement('link'); l.id='fonte-'+a.fonte; l.rel='stylesheet';
    l.href='https://fonts.googleapis.com/css2?'+f.url+'&display=swap'; document.head.appendChild(l) }
  const z=(TAMS.find(t=>t[0]===a.tam)||TAMS[1])[2];
  r.setProperty('--z',z); document.body.style.zoom=z===1?'':String(z);
  const base=/^#[0-9a-f]{6}$/i.test(a.cor)?a.cor:COR_PADRAO, ps=['--ac','--on-ac','--foco','--ac-soft','--hero1','--hero2','--marca'];
  if(base.toUpperCase()===COR_PADRAO){ ps.forEach(p=>r.removeProperty(p)); return }
  const t=tonsDe(base), esc=S.tema==='escuro', c=esc?t.es:t.cl, q=rgbDe(c);
  r.setProperty('--ac',c); r.setProperty('--foco',c); r.setProperty('--on-ac',esc?'#1F1418':'#FFF8F3');
  r.setProperty('--ac-soft',`rgba(${q[0]},${q[1]},${q[2]},${esc?.14:.09})`);
  r.setProperty('--hero2',mistura(t.cl,'#000000',esc?.45:.12)); r.setProperty('--hero1',mistura(t.cl,'#000000',esc?.72:.55));
  r.setProperty('--marca',t.cl);
}
function secAparencia(){
  const a=UI.ap, outra=!CORES.some(c=>c[1].toUpperCase()===String(a.cor).toUpperCase());
  return `<div class="sec"><div class="card">
    <h2 style="margin-bottom:4px">Aparência</h2>
    <p class="sub" style="margin-bottom:14px">Deixe o Lucra com a cara do seu espaço. Vale só para este aparelho.</p>
    <label id="ap-lcor">Cor principal</label>
    <div class="cores" role="group" aria-labelledby="ap-lcor">${CORES.map(c=>
      `<button class="cor" data-ap-cor="${c[1]}" aria-pressed="${c[1].toUpperCase()===String(a.cor).toUpperCase()}" aria-label="${c[0]}" title="${c[0]}" style="--c:${c[1]}"></button>`).join('')}
      <label class="cor outra" aria-pressed="${outra}" title="Outra cor" style="--c:${outra?esc(a.cor):'transparent'}">${outra?'':ic('plus',20)}
        <input type="color" id="ap-outra" value="${esc(/^#[0-9a-f]{6}$/i.test(a.cor)?a.cor:COR_PADRAO)}" aria-label="Escolher outra cor"></label></div>
    <div class="field" style="margin-top:16px"><label>Letra</label>
      <select id="ap-fonte">${Object.keys(FONTES).map(k=>`<option value="${k}" ${a.fonte===k?'selected':''}>${FONTES[k].n}</option>`).join('')}</select></div>
    <label id="ap-ltam">Tamanho</label>
    <div class="abas" role="group" aria-labelledby="ap-ltam" style="margin-top:0">${TAMS.map(t=>
      `<button data-ap-tam="${t[0]}" aria-pressed="${a.tam===t[0]}">${t[1]}</button>`).join('')}</div>
    <button class="btn-tx" id="ap-reset" style="margin-top:10px">Voltar ao padrão do Lucra</button>
  </div></div>`;
}
function ligarAparencia(){
  const aplica=(refaz)=>{ salvarUI(); aparencia(); if(refaz)render() };
  document.querySelectorAll('[data-ap-cor]').forEach(b=>b.onclick=()=>{UI.ap.cor=b.dataset.apCor;aplica(true)});
  const o=$('#ap-outra');
  o.addEventListener('input',()=>{UI.ap.cor=o.value;aplica(false)});      /* prévia ao vivo enquanto arrasta */
  o.addEventListener('change',()=>{UI.ap.cor=o.value;aplica(true)});
  $('#ap-fonte').onchange=()=>{UI.ap.fonte=$('#ap-fonte').value;aplica(true)};
  document.querySelectorAll('[data-ap-tam]').forEach(b=>b.onclick=()=>{UI.ap.tam=b.dataset.apTam;aplica(true)});
  $('#ap-reset').onclick=()=>{UI.ap={fonte:'padrao',tam:'m',cor:COR_PADRAO};aplica(true);toast('Aparência padrão')};
}

