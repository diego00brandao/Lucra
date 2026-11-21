import asyncio, re
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        ctx=await br.new_context(viewport={'width':412,'height':900},device_scale_factor=2); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); errs=[]; pg.on('pageerror',lambda e:errs.append(str(e)))
        await pg.goto('file:///home/claude/clinica-financeiro.html'); await pg.wait_for_timeout(800)
        await pg.click('#ob-ok'); await pg.click('[data-area=psico]'); await pg.fill('#ob-clinica','Crysthian Psicológico'); await pg.click('#ob-ok'); await pg.wait_for_timeout(300)
        await pg.click('#ob-ok'); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/110-ob3.png')
        await pg.fill('#ob-nome','Psicoterapia'); await pg.fill('#ob-preco','80'); await pg.click('#ob-ok'); await pg.wait_for_timeout(300)
        await pg.click('#ob-ok'); await pg.wait_for_timeout(300); await pg.click('#ob-fim'); await pg.wait_for_timeout(800)
        await pg.evaluate("S.tema='escuro';tema();ir('servicos')"); await pg.wait_for_timeout(400)
        await pg.evaluate("dobra['servicos:Novo serviço']=true;dobra['servicos:Taxas e encargos']=true;render()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path='shots/111-serv.png',full_page=True)
        await pg.evaluate("dobra['vendas:Registrar atendimento']=true;dobra['vendas:Registrar saída']=true;ir('vendas')"); await pg.wait_for_timeout(400)
        await pg.screenshot(path='shots/112-caixa.png',full_page=True)
        await pg.evaluate("ir('sim')"); await pg.wait_for_timeout(400); await pg.screenshot(path='shots/113-sim.png',full_page=True)
        txt=''
        for t in ['painel','agenda','clientes','vendas','servicos','sim','ajustes']:
            await pg.evaluate(f"ir('{t}')"); await pg.wait_for_timeout(300); txt+=' '+await pg.inner_text('#view')
        print('erros',errs)
        for w in ['produto','Produto','procedimento','Procedimento','cliente','Cliente','serviço','Serviço','reposição','insumo','domicílio']:
            hits=[m.start() for m in re.finditer(w,txt)]
            if hits: print(w,len(hits),'|',' … '.join(txt[max(0,h-50):h+40].replace('\n',' ') for h in hits[:4]))
        await br.close()
asyncio.run(main())
