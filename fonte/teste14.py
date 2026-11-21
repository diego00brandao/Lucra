import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        for area,campo in [('psico','#ev-foco'),('odonto','#pr-feito')]:
            ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
            pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
            await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
            await pg.evaluate(f"UI.boasVindas=true;UI.zap='web';salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('{area}');demoArea();S.agenda.push({{id:'ini1',data:hojeISO(),hora:'23:50',clienteId:S.clientes[0].id,servicoId:S.servicos[0].id,status:'marcado'}});salvar();agDia=hojeISO();ir('agenda')")
            await pg.wait_for_timeout(400)
            b=pg.locator('[data-item-ag=ini1] [data-ini]'); assert 'Iniciar' in await b.inner_text()
            await b.click(); await pg.wait_for_timeout(500)
            assert await pg.locator(campo).count()==1, 'não abriu as anotações'
            assert await pg.evaluate("S.agenda.find(a=>a.id==='ini1').inicio")
            assert await pg.evaluate("S.agenda.find(a=>a.id==='ini1').status")=='marcado'
            await pg.fill(campo,'Começou bem'); await pg.click('#ev-ok' if area=='psico' else '#pr-ok'); await pg.wait_for_timeout(500)
            assert 'desde' in await pg.inner_text('[data-item-ag=ini1]') and 'Anotações' in await pg.inner_text('[data-item-ag=ini1] [data-ini]')
            await pg.screenshot(path=f'/home/claude/work/shots/ini-{area}.png')
            # pagamento depois: não reabre a anotação já feita
            await pg.click('[data-item-ag=ini1] [data-acao=concluir]'); await pg.wait_for_timeout(500)
            for sel in ['#k-ok']:
                if await pg.locator(sel).count(): await pg.click(sel); await pg.wait_for_timeout(800)
            assert await pg.locator(campo).count()==0, 'reabriu a anotação'
            assert await pg.evaluate("S.agenda.find(a=>a.id==='ini1').status")=='concluido'
            await ctx.close()
        await br.close()
    assert not er, er; print('SEM ERROS (14)')
asyncio.run(main())
