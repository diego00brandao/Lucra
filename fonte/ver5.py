import asyncio
from playwright.async_api import async_playwright
F='/home/claude/work/fontes/node_modules/@fontsource/inter/files/'
CSS=''.join(f"@font-face{{font-family:'Inter';font-weight:{w};src:url(https://fonts.gstatic.com/inter-{w}.woff2) format('woff2')}}" for w in (400,500,600,700))
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        for w,h,n,sc in ((1440,1000,'desk',1),(390,844,'cel',2)):
            ctx=await br.new_context(viewport={'width':w,'height':h},device_scale_factor=sc)
            await ctx.route('https://fonts.googleapis.com/**',lambda r:r.fulfill(status=200,content_type='text/css',body=CSS))
            async def fonte(r):
                w=r.request.url.split('inter-')[1].split('.')[0]; await r.fulfill(status=200,content_type='font/woff2',body=open(F+f'inter-latin-{w}-normal.woff2','rb').read())
            await ctx.route('https://fonts.gstatic.com/**',fonte)
            pg=await ctx.new_page(); await pg.goto('file:///home/claude/lucra-painel-novo.html'); await pg.wait_for_timeout(800)
            print(n,await pg.evaluate("document.fonts.check('16px Inter')"), await pg.evaluate("document.documentElement.scrollWidth-innerWidth"))
            await pg.screenshot(path=f'/home/claude/lucra-painel-novo-{n}.png',full_page=True)
            await ctx.close()
        await br.close()
asyncio.run(main())
