import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        ctx=await br.new_context(viewport={'width':1366,'height':860}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';demo();ir('painel')")
        await pg.wait_for_timeout(300); await pg.screenshot(path='shots/v4/desk-painel.png')
        await pg.evaluate("ir('novoag')"); await pg.wait_for_timeout(300); await pg.screenshot(path='shots/v4/desk-novoag.png')
        await ctx.close()
        ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('psico');demoArea();S.tema='escuro';tema();ir('novoag')")
        await pg.wait_for_timeout(300); await pg.click('[data-pk-h="14"]'); await pg.screenshot(path='shots/v4/esc-novoag.png')
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(300); await pg.locator('[data-ver-c]').first.click(); await pg.wait_for_timeout(600)
        await pg.screenshot(path='shots/v4/esc-ficha.png')
        await br.close()
asyncio.run(main())
