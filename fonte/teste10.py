import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); er=[]
        for vw in [390,1366]:
            ctx=await br.new_context(viewport={'width':vw,'height':860}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
            pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
            await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
            await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';demo()")
            d=await pg.evaluate("(()=>{const v=S.vendas.filter(v=>v.data<=hojeISO()).sort((a,b)=>b.data.localeCompare(a.data))[0];return v.data})()")
            await pg.evaluate(f"cxDia='{d}';ir('caixa')"); await pg.wait_for_timeout(400)
            esper=await pg.evaluate(f"S.vendas.filter(v=>v.data==='{d}').reduce((a,v)=>a+num(v.valor),0)")
            tx=await pg.inner_text('#view'); assert await pg.evaluate(f"brl({esper})") in tx and 'Por forma de pagamento' in tx, tx[:400]
            assert await pg.locator('#menu button[data-t=caixa][aria-current=true]').count()==1
            ov=await pg.evaluate("document.documentElement.scrollWidth-innerWidth"); assert ov<=0, ov
            await pg.screenshot(path=f'/home/claude/work/caixa-{vw}.png',full_page=True)
            await pg.click('#cx-reg'); await pg.wait_for_timeout(300); assert await pg.evaluate("tela")=='registrar'
            await ctx.close()
        await br.close(); assert not er, er; print('SEM ERROS (10)')
asyncio.run(main())
