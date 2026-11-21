import asyncio, sys
from playwright.async_api import async_playwright
FONT='/home/claude/work/fontes/node_modules/@fontsource/inter/files/'
async def main():
    erros=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        ctx=await br.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
        await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:erros.append(str(e))); pg.on('console',lambda m: m.type=='error' and erros.append(m.text))
        await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';demo();ir('painel')")
        for area in ['estetica','psico']:
            if area=='psico':
                await pg.evaluate("mudaArea('psico');demoArea();ir('painel')")
            for t in ['painel','lucro','novoag','agenda','retornos','clientes','registrar','atendmes','saida','saidas','servicos','taxas','simpag','simorc','ajustes']:
                await pg.evaluate(f"ir('{t}')"); await pg.wait_for_timeout(250)
                await pg.screenshot(path=f'shots/v4/{area}-{t}.png',full_page=True)
        await pg.click('#b-menu'); await pg.wait_for_timeout(400); await pg.screenshot(path='shots/v4/menu.png')
        await br.close()
    print(erros or 'sem erros')
asyncio.run(main())
