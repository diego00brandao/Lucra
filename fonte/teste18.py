import asyncio
from playwright.async_api import async_playwright
import teste as T
SH='/home/claude/work/shots'
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        async def dlg(d): er.append('dialogo'); await d.dismiss()
        pg.on('dialog',dlg)
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;UI.zap='web';salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');demoArea();ir('clientes')"); await pg.wait_for_timeout(300)
        cid=await pg.evaluate("S.clientes[0].id")
        await pg.evaluate(f"historico('{cid}')"); await pg.wait_for_timeout(500)
        assert await pg.locator('.sheet #h-plano').count()==1 and await pg.locator('.sheet #h-odg').count()==1
        # odontograma: marcar cárie no 36 e pôr restauração no plano
        await pg.click('#h-odg'); await pg.wait_for_timeout(500)
        assert await pg.locator('[data-dt]').count()==32
        await pg.click('[data-dt="36"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-og-e=carie]'); await pg.wait_for_timeout(200)
        assert await pg.evaluate(f"S.odontogramas.find(o=>o.clienteId==='{cid}').dentes[36].e")=='carie'
        rid=await pg.evaluate("S.servicos.find(s=>/Restaura/.test(s.nome)).id")
        await pg.select_option('#og-s',rid); await pg.click('#og-pl'); await pg.wait_for_timeout(300)
        await pg.click('[data-dt="11"]'); await pg.wait_for_timeout(200); await pg.click('[data-og-e=canal]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=f'{SH}/odonto.png',full_page=True)
        alvos=await pg.evaluate("[...document.querySelectorAll('[data-dt]')].map(b=>b.getBoundingClientRect()).filter(r=>r.width<40||r.height<44).length")
        assert alvos==0, f'{alvos} dentes pequenos'
        ov=await pg.evaluate("document.querySelector('.sheet').scrollWidth-document.querySelector('.sheet').clientWidth"); assert ov<=2, ov
        pl=await pg.evaluate(f"JSON.stringify(planoAberto('{cid}').etapas.map(e=>[e.nome,e.regiao,e.status]))")
        assert 'Restaura' in pl and '"36"' in pl, pl
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # plano: adicionar etapa, agendar, atendeu => feita
        pid=await pg.evaluate(f"planoAberto('{cid}').id")
        await pg.evaluate(f"abrePlano('{pid}')"); await pg.wait_for_timeout(400)
        await pg.fill('#pl-r','46'); await pg.click('#pl-add'); await pg.wait_for_timeout(200)
        assert await pg.locator('.pl-et li').count()==2
        await pg.screenshot(path=f'{SH}/plano.png',full_page=True)
        e1=await pg.evaluate(f"planoAberto('{cid}').etapas[0].id")
        await pg.click(f'[data-pl-ag="{e1}"]'); await pg.wait_for_timeout(600)
        assert await pg.evaluate("tela")=='novoag' and await pg.input_value('#a-cli')==cid and await pg.input_value('#a-serv')==rid
        assert 'Etapa do plano' in await pg.inner_text('#view')
        dia=await pg.evaluate("somaDias(hojeISO(),3)")
        if dia[:7]!=await pg.evaluate("hojeISO().slice(0,7)"): await pg.click('#pk-prox')
        await pg.click(f'.pk-g [data-pk-d="{dia}"]'); hs=await pg.evaluate("[...document.querySelectorAll('[data-pk-h]')].find(b=>!b.classList.contains('ocup')).dataset.pkH")
        await pg.click(f'[data-pk-h="{hs}"]'); await pg.click('#a-add'); await pg.wait_for_timeout(700)
        et=await pg.evaluate(f"JSON.stringify(planoAberto('{cid}').etapas[0])"); assert '"agendado"' in et, et
        agid=await pg.evaluate(f"planoAberto('{cid}').etapas[0].agId")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate(f"posAtender(S.agenda.find(a=>a.id==='{agid}'))"); await pg.wait_for_timeout(300)
        assert await pg.evaluate(f"planoAberto('{cid}').etapas[0].status")=='feito'
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # agendamento apagado volta a etapa para "a fazer"
        e2=await pg.evaluate(f"(()=>{{const p=planoAberto('{cid}'),e=p.etapas[1];S.agenda.push({{id:'zz',data:hojeISO(),hora:'08:00',clienteId:'{cid}',servicoId:e.servicoId,status:'marcado'}});e.agId='zz';e.status='agendado';S.agenda=S.agenda.filter(a=>a.id!=='zz');totPlano(p);return e.status}})()")
        assert e2=='pendente'
        # Hoje mostra etapa para agendar
        await pg.evaluate("ir('hoje')"); await pg.wait_for_timeout(300); assert 'para agendar' in await pg.inner_text('#view')
        # orçamento vira plano
        await pg.evaluate(f"S.orcamentos.push({{id:'o1',data:hojeISO(),status:'aberto',clienteId:'{cid}',desc:0,forma:'pix',parcelas:1,itens:[{{servicoId:'{rid}',valor:600,sessoes:2}}]}});salvar();ir('simorc')"); await pg.wait_for_timeout(400)
        assert await pg.locator('[data-o-plano=o1]').count()==1; await pg.evaluate("document.querySelector('[data-o-plano=o1]').click()"); await pg.wait_for_timeout(500)
        n=await pg.evaluate("S.planos.find(p=>p.orcId==='o1').etapas.map(e=>e.valor)"); assert n==[300,300], n
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # psicologia não tem plano nem odontograma
        await pg.evaluate("mudaArea('psico');demoArea();"); cp=await pg.evaluate("S.clientes[0].id")
        await pg.evaluate(f"historico('{cp}')"); await pg.wait_for_timeout(400); assert await pg.locator('.sheet #h-plano').count()==0
        await br.close()
    assert not er, er; print('SEM ERROS (18)')
asyncio.run(main())
