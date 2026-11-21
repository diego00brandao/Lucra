import asyncio, json, subprocess, sys, time
from playwright.async_api import async_playwright
async def main():
    # servido numa subpasta, como no GitHub Pages (usuario.github.io/lucra/)
    import os, tempfile, shutil
    raiz=tempfile.mkdtemp(); shutil.copytree('/home/claude/lucra-app',raiz+'/lucra')
    srv=subprocess.Popen([sys.executable,'-m','http.server','8765','--bind','127.0.0.1','-d',raiz],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1)
    erros=[]
    try:
        async with async_playwright() as p:
            br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
            ctx=await br.new_context(viewport={'width':412,'height':900}); await ctx.route('**/fonts.g*/**',lambda r:r.abort())
            pg=await ctx.new_page(); pg.on('pageerror',lambda e:erros.append(str(e)))
            pg.on('console',lambda m:erros.append('console: '+m.text) if m.type=='error' and 'fonts.g' not in m.text and 'ERR_FAILED' not in m.text else None)
            await pg.goto('http://127.0.0.1:8765/lucra/'); await pg.wait_for_timeout(1500)
            ok=await pg.evaluate("navigator.serviceWorker.ready.then(r=>[!!r.active,r.scope])"); print('sw',ok); assert ok[0] and ok[1].endswith('/lucra/')
            man=await pg.evaluate("fetch(document.querySelector('link[rel=manifest]').href).then(r=>r.json())")
            assert man['display']=='standalone' and man['start_url']=='./' and len(man['icons'])==3
            for i in man['icons']:
                st=await pg.evaluate("u=>fetch(u).then(r=>[r.status,r.headers.get('content-type')])",'http://127.0.0.1:8765/lucra/'+i['src']); assert st==[200,'image/png'], st
            await pg.evaluate("document.querySelector('.ob')&&document.querySelector('.ob').remove();document.body.style.overflow='';UI.boasVindas=true;salvarUI();demoArea();ir('painel')"); await pg.wait_for_timeout(700)
            await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(400)
            assert await pg.locator('text=Instalar no celular').count()==1
            await pg.screenshot(path='shots/80-instalar.png')
            await pg.reload(); await pg.wait_for_timeout(1200)
            assert await pg.evaluate("!!navigator.serviceWorker.controller"), 'sw não controla a página'
            cache=await pg.evaluate("caches.keys().then(async ks=>[ks,(await (await caches.open(ks[0])).keys()).map(r=>new URL(r.url).pathname)])"); print(cache)
            # sem internet: servidor desligado de verdade
            srv.terminate(); srv.wait(); await ctx.set_offline(True)
            await pg.reload(); await pg.wait_for_timeout(1500)
            assert await pg.evaluate('tela')=='hoje' and await pg.locator('#view h1').count()==1 and await pg.evaluate('S.vendas.length')>100, 'não abriu sem internet'
            await pg.click('#fab'); await pg.wait_for_timeout(400); await pg.click('#r-ok'); await pg.wait_for_timeout(500)
            n=await pg.evaluate('S.vendas.length'); await pg.reload(); await pg.wait_for_timeout(1200)
            assert await pg.evaluate('S.vendas.length')==n, 'registro offline não ficou salvo'
            await pg.close(); pg=await ctx.new_page(); await pg.goto('http://127.0.0.1:8765/lucra/#agenda'); await pg.wait_for_timeout(1500)
            assert await pg.evaluate("tela")=='agenda' and await pg.locator('nav button[data-t=agenda][aria-current=true]').count()==1
            await pg.screenshot(path='shots/81-offline.png')
            await br.close()
    finally:
        if srv.poll() is None: srv.terminate()
    print('\n'.join(erros) if erros else 'SEM ERROS (5)')
asyncio.run(main())
