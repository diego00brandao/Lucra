"""Convênios (cadastro, preço, guia no Atendeu, enviada, paga com glosa) e funil de orçamentos."""
import asyncio
from playwright.async_api import async_playwright
import teste as T
SH='/home/claude/work/shots'
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        async def dlg(d): er.append('dialogo '+d.message); await d.dismiss()
        pg.on('dialog',dlg)
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;UI.zap='web';salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');demoArea();window.open=()=>({closed:false,focus(){},location:{}})"); await pg.wait_for_timeout(300)
        # cadastro do convênio com preço próprio
        await pg.evaluate("ir('convenios')"); await pg.wait_for_timeout(300)
        assert await pg.locator('.vazio', has_text='Nenhum convênio').count()==1
        await pg.click('.vazio [data-cv-aba=cad]'); await pg.wait_for_timeout(300)
        sid=await pg.evaluate("S.servicos[0].id")
        await pg.fill('#cv-n','Amil Dental'); await pg.fill('#cv-p','45'); await pg.fill(f'[data-cv-pr="{sid}"]','80'); await pg.click('#cv-ok'); await pg.wait_for_timeout(300)
        cv=await pg.evaluate("S.convenios[0]"); assert cv['nome']=='Amil Dental' and cv['prazo']==45 and cv['precos'][sid]==80, cv
        await pg.screenshot(path=f'{SH}/convenios-cad.png',full_page=True)
        # paciente usa o convênio (pelo cadastro)
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(300)
        cid=await pg.evaluate("S.clientes[0].id")
        await pg.click(f'[data-ed-c="{cid}"]'); await pg.wait_for_timeout(300)
        assert await pg.locator('#c-conv').count()==1
        await pg.select_option('#c-conv',cv['id']); await pg.fill('#c-cart','123456'); await pg.click('#c-add'); await pg.wait_for_timeout(300)
        c=await pg.evaluate(f"cli('{cid}')"); assert c['convenioId']==cv['id'] and c['carteira']=='123456', c
        # novo paciente também guarda
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(300)
        await pg.click('text=Novo paciente'); await pg.wait_for_timeout(300)
        await pg.fill('#c-nome','Teste Convênio'); await pg.select_option('#c-conv',cv['id']); await pg.click('#c-add'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.clientes.find(c=>c.nome==='Teste Convênio').convenioId")==cv['id']
        # Atendeu pelo convênio vira guia, não caixa
        aid=await pg.evaluate(f"(()=>{{const a={{id:uid(),clienteId:'{cid}',servicoId:'{sid}',data:hojeISO(),hora:'09:00',status:'marcado'}}; S.agenda.push(a); salvar(); agDia=hojeISO(); ir('agenda'); return a.id}})()"); await pg.wait_for_timeout(300)
        nv=await pg.evaluate("S.vendas.length")
        await pg.click(f'[data-ag="{aid}"][data-acao="concluir"]') if await pg.locator(f'[data-ag="{aid}"][data-acao="concluir"]').count() else await pg.evaluate(f"document.querySelector('[data-ag=\"{aid}\"]:not([data-acao=faltou]):not([data-acao=excluir])').click()")
        await pg.wait_for_timeout(500)
        assert 'Amil Dental' in await pg.inner_text('#k-conv') and '80' in await pg.inner_text('#k-conv')
        await pg.click('#k-conv'); await pg.wait_for_timeout(500)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.vendas.length")==nv
        g=await pg.evaluate("S.guias[0]"); assert g['valor']==80 and g['status']=='aberta' and g['agId']==aid, g
        assert await pg.evaluate(f"S.agenda.find(a=>a.id==='{aid}').status")=='concluido'
        # enviar e receber com glosa
        await pg.evaluate("convAba='guias';ir('convenios')"); await pg.wait_for_timeout(300)
        await pg.click('[data-gu-todas=aberta]'); await pg.click('#gu-env'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.guias[0].status")=='enviada'
        await pg.click('[data-gu-todas=enviada]'); await pg.click('#gu-pag'); await pg.wait_for_timeout(500)
        assert await pg.evaluate("document.querySelector('#pg-f').value")=='transf'
        await pg.fill(f'[data-pg="{g["id"]}"]','70'); await pg.wait_for_timeout(100)
        assert 'glosa' in await pg.inner_text('#pg-s')
        await pg.screenshot(path=f'{SH}/convenios-pagou.png',full_page=True)
        await pg.click('#pg-ok'); await pg.wait_for_timeout(400)
        g=await pg.evaluate("S.guias[0]"); assert g['status']=='paga' and g['recebido']==70 and g['glosa']==10, g
        v=await pg.evaluate("S.vendas.slice(-1)[0]"); assert v['valor']==70 and v['forma']=='transf' and v['servicoId']==sid, v
        k=await pg.evaluate("conta(S.vendas.slice(-1)[0])"); assert k['taxa']==0, k
        await pg.screenshot(path=f'{SH}/convenios.png',full_page=True)
        # psicologia também tem convênio; estética não
        assert await pg.evaluate("permitido('convenios')")
        await pg.evaluate("mudaArea('estetica')"); await pg.wait_for_timeout(200)
        assert not await pg.evaluate("permitido('convenios')")

        # ── funil de orçamentos (estética) ──
        await pg.evaluate("demoArea()"); await pg.wait_for_timeout(200)
        c1=await pg.evaluate("S.clientes[0].id"); c2=await pg.evaluate("S.clientes[1].id"); s1=await pg.evaluate("S.servicos[0].id")
        await pg.evaluate(f"""S.orcamentos=[{{id:'o1',data:somaDias(hojeISO(),-5),status:'aberto',clienteId:'{c1}',desc:0,forma:'pix',parcelas:2,itens:[{{servicoId:'{s1}',sessoes:1,valor:500}}]}},
          {{id:'o2',data:somaDias(hojeISO(),-1),status:'aberto',clienteId:'{c2}',desc:0,forma:'pix',parcelas:2,itens:[{{servicoId:'{s1}',sessoes:2,valor:900}}]}}]; S.clientes.slice(0,2).forEach(c=>c.tel=c.tel||'11988887777'); salvar()""")
        await pg.evaluate("ir('hoje')"); await pg.wait_for_timeout(300)
        assert await pg.locator('.aviso', has_text='orçamento esperando resposta').count()==1
        await pg.evaluate("ir('orcamentos')"); await pg.wait_for_timeout(300)
        assert await pg.locator('.pill.war', has_text='chamar').count()==1
        await pg.click('[data-fu-zap="o1"]'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.orcamentos[0].contatos.length")==1 and await pg.locator('.pill.war', has_text='chamar').count()==0
        await pg.click('[data-fu-conv="o2"]'); await pg.wait_for_timeout(300); assert await pg.evaluate("S.orcamentos[1].etapa")=='conversa'
        await pg.click('[data-fu-no="o1"]'); await pg.wait_for_timeout(400); await pg.click('[data-mo="Achou caro"]'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("[S.orcamentos[0].status,S.orcamentos[0].motivo]")==['perdido','Achou caro']
        await pg.click('[data-fu-ok="o2"]'); await pg.wait_for_timeout(400); await pg.click('#fo-pl'); await pg.wait_for_timeout(600)
        assert await pg.evaluate("S.orcamentos[1].status")=='fechado' and await pg.evaluate(f"planoAberto('{c2}').etapas.length")==2
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate("ir('orcamentos')"); await pg.wait_for_timeout(300)
        assert '50%' in await pg.inner_text('.kpis')
        assert await pg.locator('.oc-l', has_text='Achou caro').count()==1
        await pg.screenshot(path=f'{SH}/orcamentos.png',full_page=True)
        # simulador mostra o perdido como "não fechou", sem botão de fechar
        await pg.evaluate("simAba='orc';ir('sim')"); await pg.wait_for_timeout(300)
        assert await pg.locator('[data-o-fecha="o1"]').count()==0 and await pg.locator('.pill', has_text='não fechou').count()==1
        # psicologia não tem a tela
        await pg.evaluate("mudaArea('psico')"); await pg.wait_for_timeout(200); assert not await pg.evaluate("permitido('orcamentos')")
        ov=await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"); assert ov<=1, ov
        await br.close()
    assert not er, er
    print('SEM ERROS (24)')
asyncio.run(main())
