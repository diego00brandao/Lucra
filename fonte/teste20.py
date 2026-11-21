import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;UI.mod.estoque=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');demoArea();S.produtos=[];salvar();ir('reserva')"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelectorAll('.dobravel').forEach(b=>{ if(/Estoque/.test(b.textContent)&&b.getAttribute('aria-expanded')!=='true')b.click() }); const d=document.querySelector('#pr-add').closest('details'); if(d)d.open=true"); await pg.wait_for_timeout(200)
        await pg.fill('#pr-nome','Anestésico'); await pg.fill('#pr-qtd','10'); await pg.fill('#pr-lote','A123')
        venc=await pg.evaluate("(()=>{const d=somaDias(hojeISO(),10);return d.slice(8)+d.slice(5,7)+d.slice(0,4)})()")
        await pg.type('#pr-val',venc); assert len(await pg.input_value('#pr-val'))==10
        await pg.click('#pr-add'); await pg.wait_for_timeout(300)
        p1=await pg.evaluate("S.produtos[0]"); assert p1['lote']=='A123' and p1['validade']==await pg.evaluate("somaDias(hojeISO(),10)"), p1
        assert 'vence em' in await pg.text_content('#view')
        await pg.evaluate("S.produtos.push({id:'x',nome:'Resina',qtd:5,min:1,servicoId:'',porAtend:0,validade:somaDias(hojeISO(),-3)});salvar();ir('hoje')"); await pg.wait_for_timeout(300)
        tx=await pg.inner_text('#view'); assert 'produto vencido' in tx, tx[:500]
        # validade inválida não salva
        await pg.evaluate("ir('reserva')"); await pg.wait_for_timeout(300)
        await pg.evaluate("const d=document.querySelector('#pr-add').closest('details'); if(d)d.open=true"); await pg.fill('#pr-nome','Luva'); await pg.type('#pr-val','31022027'); await pg.click('#pr-add'); await pg.wait_for_timeout(200)
        assert not await pg.evaluate("S.produtos.some(p=>p.nome==='Luva')")
        await br.close()
    assert not er, er; print('SEM ERROS (20)')
asyncio.run(main())
