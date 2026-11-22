"""Teste grátis de 7 dias: conta nova com tudo liberado e aviso no Hoje; acabou o teste, vale o plano (Básico)."""
import asyncio
from playwright.async_api import async_playwright
import teste12 as M
async def main():
    srv=M.servir()
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route(M.SB+'/**',M.sb_route); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        a=await ctx.new_page(); a.on('pageerror',lambda e:M.erros.append(str(e))); await a.goto(M.URL); await a.wait_for_timeout(900)
        await a.click('[data-pt=criar]'); await a.fill('#pt-nome','Nova'); await a.fill('#pt-email','t@t.com'); await a.fill('#pt-senha','senha123'); await a.click('#pt-ok'); await a.wait_for_timeout(1500)
        await a.fill('#cc-nome','Clínica Teste'); await a.click('[data-cc=estetica]'); await a.click('#cc-ok'); await a.wait_for_timeout(1500)
        await a.evaluate("document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';ir('hoje')"); await a.wait_for_timeout(400)
        assert await a.evaluate("emTeste()") and await a.evaluate("planoAtual()")=='premium' and await a.evaluate("diasTeste()")==7
        assert 'faltam 7 dias' in await a.inner_text('#teste-b')
        assert await a.locator('#menu button.bloq').count()==0
        await a.click('#teste-b'); await a.wait_for_timeout(500); assert 'Teste grátis até' in await a.inner_text('#sec-plano')
        await a.screenshot(path='/home/claude/work/shots/teste-gratis.png')
        # acabou o teste: segue no Básico
        cid=await a.evaluate("CONTA.cid"); M.DB['clinicas'][cid]['teste_ate']='2020-01-01T00:00:00Z'
        await a.reload(); await a.wait_for_timeout(1800)
        assert not await a.evaluate("emTeste()") and await a.evaluate("planoAtual()")=='basico'
        await a.evaluate("ir('hoje')"); await a.wait_for_timeout(300); assert await a.locator('#teste-b').count()==0
        assert await a.locator('#menu button[data-t=orcamentos].bloq').count()==1
        await br.close()
    srv.shutdown()
    print('\n'.join(M.erros) if M.erros else 'SEM ERROS (34)')
asyncio.run(main())
