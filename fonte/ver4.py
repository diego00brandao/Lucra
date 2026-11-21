import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        for w,h,n in ((412,900,'m'),(1366,860,'d')):
            ctx=await br.new_context(viewport={'width':w,'height':h},device_scale_factor=2 if w<500 else 1); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
            pg=await ctx.new_page(); await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(700)
            await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('psico');demoArea();ir('painel')")
            await pg.wait_for_timeout(500); await pg.screenshot(path=f'shots/140-{n}.png')
            await ctx.close()
        await br.close()
asyncio.run(main())
