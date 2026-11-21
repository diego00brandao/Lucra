"""Periograma, LGPD (termo, exportar, páginas, trava da tela) e várias unidades na mesma conta."""
import asyncio, json
from playwright.async_api import async_playwright
import teste as T, teste12 as M
SH='/home/claude/work/shots'
async def local(br,er):
    ctx=await br.new_context(viewport={'width':390,'height':844},accept_downloads=True); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
    pg=await ctx.new_page(); pg.on('pageerror',lambda e:er.append(str(e)))
    await pg.goto(T.NOVO); await pg.wait_for_timeout(700)
    await pg.evaluate("UI.boasVindas=true;salvarUI();document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';mudaArea('odonto');demoArea();S.perfil={nome:'Rafa',registro:'SP 1'};salvar()")
    cid=await pg.evaluate("S.clientes[0].id")
    # periograma
    await pg.evaluate(f"historico('{cid}')"); await pg.wait_for_timeout(500)
    await pg.click('.sheet #h-pr'); await pg.wait_for_timeout(500)
    await pg.click('[data-pr-d="16"]'); await pg.wait_for_timeout(200)
    for i,v in enumerate(['3','5','3','2','7','3']): await pg.fill(f'[data-ps="{i}"]',v)
    await pg.click('[data-sg="1"]'); await pg.click('[data-sg="4"]'); await pg.select_option('#pr-fu','2')
    assert 'pr-p6' in await pg.get_attribute('[data-pr-d="16"]','class')
    await pg.click('#pr-prox'); await pg.wait_for_timeout(200); assert await pg.get_attribute('[data-pr-d="15"]','aria-pressed')=='true'
    for i in range(6): await pg.fill(f'[data-ps="{i}"]','2')
    await pg.screenshot(path=f'{SH}/periograma.png',full_page=True)
    t=await pg.inner_text('#pr-c .pl-res'); assert '17%' in t, t
    await pg.click('#pr-ok'); await pg.wait_for_timeout(500)
    p=await pg.evaluate("S.periogramas[0]"); assert p['dentes']['16']['fu']==2 and p['dentes']['16']['ps'][4]=='7' and set(p['dentes'])=={'16','15'}, p
    assert await pg.evaluate("resumoPerio(S.periogramas[0])")=={'dentes':2,'sitios':12,'sang':2/12*100,'b4':2,'b6':1}
    assert await pg.evaluate("CLINICO.includes('periogramas')")
    await pg.wait_for_timeout(500)
    assert await pg.locator('.sheet [data-pr-ex]').count()==1, await pg.locator('.sheet').count()
    # LGPD: termo de ciência e exportação
    assert await pg.locator('.sheet [data-doc-novo=lgpd]').count()==1
    async with pg.expect_download() as dl: await pg.click('.sheet #h-lgpd')
    d=await dl.value; dados=json.load(open(await d.path()))
    assert dados['paciente']['id']==cid and 'periogramas' in dados and 'vendas' in dados, list(dados)
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
    await pg.evaluate(f"abreDoc('{cid}','lgpd')"); await pg.wait_for_timeout(400)
    tx=await pg.input_value('#dc-tx'); assert 'Lei Geral de Proteção de Dados' in tx and 'Autorizo o registro de fotos' in tx and await pg.locator('#dc-ass').count()==1, tx[:200]
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
    # páginas abertas
    p2=await ctx.new_page(); await p2.goto(T.NOVO+('&' if '?' in T.NOVO else '?')+'privacidade'); await p2.wait_for_timeout(500)
    assert 'controlador' in await p2.inner_text('#pub'); await p2.goto(T.NOVO+('&' if '?' in T.NOVO else '?')+'termos'); await p2.wait_for_timeout(500)
    assert 'ICP-Brasil' in await p2.inner_text('#pub')
    await ctx.close()
