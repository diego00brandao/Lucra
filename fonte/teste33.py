"""Planos: Básico bloqueia o que é do Médio (com cadeado e explicação); Médio libera; Premium libera unidades."""
import asyncio
from playwright.async_api import async_playwright
import teste as T
async def abre(br,plano):
    ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
    pg=await ctx.new_page(); er=[]; pg.on('pageerror',lambda e:er.append(str(e)))
    await pg.goto(T.NOVO+('&' if '?' in T.NOVO else '?')+'plano='+plano); await pg.wait_for_timeout(700)
    await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');demoArea();window.open=()=>({closed:false,focus(){},location:{}})")
    await pg.wait_for_timeout(300); return ctx,pg,er
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        ctx,pg,er=await abre(br,'basico')
        assert await pg.evaluate("planoAtual()")=='basico'
        assert await pg.locator('#menu button[data-t=orcamentos].bloq .cad').count()==1
        await pg.evaluate("ir('orcamentos')"); await pg.wait_for_timeout(400)
        assert await pg.evaluate("tela")!='orcamentos' and 'plano Médio' in await pg.inner_text('.sheet')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        cid=await pg.evaluate("S.clientes[0].id"); await pg.evaluate(f"historico('{cid}')"); await pg.wait_for_timeout(500)
        assert await pg.locator('.sheet [data-doc-novo]').count()==0 and await pg.locator('.sheet #h-pl-trava').count()==1 and await pg.locator('.sheet #h-pr').count()==0
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate("zapAbrir('https://wa.me/5511999999999?text=oi')"); await pg.wait_for_timeout(400)
        assert 'WhatsApp' in await pg.inner_text('.sheet'); await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate("ir('registrar')"); await pg.wait_for_timeout(300); assert await pg.locator('#f-sess').evaluate("e=>e.closest('.field').hidden")
        assert not await pg.evaluate("modOn('estoque')") and not await pg.evaluate("modOn('equipe')")
        assert not er, er; await ctx.close()
        ctx,pg,er=await abre(br,'medio')
        assert await pg.locator('#menu button.bloq').count()==0
        await pg.evaluate("ir('orcamentos')"); await pg.wait_for_timeout(300); assert await pg.evaluate("tela")=='orcamentos'
        assert not await pg.evaluate("temRecurso('unidades')") and await pg.evaluate("limiteEquipe()")==3
        assert not er, er; await ctx.close()
        ctx,pg,er=await abre(br,'premium'); assert await pg.evaluate("temRecurso('unidades')"); await ctx.close()
        await br.close()
    print('SEM ERROS (33)')
asyncio.run(main())
