import asyncio
from playwright.async_api import async_playwright
import teste as T
SH='/home/claude/work'
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); er=[]
        ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        async def dlg(d): er.append('dialogo'); await d.dismiss()
        pg.on('dialog',dlg)
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;UI.zap='web';salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');demoArea();ir('clientes')")
        await pg.wait_for_timeout(300)
        cid=await pg.evaluate("S.clientes[0].id")
        await pg.evaluate(f"historico('{cid}')"); await pg.wait_for_timeout(500)
        tx=await pg.inner_text('.sheet'); assert 'Anamnese' in tx and 'Prontuário' in tx and 'Recibo' in tx, tx[:300]
        await pg.click('#h-anam'); await pg.wait_for_timeout(500)
        await pg.fill('#an-queixa','Dor no dente de baixo')
        await pg.click('[data-an=alerg] [data-an-v=sim]'); await pg.fill('[data-an=alerg] .an-det','dipirona')
        await pg.click('[data-an=pa] [data-an-v=nao]'); await pg.click('[data-an=fuma] [data-an-v=sim]')
        await pg.screenshot(path=f'{SH}/anam.png',full_page=True)
        await pg.click('#an-ok'); await pg.wait_for_timeout(900)
        assert await pg.evaluate(f"alertasDe('{cid}')")==['Alergia: dipirona'], await pg.evaluate(f"alertasDe('{cid}')")
        assert 'dipirona' in await pg.inner_text('.sheet'), 'não voltou para a ficha'
        await pg.screenshot(path=f'{SH}/ficha-odonto.png',full_page=True)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # agenda: alerta ao lado do nome; Atendeu abre o prontuário
        await pg.evaluate(f"S.agenda.push({{id:'ag-od',data:hojeISO(),hora:'10:00',clienteId:'{cid}',servicoId:S.servicos[0].id,status:'marcado'}});salvar();agDia=hojeISO();ir('agenda')"); await pg.wait_for_timeout(400)
        assert 'Alergia' in await pg.inner_text('[data-item-ag=ag-od]')
        await pg.locator('[data-item-ag=ag-od] > .mn').click(); await pg.wait_for_timeout(500)
        assert await pg.locator('#pr-feito').count()==1 and 'dipirona' in await pg.inner_text('.sheet')
        await pg.fill('#pr-regiao','36'); await pg.fill('#pr-feito','Restauração em resina'); await pg.fill('#pr-prox','Voltar em 15 dias')
        await pg.screenshot(path=f'{SH}/pront.png',full_page=True)
        await pg.click('#pr-ok'); await pg.wait_for_timeout(500)
        assert await pg.evaluate("S.prontuario.length")==1 and await pg.evaluate("S.prontuario[0].agId")=='ag-od'
        assert 'Ver prontuário' in await pg.inner_text('[data-item-ag=ag-od]')
        await pg.evaluate(f"historico('{cid}')"); await pg.wait_for_timeout(500)
        assert 'Restauração em resina' in await pg.inner_text('.sheet')
        await pg.click('.sheet [data-pr]'); await pg.wait_for_timeout(500); assert await pg.input_value('#pr-regiao')=='36'
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        h=await pg.evaluate(f"anamHTML('{cid}')"); assert 'dipirona' in h and 'Declaro' in h
        # psicologia sem anamnese de dentista; exclusão do paciente leva tudo junto
        await pg.evaluate(f"S.clientes=S.clientes.filter(c=>c.id!=='x');")
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(300)
        n=await pg.evaluate("S.clientes.length")
        await pg.evaluate("mudaArea('psico');demoArea();ir('clientes')"); await pg.wait_for_timeout(300)
        await pg.locator('[data-ver-c]').first.click(); await pg.wait_for_timeout(500)
        assert await pg.locator('.sheet #h-anam').count()==0
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate("mudaArea('odonto')"); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.anamneses.length")==1 and await pg.evaluate("S.prontuario.length")==1
        await pg.reload(); await pg.wait_for_timeout(700)
        assert await pg.evaluate("S.anamneses.length")==1
        await br.close(); assert not er, er; print('SEM ERROS (11)')
asyncio.run(main())