async def nuvem(br):
    async def aparelho():
        ctx=await br.new_context(viewport={'width':390,'height':844}); await ctx.route('**/fonts.g*/**',lambda r:r.abort()); await ctx.route(M.SB+'/**',M.sb_route)
        pg=await ctx.new_page(); pg.on('pageerror',lambda e:M.erros.append('pageerror: '+str(e))); await pg.goto(M.URL); await pg.wait_for_timeout(900); return pg
    a=await aparelho()
    assert await a.locator('.pt-legal a[href="?privacidade"]').count()==1
    await a.click('[data-pt=criar]'); await a.fill('#pt-nome','Dono'); await a.fill('#pt-email','dono@u.com'); await a.fill('#pt-senha','senha123'); await a.click('#pt-ok'); await a.wait_for_timeout(1500)
    await a.fill('#cc-nome','Unidade Centro'); await a.click('[data-cc=odonto]'); await a.wait_for_timeout(100); await a.click('#cc-ok'); await a.wait_for_timeout(1500)
    await a.evaluate("document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow=''")
    c1=await a.evaluate("CONTA.cid"); await a.evaluate("S.clientes.push({id:'u1',nome:'Paciente Centro',tel:'',email:'',nasc:'',obs:''});salvar()"); await M.espera(a,"syncEst==='ok'&&!pendente()")
    # cria a segunda unidade (outra área)
    await a.evaluate("ir('ajustes')"); await a.wait_for_timeout(400); await a.click('#ct-un'); await a.wait_for_timeout(400); await a.click('#tu-nova'); await a.wait_for_timeout(500)
    assert 'Nova unidade' in await a.inner_text('#porta')
    await a.fill('#cc-nome','Consultório Psi'); await a.click('[data-cc=psico]'); await a.wait_for_timeout(100); await a.click('#cc-ok'); await a.wait_for_timeout(1800)
    await a.evaluate("document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow=''")
    c2=await a.evaluate("CONTA.cid"); assert c2!=c1 and await a.evaluate("CONTA.area")=='psico' and await a.evaluate("S.clientes.length")==0
    assert len(await a.evaluate("CONTA.unidades"))==2
    # troca de volta: os dados da primeira continuam lá
    await a.evaluate("ir('ajustes')"); await a.wait_for_timeout(400); assert 'Trocar de unidade' in await a.inner_text('#ct-un')
    await a.click('#ct-un'); await a.wait_for_timeout(400); await a.click(f'[data-tu="{c1}"]'); await a.wait_for_timeout(1800)
    assert await a.evaluate("CONTA.cid")==c1 and await a.evaluate("area()")=='odonto' and await a.evaluate("S.clientes.some(c=>c.id==='u1')")
    # outro aparelho: pergunta qual unidade
    b=await aparelho(); await b.fill('#pt-email','dono@u.com'); await b.fill('#pt-senha','senha123'); await b.click('#pt-ok'); await b.wait_for_timeout(1500)
    assert await b.locator('[data-un]').count()==2
    await b.screenshot(path=f'{SH}/unidades.png',full_page=True)
    await b.click(f'[data-un="{c2}"]'); await b.wait_for_timeout(1500); assert await b.evaluate("CONTA.area")=='psico'
    # trava da tela
    await a.evaluate("ir('ajustes')"); await a.wait_for_timeout(400); await a.select_option('#sg-tr','5'); await a.evaluate("travar()"); await a.wait_for_timeout(300)
    assert await a.locator('#trava').count()==1
    await a.fill('#tv-s','errada'); await a.click('#tv-ok'); await a.wait_for_timeout(600); assert await a.is_visible('#tv-e')
    await a.fill('#tv-s','senha123'); await a.click('#tv-ok'); await a.wait_for_timeout(800); assert await a.locator('#trava').count()==0
    # sair limpa os dados de todas as unidades deste aparelho
    await b.evaluate("sairDaConta(true)"); await b.wait_for_timeout(500)
    assert await b.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('lucra:nuvem:')).length")==0
async def main():
    er=[]; srv=M.servir()
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        await local(br,er); await nuvem(br); await br.close()
    srv.shutdown()
    assert not er, er
    print('\n'.join(M.erros) if M.erros else 'SEM ERROS (27)')
asyncio.run(main())
