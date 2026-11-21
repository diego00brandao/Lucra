import asyncio, json, os
from playwright.async_api import async_playwright
import teste as T
SH=T.SHOTS
CT="""()=>{const g=getComputedStyle(document.documentElement),v=n=>g.getPropertyValue(n).trim();
  return [contraste(v('--ac'),S.tema==='escuro'?'#221820':'#FFFFFF'),contraste(v('--on-ac'),v('--ac')),v('--ac')]}"""
async def main():
    async with async_playwright() as p:
        br=await p.chromium.launch(channel='chrome',args=['--no-sandbox'])
        for w in (390,360):
            pg=await T.nova(br,w,780)
            await pg.click('#ob-demo'); await pg.wait_for_timeout(800); await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(400)
            await T.checa(pg,f'ajustes aparência {w}')
            if w==390:
                await pg.locator('.sec:has(h2:text("Aparência"))').screenshot(path=f'{SH}/40-aparencia.png')
                for tema in ('claro','escuro'):
                    for cor in ['#2F6B57','#1F5F78','#A4502F','#6A4C9C','#3F4450','#FFFF00','#000000','#FFFFFF','#FF0000','#00E5FF']:
                        await pg.evaluate("c=>{UI.ap.cor=c;aparencia()}",cor)
                        r=await pg.evaluate(CT)
                        if min(r[:2])<4.5: T.erros.append(f'contraste baixo {tema} {cor}: {r}')
                    await pg.click('#b-tema')
                await pg.click('[data-ap-cor="#2F6B57"]'); await pg.wait_for_timeout(300)
                await pg.select_option('#ap-fonte','redonda'); await pg.wait_for_timeout(300)
                assert 'Nunito' in await pg.evaluate("getComputedStyle(document.body).fontFamily")
            await pg.click('[data-ap-tam=gg]'); await pg.wait_for_timeout(400)
            assert await pg.evaluate("document.body.style.zoom")=='1.2'
            for t in ['painel','agenda','clientes','vendas','servicos','sim']:
                await pg.evaluate(f"ir('{t}')"); await pg.wait_for_timeout(500); await T.checa(pg,f'{t} gg {w}')
                if w==390 and t in('painel','vendas'): await pg.screenshot(path=f'{SH}/41-gg-{t}.png')
            await pg.evaluate("ir('clientes')"); await pg.wait_for_timeout(300); await pg.click('[data-ver-c]'); await pg.wait_for_timeout(600)
            box=await pg.evaluate("(()=>{const r=document.querySelector('.sheet').getBoundingClientRect();return [r.top,r.bottom,innerHeight,r.left,r.right,innerWidth]})()")
            if box[0]<-1 or box[1]>box[2]+1 or box[4]>box[5]+1: T.erros.append(f'folha fora da tela com zoom {w}: {box}')
            if w==390: await pg.screenshot(path=f'{SH}/42-gg-folha.png')
            await pg.keyboard.press('Escape')
            await pg.reload(); await pg.wait_for_timeout(900)
            if await pg.evaluate("document.body.style.zoom")!='1.2': print('DEBUG',w,await pg.evaluate("[localStorage.getItem('lucra:ui'),JSON.stringify(UI),document.body.style.zoom,document.readyState]"))
            assert await pg.evaluate("document.body.style.zoom")=='1.2', 'tamanho não persistiu'
            if w==390:
                assert await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ac').trim()")!='#7A2E4D'
                await pg.set_viewport_size({'width':1366,'height':800}); await pg.wait_for_timeout(500)
                await pg.screenshot(path=f'{SH}/43-desk-verde-gg.png'); await T.checa(pg,'desk gg')
                nav=await pg.evaluate("(()=>{const r=document.querySelector('nav').getBoundingClientRect();return [r.height,innerHeight]})()")
                await pg.evaluate("ir('ajustes')"); await pg.wait_for_timeout(300); await pg.click('#ap-reset'); await pg.wait_for_timeout(300)
                assert await pg.evaluate("document.body.style.zoom")=='' and await pg.evaluate("getComputedStyle(document.documentElement).getPropertyValue('--ac').trim()")=='#7A2E4D'
                print('nav desktop com zoom:',nav)
        await br.close()
    print('\n'.join(T.erros) if T.erros else 'SEM ERROS (3)')
asyncio.run(main())
