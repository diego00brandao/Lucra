# ── décima leva: psicologia sem "produto", "procedimento" nem "lucro" de estética ──
# Serviços: título, campos, lista e rodapé
rep('<p class="sub">Preço, custo de produto e as taxas da maquininha</p>',
    "<p class=\"sub\">${ehPsico()?'O valor de cada tipo de sessão e as taxas':'Preço, custo de produto e as taxas da maquininha'}</p>")
troca_bloco('    <div class="grid3">\n      <div class="field"><label>Preço a partir de</label>',
            "    ${ed?'':`<div class=\"nota\">Se o preço varia",
            "    ${camposServ(ed)}\n")
rep("    ${ed?'':`<div class=\"nota\">Se o preço varia",
    "    ${ed?'':ehPsico()?`<div class=\"nota\">Cadastre cada tipo de sessão com o valor que você cobra: individual, online, casal, avaliação. Pacote mensal você registra no Caixa, como pacote de sessões.</div>`:`<div class=\"nota\">Se o preço varia")
rep("${s.precoMax?brl(s.preco)+' a '+brl(s.precoMax):brl(s.preco)} · produto ${brl(s.custo)}",
    "${s.precoMax?brl(s.preco)+' a '+brl(s.precoMax):brl(s.preco)}${ehPsico()&&!num(s.custo)?' por sessão':' · produto '+brl(s.custo)}")
rep("${s.retorno?' · retorno em '+s.retorno+' dias':''}</small></div>\n        <div class=\"vr\"><span class=\"${c.lucro>=0?'v-ok':'v-bad'}\">${brl(c.lucro)}</span><small>sobra no Pix · ${pct(c.margem)}</small></div>",
    "${s.retorno?(ehPsico()?' · avisa após '+s.retorno+' dias sem vir':' · retorno em '+s.retorno+' dias'):''}</small></div>\n        <div class=\"vr\"><span class=\"${c.lucro>=0?'v-ok':'v-bad'}\">${brl(c.lucro)}</span><small>${ehPsico()?'fica com você no Pix':'sobra no Pix · '+pct(c.margem)}</small></div>")
rep("<p class=\"sub\" style=\"margin-top:12px\">A sobra já desconta produto, comissão e imposto, no melhor cenário de pagamento (Pix). No cartão ela cai.</p>",
    "<p class=\"sub\" style=\"margin-top:12px\">${ehPsico()?'O valor em verde é o que fica com você em cada sessão paga no Pix, já sem o imposto de '+pct(num(S.imposto))+'. No cartão, a taxa da maquininha também sai.':'A sobra já desconta produto, comissão e imposto, no melhor cenário de pagamento (Pix). No cartão ela cai.'}</p>")
rep_ws("""<div class="field"><label>Custo de ir até o cliente (R$)</label>
        <input id="t-dom" inputmode="decimal" placeholder="0,00" value="${S.custoDomicilio||''}"></div>""",
    """${ehPsico()?`<input type="hidden" id="t-dom" value="${S.custoDomicilio||''}">`:`<div class="field"><label>Custo de ir até o cliente (R$)</label>
        <input id="t-dom" inputmode="decimal" placeholder="0,00" value="${S.custoDomicilio||''}"></div>`}""")
js = re.sub(r'    <p class="sub" style="margin:-4px 0 12px">(No atendimento em domicílio,.*?)</p>', lambda m: "    ${ehPsico()?'':`<p class=\"sub\" style=\"margin:-4px 0 12px\">"+m.group(1)+"</p>`}", js, count=1, flags=re.S)

# prévias de quanto sobra: sem "produto R$ 0,00" na psicologia
rep("      produto <b>${brl(c.custo)}</b>${n>1?` (${n}×)`:''}", "      ${ehPsico()&&!c.custo?'':`produto <b>${brl(c.custo)}</b>${n>1?` (${n}×)`:''}`}")
rep("(${pct(k.tx)}), produto <b>${brl(k.custo)}</b>", "(${pct(k.tx)})${ehPsico()&&!k.custo?'':`, produto <b>${brl(k.custo)}</b>`}")
rep("Maquininha <b>${brl(t.taxa)}</b>, produto <b>${brl(t.custo)}</b>", "Maquininha <b>${brl(t.taxa)}</b>${ehPsico()&&!t.custo?'':`, produto <b>${brl(t.custo)}</b>`}")
rep("<p class=\"sub\" style=\"margin-bottom:14px\">produto ${brl(s.custo)}${s.comissao?` · comissão ${pct(s.comissao)}`:''}",
    "<p class=\"sub\" style=\"margin-bottom:14px\">${ehPsico()&&!num(s.custo)?'sessão':'produto '+brl(s.custo)}${s.comissao?` · comissão ${pct(s.comissao)}`:''}")
