"""Modelos personalizados em todos os documentos, botão voltar do celular e páginas abertas dentro do app."""
import asyncio
from playwright.async_api import async_playwright
import teste as T
SH='/home/claude/work/shots'
async def main():
    er=[]
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox']); ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
        await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');demoArea();S.perfil={nome:'Rafa Souza',registro:'SP 1'};salvar()")
        c1,c2=await pg.evaluate("[S.clientes[0].id,S.clientes[1].id]"); n2=await pg.evaluate(f"cli('{c2}').nome")
        # atestado: edita o texto, guarda como modelo; no próximo paciente vem o texto novo com os dados dele
        await pg.evaluate(f"abreDoc('{c1}','atestado')"); await pg.wait_for_timeout(400)
        await pg.fill('#dc-de','0900'); await pg.fill('#dc-ate','1000'); await pg.wait_for_timeout(100)
        tx=await pg.input_value('#dc-tx'); await pg.fill('#dc-tx',tx.replace('Atesto, para os devidos fins,','Atesto, para fins de trabalho,'))
        await pg.click('#dc-salvamod'); await pg.wait_for_timeout(200); await pg.fill('#mini-i','Meu atestado'); await pg.click('#mini-ok'); await pg.wait_for_timeout(200)
        m=await pg.evaluate("S.modelosDoc[0]"); assert '{paciente}' in m['texto'] and '{horario}' in m['texto'] and 'para fins de trabalho' in m['texto'], m['texto']
        assert await pg.evaluate("S.modeloPadrao.atestado")==m['id']
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.evaluate(f"abreDoc('{c2}','atestado')"); await pg.wait_for_timeout(400)
        tx=await pg.input_value('#dc-tx'); assert 'para fins de trabalho' in tx and n2 in tx and '{' not in tx, tx
        assert await pg.evaluate("document.querySelector('#dc-mod').value")==m['id']
        await pg.select_option('#dc-mod',''); await pg.wait_for_timeout(100); assert 'devidos fins' in await pg.input_value('#dc-tx')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        # todos os tipos têm modelo e botão de guardar
        for t in ['receita','declaracao','termo','lgpd']:
            await pg.evaluate(f"abreDoc('{c1}','{t}')"); await pg.wait_for_timeout(350)
            assert await pg.locator('#dc-mod').count()==1 and await pg.locator('#dc-salvamod').count()==1 and await pg.locator('#dc-salva').count()==1, t
            await pg.keyboard.press('Escape'); await pg.wait_for_timeout(350)
        # Ajustes: personalizar o termo
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(300); await pg.click('#md-abre'); await pg.wait_for_timeout(400)
        await pg.click('[data-md-novo="termo"]'); await pg.wait_for_timeout(400)
        assert '{procedimento}' in await pg.input_value('#me-t')
        await pg.fill('#me-n','Termo clareamento'); await pg.fill('#me-t','Eu, {paciente}, autorizo o clareamento. {profissional}'); await pg.click('#me-ok'); await pg.wait_for_timeout(700)
        assert await pg.locator('.sheet .md-b', has_text='Termo clareamento').count()==1
        await pg.screenshot(path=f'{SH}/modelos.png',full_page=True)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.evaluate(f"abreDoc('{c1}','termo')"); await pg.wait_for_timeout(400)
        assert await pg.input_value('#dc-tx')==f"Eu, {await pg.evaluate(f'cli(\"{c1}\").nome')}, autorizo o clareamento. Rafa Souza"
        # botão voltar do celular: fecha a folha, depois volta a tela, sem sair do app
        await pg.go_back(); await pg.wait_for_timeout(500)
        assert await pg.locator('.sheet-bg').count()==0 and await pg.evaluate("tela")=='ajustes'
        await pg.evaluate("ir('lab')"); await pg.wait_for_timeout(300)
        await pg.go_back(); await pg.wait_for_timeout(500); assert await pg.evaluate("tela")=='ajustes', await pg.evaluate("tela")
        assert pg.url.startswith(T.NOVO.split('?')[0])
        # privacidade abre numa folha dentro do app
        await pg.evaluate("document.querySelector('#sec-lgpd a[href$=\"?privacidade\"]').click()"); await pg.wait_for_timeout(400)
        assert await pg.locator('.sheet', has_text='controlador').count()==1 and len(ctx.pages)==1
        await pg.go_back(); await pg.wait_for_timeout(400); assert await pg.locator('.sheet-bg').count()==0
        await br.close()
    assert not er, er
    print('SEM ERROS (30)')
asyncio.run(main())
