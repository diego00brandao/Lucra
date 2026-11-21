import asyncio
from playwright.async_api import async_playwright
L='<path d="M11 8.5V20a3 3 0 0 0 3 3h7.5" fill="none" stroke="#FFF6EE" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M15.5 17.5c0-5 3-8.5 8.5-9 0 5.5-3 9-8.5 9Z" fill="#E0B36A"/>'
ARRED=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7.5" fill="#7A2E4D"/>{L}</svg>'
CHEIO=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#7A2E4D"/><g transform="translate(16 16) scale(.72) translate(-16.5 -15.5)">{L}</g></svg>'
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        for nome,svg,t,transp in (('icon-192',ARRED,192,True),('icon-512',ARRED,512,True),('icon-maskable-512',CHEIO,512,False),('apple-touch-icon',CHEIO,180,False)):
            pg=await br.new_page(viewport={'width':t,'height':t})
            await pg.set_content(f'<style>html,body{{margin:0;background:transparent}}svg{{display:block;width:{t}px;height:{t}px}}</style>{svg}')
            await pg.screenshot(path=f'/home/claude/lucra-app/{nome}.png',omit_background=transp); await pg.close()
        await br.close()
asyncio.run(main())
