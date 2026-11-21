import asyncio, json
from playwright.async_api import async_playwright
import teste as T
erros=[]
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:erros.append('pageerror: '+str(e)))
        await pg.add_init_script("window.open=(u)=>{(window.__hrefs=window.__hrefs||[]).push(u);return null}")
        await pg.goto(T.NOVO); await pg.wait_for_timeout(800)
        await pg.evaluate("UI.boasVindas=true;UI.zap='web';salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('psico');demoArea();ir('clientes')")
        await pg.wait_for_timeout(300)
        # máscaras
        await pg.evaluate("dobra['clientes:Novo cliente']=true;render()"); await pg.wait_for_timeout(200)
        await pg.type('#c-tel','11987654321'); assert await pg.input_value('#c-tel')=='(11) 98765-4321', await pg.input_value('#c-tel')
        await pg.fill('#c-tel',''); await pg.type('#c-tel','1134567890'); assert await pg.input_value('#c-tel')=='(11) 3456-7890'
        await pg.type('#c-cpf','50800000012'); assert await pg.input_value('#c-cpf')=='508.000.000-12'
        assert await pg.evaluate("fmtDoc('12345678000199')")=='12.345.678/0001-99' and await pg.evaluate("fmtDoc('50800000012')")=='508.000.000-12'
        # recibo com o nome do profissional e documentos formatados
        await pg.evaluate("S.perfil={nome:'Dra. Teste Terapeuta',doc:'12345678000199',profissao:'Psicóloga'};UI.clinica='Espaço Psi';salvar();salvarUI()")
        cid=await pg.evaluate("S.vendas.find(v=>v.clienteId).clienteId")
        await pg.evaluate(f"cli('{cid}').cpf='50800000012'")
        h=await pg.evaluate(f"reciboHTML('{cid}',mesDe(S.vendas.find(v=>v.clienteId==='{cid}').data),'50800000012')")
        assert 'Dra. Teste Terapeuta</span>' in h.split('rc-tot')[0] and 'Espaço Psi' not in h and '12.345.678/0001-99' in h and '508.000.000-12' in h, h[:400]
        # ficha: pacote com usar sessão e sessões para adiantar
        pac=await pg.evaluate("(()=>{const p=pacotesAbertos()[0];return p?p.venda.clienteId:null})()")
        assert pac, 'demo sem pacote'
        await pg.evaluate(f"historico('{pac}')"); await pg.wait_for_timeout(500)
        tx=await pg.inner_text('.sheet'); assert 'Pacote' in tx and 'Usar sessão' in tx, tx[:500]
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.evaluate("ir('lucro')"); await pg.wait_for_timeout(300)
        assert 'Pacotes em aberto' not in await pg.inner_text('#view')
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(300)
        alvo=await pg.evaluate("(()=>{const h=hojeISO(); const a=S.agenda.find(a=>a.status==='marcado'&&a.data>h&&a.clienteId); return [a.clienteId,a.id,a.data]})()")
        await pg.evaluate(f"historico('{alvo[0]}')"); await pg.wait_for_timeout(500)
        await pg.click(f'.sheet [data-adi="{alvo[1]}"]'); await pg.wait_for_timeout(700)
        assert await pg.evaluate("tela")=='novoag' and 'Editar agendamento' in await pg.inner_text('h1')
        await pg.evaluate("S.agenda.find(a=>a.id===edit.id)")
        await pg.click(f'.pk-sem [data-pk-d]:nth-child(1)')
        novo=await pg.evaluate("somaDias(edit.id?S.agenda.find(a=>a.id===edit.id).data:hojeISO(),-1)")
        await pg.evaluate(f"(()=>{{const d='{novo}'; $('#a-data').value=d; pk.mes=d.slice(0,7); pintaPicker()}})()")
        h0=await pg.evaluate("[...document.querySelectorAll('[data-pk-h]')].find(b=>!b.classList.contains('ocup')).dataset.pkH")
        await pg.click(f'[data-pk-h="{h0}"]'); await pg.click('#a-add'); await pg.wait_for_timeout(800)
        assert await pg.evaluate(f"S.agenda.find(a=>a.id==='{alvo[1]}').data")==novo
        assert await pg.evaluate("tela")=='clientes' and await pg.locator('.sheet').count()>=1, 'não voltou para a ficha'
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        # horário ocupado: sozinho bloqueia, com equipe avisa
        d=await pg.evaluate("somaDias(hojeISO(),2)")
        await pg.evaluate(f"S.agenda.push({{id:'ocupa',data:'{d}',hora:'15:00',clienteId:S.clientes[0].id,servicoId:S.servicos[0].id,status:'marcado'}});UI.mod.equipe=false;salvar();salvarUI();pkPendente='{d}';ir('novoag')"); await pg.wait_for_timeout(400)
        pg.set_default_timeout(5000)
        assert 'Já marcado neste dia' in await pg.inner_text('#pk') and await pg.locator('[data-pk-h="15"].bloq').count()==1
        await pg.click('[data-pk-h="15"]',force=True); await pg.wait_for_timeout(200)
        assert await pg.input_value('#a-hora')=='' and 'Ocupado' in await pg.inner_text('#toast'), await pg.inner_text('#toast')
        await pg.screenshot(path=f'{T.SHOTS}/170-ocupado.png',full_page=True)
        await pg.evaluate("UI.mod.equipe=true;salvarUI();pintaPicker()")
        await pg.click('[data-pk-h="15"]'); await pg.wait_for_timeout(200)
        assert await pg.input_value('#a-hora')=='15:00' and 'Atenção' in await pg.inner_text('#toast')
        # estética: sem recibo na ficha; menu do financeiro
        await pg.evaluate("mudaArea('estetica');demoArea();ir('clientes')"); await pg.wait_for_timeout(300)
        await pg.locator('[data-ver-c]').first.click(); await pg.wait_for_timeout(500)
        assert await pg.locator('.sheet #h-rec').count()==0
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.evaluate("ir('registrar')"); await pg.wait_for_timeout(300)
        assert await pg.locator('#f-add').is_visible() and 'Atendimentos do mês' in await pg.inner_text('#view')
        await pg.evaluate("ir('saida')"); await pg.wait_for_timeout(300)
        assert await pg.locator('#d-add').is_visible() and 'Saídas do mês' in await pg.inner_text('#view') and await pg.locator('#f-add').count()==0
        await pg.locator('[data-ed-d]').first.click(); await pg.wait_for_timeout(300)
        assert await pg.evaluate("tela")=='saida' and 'Editar saída' in await pg.inner_text('h1')
        await br.close()
    print('\n'.join(erros) if erros else 'SEM ERROS (8)')
asyncio.run(main())
