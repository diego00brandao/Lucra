import asyncio, json, os, sys
from playwright.async_api import async_playwright
D = os.path.dirname(os.path.abspath(__file__))
NOVO = 'file:///home/claude/clinica-financeiro.html'
ORIG = 'file:///mnt/user-data/uploads/clinica-financeiro__1_.html'
SHOTS = os.path.join(D, 'shots'); os.makedirs(SHOTS, exist_ok=True)
erros = []

ALVOS = """() => [...document.querySelectorAll('button,a.btn,input,select')].filter(e=>{
  const r=e.getBoundingClientRect(); if(!r.width||!r.height)return false;
  if(e.type==='checkbox'||e.classList.contains('dia'))return false;
  return r.height<43.5 || (e.tagName==='BUTTON'&&r.width<43.5);
}).map(e=>(e.id||e.className||e.tagName)+' '+Math.round(e.getBoundingClientRect().width)+'x'+Math.round(e.getBoundingClientRect().height))"""
ESTOURO = "() => document.documentElement.scrollWidth - window.innerWidth"
RES = """() => { const r=resumo(mesSel); const res=reservas(mesSel).map(a=>[a.nome,a.qtd,a.reservar,a.gasto,a.falta]).sort();
  return JSON.stringify({b:r.bruto,l:r.lucro,t:r.taxa,c:r.custo,d:r.desloc,co:r.comissao,i:r.imposto,de:r.despesas,q:r.qtd,res,
    pac:pacotesAbertos().length, ps:Object.values(r.porServico).map(a=>[a.nome,a.qtd,a.bruto,a.lucro]).sort(), pd:r.porDia}) }"""

async def nova(br, w, h, url=NOVO, **kw):
    ctx = await br.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, **kw)
    await ctx.route('**/fonts.g*/**', lambda r: r.abort())
    pg = await ctx.new_page()
    await pg.add_init_script("window.__tudoAberto=true")
    pg.on('console', lambda m: erros.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text and 'ERR_' not in m.text else None)
    pg.on('pageerror', lambda e: erros.append('pageerror: ' + str(e)))
    async def dlg(d):
        erros.append('DIÁLOGO NATIVO: ' + d.message); await d.dismiss()
    pg.on('dialog', dlg)
    await pg.goto(url); await pg.wait_for_timeout(900)
    return pg

async def checa(pg, nome):
    a = await pg.evaluate(ALVOS)
    if a: erros.append(f'alvos <44 em {nome}: {a[:8]}')
    e = await pg.evaluate(ESTOURO)
    if e > 0: erros.append(f'estouro horizontal em {nome}: {e}px')

