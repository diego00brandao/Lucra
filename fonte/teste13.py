import asyncio
from playwright.async_api import async_playwright
import teste as T
SH='/home/claude/work/shots'
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(800)
        assert await pg.locator('#ob-demo').count()==0
        await pg.click('#ob-ok'); await pg.wait_for_timeout(300)
        await pg.click('[data-area=odonto]'); await pg.wait_for_timeout(200); await pg.fill('#ob-clinica','Odonto Teste')
        await pg.click('#ob-ok'); await pg.wait_for_timeout(300); await pg.click('#ob-ok'); await pg.wait_for_timeout(300)
        assert 'Quais serviços' in await pg.inner_text('.ob')
        await pg.click('#ob-ok'); await pg.wait_for_timeout(200); assert 'Escolha pelo menos' in await pg.inner_text('#toast')
        await pg.click('[data-sug="1"]'); await pg.click('[data-sug="2"]'); await pg.click('[data-sug="5"]'); await pg.wait_for_timeout(200)
        await pg.fill('#sp-1','280'); await pg.click('[data-sug="0"]'); await pg.wait_for_timeout(200)
        assert await pg.input_value('#sp-1')=='280', 'perdeu o preço digitado'
        await pg.click('[data-tira="0"]'); await pg.wait_for_timeout(200)
        await pg.fill('#ob-nome','Gengivoplastia'); await pg.fill('#ob-preco','900'); await pg.fill('#ob-custo','90')
        await pg.screenshot(path=f'{SH}/ob-servicos.png',full_page=True)
        await pg.click('#ob-ok'); await pg.wait_for_timeout(400)
        nomes=await pg.evaluate("S.servicos.map(s=>s.nome+':'+s.preco+':'+s.custo)")
        assert nomes==['Limpeza (profilaxia):280:20','Restauração em resina:300:40','Tratamento de canal:1200:120','Gengivoplastia:900:90'], nomes
        await pg.click('#ob-volta'); await pg.wait_for_timeout(300); await pg.click('#ob-ok'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.servicos.length")==4, 'duplicou ao voltar'
        await pg.click('#ob-ok'); await pg.wait_for_timeout(400)
        assert 'Limpeza (profilaxia)' in await pg.text_content('.ob')
        # psicologia continua com o passo de um valor só
        ctx2=await br.new_context(viewport={'width':390,'height':844}); await ctx2.route('**/fonts.g*/**',lambda r:r.abort())
        q=await ctx2.new_page(); await q.goto(T.NOVO); await q.wait_for_timeout(800)
        await q.click('#ob-ok'); await q.wait_for_timeout(300); await q.click('[data-area=psico]'); await q.wait_for_timeout(200)
        await q.click('#ob-ok'); await q.wait_for_timeout(300); await q.click('#ob-ok'); await q.wait_for_timeout(300)
        assert await q.locator('[data-sug]').count()==0 and await q.locator('#ob-nome').count()==1
        # olhinho da senha (porta da conta)
        await pg.evaluate("porta('entrar')"); await pg.fill('#pt-senha','segredo1')
        assert await pg.get_attribute('#pt-senha','type')=='password'
        await pg.click('[data-olho=pt-senha]'); assert await pg.get_attribute('#pt-senha','type')=='text' and await pg.get_attribute('[data-olho]','aria-label')=='Esconder senha'
        await pg.screenshot(path=f'{SH}/olho.png')
        await pg.click('[data-olho=pt-senha]'); assert await pg.get_attribute('#pt-senha','type')=='password'
        await br.close()
    assert not er, er; print('SEM ERROS (13)')
asyncio.run(main())
