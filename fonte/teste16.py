import asyncio
from playwright.async_api import async_playwright
import teste as T
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        assert await pg.evaluate("fmtMilhar('10000')")=='10.000' and await pg.evaluate("fmtMilhar('1500,5')")=='1.500,5' and await pg.evaluate("fmtMilhar('10000.5',true)")=='10.000,5'
        assert await pg.evaluate("num(fmtMilhar('125000,90'))")==125000.9
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('psico');demoArea();S.meta=10000;salvar();ir('painel')"); await pg.wait_for_timeout(400)
        await pg.click('#ed-meta'); await pg.wait_for_timeout(400)
        assert await pg.input_value('#m-valor')=='10.000', await pg.input_value('#m-valor')
        await pg.fill('#m-valor',''); await pg.type('#m-valor','25000'); assert await pg.input_value('#m-valor')=='25.000'
        await pg.click('#m-ok'); await pg.wait_for_timeout(300); assert await pg.evaluate("S.meta")==25000
        # CRP com barra
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(400)
        await pg.evaluate("document.querySelectorAll('.dobravel').forEach(b=>{ if(/dados profissionais/i.test(b.textContent)&&b.getAttribute('aria-expanded')!=='true')b.click() })"); await pg.wait_for_timeout(300)
        await pg.type('#pf-reg','06123456'); v=await pg.input_value('#pf-reg'); assert v=='06/123456', v
        tx=await pg.text_content('#view'); assert 'versão' not in tx and 'Estoque de produtos' not in tx and 'fotos de antes' not in tx, 'texto errado na psicologia'
        assert 'Lucra' in tx
        assert not await pg.evaluate("modOn('estoque')")
        # aniversário digitado
        await pg.evaluate("ir('clientes');dobra['clientes:Novo cliente']=true;render()"); await pg.wait_for_timeout(300)
        await pg.type('#c-nasc-tx','15031990'); assert await pg.input_value('#c-nasc-tx')=='15/03/1990' and await pg.input_value('#c-nasc')=='1990-03-15'
        await pg.fill('#c-nasc-tx',''); await pg.type('#c-nasc-tx','31022000'); assert await pg.input_value('#c-nasc')=='', 'aceitou 31/02'
        await pg.fill('#c-nasc-tx',''); await pg.type('#c-nasc-tx','15031990')
        await pg.fill('#c-nome','Teste Niver'); await pg.click('#c-add'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.clientes.find(c=>c.nome==='Teste Niver').nasc")=='1990-03-15'
        await pg.screenshot(path='/home/claude/work/shots/niver.png')
        # editar mostra a data salva
        cid=await pg.evaluate("S.clientes.find(c=>c.nome==='Teste Niver').id")
        await pg.click(f'[data-ed-c="{cid}"]'); await pg.wait_for_timeout(400); assert await pg.input_value('#c-nasc-tx')=='15/03/1990'
        # estética: estoque continua e fotos aparecem no texto do backup
        await pg.evaluate("mudaArea('estetica');ir('ajustes')"); await pg.wait_for_timeout(400)
        tx=await pg.text_content('#view'); assert 'Estoque de produtos' in tx and 'fotos de antes' in tx, tx[:200]
        await br.close()
    assert not er, er; print('SEM ERROS (16)')
asyncio.run(main())
