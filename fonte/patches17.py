# ── décima sétima leva: plano de tratamento, odontograma, ocupação, validade, importação ──
js = js.replace('/* ══════════ BOAS-VINDAS', rd('plano.js') + rd('ocupacao.js') + rd('importar.js') + rd('fotonuvem.js') + '/* ══════════ BOAS-VINDAS', 1)
rep("'receber','evolucoes','anamneses','prontuario'].forEach(k=>{ if(!Array.isArray(S[k]))S[k]=[] });", "'receber','evolucoes','anamneses','prontuario','planos','odontogramas'].forEach(k=>{ if(!Array.isArray(S[k]))S[k]=[] });")
rep("receber:[], evolucoes:[], anamneses:[], prontuario:[], area:", "receber:[], evolucoes:[], anamneses:[], prontuario:[], planos:[], odontogramas:[], area:")
rep("S.anamneses=S.anamneses.filter(e=>e.clienteId!==id); S.prontuario=S.prontuario.filter(e=>e.clienteId!==id);", "S.anamneses=S.anamneses.filter(e=>e.clienteId!==id); S.prontuario=S.prontuario.filter(e=>e.clienteId!==id); S.planos=S.planos.filter(e=>e.clienteId!==id); S.odontogramas=S.odontogramas.filter(e=>e.clienteId!==id);")
# estoque: lote e validade
rep("""      <div class="field"><label>Avisar quando chegar em</label><input id="pr-min" inputmode="decimal" placeholder="0"></div></div>
    <div class="grid2">""","""      <div class="field"><label>Avisar quando chegar em</label><input id="pr-min" inputmode="decimal" placeholder="0"></div></div>
    <div class="grid2">
      <div class="field"><label for="pr-lote">Lote (opcional)</label><input id="pr-lote" autocomplete="off"></div>
      <div class="field"><label for="pr-val">Validade (opcional)</label><input id="pr-val" inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10"></div></div>
    <div class="grid2">""")
rep("""    const sid=$('#pr-serv').value||'', p={id:uid(),nome:n,min:num($('#pr-min').value),servicoId:sid,porAtend:sid?(num($('#pr-por').value)||1):0};""",
"""    const sid=$('#pr-serv').value||'', p={id:uid(),nome:n,min:num($('#pr-min').value),servicoId:sid,porAtend:sid?(num($('#pr-por').value)||1):0,lote:$('#pr-lote').value.trim(),validade:dataDeBR($('#pr-val').value)};
    if($('#pr-val').value&&!p.validade)return toast('Confira a validade: use dd/mm/aaaa');""")
rep("""       <div class="field"><label>Avisar quando chegar em</label><input id="pc-min" inputmode="decimal" value="${String(num(p.min)).replace('.',',')}"></div>""",
"""       <div class="field"><label>Avisar quando chegar em</label><input id="pc-min" inputmode="decimal" value="${String(num(p.min)).replace('.',',')}"></div>
       <div class="grid2"><div class="field"><label for="pc-lote">Lote</label><input id="pc-lote" value="${esc(p.lote||'')}"></div>
         <div class="field"><label for="pc-val">Validade</label><input id="pc-val" inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10" value="${p.validade?dataBRano(p.validade):''}"></div></div>""")
rep("""        $('#pc-ok').onclick=()=>{ p.min=num($('#pc-min').value); contar(p,num(i.value));""",
"""        $('#pc-ok').onclick=()=>{ if($('#pc-val').value&&!dataDeBR($('#pc-val').value))return toast('Confira a validade: use dd/mm/aaaa');
          p.lote=$('#pc-lote').value.trim(); p.validade=dataDeBR($('#pc-val').value); p.min=num($('#pc-min').value); contar(p,num(i.value));""")
rep("""      <small>mínimo ${qtdBR(p.min)}${s&&num(p.porAtend)""","""      <small>${pillValidade(p)}${p.lote?'lote '+esc(p.lote)+' · ':''}mínimo ${qtdBR(p.min)}${s&&num(p.porAtend)""")
