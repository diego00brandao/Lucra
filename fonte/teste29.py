"""Assinaturas: botão Salvar, assinatura do paciente em qualquer documento, a sua guardada e reaproveitada, assinar de novo."""
import asyncio
from playwright.async_api import async_playwright
import teste as T
SH='/home/claude/work/shots'
async def risca(pg,sel,k=0):
    await pg.locator(sel).scroll_into_view_if_needed(); await pg.wait_for_timeout(150)
    b=await pg.locator(sel).bounding_box(); await pg.mouse.move(b['x']+30,b['y']+80); await pg.mouse.down()
    for i in range(8): await pg.mouse.move(b['x']+50+i*22,b['y']+40+(i%2)*(50-k*15))
    await pg.mouse.up()
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');demoArea();S.perfil={nome:'Rafa',registro:'SP 1',doc:'12345678909'};salvar()")
        cid=await pg.evaluate("S.clientes[0].id")
        # receita: assinatura do paciente é opcional (fechada), a sua aparece para desenhar
        await pg.evaluate(f"abreDoc('{cid}','receita')"); await pg.wait_for_timeout(500)
        assert not await pg.evaluate("document.querySelector('#dc-pac').open") and await pg.evaluate("document.querySelector('#dc-eu').open")
        await pg.fill('#dc-tx','Uso interno\n1. Remédio X')
        await risca(pg,'#dc-eucv')
        await pg.click('#dc-pac summary'); await pg.wait_for_timeout(200); await risca(pg,'#dc-ass')
        await pg.screenshot(path=f'{SH}/assinaturas.png',full_page=True)
        await pg.click('#dc-salva'); await pg.wait_for_timeout(500)
        d=await pg.evaluate("S.documentos[0]")
        assert d['assinatura'].startswith('data:image') and d['assProf'].startswith('data:image'), list(d)
        assert await pg.evaluate("S.perfil.assinatura")==d['assProf']
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # próximo documento já traz a sua assinatura, sem desenhar de novo
        await pg.evaluate(f"abreDoc('{cid}','atestado')"); await pg.wait_for_timeout(500)
        assert await pg.locator('#dc-euv img').count()==1 and await pg.is_checked('#dc-euinc') and await pg.locator('#dc-euwrap[hidden]').count()==1
        await pg.click('#dc-salva'); await pg.wait_for_timeout(400)
        a=await pg.evaluate("S.documentos.find(d=>d.tipo==='atestado')"); assert a.get('assProf') and not a.get('assinatura'), list(a)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # reabrir: assinatura aparece, dá para assinar de novo e salvar; impressão traz as duas
        await pg.evaluate(f"abreDoc('{cid}','',S.documentos[0].id)"); await pg.wait_for_timeout(500)
        assert await pg.locator('#dc-assv img').count()==1
        await pg.click('#dc-refaz'); await pg.wait_for_timeout(200); await risca(pg,'#dc-ass',2)
        antes=d['assinatura']; await pg.click('#dc-salva'); await pg.wait_for_timeout(400)
        assert await pg.evaluate("S.documentos[0].assinatura")!=antes
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate(f"imprimir(docHTML(S.documentos[0]))"); await pg.wait_for_timeout(200)
        assert await pg.locator('#impressao .rc-ass img').count()==2
        await pg.evaluate("document.body.classList.remove('imprime')")
        # desmarcar "incluir" tira a sua assinatura do documento
        await pg.evaluate(f"abreDoc('{cid}','',S.documentos.find(d=>d.tipo==='atestado').id)"); await pg.wait_for_timeout(500)
        await pg.uncheck('#dc-euinc'); await pg.click('#dc-salva'); await pg.wait_for_timeout(400)
        assert not await pg.evaluate("S.documentos.find(d=>d.tipo==='atestado').assProf")
        # recibo e informe levam a sua assinatura
        assert 'img' in await pg.evaluate(f"reciboHTML('{cid}',mesAtual(),'')")
        await br.close()
    assert not er, er
    print('SEM ERROS (29)')
asyncio.run(main())
