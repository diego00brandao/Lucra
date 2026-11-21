"""Não perder ajustes: nome da clínica e módulos ficam salvos mesmo fechando o app logo depois, e chegam no outro aparelho."""
import asyncio
from playwright.async_api import async_playwright
import teste12 as M
async def main():
    srv=M.servir()
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        async def aparelho():
            ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort()); await ctx.route(M.SB+'/**',M.sb_route)
            pg=await ctx.new_page(); pg.on('pageerror',lambda e:M.erros.append('pageerror: '+str(e))); await pg.goto(M.URL); await pg.wait_for_timeout(900); return ctx,pg
        ca,a=await aparelho()
        await a.click('[data-pt=criar]'); await a.fill('#pt-nome','Dono'); await a.fill('#pt-email','n@n.com'); await a.fill('#pt-senha','senha123'); await a.click('#pt-ok'); await a.wait_for_timeout(1500)
        await a.fill('#cc-nome','Nome Antigo'); await a.click('[data-cc=estetica]'); await a.wait_for_timeout(100); await a.click('#cc-ok'); await a.wait_for_timeout(1500)
        await a.evaluate("document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow=''"); await M.espera(a,"syncEst==='ok'&&!pendente()")
        cid=await a.evaluate("CONTA.cid")
        # troca o nome e o módulo e fecha o app na hora
        await a.evaluate("ir('ajustes')"); await a.wait_for_timeout(400)
        await a.fill('#a-nome','Studio Novo'); await a.click('#a-nome-ok')
        await a.evaluate("UI.mod.estoque=!modOn('estoque');salvarUI()"); est=await a.evaluate("UI.mod.estoque")
        await a.wait_for_timeout(300); await a.reload(); await a.wait_for_timeout(1800)
        assert await a.evaluate("UI.clinica")=='Studio Novo' and M.DB['clinicas'][cid]['nome']=='Studio Novo', (await a.evaluate("UI.clinica"), M.DB['clinicas'][cid])
        assert await a.evaluate("UI.mod.estoque")==est
        # sem internet: o nome fica guardado e vai quando a conexão volta
        await ca.route(M.SB+'/rest/**',lambda r:r.abort())
        await a.evaluate("ir('ajustes')"); await a.wait_for_timeout(400); await a.fill('#a-nome','Studio Offline'); await a.evaluate("document.querySelector('#a-nome-ok').click()"); await a.wait_for_timeout(500)
        assert M.DB['clinicas'][cid]['nome']=='Studio Novo'
        await ca.unroute(M.SB+'/rest/**'); await a.reload(); await a.wait_for_timeout(2000)
        assert await a.evaluate("UI.clinica")=='Studio Offline' and M.DB['clinicas'][cid]['nome']=='Studio Offline', (await a.evaluate("UI.clinica"), M.DB['clinicas'][cid])
        await M.espera(a,"syncEst==='ok'&&!pendente()")
        # outro aparelho recebe o nome e os módulos
        cb,b=await aparelho(); await b.fill('#pt-email','n@n.com'); await b.fill('#pt-senha','senha123'); await b.click('#pt-ok'); await b.wait_for_timeout(2000)
        assert await b.evaluate("UI.clinica")=='Studio Offline' and await b.evaluate("UI.mod.estoque")==est, await b.evaluate("[UI.clinica,UI.mod]")
        await br.close()
    srv.shutdown()
    print('\n'.join(M.erros) if M.erros else 'SEM ERROS (31)')
asyncio.run(main())
