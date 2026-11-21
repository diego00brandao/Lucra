import asyncio, json, os
from playwright.async_api import async_playwright
SH=os.path.join(os.path.dirname(os.path.abspath(__file__)),'shots'); erros=[]
import teste as T
async def nova(br,w,h):
    ctx=await br.new_context(viewport={'width':w,'height':h},device_scale_factor=2); await ctx.route('**/fonts.g*/**', lambda r: r.abort()); pg=await ctx.new_page()
    pg.on('pageerror',lambda e:erros.append('pageerror: '+str(e)))
    async def dlg(d): erros.append('DIÁLOGO NATIVO'); await d.dismiss()
    pg.on('dialog',dlg)
    await pg.add_init_script("document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[target=_blank]');if(a){(window.__hrefs=window.__hrefs||[]).push(a.href);e.preventDefault()}})")
    await pg.goto(T.NOVO); await pg.wait_for_timeout(900); return pg
async def checa(pg,n):
    a=await pg.evaluate(T.ALVOS); e=await pg.evaluate(T.ESTOURO)
    if a: erros.append(f'alvos <44 em {n}: {a[:6]}')
    if e>0: erros.append(f'estouro em {n}: {e}px')
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        pg=await nova(br,390,844)
        assert await pg.locator('[data-eq]').count()==0
        await pg.click('#ob-ok'); await pg.wait_for_timeout(400); assert await pg.locator('[data-eq]').count()==2; await checa(pg,'ob equipe')
        await pg.click('#ob-pula'); await pg.click('#ob-pula'); await pg.click('#ob-pula'); await pg.click('#ob-pula'); await pg.wait_for_timeout(300)
        await pg.click('#ob-fim'); await pg.wait_for_timeout(600)
        assert await pg.locator('#fab').is_hidden(), 'fab sem serviço'
        await pg.evaluate("demo();UI.boasVindas=true;salvarUI();ir('painel')"); await pg.wait_for_timeout(600)
        await pg.evaluate("(()=>{const c=S.clientes[0]; c.nome='Diego Brandão'; c.tel='(11) 98098-4102'; S.clientes=[c]; S.vendas.forEach(v=>{v.clienteId=c.id;v.cliente=c.nome}); S.agenda.forEach(a=>a.clienteId=c.id); salvar(); render()})()")  # fixture: cliente único com telefone
        base=json.loads(await pg.evaluate(T.RES))
        # painel enxuto
        vis=await pg.evaluate("[...document.querySelectorAll('#view .sec > .sec-top h2, #view .sec > .card > h2')].map(h=>[h.textContent.trim(),(h.closest('.dobravel')||{getAttribute(){return null}}).getAttribute('aria-expanded')])")
        print(vis)
        assert not any(v[0] in ('Lucro por dia','Lucro por procedimento','Para onde foi o dinheiro') for v in vis) and ['Atenção no financeiro',None] in vis, vis
        assert await pg.locator('text=Você ainda não fez nenhum backup').count()==1
        await pg.screenshot(path=f'{SH}/60-painel.png',full_page=True); await checa(pg,'painel enxuto')
        await pg.evaluate("ir('lucro')"); await pg.wait_for_timeout(400)
        vis=await pg.evaluate("[...document.querySelectorAll('#view .sec > .sec-top h2')].map(h=>h.textContent.trim())")
        assert vis.index('Para onde foi o dinheiro')<vis.index('Lucro por procedimento')<vis.index('Lucro por dia'), vis
        assert await pg.locator('.dia').first.is_visible()
        await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(400)
        # registro rápido
        n0=await pg.evaluate('S.vendas.length')
        await pg.click('#fab'); await pg.wait_for_timeout(500)
        esp=await pg.evaluate("conta({servicoId:document.querySelector('#r-serv').value,valor:num(document.querySelector('#r-valor').value),forma:'debito',parcelas:1,sessoes:1,desloc:0}).lucro")
        await pg.click('[data-rf=debito]'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=f'{SH}/61-rapido.png'); await checa(pg,'registro rápido')
        await pg.click('#r-ok'); await pg.wait_for_timeout(400)
        assert await pg.evaluate('S.vendas.length')==n0 and 'Escolha' in await pg.inner_text('#toast'), 'salvou sem cliente'
        assert 'Sem cadastro' not in await pg.inner_text('#r-cli')
        await pg.select_option('#r-cli','__novo'); await pg.wait_for_timeout(400)
        await pg.fill('#nc-nome','Cliente Novo Rápido'); await pg.click('#nc-ok'); await pg.wait_for_timeout(400)
        assert await pg.evaluate("S.clientes.some(c=>c.nome==='Cliente Novo Rápido')") and await pg.evaluate("cli(document.querySelector('#r-cli').value).nome")=='Cliente Novo Rápido'
        await pg.click('#r-ok'); await pg.wait_for_timeout(600)
        v=json.loads(await pg.evaluate('JSON.stringify(S.vendas[S.vendas.length-1])'))
        assert await pg.evaluate('S.vendas.length')==n0+1 and v['forma']=='debito' and v['sessoes']==1 and v['usadas']==[] and v['parcelas']==1 and abs(await pg.evaluate('conta(S.vendas[S.vendas.length-1]).lucro')-esp)<.001, v
        # caixa, agenda, clientes, serviços: formulários fechados e recursos opcionais escondidos
        for t,forms in (('vendas',['#f-add','#d-add']),('agenda',['#a-add']),('clientes',['#c-add']),('servicos',['#s-add','#t-save'])):
            await pg.evaluate(f"ir('{t}')"); await pg.wait_for_timeout(500); await checa(pg,t+' enxuto')
            for f in forms: assert not await pg.locator(f).is_visible(), f
            await pg.screenshot(path=f'{SH}/62-{t}.png')
        assert await pg.locator('text=Contas a pagar').count()==0 and await pg.locator('#eq-add').count()==0
        # editar abre o formulário sozinho
        await pg.evaluate("ir('vendas')"); await pg.wait_for_timeout(400); await pg.locator('[data-ed-v]').first.click(); await pg.wait_for_timeout(500)
        assert await pg.locator('#f-add').is_visible(); await pg.click('#f-cancel'); await pg.wait_for_timeout(300)
        # ligar recursos
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(400); assert await pg.locator('#fab').is_hidden()
        await pg.locator('.dobravel:has-text("O que aparece no app")').click(); await pg.wait_for_timeout(300); await checa(pg,'recursos')
        await pg.screenshot(path=f'{SH}/63-ajustes.png',full_page=True)
        await pg.check('[data-mod=contas]'); await pg.evaluate("ir('vendas')"); await pg.wait_for_timeout(400)
        assert await pg.locator('text=Contas a pagar').count()==1
        # backup some depois de baixar
        await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(400)
        async with pg.expect_download(): await pg.click('#bk-ja')
        await pg.wait_for_timeout(500); assert await pg.locator('#bk-ja').count()==0
        # imprevisto no dia
        await pg.evaluate("ir('agenda')"); await pg.wait_for_timeout(500)
        nd=await pg.evaluate("S.agenda.filter(a=>a.status==='marcado'&&a.data===hojeISO()).length"); assert nd>=2, nd
        await pg.evaluate("S.agenda.filter(a=>a.data===hojeISO())[1].clienteId='';salvar();render()"); await pg.wait_for_timeout(300)
        await pg.screenshot(path=f'{SH}/64-agenda.png',full_page=True)
        await pg.click('#ag-imprev'); await pg.wait_for_timeout(500)
        await pg.click('[data-cd-m="falta de energia"]'); await pg.wait_for_timeout(200)
        pv=await pg.inner_text('#cd-previa'); assert 'imprevisto (falta de energia)' in pv and '{' not in pv, pv
        await pg.screenshot(path=f'{SH}/65-imprevisto.png'); await checa(pg,'imprevisto')
        await pg.locator('[data-cd-env]').first.click(); await pg.wait_for_timeout(700)
        import urllib.parse as U
        h=U.unquote((await pg.evaluate('window.__hrefs'))[-1]); assert h.startswith('https://wa.me/5511980984102?text=Oi, Diego! Tive um imprevisto (falta de energia)'), h
        assert await pg.locator('#cd-lista .pill:has-text("avisada")').count()==1
        await pg.click('[data-cd-so]'); await pg.wait_for_timeout(300)
        await pg.click('#cd-todos'); await pg.wait_for_timeout(300); await pg.screenshot(path=f'{SH}/66-imprevisto2.png')
        assert await pg.evaluate("S.agenda.filter(a=>a.status==='marcado'&&a.data===hojeISO()).length")==0
        await pg.click('#cd-fim'); await pg.wait_for_timeout(500)
        nr=await pg.locator('[data-rm]').count(); assert nr==nd-1, (nr,nd)
        assert await pg.locator('#ag-imprev').count()==0
        await pg.screenshot(path=f'{SH}/67-remarcar.png'); await checa(pg,'para remarcar')
        await pg.locator('[data-rm]').first.click(); await pg.wait_for_timeout(400); await checa(pg,'folha remarcar')
        antes20=await pg.evaluate("S.agenda.filter(a=>a.data==='2026-12-20'&&a.status==='marcado').length")
        await pg.fill('#rm-data','2026-12-20'); await pg.fill('#rm-hora','15:00'); await pg.click('#rm-ok'); await pg.wait_for_timeout(900)
        tx=await pg.input_value('#mz-tx'); assert '*20/12/26*, às *15:00*' in tx, tx
        await pg.click('#mz-no'); await pg.wait_for_timeout(400)
        assert await pg.locator('[data-rm]').count()==nr-1 and await pg.evaluate("S.agenda.filter(a=>a.data==='2026-12-20'&&a.status==='marcado').length")==antes20+1
        await pg.locator('[data-rm-x]').first.click(); await pg.wait_for_timeout(300); assert await pg.locator('[data-rm]').count()==nr-2
        r=json.loads(await pg.evaluate("(()=>{mesSel=mesDe(S.vendas[0].data);return ("+T.RES+")()})()"))
        assert r['b']==base['b'] and r['l']==base['l'], 'mês do exemplo mudou'
        # desktop
        await pg.set_viewport_size({'width':1366,'height':850}); await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{SH}/68-desk.png'); await checa(pg,'desk')
        await br.close()
    print('\n'.join(erros) if erros else 'SEM ERROS (4)')
asyncio.run(main())
