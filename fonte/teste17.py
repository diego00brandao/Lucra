import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        assert await pg.evaluate("tela")=='hoje'
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('psico');demoArea();"
          "const h=hojeISO(),c=S.clientes[0];S.agenda.push({id:'h1',data:h,hora:'23:30',clienteId:c.id,servicoId:S.servicos[0].id,status:'marcado'},{id:'h2',data:somaDias(h,1),hora:'10:00',clienteId:c.id,servicoId:S.servicos[0].id,status:'marcado'},{id:'h3',data:somaDias(h,-2),hora:'10:00',clienteId:c.id,servicoId:S.servicos[0].id,status:'marcado'});"
          "c.nasc='1990-'+h.slice(5);salvar();ir('hoje')"); await pg.wait_for_timeout(400)
        tx=await pg.inner_text('#view')
        for t in ['hoje','sem resposta','Lembrar','para receber','Aniversário hoje']:
            assert t in tx, (t,tx[:800])
        assert 'Sobrou de verdade' not in tx
        await pg.screenshot(path='/home/claude/work/hoje.png',full_page=True)
        await pg.click('.aviso:has-text("sem resposta") [data-av]'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("tela")=='agenda' and await pg.evaluate("agDia")==await pg.evaluate("somaDias(hojeISO(),-2)")
        # tudo em dia
        await pg.evaluate("S.agenda=[];S.receber=[];S.clientes.forEach(c=>c.nasc='');S.vendas=S.vendas.filter(v=>!(v.sessoes>1));S.servicos.forEach(s=>s.retorno=0);salvar();ir('hoje')"); await pg.wait_for_timeout(300)
        assert 'Tudo em dia' in await pg.inner_text('#view')
        await br.close()
    assert not er, er; print('SEM ERROS (17)')
asyncio.run(main())
