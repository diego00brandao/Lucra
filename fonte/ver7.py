import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        for z in ('m','g','gg'):
            pg=await br.new_page(viewport={'width':360,'height':740}); await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(600)
            await pg.evaluate(f"UI.boasVindas=true;UI.ap.tam='{z}';salvarUI();aparencia();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';demo();ir('painel')")
            await pg.click('#b-menu'); await pg.wait_for_timeout(400)
            print(z, await pg.evaluate("(()=>{const r=document.querySelector('#menu').getBoundingClientRect();return [Math.round(r.top),Math.round(r.bottom),innerHeight]})()"))
            await pg.close()
        await br.close()
asyncio.run(main())