async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(channel='chrome', args=['--no-sandbox'])
        # 1 · boas-vindas no celular
        pg = await nova(br, 390, 844)
        assert await pg.locator('.ob').count() == 1, 'boas-vindas não abriu'
        await pg.screenshot(path=f'{SHOTS}/01-ob0.png'); await checa(pg, 'ob0')
        await pg.click('#ob-ok'); await pg.wait_for_timeout(500)
        await pg.fill('#ob-clinica', 'Studio Bela Pele'); await pg.screenshot(path=f'{SHOTS}/02-ob1.png'); await checa(pg, 'ob1')
        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(500)
        await pg.click('[data-meta="10000"]'); await pg.screenshot(path=f'{SHOTS}/03-ob2.png'); await checa(pg, 'ob2')
        await pg.click('#ob-ok'); await pg.wait_for_timeout(500)
        await pg.click('#ob-ok'); await pg.wait_for_timeout(300)   # sem nome: deve barrar
        assert await pg.locator('#ob-nome').count() == 1
        await pg.fill('#ob-nome', 'Limpeza de pele'); await pg.fill('#ob-preco', '220'); await pg.fill('#ob-custo', '24')
        await pg.screenshot(path=f'{SHOTS}/04-ob3.png'); await checa(pg, 'ob3')
        await pg.click('#ob-ok'); await pg.wait_for_timeout(500)
        await pg.screenshot(path=f'{SHOTS}/05-ob4.png'); await checa(pg, 'ob4')
        await pg.click('#ob-volta'); await pg.wait_for_timeout(400); await pg.click('#ob-ok'); await pg.wait_for_timeout(400)
        await pg.click('#ob-ok'); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{SHOTS}/06-ob5.png'); await checa(pg, 'ob5')
        await pg.click('#ob-fim'); await pg.wait_for_timeout(900)
        st = json.loads(await pg.evaluate("localStorage.getItem('lucra:v1')"))
        assert len(st['servicos']) == 1 and st['meta'] == 10000 and st['servicos'][0]['custo'] == 24, st
        assert set(st.keys()) == {'tema','meta','imposto','custoDomicilio','taxas','servicos','vendas','despesas','retiradas','clientes','agenda','contas','produtos','orcamentos','equipe','receber','evolucoes','anamneses','prontuario','area','perfil'}, st.keys()
        await pg.screenshot(path=f'{SHOTS}/07-painel-1serv.png', full_page=True); await checa(pg, 'painel 1 serviço')
        # recarrega: não reabre boas-vindas
        await pg.reload(); await pg.wait_for_timeout(900)
        assert await pg.locator('.ob').count() == 0
        # 2 · exemplo pelos Ajustes (confirmação em folha)
        await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(500); await checa(pg, 'ajustes')
        await pg.screenshot(path=f'{SHOTS}/08-ajustes.png', full_page=True)
        await pg.click('#a-demo'); await pg.wait_for_timeout(500); await pg.screenshot(path=f'{SHOTS}/09-confirma.png'); await checa(pg, 'confirmar')
        await pg.click('[data-cf=ok]'); await pg.wait_for_timeout(900)
        novo = await pg.evaluate(RES)
        for t in ['painel', 'agenda', 'clientes', 'vendas', 'servicos', 'sim']:
            await pg.evaluate(f"ir('{t}')"); await pg.wait_for_timeout(900)
            await pg.screenshot(path=f'{SHOTS}/10-{t}.png', full_page=(t == 'painel')); await checa(pg, t)
        await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(500)
        await pg.click('#ir-res'); await pg.wait_for_timeout(700); await pg.screenshot(path=f'{SHOTS}/11-reserva.png'); await checa(pg, 'reserva')
        # folhas: histórico → estornar; excluir venda; usar sessão; atendeu
        await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(500)
        await pg.click('[data-ver-c]'); await pg.wait_for_timeout(600); await pg.screenshot(path=f'{SHOTS}/12-historico.png'); await checa(pg, 'histórico')
        await pg.locator('.sheet [data-est-v]').first.click(); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{SHOTS}/13-estorno.png'); await checa(pg, 'estorno')
        await pg.click('#e-ok'); await pg.wait_for_timeout(1000)
        await pg.locator('.sheet [data-desfaz-v]').first.click(); await pg.wait_for_timeout(500)
        assert await pg.locator('.sheet-bg').count() == 2
        await pg.click('[data-cf=ok]'); await pg.wait_for_timeout(1000)
        assert await pg.locator('.sheet [data-desfaz-v]').count() == 0, 'estorno não foi desfeito'
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(500)
        assert await pg.locator('.sheet-bg').count() == 0
        assert await pg.evaluate(RES) == novo, 'estornar+desfazer mudou os números'
        await pg.evaluate("ir('vendas')"); await pg.wait_for_timeout(500)
        n0 = await pg.evaluate('S.vendas.length')
        await pg.locator('[data-del-v]').first.click(); await pg.wait_for_timeout(400); await pg.click('[data-cf=no]'); await pg.wait_for_timeout(400)
        assert await pg.evaluate('S.vendas.length') == n0
        await pg.locator('[data-del-v]').first.click(); await pg.wait_for_timeout(400); await pg.click('[data-cf=ok]'); await pg.wait_for_timeout(500)
        assert await pg.evaluate('S.vendas.length') == n0 - 1
        await pg.locator('[data-ses-v]').first.click(); await pg.wait_for_timeout(500); await pg.screenshot(path=f'{SHOTS}/14-sessao.png'); await checa(pg, 'sessão')
        await pg.click('#ps-ok'); await pg.wait_for_timeout(500)
        await pg.evaluate("ir('agenda')"); await pg.wait_for_timeout(500)
        await pg.locator('[data-acao=concluir]').first.click(); await pg.wait_for_timeout(500); await pg.screenshot(path=f'{SHOTS}/15-fechar.png'); await checa(pg, 'fechar atendimento')
        await pg.click('#k-ok'); await pg.wait_for_timeout(700)
        assert await pg.locator('#pr-feito').count()==1, 'Atendeu não abriu o prontuário'
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)
        await pg.locator('[data-acao=excluir]').first.click(); await pg.wait_for_timeout(400); await pg.click('[data-cf=ok]'); await pg.wait_for_timeout(400)
        # tema escuro
        await pg.click('#b-tema'); await pg.evaluate("ir('painel')"); await pg.wait_for_timeout(900)
        await pg.screenshot(path=f'{SHOTS}/16-painel-escuro.png', full_page=True)
        await pg.evaluate("ir('vendas')"); await pg.wait_for_timeout(700); await pg.screenshot(path=f'{SHOTS}/17-caixa-escuro.png')
        # 3 · números iguais aos do original com o mesmo exemplo
        po = await nova(br, 390, 844, ORIG)
        await po.evaluate('demo()'); orig = await po.evaluate(RES)
        COMPRAS="S.despesas.filter(d=>d.servicoId&&mesDe(d.data)===mesSel).reduce((a,d)=>a+Number(d.valor),0)"
        compras = await po.evaluate(COMPRAS)
        def ajusta(o, c):   # correção do desconto em dobro: compras de produto saem só pelo custo de cada atendimento
            o=json.loads(o); o['l']=round(o['l']+c,6); o['de']=round(o['de']-c,6); return o
        def igual(a, b):
            a=json.loads(a) if isinstance(a,str) else a; b=json.loads(b) if isinstance(b,str) else b
            a['l']=round(a['l'],6); b['l']=round(b['l'],6); a['de']=round(a['de'],6); b['de']=round(b['de'],6); return a==b
        assert compras>0 and igual(ajusta(orig,compras), novo), ('resumo/reservas diferem do original corrigido', orig, novo)
        print('exemplo: lucro original', json.loads(orig)['l'], '→ corrigido', json.loads(novo)['l'], '(compras', compras, ')')
        print('números do exemplo idênticos ao original:', json.loads(novo)['b'], json.loads(novo)['l'])
        # dados antigos (salvos pelo original) abrem no novo sem boas-vindas e sem perda
        antigo = await po.evaluate("localStorage.getItem('lucra:v1')")
        pv = await nova(br, 360, 740)
        await pv.evaluate("d=>{localStorage.clear();localStorage.setItem('lucra:v1',d)}", antigo); await pv.reload(); await pv.wait_for_timeout(900)
        assert await pv.locator('.ob').count() == 0
        await pv.evaluate('mesSel=mesDe(S.vendas[0].data);render()')
        assert igual(await pv.evaluate(RES), ajusta(orig,compras))
        await po.reload(); await po.wait_for_timeout(500)
        assert json.loads(await pv.evaluate("JSON.stringify(Object.assign({},S,{contas:undefined,produtos:undefined,orcamentos:undefined,equipe:undefined,receber:undefined,evolucoes:undefined,anamneses:undefined,prontuario:undefined,area:undefined,perfil:undefined}))")) == json.loads(await po.evaluate("JSON.stringify(S)")), 'dados antigos carregam diferente do original'
        await pv.screenshot(path=f'{SHOTS}/18-360.png'); await checa(pv, 'painel 360')
        for t in ['agenda', 'clientes', 'vendas', 'servicos', 'sim']:
            await pv.evaluate(f"ir('{t}')"); await pv.wait_for_timeout(500); await checa(pv, t + ' 360')
        # 4 · desktop
        pd = await nova(br, 1366, 800)
        await pd.screenshot(path=f'{SHOTS}/19-desk-ob.png')
        await pd.click('#ob-demo'); await pd.wait_for_timeout(1000)
        await pd.screenshot(path=f'{SHOTS}/20-desk-painel.png'); await checa(pd, 'desk painel')
        await pd.evaluate("ir('vendas')"); await pd.wait_for_timeout(800); await pd.screenshot(path=f'{SHOTS}/21-desk-caixa.png'); await checa(pd, 'desk caixa')
        await pd.evaluate("ir('clientes')"); await pd.wait_for_timeout(500); await pd.click('[data-ver-c]'); await pd.wait_for_timeout(600)
        await pd.screenshot(path=f'{SHOTS}/22-desk-historico.png')
        # foco visível no teclado
        await pd.keyboard.press('Escape'); await pd.wait_for_timeout(400); await pd.keyboard.press('Tab'); await pd.keyboard.press('Tab'); await pd.keyboard.press('Tab')
        ow = await pd.evaluate("getComputedStyle(document.activeElement).outlineWidth")
        print('outline no foco:', ow, await pd.evaluate("document.activeElement.id||document.activeElement.className"))
        await br.close()
    print('\n'.join(erros) if erros else 'SEM ERROS')

if __name__=="__main__": asyncio.run(main())