# saídas e contas: o campo "é produto de qual serviço" some
rep_ws("""<div class="field"><label>É compra de produto de qual serviço?</label>
        <select id="d-serv"><option value="">Não é produto (despesa geral)</option>
        ${S.servicos.map(s=>`<option value="${s.id}" ${edD&&edD.servicoId===s.id?'selected':''}>${esc(s.nome)}</option>`).join('')}</select></div>""",
    """${ehPsico()?'<input type="hidden" id="d-serv" value="">':`<div class="field"><label>É compra de produto de qual serviço?</label>
        <select id="d-serv"><option value="">Não é produto (despesa geral)</option>
        ${S.servicos.map(s=>`<option value="${s.id}" ${edD&&edD.servicoId===s.id?'selected':''}>${esc(s.nome)}</option>`).join('')}</select></div>`}""")
rep_ws("""<div class="field"><label>É produto de qual serviço?</label><select id="ct-serv"><option value="">Não é produto (despesa geral)</option>
        ${S.servicos.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join('')}</select></div>""",
    """${ehPsico()?'<input type="hidden" id="ct-serv" value="">':`<div class="field"><label>É produto de qual serviço?</label><select id="ct-serv"><option value="">Não é produto (despesa geral)</option>
        ${S.servicos.map(s=>`<option value="${s.id}">${esc(s.nome)}</option>`).join('')}</select></div>`}""")
# estorno: "o produto já tinha sido usado" não existe na psicologia
rep_ws("""<div class="ck-l"><label class="sw"><input type="checkbox" id="e-prod" checked> <span>O produto já tinha sido usado</span></label>
         <small>Se o procedimento foi feito, o insumo não volta para o estoque.</small></div>""",
    """${ehPsico()?'<input type="checkbox" id="e-prod" checked hidden>':`<div class="ck-l"><label class="sw"><input type="checkbox" id="e-prod" checked> <span>O produto já tinha sido usado</span></label>
         <small>Se o procedimento foi feito, o insumo não volta para o estoque.</small></div>`}""")
# boas-vindas: o primeiro serviço sem custo de produto
rep_ws("""<div class="grid2">
          <div class="field"><label for="ob-preco">Preço cobrado (R$)</label>
            <input id="ob-preco" data-k="preco" inputmode="decimal" placeholder="0,00" value="${v('preco')}"></div>
          <div class="field"><label for="ob-custo">Custo de produto (R$)</label>
            <input id="ob-custo" data-k="custo" inputmode="decimal" placeholder="0,00" value="${v('custo')}"></div>
        </div></div>
      <div class="nota">O <b>custo de produto</b> é o que sai do seu bolso a cada atendimento: creme, descartável, agulha, toxina. Um valor aproximado já serve.</div>""",
    """${ehPsico()?`<div class="field"><label for="ob-preco">Valor da sessão (R$)</label>
            <input id="ob-preco" data-k="preco" inputmode="decimal" placeholder="0,00" value="${v('preco')}"></div></div>
      <div class="nota">Atende online e presencial com valores diferentes? Cadastre os dois depois, em Valores.</div>`:`<div class="grid2">
          <div class="field"><label for="ob-preco">Preço cobrado (R$)</label>
            <input id="ob-preco" data-k="preco" inputmode="decimal" placeholder="0,00" value="${v('preco')}"></div>
          <div class="field"><label for="ob-custo">Custo de produto (R$)</label>
            <input id="ob-custo" data-k="custo" inputmode="decimal" placeholder="0,00" value="${v('custo')}"></div>
        </div></div>
      <div class="nota">O <b>custo de produto</b> é o que sai do seu bolso a cada atendimento: creme, descartável, agulha, toxina. Um valor aproximado já serve.</div>`}""")
rep("<h1>Qual procedimento você mais faz?</h1>", "<h1>${ehPsico()?'Quanto custa a sua sessão?':'Qual procedimento você mais faz?'}</h1>")
rep_ws("""<div class="field"><label>Ir até o cliente (R$ por visita)</label>
        <input id="f-desloc" inputmode="decimal" placeholder="0,00 = na sala" value="${edV&&edV.desloc?edV.desloc:''}"></div>""",
    """${ehPsico()?`<input type="hidden" id="f-desloc" value="${edV&&edV.desloc?edV.desloc:''}">`:`<div class="field"><label>Ir até o cliente (R$ por visita)</label>
        <input id="f-desloc" inputmode="decimal" placeholder="0,00 = na sala" value="${edV&&edV.desloc?edV.desloc:''}"></div>`}""")
