import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        ctx=await br.new_context(viewport={'width':412,'height':900},device_scale_factor=2); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.add_init_script("window.print=()=>{window.__p=1}")
        await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(700)
        await pg.evaluate("S.area='psico';demoArea();UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';S.tema='escuro';tema();ir('clientes')")
        await pg.wait_for_timeout(500)
        await pg.click(f'[data-ver-c="{await pg.evaluate("S.clientes[0].id")}"]'); await pg.wait_for_timeout(600)
        await pg.click('#h-rec'); await pg.wait_for_timeout(500)
        await pg.screenshot(path='shots/120-recibo-sheet.png')
        await pg.fill('#rb-cpf','473.518.008-71'); await pg.click('#rb-outro'); await pg.fill('#rb-pn','Mãe da Ana'); await pg.fill('#rb-pc','111.222.333-44')
        await pg.fill('#rb-n','Laerte Conceição Bezerra'); await pg.fill('#rb-d','229.211.058-02'); await pg.fill('#rb-r','06/146968'); await pg.fill('#rb-p','Psicólogo')
        await pg.locator('#rb-prev').scroll_into_view_if_needed(); await pg.wait_for_timeout(200)
        await pg.locator('#rb-prev').screenshot(path='shots/121-recibo.png')
        await pg.click('#rb-pr'); await pg.emulate_media(media='print'); await pg.set_viewport_size({'width':794,'height':1123}); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/122-print.png')
        print('erros',errs, 'print', await pg.evaluate('window.__p'))
        await br.close()
asyncio.run(main())
