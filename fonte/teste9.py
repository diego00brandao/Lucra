import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844})
        await ctx.route('**/fonts.g*/**',lambda r:r.abort()); pg=await ctx.new_page(); er=[]; pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('psico');demoArea();S.agenda.push({id:'lk1',data:hojeISO(),hora:'09:00',clienteId:S.clientes[0].id,servicoId:S.servicos[0].id,status:'marcado',link:'meet.google.com/abc-defg-hij'});salvar();agDia=hojeISO();ir('agenda')")
        await pg.wait_for_timeout(400)
        h=await pg.get_attribute('[data-item-ag=lk1] a[href*=meet]','href'); assert h=='https://meet.google.com/abc-defg-hij', h
        await pg.evaluate("ir('novoag')"); await pg.wait_for_timeout(300)
        await pg.select_option('#a-cli',index=1); await pg.click('[data-pk-h="20"]'); await pg.fill('#a-link','meet.google.com/xyz-abcd-efg'); await pg.click('#a-add'); await pg.wait_for_timeout(600)
        assert await pg.evaluate("S.agenda.some(a=>a.link==='https://meet.google.com/xyz-abcd-efg')")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.evaluate("ir('novoag')"); await pg.wait_for_timeout(800)
        await pg.click('#pk-outro'); await pg.type('#pk-hm','1410'); assert await pg.input_value('#pk-hm')=='14:10'
        await pg.click('#pk-hm-ok'); await pg.wait_for_timeout(200)
        assert await pg.input_value('#a-hora')=='14:10' and await pg.locator('[data-pk-m][aria-pressed=true]').count()==0 and '14:10' in await pg.inner_text('#pk-outro') and '14h10' in await pg.inner_text('.pk-res')
        await pg.screenshot(path='/home/claude/work/outro.png',full_page=True)
        await pg.click('#pk-outro'); await pg.fill('#pk-hm','25:00'); await pg.click('#pk-hm-ok'); assert await pg.input_value('#a-hora')=='14:10'
        assert not er, er
        await br.close(); print('SEM ERROS (9)')
asyncio.run(main())
