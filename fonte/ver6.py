import asyncio, sys
from playwright.async_api import async_playwright
F='/home/claude/work/fontes/node_modules/@fontsource/inter/files/'
CSS=''.join(f"@font-face{{font-family:'Inter';font-weight:{w};src:url(https://fonts.gstatic.com/inter-{w}.woff2) format('woff2')}}" for w in (400,500,600,700))
async def ctxf(br,w,h,sc):
    ctx=await br.new_context(viewport={'width':w,'height':h},device_scale_factor=sc)
    await ctx.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=CSS))
    async def fonte(r):
        ww=r.request.url.split('inter-')[1].split('.')[0]; await r.fulfill(status=200,content_type='font/woff2',body=open(F+f'inter-latin-{ww}-normal.woff2','rb').read())
    await ctx.route('https://fonts.gstatic.com/**',fonte); return ctx
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        errs=[]
        for w,h,n,sc in ((390,844,'m',2),(1440,900,'d',1)):
            ctx=await ctxf(br,w,h,sc); pg=await ctx.new_page(); pg.on('pageerror',lambda e:errs.append(str(e)))
            await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(800)
            await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';demo();ir('painel')")
            await pg.wait_for_timeout(600); await pg.screenshot(path=f'shots/150-{n}-painel.png',full_page=(n=='d'))
            if n=='m':
                await pg.click('#b-menu'); await pg.wait_for_timeout(400); await pg.screenshot(path='shots/151-m-menu.png')
                await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
            for t in ['agenda','clientes','vendas','servicos','sim','ajustes']:
                await pg.evaluate(f"ir('{t}')"); await pg.wait_for_timeout(400); await pg.screenshot(path=f'shots/152-{n}-{t}.png',full_page=True)
            await pg.evaluate("S.tema='escuro';tema();salvar();mudaArea('psico');demoArea();ir('painel')"); await pg.wait_for_timeout(500)
            await pg.screenshot(path=f'shots/153-{n}-psico-escuro.png')
            await ctx.close()
        print('erros',errs); await br.close()
asyncio.run(main())
