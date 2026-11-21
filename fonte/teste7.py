import asyncio, json, os
from playwright.async_api import async_playwright
import teste as T
erros=[]
async def nova(br,init=None):
    ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
    pg=await ctx.new_page(); pg.on('pageerror',lambda e:erros.append('pageerror: '+str(e)))
    async def dlg(d): erros.append('DIÁLOGO NATIVO'); await d.dismiss()
    pg.on('dialog',dlg)
    if init: await pg.add_init_script(init)
    await pg.goto(T.NOVO); await pg.wait_for_timeout(800); return ctx,pg
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        ctx,pg=await nova(br)
        # 1 · leitura de valores
        casos={'1.500':1500,'1.234,56':1234.56,'1234,56':1234.56,'1234.56':1234.56,'R$ 80':80,'80':80,'':0,'2,5':2.5,'1.37':1.37,'0,7':0.7,'12.000':12000,'abc':0,'1.500,00':1500}
        for k,v in casos.items():
            r=await pg.evaluate("v=>num(v)",k)
            if abs(r-v)>1e-9: erros.append(f'num({k!r})={r}, esperado {v}')
        for v in [1.375,2.125,0.7,1500,-30.5]:
            if await pg.evaluate("v=>num(v)",v)!=v: erros.append(f'num({v}) mudou número já salvo')
        # 2 · desconto em dobro: compras de produto não saem de novo
        await pg.evaluate("demo();UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';ir('painel')")
        r=json.loads(await pg.evaluate("JSON.stringify(resumo(mesSel))"))
        gerais=await pg.evaluate("S.despesas.filter(d=>!d.servicoId&&mesDe(d.data)===mesSel).reduce((a,d)=>a+d.valor,0)")
        assert abs(r['lucro']-(r['lucroBruto']-gerais))<.01 and r['compras']==3440, r
        await pg.evaluate("ir('lucro')"); await pg.wait_for_timeout(300)
        assert 'não entram de novo aqui' in await pg.inner_text('#view')
        # sem telefone de verdade no exemplo
        assert await pg.evaluate("S.clientes.every(c=>!c.tel&&!c.email&&!/Diego/.test(c.nome))")
        # 3 · área separada e nome do espaço por área
        await pg.evaluate("UI.clinica='Studio Estética';salvarUI();mudaArea('psico')"); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.clientes.length")==0 and await pg.evaluate("UI.clinica")==''
        await pg.evaluate("UI.clinica='Consultório Psi';salvarUI();S.clientes.push({id:'p1',nome:'Paciente Psi',tel:'',email:'',nasc:'',obs:''});S.evolucoes.push({id:'e1',clienteId:'p1',agId:'',data:hojeISO(),humor:5,sinais:[],evolucao:'',foco:'',chegada:'',notas:'',proximo:''});salvar()")
        await pg.evaluate("mudaArea('estetica')"); await pg.wait_for_timeout(300)
        assert await pg.evaluate("UI.clinica")=='Studio Estética' and await pg.evaluate("!S.clientes.some(c=>c.id==='p1')") and await pg.evaluate("S.vendas.length")>100
        await pg.reload(); await pg.wait_for_timeout(800)
        assert await pg.evaluate("UI.area")=='estetica' and await pg.evaluate("S.vendas.length")>100
        await pg.evaluate("mudaArea('psico')"); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.clientes.length")==1 and await pg.evaluate("UI.clinica")=='Consultório Psi'
        # paciente excluído leva as anotações junto
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(300)
        await pg.locator('[data-del-c]').first.click(); await pg.wait_for_timeout(300); await pg.click('[data-cf=ok]'); await pg.wait_for_timeout(300)
        assert await pg.evaluate("S.evolucoes.length")==0
        # 4 · backup de outra área volta para a área de origem
        bk=await pg.evaluate("(()=>{const s=JSON.parse(localStorage.getItem(UI.chaves.estetica));return JSON.stringify(s)})()")
        path=os.path.join(os.path.dirname(os.path.abspath(__file__)),'bk-estetica.json'); open(path,'w').write(bk)
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(300)
        async with pg.expect_file_chooser() as fc: await pg.click('#a-imp')
        await (await fc.value).set_files(path); await pg.wait_for_timeout(900)
        assert await pg.evaluate("UI.area")=='estetica' and await pg.evaluate("S.area")=='estetica' and await pg.evaluate("S.vendas.length")>100
        assert await pg.locator('nav button[data-t=clientes] .rot').text_content()=='Clientes'
        await ctx.close()
        # 5 · dados antigos já na psicologia (versão anterior): continuam na psicologia, estética fica separada
        ctx,pg=await nova(br)
        await pg.evaluate("localStorage.clear();localStorage.setItem('lucra:v1',JSON.stringify({area:'psico',clientes:[{id:'x',nome:'Crysthian Teste',tel:'',email:'',nasc:'',obs:''}],servicos:[],vendas:[],despesas:[],agenda:[]}));localStorage.setItem('lucra:ui',JSON.stringify({clinica:'Crysthian Psicológico',boasVindas:true}))")
        await pg.reload(); await pg.wait_for_timeout(800)
        assert await pg.evaluate("UI.area")=='psico' and await pg.evaluate("CHAVE")=='lucra:v1' and await pg.evaluate("S.clientes.length")==1 and await pg.evaluate("UI.clinica")=='Crysthian Psicológico'
        await pg.evaluate("mudaArea('estetica')")
        assert await pg.evaluate("CHAVE")=='lucra:v1:estetica' and await pg.evaluate("S.clientes.length")==0 and await pg.evaluate("UI.clinica")==''
        assert json.loads(await pg.evaluate("localStorage.getItem('lucra:v1')"))['clientes'][0]['nome']=='Crysthian Teste'
        await ctx.close()
        # 6 · dados danificados: guarda cópia e avisa
        ctx,pg=await nova(br)
        await pg.evaluate("localStorage.clear();localStorage.setItem('lucra:v1','{isto nao e json');localStorage.setItem('lucra:ui',JSON.stringify({boasVindas:true}))")
        await pg.reload(); await pg.wait_for_timeout(800)
        assert await pg.locator('#aviso-salvar').count()==1 and 'danificados' in await pg.inner_text('#aviso-salvar')
        assert await pg.evaluate("Object.keys(localStorage).some(k=>k.startsWith('lucra:v1:danificado:'))")
        await ctx.close()
        # 7 · falha ao salvar: aviso aparece e some quando volta a funcionar
        ctx,pg=await nova(br)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow=''")
        await pg.evaluate("window.__set=Storage.prototype.setItem;Storage.prototype.setItem=function(){throw new DOMException('cheio','QuotaExceededError')};S.meta=5;salvar()")
        assert await pg.locator('#aviso-salvar').count()==1 and 'Não consegui salvar' in await pg.inner_text('#aviso-salvar')
        await pg.screenshot(path=f'{T.SHOTS}/130-aviso.png')
        await pg.evaluate("Storage.prototype.setItem=window.__set;salvar()")
        assert await pg.locator('#aviso-salvar').count()==0
        await ctx.close()
        # 8 · menu: gaveta no celular, atalhos embaixo, lateral no computador
        ctx,pg=await nova(br)
        await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';demo();ir('painel')")
        # celular: sem gaveta; barra de baixo com os 4 grupos
        assert not await pg.locator('#menu').is_visible() and not await pg.locator('#b-menu').is_visible()
        nomes=[x.strip() for x in await pg.locator('#barra button span').all_text_contents()]
        assert nomes==['Analítico','Atendimento','Financeiro','Configurações'], nomes
        assert await pg.locator('#barra button[aria-current=true]').inner_text()=='Analítico'
        await pg.screenshot(path=f'{T.SHOTS}/170-barra.png')
        await pg.click('#barra button:has-text("Atendimento")'); await pg.wait_for_timeout(400)
        opc=[x.strip() for x in await pg.locator('.sheet .grupo-l button').all_text_contents()]
        assert opc==['Novo agendamento','Agenda','Retornos','Clientes'], opc
        await pg.screenshot(path=f'{T.SHOTS}/171-grupo.png'); await T.checa(pg,'grupo atendimento')
        await pg.click('.sheet .grupo-l button:has-text("Clientes")'); await pg.wait_for_timeout(500)
        assert await pg.evaluate("tela")=='clientes' and await pg.locator('.sheet').count()==0
        assert await pg.locator('#barra button[aria-current=true]').inner_text()=='Atendimento'
        await pg.click('#barra button:has-text("Configurações")'); await pg.wait_for_timeout(400)
        await pg.click('.sheet .grupo-l button:has-text("Ajustes")'); await pg.wait_for_timeout(500)
        assert await pg.evaluate("tela")=='ajustes'
        # o + não fica em cima da barra
        fb=await pg.evaluate("(()=>{const f=document.querySelector('#fab').getBoundingClientRect(),b=document.querySelector('#barra').getBoundingClientRect();return [f.bottom,b.top]})()")
        assert fb[0]<=fb[1], fb
        await pg.evaluate("ir('vendas')"); await pg.wait_for_timeout(300)
        assert await pg.locator('.barra').count()==0 or not await pg.locator('.barra').is_visible()
        box=await pg.evaluate("(()=>{const r=document.querySelector('#fab').getBoundingClientRect();return [r.width,r.height,innerWidth-r.right,innerHeight-r.bottom]})()")
        assert box[0]==box[1]>=56 and 0<box[2]<40 and 60<box[3]<160, box
        await pg.click('#fab'); await pg.wait_for_timeout(400); assert await pg.locator('#r-ok').count()==1
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        txt=(await pg.text_content('#menu')).upper()
        ordem=['ANALÍTICO','PAINEL','LUCRO','CAIXA DO DIA','OCUPAÇÃO DA AGENDA','ATENDIMENTO','NOVO AGENDAMENTO','AGENDA','RETORNOS','CLIENTES','FINANCEIRO','REGISTRAR ATENDIMENTO',
               'REGISTRAR SAÍDA','SERVIÇOS','SIMULADOR','CONFIGURAÇÕES','TAXAS E ENCARGOS','AJUSTES','SAIR']
        pos=[]; at=0
        for o in ordem: at=txt.index(o,at); pos.append(at); at+=len(o)
        # cada item do menu abre a sua tela, sem erro
        for t in ['lucro','novoag','retornos','registrar','saida','sim','taxas']:
            await pg.evaluate(f"ir('{t}')"); await pg.wait_for_timeout(200)
            assert await pg.evaluate("tela")==t and await pg.locator(f'#menu button[data-t={t}][aria-current=true]').count()==1, t
        await pg.evaluate("ir('vendas')"); await pg.wait_for_timeout(200)
        await pg.click('#barra button:has-text("Configurações")'); await pg.wait_for_timeout(400); await pg.click('.sheet .grupo-l button:has-text("Sair")'); await pg.wait_for_timeout(500)
        assert 'não tem login' in await pg.inner_text('.sheet') and await pg.evaluate("tela")=='vendas'
        await pg.screenshot(path=f'{T.SHOTS}/160-sair.png')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        await pg.set_viewport_size({'width':1366,'height':860}); await pg.wait_for_timeout(300)
        assert await pg.locator('#menu button[data-t=sim]').is_visible() and not await pg.locator('#fab').is_visible() and not await pg.locator('#b-menu').is_visible()
        await pg.click('#menu button[data-t=painel]'); await pg.wait_for_timeout(400)
        assert await pg.locator('.pn-cols').count()==0 and await pg.locator('.pn-so [data-pn=dir]').count()>=1 and await pg.locator('#view [data-pn=esq]').count()==0
        await pg.click('#b-reg'); await pg.wait_for_timeout(400); assert await pg.locator('#r-ok').count()==1
        await br.close()
    print('\n'.join(erros) if erros else 'SEM ERROS (7)')
asyncio.run(main())
