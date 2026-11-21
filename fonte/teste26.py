"""Psicologia: prontuário CFP, questionários (na sessão e página do link), documentos psicológicos com contrato assinado,
fechamento do mês e informe para o IR."""
import asyncio, json
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
        await pg.evaluate("UI.boasVindas=true;UI.zap='web';salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('psico');demoArea();S.perfil={nome:'Crysthian Lima',registro:'06/123456',doc:'12345678909',cidade:'São Paulo'};salvar();window.open=()=>({closed:false,focus(){},location:{}})"); await pg.wait_for_timeout(300)
        cid=await pg.evaluate("S.clientes.find(c=>S.evolucoes.some(e=>e.clienteId===c.id)).id"); nome=await pg.evaluate(f"cli('{cid}').nome")
        await pg.evaluate(f"historico('{cid}')"); await pg.wait_for_timeout(500)
        assert await pg.locator('.sheet #h-pp').count()==1 and await pg.locator('.sheet [data-q-ag]').count()==2 and await pg.locator('.sheet #h-ir').count()==1
        docs=await pg.evaluate("[...document.querySelectorAll('.sheet [data-doc-novo]')].map(b=>b.dataset.docNovo)")
        assert docs==['declaracao','contrato','atestadoPsi','relatorio','laudo','parecer'], docs
        # prontuário
        await pg.click('.sheet #h-pp'); await pg.wait_for_timeout(500)
        await pg.select_option('#pp-ab','Terapia cognitivo-comportamental (TCC)'); await pg.fill('#pp-dem','Ansiedade no trabalho'); await pg.fill('#pp-obj','Reduzir crises')
        await pg.click('#pp-imp'); await pg.wait_for_timeout(300)
        imp=await pg.inner_text('#impressao')
        assert 'Prontuário psicológico' in imp and 'Ansiedade no trabalho' in imp and 'CRP 06/123456' in imp and 'Evolução' in imp, imp[:400]
        await pg.evaluate("document.body.classList.remove('imprime')")
        assert (await pg.evaluate(f"prontPsiDe('{cid}').abordagem")).startswith("Terapia")
        assert await pg.evaluate("CLINICO.includes('prontPsi')&&CLINICO.includes('escalas')")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # questionário aplicado na sessão
        await pg.evaluate(f"aplicarAgora('{cid}','phq9')"); await pg.wait_for_timeout(500)
        for i in range(9): await pg.click(f'input[name="qa{i}"][value="{2 if i<5 else (1 if i==8 else 0)}"]', force=True)
        await pg.screenshot(path=f'{SH}/phq9.png',full_page=True)
        await pg.click('#qa-ok'); await pg.wait_for_timeout(400)
        e=await pg.evaluate("S.escalas[0]"); assert e['pontos']==11 and e['instr']=='phq9', e
        await pg.evaluate(f"S.escalas.push({{id:'x',clienteId:'{cid}',instr:'phq9',data:'2026-10-01',resp:[3,3,3,3,3,0,0,0,0],pontos:15,via:'sessao'}});salvar();historico('{cid}')"); await pg.wait_for_timeout(500)
        t=await pg.inner_text('.sheet'); assert '11/27 · moderado' in t and 'item 9 marcado' in t, t[:300]
        assert await pg.locator('.sheet .esc-g').count()==1
        await pg.screenshot(path=f'{SH}/ficha-psi.png',full_page=True)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # contrato com valor e assinatura
        await pg.evaluate(f"abreDoc('{cid}','contrato')"); await pg.wait_for_timeout(500)
        await pg.fill('#dc-vl','180'); await pg.select_option('#dc-fr','quinzenal'); await pg.wait_for_timeout(100)
        await pg.locator('#dc-ass').scroll_into_view_if_needed(); await pg.wait_for_timeout(200)
        tx=await pg.input_value('#dc-tx'); assert 'R$ 180,00' in tx and 'quinzenal' in tx and nome in tx and 'CRP 06/123456' in tx, tx[:300]
        cv=await pg.locator('#dc-ass').bounding_box(); await pg.mouse.move(cv['x']+30,cv['y']+80); await pg.mouse.down()
        for i in range(8): await pg.mouse.move(cv['x']+50+i*20,cv['y']+50+(i%2)*40)
        await pg.mouse.up(); await pg.click('#dc-imp'); await pg.wait_for_timeout(300)
        d=await pg.evaluate("S.documentos.find(d=>d.tipo==='contrato')"); assert d['assinatura'].startswith('data:image'), d.keys()
        assert 'Contrato terapêutico' in await pg.inner_text('#impressao') and await pg.locator('#impressao img').count()==1
        await pg.evaluate("document.body.classList.remove('imprime')"); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # relatório com a estrutura do CFP
        await pg.evaluate(f"abreDoc('{cid}','relatorio')"); await pg.wait_for_timeout(400)
        tx=await pg.input_value('#dc-tx'); assert '2. Descrição da demanda' in tx and '5. Conclusão' in tx and 'Crysthian Lima' in tx, tx
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # informe IR
        ano=await pg.evaluate("hojeISO().slice(0,4)")
        await pg.evaluate(f"abreInforme('{cid}')"); await pg.wait_for_timeout(400); await pg.click(f'[data-ir-a="{ano}"]'); await pg.wait_for_timeout(200)
        tot=await pg.evaluate(f"pagosNoAno('{cid}',{ano}).reduce((a,m)=>a+m.total,0)"); assert tot>0
        await pg.click('#ir-imp'); await pg.wait_for_timeout(300)
        imp=await pg.inner_text('#impressao'); assert 'Declaração de pagamentos' in imp and 'Imposto de Renda' in imp and 'CPF/CNPJ 123.456.789-09' in imp, imp[:300]
        await pg.evaluate("document.body.classList.remove('imprime')"); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # fechamento do mês
        assert await pg.evaluate("permitido('fechamento')")
        await pg.evaluate(f"cli('{cid}').tel=cli('{cid}').tel||'11988887777'")
        await pg.evaluate(f"S.receber.push({{id:'rr1',clienteId:'{cid}',servicoId:S.servicos[0].id,valor:150,data:hojeISO(),desc:'Sessão'}});salvar();ir('fechamento')"); await pg.wait_for_timeout(400)
        assert await pg.locator('.pill.bad', has_text='deve').count()>=1
        await pg.screenshot(path=f'{SH}/fechamento.png',full_page=True)
        await pg.locator(f'[data-fc-zap="{cid}"]').click(); await pg.wait_for_timeout(200)
        await pg.locator(f'[data-fc-rec="{cid}"]').click(); await pg.wait_for_timeout(400); assert await pg.locator('.sheet').count()==1
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # só em psicologia
        await pg.evaluate("mudaArea('odonto')"); assert not await pg.evaluate("permitido('fechamento')")
        ov=await pg.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"); assert ov<=1, ov
        # página pública do questionário (respostas para o servidor de mentira)
        env={}
        async def rota(route):
            r=route.request; n=r.url.rsplit('/',1)[1]; a=json.loads(r.post_data or '{}')
            if n=='ver_questionario': return await route.fulfill(status=200,content_type='application/json',body=json.dumps({'clinica':'Consultório Lima','area':'psico','instrumento':'phq9','respondido':False}))
            if n=='responder_questionario': env.update(a); return await route.fulfill(status=200,content_type='application/json',body='"ok"')
            return await route.fulfill(status=404,body='{}')
        p2=await ctx.new_page(); p2.on('pageerror',lambda e:er.append(str(e))); await p2.route('**/rest/v1/rpc/**',rota)
        await p2.goto(T.NOVO+('&' if '?' in T.NOVO else '?')+'responder=tok1'); await p2.wait_for_timeout(800)
        assert 'Questionário' in await p2.inner_text('#pub')
        await p2.click('#p-ok'); await p2.wait_for_timeout(200); assert not env
        for i in range(9): await p2.click(f'input[name="qp{i}"][value="{1 if i==8 else 0}"]', force=True)
        await p2.click('#p-ok'); await p2.wait_for_timeout(500)
        assert env.get('p_respostas')==[0,0,0,0,0,0,0,0,1] and env.get('p_token')=='tok1', env
        t=await p2.inner_text('#pub'); assert 'Obrigado' in t and '188' in t, t
        await p2.screenshot(path=f'{SH}/quest-publico.png',full_page=True)
        await br.close()
    assert not er, er
    print('SEM ERROS (26)')
asyncio.run(main())
