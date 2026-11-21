import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); pg=await (await br.new_context(viewport={'width':390,'height':844})).new_page()
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();mudaArea('psico');demoArea();ir('servicos')"); await pg.wait_for_timeout(400)
        assert await pg.locator('#menu button[data-t=servicos] .rot').text_content()=='Serviços e valores'
        tx=await pg.inner_text('#view'); assert 'Serviços e valores' in tx and 'e valores e valores' not in tx, tx[:300]
        await pg.evaluate("render();render()"); tx=await pg.inner_text('#view'); assert 'e valores e valores' not in tx
        t=(await pg.text_content('#menu')).upper(); assert t.index('LUCRO')<t.index('CAIXA DO DIA')<t.index('ATENDIMENTO')
        await br.close(); print('SEM ERROS (15)')
asyncio.run(main())
